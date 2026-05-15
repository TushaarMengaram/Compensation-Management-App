# Compensation Management MVP

Full-stack MVP for salary review cycles: admins create proposals, a **different** admin approves or rejects, budget is enforced on approval, and closing a cycle applies approved changes with **append-only** salary history.

---

## Setup & run (under 10 minutes)

### Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js 18+** | For native ESM and `npm` scripts |
| **MongoDB** | Local instance, e.g. `mongodb://127.0.0.1:27017/compensation_mvp` |
| **~5 minutes** | Clone, install, seed, start both apps |

### 1. Clone and install

```bash
git clone <repository-url>
cd Paltech_project

npm run install:all   # installs server/ and client/ dependencies
npm install           # root devDependency: concurrently (optional, for npm run dev)
```

### 2. Configure environment

**Server** — copy and edit:

```bash
cd server
cp .env.example .env
```

Minimum in `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/compensation_mvp
JWT_SECRET=change_this_to_a_long_random_string_for_local_dev
CLIENT_ORIGIN=http://localhost:5173
```

Admin seed credentials (used by `npm run seed`):

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=Primary Admin

SECOND_ADMIN_EMAIL=admin2@example.com
SECOND_ADMIN_PASSWORD=Admin123!
SECOND_ADMIN_NAME=Secondary Admin
```

**Client** — copy and align API port with `PORT`:

```bash
cd ../client
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

If you change `PORT` in `server/.env`, update `VITE_API_URL` to match.

### 3. Start MongoDB

Ensure MongoDB is running locally (Windows service, Docker, or `mongod`). The API exits with a clear error if the connection fails.

### 4. Seed and run

**Option A — two terminals (recommended first time)**

```bash
# Terminal 1
cd server
npm run seed
npm run dev

# Terminal 2
cd client
npm run dev
```

**Option B — single command from repo root**

```bash
cd server && npm run seed && cd ..
npm run dev
```

| App | URL |
|-----|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:5000/api |
| Health | http://localhost:5000/api/health |

### 5. Quick smoke test

1. Open http://localhost:5173 → **Login** as `admin@example.com` / `Admin123!`.
2. **Review cycles** → confirm seeded closed cycle exists.
3. **Proposals** → create a proposal in an **Open** cycle (or create a cycle first).
4. Log out → log in as `admin2@example.com` → **Approve** the proposal (not your own).
5. Log in as `jane.doe@example.com` / `Employee123!` → view salary and history.

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Admin123!` |
| Admin | `admin2@example.com` | `Admin123!` |
| Employee | `jane.doe@example.com` | `Employee123!` |
| Employee | `john.smith@example.com` | `Employee123!` |
| Employee | `alex.lee@example.com` | `Employee123!` |

Seeded employees have non-zero salaries and history from a closed demo cycle. **Self-registration** creates employees only (see Assumptions).

### Troubleshooting

- **`ECONNREFUSED` / MongoDB** — start MongoDB; confirm `MONGO_URI` in `server/.env` (not a stale Atlas URL).
- **CORS / network errors** — `CLIENT_ORIGIN` must match the Vite URL; `VITE_API_URL` must match `PORT`.
- **Windows + OneDrive** — if `.env` does not apply, confirm the file on disk matches what the server reads.

---

## Tech stack & rationale

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, Axios | Fast local dev, simple SPA routing, utility-first styling without a heavy component library |
| **Backend** | Node.js, Express | Minimal boilerplate for a hackathon-sized REST API |
| **ODM** | Mongoose | Schema validation, middleware (e.g. blocking salary-history mutations), familiar MongoDB mapping |
| **Database** | **MongoDB** | Documents map naturally to review cycles, proposals, and audit rows; flexible nested refs; easy local install for reviewers |
| **Auth** | **JWT** (Bearer) + **bcryptjs** (cost factor **10**) | Stateless API suitable for a demo/MVP; passwords never stored in plain text; role carried in token payload |
| **Validation** | express-validator | Request validation on auth and write endpoints |
| **UI feedback** | react-hot-toast | Lightweight success/error toasts |

### Storage layer (MongoDB)

- **Users**, **SalaryRecord** (current salary per employee), **ReviewCycle**, **Proposal**, **SalaryHistory** (immutable audit trail).
- References use ObjectIds; proposals snapshot `currentSalarySnapshot`, `costOfChange`, and `employeeNameSnapshot` for stable sorting and audit.
- **Salary history** has no update/delete HTTP routes; Mongoose pre-hooks on `SalaryHistory` block updates/deletes as defense-in-depth.
- Cycle **close** applies approved proposals sequentially (see Trade-offs — no multi-document transaction on standalone MongoDB).

### Auth & password hashing

- **Register** (`POST /api/auth/register`): employee role only; password hashed with `bcrypt.hash(password, 10)`; creates `SalaryRecord` at **₹0**.
- **Login** (`POST /api/auth/login`): `bcrypt.compare` against stored hash; returns JWT signed with `JWT_SECRET`.
- **Protected routes**: `Authorization: Bearer <token>`; `authenticate` middleware loads user; `requireRole('admin')` gates admin/proposal/cycle routes.
- **Admins are not self-registered** — created only via `npm run seed` from `ADMIN_*` / `SECOND_ADMIN_*` env vars (see Assumptions).

---

## Architectural overview

```
Paltech_project/
├── server/                 # Express API
│   ├── index.js            # App entry, CORS, routes, error handler
│   ├── config/database.js  # Mongoose connection
│   ├── models/             # User, SalaryRecord, ReviewCycle, Proposal, SalaryHistory
│   ├── routes/             # authRoutes, employeeRoutes, adminRoutes, proposalRoutes
│   ├── controllers/        # HTTP handlers + validation orchestration
│   ├── middleware/         # authenticate (JWT), requireRole
│   ├── services/           # budgetService, cycleCloseService (domain workflows)
│   ├── utils/              # token, http helpers, date validation
│   └── scripts/seed.js     # Admins, demo employees, closed cycle + history
├── client/                 # Vite React SPA
│   ├── src/App.jsx         # Routes (public + role-protected)
│   ├── src/context/        # AuthContext (user, token, login/logout)
│   ├── src/services/api.js # Axios instance + interceptors
│   ├── src/layouts/        # AdminLayout, EmployeeLayout (sidebar nav)
│   ├── src/pages/          # admin/* and employee/* screens
│   ├── src/components/     # Spinner, StatusBadge, ProtectedRoute
│   └── src/utils/format.js # INR formatting, date helpers
└── package.json            # Root: concurrently dev script
```

### Request flow

1. **Employee**: `/api/employees/me/salary`, `/api/employees/me/salary-history` — own data only.
2. **Admin**: `/api/admin/*` — employees list/detail, cycles CRUD, close cycle.
3. **Proposals**: `/api/proposals` — list/create; approve/reject/patch/delete with rules in `proposalController.js`.
4. **Client**: `ProtectedRoute` sends employees vs admins to the correct layout; Axios attaches JWT from `localStorage`.

### Core business workflow

1. Admin creates an **Open** review cycle (budget > 0, effective date today or future).
2. Admin creates **Proposed** rows (proposed salary > snapshot; justification required).
3. **Another** admin approves/rejects (self-action blocked with 403 + UI message).
4. **Approve** checks cycle budget via `budgetService`.
5. When all proposals are **Approved** or **Rejected**, admin **closes** cycle → `cycleCloseService` updates salaries and writes `SalaryHistory` (idempotent if already closed).

### Key files

| File | Responsibility |
|------|----------------|
| `server/controllers/proposalController.js` | CRUD, approve/reject, creator-only edit/delete |
| `server/services/cycleCloseService.js` | Close cycle, apply salaries, pending-count messaging |
| `server/services/budgetService.js` | Sum approved costs vs `totalBudget` |
| `server/controllers/adminController.js` | Cycles, employees, salary/history by employee id |
| `client/src/pages/admin/AdminProposalsPage.jsx` | Create, filter, edit, delete, approve/reject UI |
| `client/src/pages/admin/AdminEmployeeDetailPage.jsx` | Admin view of employee salary + history |

---

## How AI tools were used

| Item | Detail |
|------|--------|
| **Assistant** | **Cursor** (AI coding agent in the IDE), including Composer-style multi-file edits |
| **AI-generated / scaffolded** | Initial repo layout (server + client), Mongoose models, route wiring, seed script, most admin/employee pages, Tailwind layouts, README drafts |
| **AI-assisted** | Business rules (self-approval block, budget check, cycle close, creator-only proposal edit), INR formatting, sidebar grouping, effective-date validation, proposal edit modal, bug fixes (CORS, env/MongoDB, JSX typos) |
| **Hand-written / human-directed** | Product decisions (two peer admins, INR currency, hackathon scope), acceptance-criteria gaps (employee filter, pagination, edit UI), review feedback (“proper buttons”, README structure) |
| **Reviewed & edited** | All merged code was iterated in chat: rejected or fixed incorrect `motion` JSX typos, Atlas vs local `MONGO_URI` mismatches, duplicate dashboard buttons |
| **Worth flagging** | AI occasionally introduced invalid JSX tag names (`motion` instead of `div`); always run `npm run build` in `client/` after large UI edits. AI suggested patterns were checked against acceptance criteria before treating features as done |

---

## Assumptions

| Topic | Assumption |
|-------|------------|
| **Scope** | Single organization; English UI; INR display (`en-IN`) with amounts stored as numbers (no currency field in DB) |
| **Roles** | One role per user: `employee` or `admin`; admins use admin UI only in this MVP |
| **Administrator creation** | **No public admin signup.** Admins are created by `server/scripts/seed.js` reading `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` and optional `SECOND_ADMIN_*`. Re-running seed is idempotent (skips existing emails). Both admins are **peers** — no primary/secondary hierarchy |
| **New employee salary** | `POST /api/auth/register` creates `SalaryRecord` with **`currentSalary: 0`** and `effectiveDate: now` |
| **Seeded employees** | Jane / John / Alex get salaries **₹58,000 / ₹72,000 / ₹91,000** and a pre-closed demo cycle with history |
| **Admins’ salary records** | Seed gives admins a salary record at **0** (admins are not compensated in this demo) |
| **Segregation of duties** | Proposer cannot approve or reject their own proposal (API + UI) |
| **Environment** | Local dev: MongoDB on localhost, JWT secret in `.env`, no HTTPS requirement |
| **Users** | Trusted internal admins; no rate limiting, MFA, or email verification |

---

## Trade-offs (6-hour budget)

| Deprioritized | Reason |
|---------------|--------|
| **MongoDB transactions** on cycle close | Standalone local MongoDB; sequential writes kept compatible; production would use replica set + `withTransaction` |
| **Refresh tokens / session revocation** | JWT-only keeps auth simple for demo |
| **Automated tests** | Manual demo flow prioritized over Playwright/Jest setup time |
| **Fine-grained RBAC** | Single `admin` role sufficient for two-admin approval demo |
| **Public API hardening** | `/api/health` and auth routes are public; no API gateway or WAF |
| **Edit/delete audit trail** | Proposals can be edited/deleted by creator while `Proposed`; no separate audit log table |
| **Email notifications** | Out of scope |
| **Pagination on all lists** | Proposals paginate; some admin lists use a high `limit` for simplicity |
| **Production deployment** | No Docker/K8s/CI in repo — local run only |

---

## Future work

- **Transactions** on cycle close and salary apply (replica set + Mongoose sessions)
- **Refresh tokens**, logout-all-devices, password reset
- **Roles**: HR vs Finance approvers, delegation
- **Audit log** for admin actions (beyond immutable salary history)
- **E2E tests** (Playwright) for propose → second-admin approve → close → employee history
- **Currency metadata** in DB if multi-region; bonus/equity line items
- **Bulk import** of employees and opening balances
- **Stricter AC2** option: protect `/api/health` or move behind auth if required by policy
- **CI/CD**, Docker Compose (Mongo + API + client), staging environment

---

## Environment reference

**`server/.env`**

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `5000`) |
| `MONGO_URI` | Mongo connection string |
| `JWT_SECRET` | JWT signing secret |
| `CLIENT_ORIGIN` | CORS origin (Vite dev server) |
| `ADMIN_*` / `SECOND_ADMIN_*` | Seeded admin accounts |

**`client/.env`**

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Axios base URL (e.g. `http://localhost:5000/api`) |

---

## License & disclaimer

Built as a hackathon / MVP demo. Review security and compliance before any production use.
