# Atlas

> DAG-based learning analytics system that diagnoses the exact root cause of a student's learning failure.

Atlas models academic concepts as a **Directed Acyclic Graph (DAG)** within PostgreSQL and automatically traces learning failures backward through prerequisite chains to identify the **highest-order unmastered prerequisite**.

---

## Architecture

| Tier | Technology |
|------|-----------|
| **Frontend** | React (Vite) + Tailwind CSS v4 + React Flow + Recharts |
| **Backend** | Python FastAPI + JWT Auth |
| **Database** | PostgreSQL 16 with triggers & recursive CTEs |

## Quick Start

### 1. Database

Using Docker (recommended):

```bash
docker compose up -d
```

Or manually create a database named `skillweave` and run:

```bash
psql -U postgres -d skillweave -f db/init.sql
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Demo Login

Use any student email from the seed data with password `password123`:

| Email | Student |
|-------|---------|
| `aryan.k@srm.edu` | Aryan Khan |
| `priya.s@srm.edu` | Priya Sharma |
| `rohan.m@srm.edu` | Rohan Mehta |

---

## Core Features

1. **Interactive DAG Visualization** — React Flow renders all concepts and prerequisite edges
2. **Root-Cause Traversal** — Click any concept node to trace the critical path back to the foundational gap
3. **Automated Gap Detection** — PostgreSQL trigger auto-generates knowledge gaps when scores fall below thresholds
4. **Analytics Dashboard** — System-wide gap frequency, severity distribution, and student performance charts

## Database Schema

- **STUDENT** — Core profiles
- **CONCEPT** — Graph nodes with difficulty levels
- **PREREQUISITES** — DAG edges (parent → child)
- **ATTEMPTS** — Transactional learning activity logs
- **KNOWLEDGEGAP** — Auto-populated via trigger (score < 35 → Critical, < 50 → Warning)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | JWT authentication |
| GET | `/api/v1/students/{id}/dashboard` | Student dashboard data |
| GET | `/api/v1/graph/concepts` | Full DAG (nodes + edges) |
| GET | `/api/v1/graph/root-cause/{student}/{concept}` | Root-cause analysis |
| POST | `/api/v1/attempts/` | Log new attempt (triggers gap detection) |
| GET | `/api/v1/analytics/gaps` | Aggregated gap data |
