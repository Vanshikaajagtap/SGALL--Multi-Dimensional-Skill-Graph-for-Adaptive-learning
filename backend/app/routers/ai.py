from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from ..database import get_db
from ..auth import get_current_user
from ..agent import chat_app, generate_remediation_plan
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter(prefix="/api/v1/ai", tags=["AI Hybrid Workflow"])

# 1. Proactive Endpoint (Background Processable)
class GapInfo(BaseModel):
    gap_id: int
    concept_name: str
    difficulty: str
    severity: str

def process_proactive_remediation(gap: GapInfo, db):
    """Background task to generate plan and attach to db record."""
    plan = generate_remediation_plan(gap.concept_name, gap.difficulty, gap.severity)
    try:
        db.execute("UPDATE KNOWLEDGEGAP SET ai_remediation = %s WHERE gap_id = %s", (plan, gap.gap_id))
    except Exception as e:
        print("Failed to save proactive remediation:", e)

@router.post("/remediation-plan")
def trigger_remediation(gap: GapInfo, db=Depends(get_db)):
    """API exposure for triggering plan generation directly if needed."""
    process_proactive_remediation(gap, db)
    return {"status": "triggered"}


# 2. Reactive Chatbot Endpoint
class MessageHistory(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[MessageHistory] = []

@router.post("/chat")
def chat_with_agent(req: ChatRequest, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    student_id = current_user["student_id"]
    
    # Construct Context
    db.execute("SELECT first_name FROM STUDENT WHERE student_id = %s", (student_id,))
    name_row = db.fetchone()
    
    db.execute("""
        SELECT c.concept_name, kg.severity
        FROM KNOWLEDGEGAP kg
        JOIN CONCEPT c ON c.concept_id = kg.concept_id
        WHERE kg.student_id = %s
    """, (student_id,))
    gaps = db.fetchall()
    gaps_str = ", ".join([f"{g['concept_name']} ({g['severity']})" for g in gaps])
    
    student_context = {
        "profile": name_row["first_name"] if name_row else "Student",
        "gaps": gaps_str
    }
    
    # Construct Message Stream
    messages = []
    for h in req.history:
        if h.role == "user":
            messages.append(HumanMessage(content=h.content))
        elif h.role == "ai":
            messages.append(AIMessage(content=h.content))
            
    messages.append(HumanMessage(content=req.message))
    
    # Execute LangGraph node
    result = chat_app.invoke({"messages": messages, "student_context": student_context})
    
    latest_msg = result["messages"][-1]
    return {"reply": latest_msg.content}
