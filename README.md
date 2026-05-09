# ArchitecturePlanner

ArchitecturePlanner is a course-project MVP for startups and small companies that need a deterministic recommendation for application architecture, deployment style, and early infrastructure planning.

## What the MVP includes

- `backend/`: Express API with questionnaire endpoint, deterministic rule engine, and plan generation endpoint.
- `frontend/`: React interface for filling the questionnaire and viewing generated results.
- `backend/db/schema.sql`: PostgreSQL schema for storing generated plans and cached regional data.
- Diagram export support:
  - `.drawio` generated from backend XML
  - `.png` generated in the browser from the returned diagram model

## Main API endpoints

- `GET /api/health`
- `GET /api/questionnaire`
- `POST /api/plans/generate`
- `GET /api/plans/recent`

## Backend run

Use the Node.js npm wrapper directly on this machine:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install
& 'C:\Program Files\nodejs\npm.cmd' start
```

Run those commands inside `backend/`.
The backend only exposes API routes now; frontend static assets are expected to be served separately, for example by Nginx.
Protected routes now also require Auth0 configuration from `backend/.env.example`.

## Frontend run

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

Run those commands inside `frontend/`.
Auth0 SPA configuration lives in `frontend/.env.example`.

## Auth0 setup

Create these Auth0 resources:

- SPA application for the React frontend
- API for the Express backend

Recommended API identifier:

```text
https://architectureplanner/api
```

Then configure environment variables from:

- `backend/.env.example`
- `frontend/.env.example`

Suggested local Auth0 dashboard URLs:

- Allowed Callback URLs: `http://localhost:5173`
- Allowed Logout URLs: `http://localhost:5173`
- Allowed Web Origins: `http://localhost:5173`

## Database setup

Create a PostgreSQL database and apply:

```sql
\i backend/db/schema.sql
```

Then set:

```powershell
$env:DATABASE_URL="postgres://user:password@localhost:5432/architecture_planner"
```

If `DATABASE_URL` is not set, the API still generates plans but does not persist them.
