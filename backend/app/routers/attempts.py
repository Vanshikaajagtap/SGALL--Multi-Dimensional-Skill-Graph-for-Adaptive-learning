from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from ..database import get_db
from ..auth import get_current_user
from .ai import process_proactive_remediation, GapInfo

router = APIRouter(prefix="/api/v1/attempts", tags=["Attempts"])


class AttemptCreate(BaseModel):
    concept_id: int
    score: float = Field(ge=0, le=100)
    time_spent_mins: int | None = None


@router.post("/", status_code=201)
def create_attempt(attempt: AttemptCreate, background_tasks: BackgroundTasks, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    student_id = current_user["student_id"]
 
    db.execute("SELECT concept_id FROM CONCEPT WHERE concept_id = %s", (attempt.concept_id,))
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="Concept not found")

    db.execute("""
        INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins)
        VALUES (%s, %s, %s, %s)
        RETURNING attempt_id, student_id, concept_id, score, time_spent_mins, attempt_timestamp
    """, (student_id, attempt.concept_id, attempt.score, attempt.time_spent_mins))
    new_attempt = db.fetchone()
 
    db.execute("""
        SELECT kg.gap_id, kg.severity, kg.detected_on, kg.ai_remediation, c.concept_name, c.difficulty
        FROM KNOWLEDGEGAP kg
        JOIN CONCEPT c ON c.concept_id = kg.concept_id
        WHERE kg.student_id = %s AND kg.concept_id = %s
    """, (student_id, attempt.concept_id))
    gap = db.fetchone()
 
    if gap and gap["severity"] == "Critical" and not gap.get("ai_remediation"):
        gap_info = GapInfo(
            gap_id=gap["gap_id"],
            concept_name=gap["concept_name"],
            difficulty=gap["difficulty"],
            severity=gap["severity"]
        )
        background_tasks.add_task(process_proactive_remediation, gap_info, db)

    return {
        "attempt": new_attempt,
        "auto_generated_gap": gap,
    }


@router.get("/me")
def get_attempts_me(limit: int = 50, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
     
    db.execute("""
        SELECT a.attempt_id, a.concept_id, c.concept_name,
               a.score, a.time_spent_mins, a.attempt_timestamp
        FROM ATTEMPTS a
        JOIN CONCEPT c ON c.concept_id = a.concept_id
        WHERE a.student_id = %s
        ORDER BY a.attempt_timestamp DESC
        LIMIT %s
    """, (current_user["student_id"], limit))
    return db.fetchall()
