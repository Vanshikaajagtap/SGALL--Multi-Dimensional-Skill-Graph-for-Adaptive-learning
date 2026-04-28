from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/students", tags=["Students"])


@router.get("/")
def list_students(db=Depends(get_db), current_user: dict = Depends(require_admin)):
    
    db.execute("""
        SELECT student_id, first_name, last_name, email,
               degree_program, study_year
        FROM STUDENT
        ORDER BY student_id
    """)
    return db.fetchall()


@router.get("/me")
def get_student_me(db=Depends(get_db), current_user: dict = Depends(get_current_user)):
     
    db.execute("""
        SELECT student_id, first_name, last_name, email,
               contact_no, degree_program, study_year, dob, role
        FROM STUDENT
        WHERE student_id = %s
    """, (current_user["student_id"],))
    student = db.fetchone()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/me/dashboard")
def get_dashboard_me(db=Depends(get_db), current_user: dict = Depends(get_current_user)):
     return _fetch_dashboard(current_user["student_id"], db)


@router.get("/{student_id}/dashboard")
def get_dashboard_admin(student_id: int, db=Depends(get_db), current_user: dict = Depends(require_admin)):
    return _fetch_dashboard(student_id, db)


def _fetch_dashboard(student_id: int, db):
     
    db.execute("""
        SELECT student_id, first_name, last_name, email,
               degree_program, study_year, role
        FROM STUDENT WHERE student_id = %s
    """, (student_id,))
    profile = db.fetchone()
    if not profile:
        raise HTTPException(status_code=404, detail="Student not found")
 
    db.execute("""
        SELECT a.attempt_id, a.concept_id, c.concept_name, c.difficulty,
               a.score, a.time_spent_mins, a.attempt_timestamp
        FROM ATTEMPTS a
        JOIN CONCEPT c ON c.concept_id = a.concept_id
        WHERE a.student_id = %s
        ORDER BY a.attempt_timestamp DESC
        LIMIT 20
    """, (student_id,))
    attempts = db.fetchall()
 
    db.execute("""
        SELECT kg.gap_id, kg.concept_id, c.concept_name, c.difficulty,
               kg.severity, kg.detected_on, kg.ai_remediation
        FROM KNOWLEDGEGAP kg
        JOIN CONCEPT c ON c.concept_id = kg.concept_id
        WHERE kg.student_id = %s
        ORDER BY
            CASE kg.severity WHEN 'Critical' THEN 0 ELSE 1 END,
            kg.detected_on DESC
    """, (student_id,))
    gaps = db.fetchall()
 
    db.execute("""
        SELECT
            COUNT(*) AS total_attempts,
            ROUND(AVG(score), 2) AS avg_score,
            COUNT(DISTINCT concept_id) AS concepts_attempted
        FROM ATTEMPTS
        WHERE student_id = %s
    """, (student_id,))
    stats = db.fetchone()

    return {
        "profile": profile,
        "recent_attempts": attempts,
        "knowledge_gaps": gaps,
        "stats": stats,
    }
