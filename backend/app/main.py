"""
Atlas — FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import router as auth_router
from .routers.students import router as students_router
from .routers.graph import router as graph_router
from .routers.attempts import router as attempts_router
from .routers.analytics import router as analytics_router
from .routers.ai import router as ai_router

app = FastAPI(
    title="Atlas API",
    description="DAG-based learning analytics — root-cause gap detection",
    version="1.0.0",
)

# CORS — allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(students_router)
app.include_router(graph_router)
app.include_router(attempts_router)
app.include_router(analytics_router)
app.include_router(ai_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "Atlas API", "version": "1.0.0"}
