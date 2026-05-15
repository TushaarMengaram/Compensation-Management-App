# Compensation Management MVP

Full-stack MVP for managing employee salary review cycles, proposals, approvals with budget enforcement, and immutable salary history.

## Tech stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React + Vite + Tailwind + React Router + Axios | Fast dev experience, easy styling, simple data fetching |
| Backend | Express + Mongoose | Minimal ceremony, flexible JSON APIs |
| Database | MongoDB | Document model fits cycles, proposals, and audit rows |
| Auth | JWT + bcrypt | Stateless sessions suitable for local/demo deployments |

## Architecture

- **Server** (`server/`): REST API under `/api`, JWT bearer auth, role middleware (`employee` vs `admin`), domain rules enforced in controllers + small services (`budgetService`, `cycleCloseService`).
- **Client** (`client/`): SPA with protected routes by role, Axios instance with interceptors, toast notifications, dashboard-style layouts.

### Core workflow

1. Admin creates an **Open** review cycle with a **positive** total budget.
2. Admin creates **Proposed** salary proposals (proposed salary must exceed the snapshot current salary; justification required).
3. A **different** admin approves or rejects (self-approval blocked on API and UI).
4. **Approve** checks `sum(approved costs in cycle) + this proposal cost <= totalBudget`.
5. When every proposal is **Approved** or **Rejected**, admin **closes** the cycle: approved rows update `SalaryRecord`, append-only `SalaryHistory` entries are created, cycle becomes **Closed**. Close is idempotent if already closed.

## Local setup

### Prerequisites

- Node.js 18+ (for native `watch` / ESM)
- MongoDB running locally (e.g. `mongodb://127.0.0.1:27017/compensation_mvp`)

### Backend

```bash
cd server
cp .env.example .env
# Edit .env: MONGO_URI, JWT_SECRET, ADMIN_* and optional SECOND_ADMIN_*
npm install
npm run seed
npm run dev
```

API base: `http://localhost:5000/api` (or your `PORT`).

### Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

### Run both apps (optional)

From the repository root:

```bash
npm run install:all
npm install
npm run dev
```

`install:all` installs dependencies in `server/` and `client/`. The root `npm install` adds `concurrently` so `npm run dev` can start the API and Vite together.

### Demo accounts (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Admin123!` |
| Admin | `admin2@example.com` | `Admin123!` |
| Employee | `jane.doe@example.com` | `Employee123!` |
| Employee | `john.smith@example.com` | `Employee123!` |
| Employee | `alex.lee@example.com` | `Employee123!` |

Seeded employees have realistic salaries and **salary history** from a closed demo cycle (`FY2024 Annual Review (Demo)`). New self-registrations still start at **$0** with empty history.

### Demo flow

1. Sign in as a seeded employee (e.g. `jane.doe@example.com`) to view salary and history, **or** register a new employee (starts at **$0**).
2. Sign in as **admin** (`ADMIN_EMAIL` / `ADMIN_PASSWORD` from seed).
3. Optionally sign in as **second admin** (`SECOND_ADMIN_*`) to approve proposals the first admin created.
4. In **Employees**, note the employee id contextually (table lists staff).
5. **Create cycle** with a realistic budget.
6. Under **Proposals**, create a proposal: pick employee, cycle, proposed salary **greater than current**, add justification.
7. Switch to the **other** admin account → **Approve** or **Reject**.
8. After all proposals are decided, **Review cycles** → **Close cycle**.
9. Sign back in as the employee → **Salary** and **Salary history** reflect applied changes.

## Environment variables

**`server/.env`**

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | Mongo connection string |
| `JWT_SECRET` | Signing secret for JWTs |
| `CLIENT_ORIGIN` | CORS origin for the Vite dev server |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Primary seeded admin |
| `SECOND_ADMIN_*` | Optional second admin for approval demos |

**`client/.env`**

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL for Axios (e.g. `http://localhost:5000/api`) |

## Security notes (MVP scope)

- **Employees** only hit `/api/employees/*` (salary + own history). Admin/proposal/cycle routes require `admin`.
- **Self-approval** is rejected with `403` on both approve and reject.
- **Salary history** has no update/delete HTTP routes; Mongoose middleware blocks mutating deletes/updates at the model layer as defense-in-depth.
- Registration creates **employee** accounts only; admins come from **seed** (avoid public admin self-signup).

## Assumptions and tradeoffs

- **MongoDB transactions**: Cycle close performs sequential writes without a multi-document transaction for maximum compatibility with a standalone local MongoDB. For production, use a replica set and `withTransaction` around close + apply.
- **Sorting proposals by employee name** uses denormalized `employeeNameSnapshot` for simple indexed sorts.
- **Currency** is displayed as USD in the UI; amounts are stored as numbers without currency metadata.
- **Single role per user**; admins use admin routes exclusively in this MVP UI.

## Future improvements

- Refresh tokens / server-side session revocation
- Fine-grained permissions (e.g. HR vs Finance approvers)
- Multi-currency, bonus components, and proration rules
- Audit log for admin actions beyond salary history
- E2E tests (Playwright) for the critical approval + close path

## AI usage disclosure

This repository was implemented with assistance from an AI coding agent (Cursor), including scaffolding, business-rule enforcement, UI layout, and documentation. All code should be reviewed, tested, and adapted to your organization’s policies before production use.
