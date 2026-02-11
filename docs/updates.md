# Vault Treasury — Architecture Updates Log

> Chronological record of significant architecture and design decisions.

---

## 2026-02-11 — Patch: Payment Sort Filter, Liquidity Ticker & Currency Fix

**Features Added:**
- **Payments "Recently Actioned" sort** — new `sortBy` query parameter. When set to `resolved_at`, queries `payment_actions` table (using indexed `performed_at DESC`) to surface recently approved/rejected payments first. Pending payments (no action rows) sink to the bottom. Frontend adds a "Sort Order" dropdown with "Newest First" and "Recently Actioned" options.
- **Liquidity Overview ticker** on Accounts page — 3-column Swiss Finance–style widget showing:
  - **Global Cash Position** (sum of internal account balances)
  - **Pending Outflows** (sum of pending payment amounts, converted to USD) with a visual risk bar (amber < 50%, red > 50%)
  - **Projected Close** (liquidity − exposure, green if positive, red if negative)
- **Backend `GET /accounts/stats`** — new endpoint returning `{ totalLiquidity, pendingExposure }` via two aggregate queries in `AccountsService`

**Bug Fixed:**
- **Pending exposure currency conversion** — pending payment amounts were summed raw without currency conversion, making 50,000 INR display as $50,000 USD. Fixed by fetching `currency` alongside `amount` and applying static exchange rates (same `EXCHANGE_RATES_TO_USD` map from payments service) before summing.

**Files Modified:**

| File | Change |
|------|--------|
| `backend/src/payments/dto/payment.dto.ts` | Added `sortBy` field with `@IsIn(['created_at', 'resolved_at'])` |
| `backend/src/payments/payments.service.ts` | Added `findAllByRecentAction()` — queries `payment_actions`, deduplicates, orders, paginates |
| `backend/src/accounts/accounts.service.ts` | Added `EXCHANGE_RATES_TO_USD`, `getLiquidityStats()` with currency conversion |
| `backend/src/accounts/accounts.controller.ts` | Added `GET /stats` route (before `:id`) |
| `frontend/src/components/payments/PaymentFilters.tsx` | Added Sort dropdown with `ArrowUpDown` icon |
| `frontend/src/components/accounts/LiquidityOverview.tsx` | **[NEW]** 3-column liquidity widget component |
| `frontend/src/lib/actions/payments.ts` | Added `sortBy` to `PaymentFilters` + query propagation |
| `frontend/src/lib/actions/accounts.ts` | Added `fetchLiquidityStats()` server action |
| `frontend/src/app/(protected)/payments/page.tsx` | Wired `sortBy` through searchParams |
| `frontend/src/app/(protected)/accounts/page.tsx` | Integrated `LiquidityOverview` with parallel data fetching |

---

## 2026-02-11 — Patch: Limit Enforcement & Currency Conversion

**Bug Fixed:**
- `updateAccountLimits` server action used `smartPost` (HTTP POST) but backend expects `@Patch` — caused silent 404. Added `smartPatch` to `smart-fetch.ts` and switched the action to use it.

**Features Added:**
- **Currency conversion** on payment approval — static exchange rate map (USD, EUR, GBP, INR, JPY, CAD, AUD, CHF, SGD, AED). Converts payment amount to source account currency before deducting balance and incrementing limit usage.
- **Per-transaction limit enforcement** — approval blocked if converted amount exceeds per-txn limit.
- **Daily limit enforcement** — approval blocked if `current_usage + amount` would exceed daily cap. Error message includes used/limit/remaining breakdown.
- **Daily limit auto-reset** — if `last_reset_at` is >24h ago, `current_usage` resets to 0 before checking.
- **Balance deduction** — source account balance decreases by converted amount on approval.
- **Daily usage increment** — `current_usage` increases by converted amount on approval.

**Files Modified:**

| File | Change |
|------|--------|
| `backend/src/payments/payments.service.ts` | Added `EXCHANGE_RATES_TO_USD` map, `convertCurrency()`, limit checks before approval, daily reset logic |
| `frontend/src/lib/api/smart-fetch.ts` | Added `smartPatch` export |
| `frontend/src/lib/actions/accounts.ts` | Switched `smartPost` → `smartPatch` for `updateAccountLimits` |

---

## 2026-02-11 — Module 3: Account Management (Complete)

**Completed:**
- Backend: Full accounts module (`AccountsService`, `AccountsController`) with Supabase queries
- Backend: `findAll` filters to internal accounts only (`account_type = 'internal'`, `is_active = true`)
- Backend: `findOne` with account limits, recent payments (both inflow/outflow), user name resolution
- Backend: `updateLimits` with upsert on `account_limits` (Sentinel-gated via `SentinelGuard`)
- Backend: DTOs with validation (`AccountFiltersDto`, `UpdateLimitsDto`)
- Frontend: `AccountCard` with balance display, daily limit usage bar (color-coded), per-txn limit
- Frontend: `AccountList` with grid layout, AnimatePresence animations, pagination
- Frontend: `AccountDetail` two-column layout — balance + limits (left), transaction timeline (right)
- Frontend: `LimitDialog` with current values, change detection, behavioral security notice
- Frontend: `AccountsSkeleton` matching card grid layout
- Frontend: Server actions (`fetchAccounts`, `fetchAccount`, `updateAccountLimits`)
- Frontend: Route pages (`/accounts`, `/accounts/[id]`, loading state)

**Architecture Decisions:**

| Decision | Rationale |
|----------|-----------|
| Internal accounts only | External (vendor) accounts are reference data — no right to view their balances or set limits |
| No type filter tabs | All accounts shown are internal — filtering between types is unnecessary |
| Upsert for limits | `UNIQUE(account_id, limit_type)` constraint allows clean insert-or-update semantics |
| SentinelGuard on PATCH limits | Limit modification is a high-risk action (e.g., raising daily cap from $500K to $5M) |
| Inflow/outflow indicators | `from_account_id = id` means outflow (red), otherwise inflow (green) |

**Files Created/Modified:**

| File | Status |
|------|--------|
| `backend/src/accounts/dto/account.dto.ts` | NEW |
| `backend/src/accounts/accounts.service.ts` | REPLACED — full implementation |
| `backend/src/accounts/accounts.controller.ts` | REPLACED — GET list, GET detail, PATCH limits |
| `backend/src/accounts/accounts.module.ts` | MODIFIED — added DatabaseModule, SentinelModule |
| `frontend/src/lib/actions/accounts.ts` | NEW |
| `frontend/src/components/accounts/AccountCard.tsx` | NEW |
| `frontend/src/components/accounts/AccountList.tsx` | NEW |
| `frontend/src/components/accounts/AccountDetail.tsx` | NEW |
| `frontend/src/components/accounts/LimitDialog.tsx` | NEW |
| `frontend/src/components/accounts/AccountsSkeleton.tsx` | NEW |
| `frontend/src/app/(protected)/accounts/page.tsx` | NEW |
| `frontend/src/app/(protected)/accounts/[id]/page.tsx` | NEW |
| `frontend/src/app/(protected)/accounts/loading.tsx` | NEW |

---

## 2026-02-10 — Module 2: Payment Queue (Complete)

**Completed:**
- Backend: Full payments CRUD (`PaymentsService`, `PaymentsController`) with Supabase queries
- Backend: `SentinelGuard` (mock — always ALLOW, swap-in-place for Module 5)
- Backend: DTOs with validation (`PaymentFiltersDto`, `ApprovePaymentDto`, `RejectPaymentDto`)
- Backend: User name resolution in payment actions — batch lookup from `treasury_profiles`
- Frontend: Role-aware `Sidebar.tsx` with Framer Motion animations, user info, logout
- Frontend: `PaymentCard`, `PaymentFilters`, `PaymentList` (optimistic UI), `PaymentDetail` (audit trail timeline)
- Frontend: `smart-fetch.ts` — server-side API client with 428 challenge stub + 401 → redirect to login
- Frontend: Payment server actions (`fetchPayments`, `fetchPayment`, `approvePayment`, `rejectPayment`)
- Frontend: Protected layout with `requireAuth()` + Sidebar injection + Suspense skeleton
- Frontend: Skeleton loaders for sidebar and payment queue (perceived performance)
- Frontend: Shared `ApproveDialog` / `RejectDialog` components used by both list and detail pages
- Frontend: Payment detail page with minimalist financial ticket UI, route details, audit trail

**Bug Fixes:**
- **Infinite redirect loop** — `middleware.ts` redirected `/login → /payments` when a stale cookie existed, causing a loop with `requireAuth()`. Fix: removed that middleware redirect; login page handles its own auth check.
- **401 throw crash** — `smart-fetch.ts` threw `Error('UNAUTHORIZED')` on 401, causing unhandled re-renders. Fix: now calls `redirect('/login')` instead.
- **Stale cookie persistence** — `getSession()` now deletes the `vault_session` cookie when the backend rejects the token, preventing stale cookie loops.
- **Missing confirmation dialogs** — Approve/Reject buttons on detail page fired instantly. Fix: extracted shared `PaymentDialogs.tsx` with confirmation modals.

**Architecture Decisions:**

| Decision | Rationale |
|----------|-----------|
| Container/Presentation pattern | `page.tsx` (Server Component) fetches → `PaymentList.tsx` (Client) handles UI |
| SentinelGuard as mock | Controllers won't change when real ML integration is added (Module 5) |
| URL-param based filters | Server-compatible, shareable URLs, no client state for filters |
| Optimistic UI on approve/reject | Instant feedback via `useOptimistic` — rolls back on error |
| Smart Fetch with redirect | Centralized 401 → `/login` redirect prevents cascading re-render loops |
| Shared dialog components | Single source of truth for approve/reject confirmation UX across pages |

**Files Created/Modified:**

| File | Status |
|------|--------|
| `backend/src/sentinel/sentinel.guard.ts` | NEW |
| `backend/src/payments/dto/payment.dto.ts` | NEW |
| `backend/src/payments/payments.service.ts` | REPLACED — user name resolution added |
| `backend/src/payments/payments.controller.ts` | REPLACED |
| `backend/src/payments/payments.module.ts` | MODIFIED |
| `frontend/src/middleware.ts` | MODIFIED — removed stale-cookie redirect loop |
| `frontend/src/lib/auth/actions.ts` | MODIFIED — cookie cleanup on invalid token |
| `frontend/src/lib/api/smart-fetch.ts` | NEW — 401 redirect fix |
| `frontend/src/lib/actions/payments.ts` | NEW |
| `frontend/src/components/layout/Sidebar.tsx` | REPLACED — role-aware + animations |
| `frontend/src/components/layout/SidebarSkeleton.tsx` | NEW |
| `frontend/src/components/payments/PaymentCard.tsx` | NEW |
| `frontend/src/components/payments/PaymentFilters.tsx` | NEW |
| `frontend/src/components/payments/PaymentList.tsx` | NEW |
| `frontend/src/components/payments/PaymentDetail.tsx` | NEW — financial ticket + audit trail |
| `frontend/src/components/payments/PaymentDialogs.tsx` | NEW — shared approve/reject dialogs |
| `frontend/src/components/payments/PaymentsSkeleton.tsx` | NEW |
| `frontend/src/app/(protected)/layout.tsx` | REPLACED — Suspense + skeleton |
| `frontend/src/app/(protected)/payments/page.tsx` | REPLACED |
| `frontend/src/app/(protected)/payments/[id]/page.tsx` | NEW |
| `frontend/src/app/(protected)/payments/loading.tsx` | NEW |

---

## 2026-02-10 — Module 1: Authentication System Complete

**Completed:**
- Frontend: Login Page, Signup Page 
- Backend: Auth Module, Signups Module
- Middleware: Authentication Middleware

## 2026-02-09 — Gatekeeper Authentication Architecture

**Previous:** Separate `signup_requests` table where admins manually create user accounts after approval.

**Updated:** Immediate account creation with status-based gating. All frontend calls go through NestJS backend (no direct Supabase calls from frontend).

| Aspect | Before | After |
|--------|--------|-------|
| Signup Flow | Admin creates account after review | User signs up via backend, status = `pending` |
| Password Handling | Admin sets password or sends invite | User sets own password, backend calls Supabase |
| Access Control | `signup_requests` table | `treasury_profiles.status` column |
| Admin Workflow | Create account from scratch | Simply approve (update status) |
| API Pattern | Frontend → Supabase | Frontend → NestJS → Supabase |

**Changes Made:**
- Removed `signup_requests` table
- Added `status` column to `treasury_profiles` with values: `pending`, `active`, `deactivated`
- Added database trigger `handle_new_user()` to auto-create treasury profile on signup
- JWT returned in response body, Next.js Server Action sets HTTP-only cookie
- Signup via `POST /api/signups` (signups module), login via `POST /api/auth/login` (auth module)

**Module Responsibilities:**

| Module | Endpoints |
|--------|-----------|
| `signups` | `POST /api/signups` — Account creation |
| `auth` | `POST /login`, `POST /logout`, `GET /me` |
| `admin` | `GET /pending-users`, `POST /users/:id/approve` |

**Rationale:**
- More secure (user sets own password, never handled by admin)
- Simpler (fewer tables, less code)
- Better UX (users can sign up immediately)
- Consistent API pattern (all calls through backend)
- Clear module separation (signup ≠ login)

---

## 2026-02-09 — Upstash Redis Migration

**Previous:** Local Redis container in Docker Compose.

**Updated:** Cloud-hosted Redis via Upstash.

**Changes Made:**
- Removed `redis` service from `docker-compose.dev.yml` and `docker-compose.prod.yml`
- Deleted `docker-compose.infra.yml`
- Updated `REDIS_URL` to use `rediss://` (TLS) connection string
- Updated `docs/commands.md` to reflect changes

**Rationale:**
- Simpler deployment (no container to manage)
- Production-ready from day one
- TLS encryption by default

---

## 2026-02-08 — Module 0 Setup Complete

**Completed:**
- Frontend: Next.js 14 + Shadcn UI + Design System
- Backend: NestJS + 8 module skeletons
- Docker: dev and prod configurations
- Documentation: system architecture, db schema, design system, feature map
