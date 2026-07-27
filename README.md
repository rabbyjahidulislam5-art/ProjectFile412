# Smart Campus — Module 0: Foundation

Monorepo foundation for the Smart Campus app: Next.js 15 frontend, Express/TypeScript backend, Prisma on Neon PostgreSQL.

```
frontend/   Next.js 15 App Router, Tailwind, auth pages, global nav shell
backend/    Express + TypeScript API, Prisma schema, auth feature
render.yaml Render deploy blueprint for the backend
```

## Local setup

```bash
npm install                       # installs both workspaces
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Fill in `backend/.env`:
- `DATABASE_URL` — a Neon Postgres connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — distinct random strings (32+ chars)

Then push the schema and start both apps:

```bash
npm run prisma:migrate --workspace backend -- --name init
npm run dev:backend     # http://localhost:4000
npm run dev:frontend    # http://localhost:3000
```

## Deployment

- **Database**: create a Neon Postgres project, copy the pooled connection string into `DATABASE_URL`.
- **Backend (Render)**: connect the repo — `render.yaml` provisions the web service (root dir `backend`, health check `/api/health`). Set `DATABASE_URL` and `CORS_ORIGIN` (your Vercel URL) in the Render dashboard; JWT secrets are auto-generated.
- **Frontend (Vercel)**: import the repo, set the project's Root Directory to `frontend`, and add `NEXT_PUBLIC_API_URL` pointing at the Render backend URL.

## What's built (Module 0)

- Full Prisma schema for every table in the system-wide design (users, wallets, transactions, shops, dues/fines, prepaid/postpaid billing, notifications, audit logs).
- Express foundation: env validation, structured logging, global error handler, Zod request validation, JWT access + refresh cookie auth, role-based `authorize()` middleware, rate limiting, Helmet, CORS.
- Full auth feature: register, login, forgot/reset password (OTP), forced password reset for staff-provisioned accounts, refresh, logout, `/me`.
- Frontend foundation: Tailwind design tokens, dark theme, the responsive top-nav/bottom-nav shell (no sidebar, per spec), global primitives (Button, Input, Toast, Modal/Sheet, Badge, Empty State), and the four auth pages wired end-to-end to the API.

Role dashboards (Student, Admin Office, Library, Accounts Office, Shop) are out of scope for this module and land in Modules 1–5.
