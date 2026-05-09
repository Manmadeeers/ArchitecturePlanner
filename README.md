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
- `GET /api/plans`
- `GET /api/plans/:planId`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId/role`
- `GET /api/admin/analytics/overview`
- `GET /api/admin/settings/engine`
- `PATCH /api/admin/settings/engine`

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

When you run the SPA through Docker + Nginx instead of the Vite dev server, add these too:

- Allowed Callback URLs: `https://localhost:20532`
- Allowed Logout URLs: `https://localhost:20532`
- Allowed Web Origins: `https://localhost:20532`

Auth0 matches callback URLs exactly, including protocol and port, so `http://localhost:5173` and `https://localhost:20532` must both be listed if you use both environments.

## Admin bootstrap

Admin access is controlled by the local `users.role` column, while Auth0 remains the identity provider.

Recommended first-admin flow:

1. Sign in once through the app so the local `users` row is created.
2. Promote that user from `backend/`:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run admin:promote -- user@example.com
```

If you are working from the Docker stack only, you can run the same promotion inside the backend container:

```powershell
docker exec architectureplanner-backend node scripts/promote-admin.js user@example.com
```

You can also promote a user manually in PostgreSQL:

```sql
update users
set role = 'admin'
where email = 'user@example.com';
```

After promotion, the authenticated header menu exposes the admin workspace, where admins can:

- manage user roles
- review system-wide analytics
- update safe engine settings used by future plan generations

## Docker deployment

The repository now includes:

- `backend/Dockerfile`: production Node.js API image
- `db/Dockerfile`: PostgreSQL image with schema initialization baked in
- `nginx/Dockerfile`: multi-stage image that builds the frontend and serves it from Nginx
- `nginx/default.conf`: HTTPS reverse proxy and SPA/static file config
- `docker-compose.yml`: Postgres + backend + Nginx stack

Expected certificate files for the Nginx container:

- `nginx/certs/fullchain.pem`
- `nginx/certs/privkey.pem`

For local development, you can generate a self-signed pair without installing OpenSSL on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\nginx\generate-dev-certs.ps1
```

The frontend production build uses:

```text
VITE_API_BASE_URL=/api
```

so Nginx can proxy API traffic to the backend container on the same origin.
The Docker frontend build also reads `frontend/.env`, so your `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, and `VITE_AUTH0_AUDIENCE` values are baked into the SPA image together with the production redirect URL from `frontend/.env.production`.

To start the stack:

```powershell
docker compose up --build
```

The compose file:

- builds PostgreSQL from `db/Dockerfile` and initializes schema from `backend/db/schema.sql`
- runs the backend against the `db` service over the internal Docker network
- exposes Nginx on ports `80` and `20532`

If you already have an existing Postgres volume from an older version of the project, init scripts will not rerun automatically. Apply upgrade SQL manually from:

- `backend/db/migrations/001_link_generated_plans_to_users.sql`
- `backend/db/migrations/002_store_full_plan_payloads.sql`
- `backend/db/migrations/003_add_admin_tables.sql`

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
