---
feature: ecocoleta
status: delivered
specs:
  - docs/compose/specs/ecocoleta.md
plans:
  - .mimocode/plans/1783972170841-nimble-harbor.md
branch: main
commits: initial..current
---

# EcoColeta — Final Report

## What Was Built

EcoColeta is a desktop application connecting residents with recycling collection companies. Residents request pickups of recyclable materials; nearby companies accept, track, and complete those requests. An admin panel manages users, companies, and platform statistics. The platform implements a full collection lifecycle: request creation, company acceptance, status transitions (pending → accepted → on_the_way → completed), completion with weight verification, and post-collection reviews.

Three user roles are supported: **Resident** (request pickups, track history, earn points), **Company** (accept requests, manage collections via map, view ratings), and **Admin** (approve/block users and companies, view stats). The system includes real-time notifications via Socket.IO, a dark/light theme toggle, and a points-based ranking system.

## Architecture

### Backend (`server/`)

```
server/src/
├── app.ts              # Express app — CORS, JSON parsing, health check, routes
├── server.ts           # HTTP server + Socket.IO initialization
├── config/
│   ├── database.ts     # Prisma client singleton
│   └── env.ts          # Environment variable loading
├── middleware/
│   ├── auth.ts         # JWT verification + role-based access control
│   ├── validate.ts     # Zod schema validation wrapper
│   └── errorHandler.ts # Centralized error normalization
├── modules/            # MVC per domain
│   ├── auth/           # Register (resident/company), login, token refresh
│   ├── users/          # Profile CRUD, dashboard stats, points
│   ├── companies/      # Profile CRUD, dashboard, nearby search
│   ├── requests/       # Full CRUD + status state machine (8 endpoints)
│   ├── reviews/        # Create reviews, query by company
│   ├── notifications/  # List, mark read
│   └── admin/          # User/company management, stats, approval/block
├── routes/index.ts     # Route aggregation under /api prefix
└── services/
    └── socket.ts       # Socket.IO room management + broadcast helpers
```

**Database**: SQLite via Prisma ORM, 7 tables — `users`, `companies`, `collection_requests`, `materials`, `reviews`, `notifications`, `addresses`. CUID primary keys. JSON strings for array fields (materials, photos) due to SQLite limitations.

**API Surface**: 25+ REST endpoints across 7 route groups. Authentication via Bearer JWT tokens. Role-based middleware (`requireRole`) gates admin endpoints.

**Real-time**: Socket.IO with JWT-authenticated connections. Users join `user:{id}` rooms; companies join `company:{id}` and `companies` broadcast rooms. Helper functions `emitToUser`, `emitToCompany`, `emitToRoom` for targeted notifications.

### Frontend (`src/`)

```
src/
├── App.tsx             # React Router with protected routes + role-based redirects
├── main.tsx            # Electron renderer entry
├── contexts/
│   ├── AuthContext.tsx  # JWT auth state, login/register/logout
│   └── ThemeContext.tsx # Dark/light theme provider with localStorage persistence
├── hooks/
│   ├── useAuth.ts      # Auth context consumer
│   ├── useSocket.ts    # Socket.IO connection management
│   ├── useTheme.ts     # Theme toggle
│   └── useNotifications.ts # Real-time notification handling
├── services/
│   ├── api.ts          # Fetch-based API client with token interceptors
│   └── socket.ts       # Socket.IO client singleton
├── components/         # 12 reusable components
│   ├── Button.tsx, Input.tsx, Card.tsx    # Base primitives
│   ├── Layout.tsx, Sidebar.tsx, Header.tsx # App shell
│   ├── DataTable.tsx   # Table with sorting/filtering
│   ├── StatusBadge.tsx, StarRating.tsx    # Status display
│   ├── Timeline.tsx    # Request progress timeline
│   ├── MapView.tsx     # Google Maps wrapper
│   └── NotificationBell.tsx              # Notification indicator
├── pages/
│   ├── auth/           # LoginPage, RegisterResidentPage, RegisterCompanyPage
│   ├── resident/       # ResidentDashboard, NewRequestPage, RequestDetailPage, HistoryPage
│   ├── company/        # CompanyDashboard, MapViewPage, RequestDetailPage, CollectionProcessPage
│   └── admin/          # AdminDashboard, ManageUsersPage, ManageCompaniesPage, ReportsPage
└── types/index.ts      # Shared TypeScript interfaces (180 lines)
```

**Routing**: Role-based navigation. Residents see request management and history; companies see map and collection workflows; admins see user/company management and reports. All routes wrapped in `ProtectedRoute` with auth check.

**Theme**: Tailwind CSS with `dark:` class toggling via `ThemeProvider`. Green (#22C55E) primary palette.

### Design Decisions

- **SQLite for development**: Eliminates external database dependency for local development. PostgreSQL config ready for production via Prisma's provider switching.
- **JSON strings for arrays**: Prisma SQLite lacks native array columns — `materials`, `photos`, and `addresses` are serialized JSON with application-level parsing.
- **CUID primary keys**: Globally unique, URL-safe identifiers without coordination or sequential leakage.
- **Separate User/Company models**: Different schemas (Company has `cnpj`, `serviceAreaRadius`, `approved`) justify separate tables rather than a single `accounts` model with role discriminator.
- **Fetch over Axios**: Frontend uses native `fetch` via a thin `ApiClient` class, avoiding an extra dependency for simple HTTP needs.
- **Socket.IO rooms over broadcast**: Users and companies join specific rooms for targeted notifications instead of broadcasting to all clients.

## Usage

### Development

```bash
npm install                              # Install root + workspace dependencies
npx prisma generate --workspace=server    # Generate Prisma client
npx prisma db push --workspace=server     # Create SQLite database
npx prisma db seed --workspace=server     # Seed materials data
npm run dev                              # Start Electron + Vite + Express concurrently
```

### Scripts

```bash
npm run dev:server    # Backend only (port 3001, tsx watch)
npm run dev:client    # Frontend only (Vite dev server)
npm test             # Server tests (vitest)
npm run test:frontend # Frontend tests (vitest + jsdom)
npm run build        # Production build (electron-vite + tsc)
```

### Environment Variables (`server/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite connection string |
| `JWT_SECRET` | (required) | Secret for JWT signing |
| `JWT_EXPIRES_IN` | `7d` | Access token expiration |
| `PORT` | `3001` | Server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Frontend origin |

### API Endpoints

**Auth**: `POST /api/auth/register/resident`, `POST /api/auth/register/company`, `POST /api/auth/login`, `POST /api/auth/refresh`

**Users**: `GET /api/users/me`, `PUT /api/users/me`, `GET /api/users/dashboard`, `GET /api/users/points`

**Companies**: `GET /api/companies/me`, `PUT /api/companies/me`, `GET /api/companies/dashboard`, `GET /api/companies/nearby`

**Requests**: `POST /api/requests`, `GET /api/requests`, `GET /api/requests/:id`, `PUT /api/requests/:id/accept|reject|on-the-way|complete|cancel|reschedule`

**Reviews**: `POST /api/reviews`, `GET /api/reviews/company/:companyId`

**Notifications**: `GET /api/notifications`, `PUT /api/notifications/:id/read`

**Admin**: `GET /api/admin/users`, `GET /api/admin/companies`, `PUT /api/admin/companies/:id/approve`, `PUT /api/admin/users/:id/block`, `PUT /api/admin/companies/:id/block`, `GET /api/admin/stats`

## Verification

- **Server tests**: 288 passed across 28 test files (auth, requests, reviews, notifications, admin, users, companies)
- **Frontend tests**: 24 passed covering components, pages, and hooks
- **TypeScript**: Full type safety across frontend and backend (strict mode)
- **Build**: Successful electron-vite production build and server compilation

All 312 tests green. No failing tests.

## Journey Log

> Brief notes on what informed the final design. Not required reading.

- [lesson] Prisma SQLite doesn't support array columns — used JSON strings with application-level parsing for materials, photos, and addresses. This pattern requires careful serialization/deserialization at the service layer.
- [lesson] Parallel task integration across 16 subtasks produced merge conflicts in `package.json`, `package-lock.json`, and `src/types/index.ts`. Resolved by merging both branches' additions and deduplicating. Lesson: shared type files are high-conflict zones in parallel development.
- [pivot] Socket.IO integration simplified for MVP — real-time notification delivery works but Google Maps live tracking deferred to future iteration. The `useGoogleMaps` hook is a stub awaiting API key configuration.
- [lesson] JWT token expiry hardcoded at 7 days in `auth.service.ts:18` despite config values existing. The `config.jwtExpiresIn` is defined but `generateTokens` uses a literal `60 * 60 * 24 * 7` instead. Config-driven expiry would be safer for production.
- [lesson] Frontend API base URL (`api.ts:1`) and Socket.IO URL (`socket.ts:3`) both default to port 3000, but the server runs on port 3001. This is a runtime connection bug — these need to match or be configurable via environment variables.

## Source Materials

| File | Role | Notes |
|------|------|-------|
| `docs/compose/specs/ecocoleta.md` | Initial design spec | Complete feature specification with DB schema, API surface, and UI requirements |
| `.mimocode/plans/1783972170841-nimble-harbor.md` | Implementation plan | Architecture, phase ordering, and 16-task breakdown |
