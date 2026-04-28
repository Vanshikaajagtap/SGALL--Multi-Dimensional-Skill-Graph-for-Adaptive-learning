from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/graph", tags=["Graph"])


@router.get("/concepts")
def get_all_concepts(db=Depends(get_db)):
     
    db.execute("SELECT concept_id, concept_name, difficulty FROM CONCEPT ORDER BY concept_id")
    nodes = db.fetchall()

    db.execute("SELECT parent_id, child_id FROM PREREQUISITES ORDER BY parent_id, child_id")
    edges = db.fetchall()

    return {"nodes": nodes, "edges": edges}


@router.get("/prerequisites/{concept_id}")
def get_prerequisite_chain(concept_id: int, db=Depends(get_db)):
     
    db.execute("""
        WITH RECURSIVE prereq_chain AS (
            SELECT c.concept_id, c.concept_name, c.difficulty, 0 AS depth
            FROM CONCEPT c
            WHERE c.concept_id = %s

            UNION ALL

            SELECT c.concept_id, c.concept_name, c.difficulty, pc.depth + 1
            FROM prereq_chain pc
            JOIN PREREQUISITES p ON p.child_id = pc.concept_id
            JOIN CONCEPT c ON c.concept_id = p.parent_id
        )
        SELECT * FROM prereq_chain ORDER BY depth DESC
    """, (concept_id,))
    chain = db.fetchall()

    if not chain:
        raise HTTPException(status_code=404, detail="Concept not found")

    return {"concept_id": concept_id, "prerequisite_chain": chain}


@router.get("/root-cause/me/{concept_id}")
def get_root_cause_me(concept_id: int, db=Depends(get_db), current_user: dict = Depends(get_current_user)):
     
    return _fetch_root_cause(current_user["student_id"], concept_id, db)


@router.get("/root-cause/{student_id}/{concept_id}")
def get_root_cause_admin(student_id: int, concept_id: int, db=Depends(get_db), current_user: dict = Depends(require_admin)):
     
    return _fetch_root_cause(student_id, concept_id, db)


def _fetch_root_cause(student_id: int, concept_id: int, db):
    db.execute("""
        SELECT * FROM find_root_cause(%s, %s)
    """, (student_id, concept_id))
    full_chain = db.fetchall()

    if not full_chain:
        raise HTTPException(status_code=404, detail="Concept not found")
 
    unmastered = [
        node for node in full_chain
        if node["best_score"] is None or float(node["best_score"]) < 50
    ]
 
    root_cause = unmastered[0] if unmastered else None

    critical_path_ids = [n["concept_id"] for n in unmastered]

    return {
        "student_id": student_id,
        "target_concept_id": concept_id,
        "full_chain": full_chain,
        "root_cause": root_cause,
        "critical_path_ids": critical_path_ids,
    }
