import os
from typing import TypedDict, Annotated, Sequence
import operator
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage
from langgraph.graph import StateGraph, START, END

from dotenv import load_dotenv
load_dotenv()

class AgentState(TypedDict): 
    messages: Annotated[Sequence[BaseMessage], operator.add]
    student_context: dict

def init_llm():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        return None
    return ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
 
def generate_remediation_plan(concept_name: str, difficulty: str, severity: str) -> str:
    
    llm = init_llm()
    if not llm:
        return f"Atlas AI Guide: Review the foundational principles of {concept_name}."
    
    prompt = f"""You are Atlas, an expert AI tutor in a university computer science program.
The student has a {severity} knowledge gap in the {difficulty} concept '{concept_name}'.
Provide a strict, targeted, highly actionable 3-sentence study plan to remediate this specific gap.
Do not use generic advice. Speak directly to the student."""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content.strip()
    except Exception as e:
        return f"Atlas AI Guide is currently offline. Focus your review on {concept_name} lecture materials."
 
def chatbot_node(state: AgentState): 
    llm = init_llm()
    messages = state["messages"]
    student_context = state.get("student_context", {})
    
    if not llm: 
        return {"messages": [AIMessage(content="The Atlas AI Tutor is currently offline. Please set a valid GEMINI_API_KEY in the backend .env.")]}
         
    sys_prompt = f"You are Atlas, the intelligent tutor for the university program. "
    if student_context:
        sys_prompt += f"You are speaking to {student_context.get('profile', 'a student')}. "
        if student_context.get('gaps'):
            sys_prompt += f"Their current active knowledge gaps are: {student_context.get('gaps')}. "
        else:
            sys_prompt += "They have no currently detected critical gaps. "
    sys_prompt += "Guide the student using Socratic questioning. Do not give them direct answers to code or math problems; instead, help them arrive at the conclusion themselves. Keep responses concise and formatting clean."

    full_messages = [SystemMessage(content=sys_prompt)] + list(messages)
    
    try:
        response = llm.invoke(full_messages)
        return {"messages": [response]}
    except Exception as e:
        return {"messages": [AIMessage(content=f"Error connecting to AI: {str(e)}")]}
 
workflow = StateGraph(AgentState)
workflow.add_node("chatbot", chatbot_node)
workflow.add_edge(START, "chatbot")
workflow.add_edge("chatbot", END)

chat_app = workflow.compile()
