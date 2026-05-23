# ArchitecturePlanner

ArchitecturePlanner is an MVP web app that generates deterministic architecture recommendations for early-stage software projects.

It combines:
- a questionnaire-driven planning API (Express + PostgreSQL)
- a React frontend for interactive plan generation
- Dockerized deployment with Nginx TLS proxying

## Features

- Deterministic plan generation from project constraints.
- Scenario simulation endpoints for comparing architecture options.
- Diagram export support (`.drawio` and browser-generated `.png`).
- Admin workspace for user management, analytics, and engine settings.
- Auth0-based authentication for SPA and protected API routes.

## Tech Stack

- Backend: Node.js, Express, PostgreSQL, Drizzle ORM
- Frontend: React, Vite
- Infra: Docker, Docker Compose, Nginx
- Auth: Auth0

## Project Structure

```text
.
|- backend/         # Express API, rule engine, DB access, admin routes
|- frontend/        # React SPA (Vite)
|- db/              # PostgreSQL image and initialization assets
|- nginx/           # Nginx config, Dockerfile, local TLS cert script
|- docs/            # Project documentation
|- test/            # Additional test assets
`- docker-compose.yml
```

## Quick Start (Local Development)

### 1. Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+ (optional if using Docker for DB)

### 2. Backend setup

```bash
cd backend
npm install
```

Update `backend/.env` with your environment values:

```env
DATABASE_URL=postgres://user:password@localhost:5432/architecture_planner
DATABASE_SSL=false
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://architectureplanner/api
```

Start backend:

```bash
npm start
```

Backend runs on `http://localhost:4000` by default.

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create or update `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_spa_client_id
VITE_AUTH0_AUDIENCE=https://architectureplanner/api
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
VITE_AUTH0_LOGOUT_RETURN_TO=http://localhost:5173
```

Start frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Docker Deployment

Generate local TLS certs (for local HTTPS on `20532`):

```powershell
powershell -ExecutionPolicy Bypass -File .\nginx\generate-dev-certs.ps1
```

Start full stack:

```bash
docker compose up --build
```

Services:
- PostgreSQL: `localhost:5432`
- Backend: internal `backend:4000` (proxied by Nginx)
- Nginx: `http://localhost` and `https://localhost:20532`

## Authentication (Auth0)

Create:
- one SPA application (frontend)
- one API (backend)

Recommended API identifier:

```text
https://architectureplanner/api
```

For local frontend development (`http://localhost:5173`), configure:
- Allowed Callback URLs: `http://localhost:5173`
- Allowed Logout URLs: `http://localhost:5173`
- Allowed Web Origins: `http://localhost:5173`

For Docker + Nginx local HTTPS (`https://localhost:20532`), also configure:
- Allowed Callback URLs: `https://localhost:20532`
- Allowed Logout URLs: `https://localhost:20532`
- Allowed Web Origins: `https://localhost:20532`

## API Overview

Core endpoints:
- `GET /api/health`
- `GET /api/questionnaire`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `POST /api/plans/generate`
- `POST /api/plans/scenarios/generate`
- `GET /api/plans/recent`
- `GET /api/plans`
- `GET /api/plans/:planId`
- `DELETE /api/plans/:planId`

Admin endpoints:
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId`
- `PATCH /api/admin/users/:userId/role`
- `DELETE /api/admin/users/:userId`
- `GET /api/admin/analytics/overview`
- `GET /api/admin/reports/analytics.pdf`
- `GET /api/admin/settings/engine`
- `PATCH /api/admin/settings/engine`
- `GET /api/admin/technologies`
- `POST /api/admin/technologies`
- `PATCH /api/admin/technologies/:technologyId`
- `DELETE /api/admin/technologies/:technologyId`

## Admin Bootstrap

After first login creates a local user row, promote user to admin:

```bash
cd backend
npm run admin:promote -- user@example.com
```

Alternative (inside Docker container):

```bash
docker exec architectureplanner-backend node scripts/promote-admin.js user@example.com
```

## Testing

Backend tests:

```bash
cd backend
npm test
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make focused, tested changes.
4. Open a pull request with clear context and validation steps.

## License

No root `LICENSE` file is currently included. Add one before publishing this repository as open source.
