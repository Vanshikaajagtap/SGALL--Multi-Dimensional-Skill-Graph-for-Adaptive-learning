"""
SkillWeave — Analytics Routes
"""

from fastapi import APIRouter, Depends
from ..database import get_db
from ..auth import require_admin

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get("/overview")
def get_overview(db=Depends(get_db), current_user: dict = Depends(require_admin)):
    """System-wide summary statistics (Admin only)."""
    db.execute("""
        SELECT
            (SELECT COUNT(*) FROM STUDENT) AS total_students,
            (SELECT COUNT(*) FROM CONCEPT) AS total_concepts,
            (SELECT COUNT(*) FROM ATTEMPTS) AS total_attempts,
            (SELECT COUNT(*) FROM KNOWLEDGEGAP) AS total_gaps,
            (SELECT COUNT(*) FROM KNOWLEDGEGAP WHERE severity = 'Critical') AS critical_gaps,
            (SELECT COUNT(*) FROM KNOWLEDGEGAP WHERE severity = 'Warning') AS warning_gaps
    """)
    return db.fetchone()


@router.get("/gaps")
def get_gap_aggregation(db=Depends(get_db), current_user: dict = Depends(require_admin)):
    """
    Aggregated gap data using SQL window functions.
    Returns the most frequent critical gaps across all students.
    (Admin only)
    """
    db.execute("""
        SELECT
            c.concept_id,
            c.concept_name,
            c.difficulty,
            kg.severity,
            COUNT(*) AS student_count,
            RANK() OVER (ORDER BY COUNT(*) DESC) AS frequency_rank
        FROM KNOWLEDGEGAP kg
        JOIN CONCEPT c ON c.concept_id = kg.concept_id
        GROUP BY c.concept_id, c.concept_name, c.difficulty, kg.severity
        ORDER BY student_count DESC
    """)
    return db.fetchall()


@router.get("/severity-distribution")
def get_severity_distribution(db=Depends(get_db), current_user: dict = Depends(require_admin)):
    """Gap count grouped by severity (Admin only)."""
    db.execute("""
        SELECT severity, COUNT(*) AS count
        FROM KNOWLEDGEGAP
        GROUP BY severity
        ORDER BY severity
    """)
    return db.fetchall()


@router.get("/student-performance")
def get_student_performance(db=Depends(get_db), current_user: dict = Depends(require_admin)):
    """Average score per student with gap count (Admin only)."""
    db.execute("""
        SELECT
            s.student_id,
            s.first_name || ' ' || s.last_name AS student_name,
            ROUND(AVG(a.score), 2) AS avg_score,
            COUNT(DISTINCT a.concept_id) AS concepts_attempted,
            COALESCE(g.gap_count, 0) AS gap_count
        FROM STUDENT s
        LEFT JOIN ATTEMPTS a ON a.student_id = s.student_id
        LEFT JOIN (
            SELECT student_id, COUNT(*) AS gap_count
            FROM KNOWLEDGEGAP
            GROUP BY student_id
        ) g ON g.student_id = s.student_id
        GROUP BY s.student_id, s.first_name, s.last_name, g.gap_count
        ORDER BY avg_score DESC
    """)
    return db.fetchall()
