# Vault Treasury — Architecture Updates Log

> Chronological record of significant architecture and design decisions.

---

## 2026-02-19 — Patch: Sentinel HST Learning & Model Persistence Fixes

**Problem:** HST model was not learning during cold start, and saved model blobs were corrupted on every reload — creating an infinite CHALLENGE loop. Audit log action names were also cryptic (e.g., `approve_payments`).

**Root Causes Identified:**

| Issue | Cause |
|-------|-------|
| HST not learning | Mode gate required `NORMAL` mode, but cold start forces `CHALLENGE` — deadlock |
| Feature windows not emitting | `MAX_PENDING_EVENTS = 50` was too low for 120-char challenge text (needs ~240 events) |
| Corrupted model blobs | `model_blob` column was `bytea(hex)` — Supabase REST API returned hex-encoded data, which failed base64 validation |
| Model never rebuilding | Corrupted rows were never deleted, so upserts kept failing silently |
| Single CHALLENGE then ALLOW forever | `completed_windows` were never cleared from Redis after learning |

**Fixes Applied:**

| File | Change |
|------|--------|
| `sentinel-ml/core/orchestrator.py` | Cold-start-aware mode gate: learn in any mode when HST < 50 windows, only `NORMAL` mode after |
| `sentinel-ml/core/orchestrator.py` | Clear `completed_windows` from Redis after HST learning — forces fresh CHALLENGE each action during cold start |
| `sentinel-ml/persistence/session_repository.py` | Increased `MAX_PENDING_EVENTS` from 50 → 300; added `_save_keyboard_state()` helper |
| `sentinel-ml/persistence/model_store.py` | Auto-delete corrupted rows on detection; added zlib compression (5x size reduction); blob size logging |
| `backend/src/sentinel/sentinel.guard.ts` | Replaced generic `extractActionType` with explicit route-to-label mapping |
| `frontend/src/app/(auth)/verify/page.tsx` | Replaced short enrollment texts (~70 chars) with longer challenge texts (~120 chars) matching `sentinel.service.ts` |
| **Supabase schema** | Changed `model_blob` column from `bytea` → `text` |

**Audit Log Action Labels (sentinel.guard.ts):**

| Route | New Label |
|-------|-----------|
| `POST payments/:id/approve` | Payment Approval |
| `POST payments/:id/reject` | Payment Rejection |
| `POST accounts/:id/limit-request` | Account Limit Change Request |
| `PATCH accounts/:id/limits` | Account Limit Update |
| `PATCH accounts/:id/balance` | Account Balance Update |
| `POST admin/users/:id/approve` | User Approval |
| `POST admin/users/:id/reject` | User Rejection |
| `POST admin/users/:id/deactivate` | User Deactivation |
| `POST admin/limit-requests/:id/approve` | Limit Request Approval |
| `POST admin/limit-requests/:id/reject` | Limit Request Rejection |
| `POST erp-simulator/start` | ERP Simulator Start |
| `POST erp-simulator/stop` | ERP Simulator Stop |
| `PATCH erp-simulator/config` | ERP Simulator Config Update |

---

## 2026-02-18 — Feature: Payment Limit Exceeded Modal

**Problem:** When a payment exceeds the account's per-transaction or daily limit, the backend returned a generic 400 error. The user had no visibility into *which* limit was breached, by how much, or how to request a change.

**Solution:** Structured error propagation from backend → frontend with a rich modal dialog, integrated into both the payments list and payment detail pages.

**Error Format:**

Backend throws `BadRequestException` with a colon-delimited string that passes cleanly through Next.js server action boundaries:

```
LIMIT_EXCEEDED:per_transaction:accountId:txnAmount:limitAmount:difference:currency
LIMIT_EXCEEDED:daily:accountId:txnAmount:limitAmount:difference:currency:currentUsage:remaining
```

**Architecture:**

| Aspect | Detail |
|--------|--------|
| Error propagation | `BadRequestException(string)` → `smart-fetch` throws `Error(body.message)` → `useChallengeAction.onError` fires |
| Parser | `parseLimitError()` — regex extracts type, accountId, and optional amounts from error string |
| Modal z-order | `useChallengeAction` sets `processingState: 'idle'` *before* calling `onError`, so SecurityProcessingModal is already dismissed |
| Deep-link | "Request Limit Change" button navigates to `/accounts/:id?requestLimit=true`, which auto-opens the `LimitDialog` |

**Dialog Features:**
- Payment amount vs. limit in a grid layout
- Daily limits show "Used Today" and "Remaining" breakdown
- Shortfall highlighted in red with explanatory text
- Falls back to simple text if amount data is unavailable

**Files Modified:**

| File | Change |
|------|--------|
| `backend/src/payments/payments.service.ts` | `BadRequestException` with colon-delimited string including all amounts |
| `frontend/src/components/payments/LimitExceededDialog.tsx` | **[NEW]** Dialog component + `parseLimitError()` + `LimitErrorInfo` type |
| `frontend/src/components/payments/PaymentDetail.tsx` | Added `limitError` state, `parseLimitError` in `onError`, renders dialog |
| `frontend/src/components/payments/PaymentList.tsx` | Same pattern — `limitError` state, `parseLimitError` in `onError`, renders dialog |
| `frontend/src/components/accounts/AccountDetailClient.tsx` | Auto-opens `LimitDialog` when `?requestLimit=true` is in URL |

---

## 2026-02-15 — Feature: Admin Account Balance Update

**Problem:** Without a real bank connection, there's no way to fund accounts. The ERP simulator generates payments against internal accounts, but their balances start at seeded values and can only decrease through approved payments.

**Solution:** Admin-only balance update feature on the account detail page.

| Layer | File | Change |
|-------|------|--------|
| Backend DTO | `accounts/dto/account.dto.ts` | Added `UpdateBalanceDto` |
| Backend Service | `accounts/accounts.service.ts` | Added `updateBalance()` method |
| Backend Controller | `accounts/accounts.controller.ts` | Added `PATCH :id/balance` (RolesGuard + SentinelGuard) |
| Server Action | `lib/actions/accounts.ts` | Added `updateAccountBalance()` |
| UI Component | `components/accounts/BalanceDialog.tsx` | New dialog with diff preview |
| UI Integration | `components/accounts/AccountDetail.tsx` | Admin-only pencil icon, `useChallengeAction` wiring |

**Security:** Endpoint requires `treasury_admin` role + Sentinel behavioral verification. RLS policy `accounts_update_admin` already permits admin updates. **No SQL migration needed.**

---

## 2026-02-15 — Feature: Module 6 — ERP Simulator Agent

**Problem:** No way to generate realistic payment data for testing the treasury workflow (approve/reject payments, limit enforcement, Sentinel challenges).

**Solution:** Backend agent with admin-controllable start/stop/config via the Settings page.

**Backend:**

| File | Purpose |
|------|---------|
| `erp-simulator/dto/erp-simulator.dto.ts` | Config validation DTO |
| `erp-simulator/erp-simulator.service.ts` | Dynamic `setTimeout` loop, payment generation, config CRUD |
| `erp-simulator/erp-simulator.controller.ts` | 4 endpoints (GET config, POST start/stop, PATCH config) |
| `erp-simulator/erp-simulator.module.ts` | Module wiring |
| `app.module.ts` | Added `ScheduleModule.forRoot()` |

**Frontend:**

| File | Purpose |
|------|---------|
| `lib/actions/erp-simulator.ts` | Server actions (fetch, start, stop, update) |
| `components/admin/ErpSimulatorPanel.tsx` | Admin UI with live stats polling |
| `app/(protected)/admin/settings/page.tsx` | Replaced placeholder with functional panel |

**Key Design Decisions:**
- `setTimeout` loop (not `@Cron`) — interval is admin-configurable and re-read each tick
- Death-spiral prevention — try/catch in loop prevents single errors from killing generation
- Idempotent start/stop — in-memory `isRunning` flag prevents duplicate timers
- 10 currencies, all covered by existing exchange rate maps in `payments.service.ts` and `accounts.service.ts`

---

## 2026-02-14 — Patch: Admin Sentinel Integration & Challenge Coverage

**Problem:** Admin actions (approve/reject users, update limits, deactivate users) called server actions directly without handling 428 `CHALLENGE_REQUIRED` responses from `SentinelGuard`. If Sentinel flagged risk during an admin action, the request silently failed instead of triggering the behavioral verification modal. Additionally, the `/verify` page hardcoded a redirect to `/payments`, sending admins to the wrong dashboard.

**Changes:**

1. **Role-aware `/verify` redirect** — Added `getUserRole()` server action. After successful behavioral enrollment, admins redirect to `/admin/signups`, treasurers to `/payments`.
2. **`useChallengeAction` on all gated actions** — Wrapped 7 additional server actions with the challenge hook (payments were already done):

| Component | Actions Wrapped |
|-----------|----------------|
| `AccountDetail.tsx` | `requestLimitChange`, `updateAccountLimits`, `approveLimitRequest`, `rejectLimitRequest` |
| `SignupRequestCard.tsx` | `approveUser`, `rejectUser` |
| `UserList.tsx` | `deactivateUser` |

**Files Modified:**

| File | Change |
|------|--------|
| `frontend/src/lib/auth/actions.ts` | Added `getUserRole()` server action |
| `frontend/src/app/(auth)/verify/page.tsx` | Role-aware redirect after verification |
| `frontend/src/components/accounts/AccountDetail.tsx` | 4 actions wrapped with `useChallengeAction` |
| `frontend/src/components/admin/SignupRequestCard.tsx` | 2 actions wrapped with `useChallengeAction` |
| `frontend/src/components/admin/UserList.tsx` | 1 action wrapped with `useChallengeAction` |

---

## 2026-02-14 — Patch: Security Processing Modal (Sentinel Loading UX)

**Problem:** Sentinel guard evaluation has 1-2s latency while `/evaluate` analyzes behavioral data. During this time the UI appeared frozen — no feedback that the action was being processed.

**Solution:** A global `SecurityProcessingModal` with a 3-state lifecycle: `idle` → `processing` → `success` → `idle` (on user dismiss).

**Architecture:**

| Aspect | Detail |
|--------|--------|
| State machine | `processingState: 'idle' \| 'processing' \| 'success'` in `ChallengeProvider` context |
| Auto-triggered | `useChallengeAction` sets `'processing'` before the network call, `'success'` on ALLOW |
| Instant render | `flushSync()` forces React to render the modal immediately, bypassing `startTransition` batching |
| z-index layering | Processing modal at `z-[45]`, Challenge modal at `z-50` — challenge overlays processing |
| Dialog handoff | Confirmation dialogs close immediately on confirm → processing modal takes over |
| Success dismiss | User clicks "Continue" or backdrop to dismiss the success state |
| Error reset | On failure or challenge cancel, state resets to `'idle'` — modal hides immediately |

**UX Flow:**
```
Confirm button → dialog closes → ⏳ processing modal (scanning beam) → ✅ success modal (checkmark) → user clicks Continue
                                                                    ↘ 🔐 challenge modal (if 428) → retry → ✅ success
```

**Files Created:**

| File | Purpose |
|------|---------|
| `frontend/src/components/sentinel/SecurityProcessingModal.tsx` | Animated processing + success overlay |

**Files Modified:**

| File | Change |
|------|--------|
| `frontend/src/components/sentinel/ChallengeProvider.tsx` | Added `processingState`, `setProcessingState`, `dismissProcessing` to context |
| `frontend/src/hooks/useChallengeAction.ts` | Auto-toggles processing state with `flushSync` for instant render |
| `frontend/src/app/(protected)/SentinelWrapper.tsx` | Mounted `SecurityProcessingModal` alongside `ChallengeModal` |
| `frontend/src/components/accounts/AccountDetail.tsx` | Confirmation dialogs close immediately before challenge action |
| `frontend/src/components/admin/SignupRequestCard.tsx` | Controlled AlertDialogs, close on confirm before challenge action |

---

## 2026-02-12 — Module 5: Sentinel Integration & Behavioral 2FA (Complete)

**Completed:**
- Full Sentinel ML integration replacing the mock `SentinelGuard` with real behavioral biometric analysis
- Two-step authentication: password login (`/login`) → behavioral typing enrollment (`/verify`) → dashboard
- In-session challenge modals for gated actions (payments, limits, admin) when Sentinel flags suspicious behavior

**Architecture:**

| Component | Detail |
|-----------|--------|
| Auth flow | `/login` (password) → `/verify` (behavioral typing) → `/payments` |
| MFA state | Redis `client:mfa:{user_id}` — 12h absolute TTL, 30m idle sliding TTL |
| Session state | Redis `client:sentinel:{session_id}` — user_id, IP, UA, start_time, batch counters |
| Batch validation | Client-authoritative batch_id, server validates `payload.batch_id > last_accepted` — rejects replays with 409 |
| Streaming | Keyboard/mouse events buffered 150ms client-side, proxied through NestJS to Sentinel ML |
| Decision enforcement | ALLOW → proceed, CHALLENGE → 428 with challenge_text, BLOCK → terminate Supabase session + 401 |
| Fail-safe | Sentinel unreachable → default to CHALLENGE |
| Circular deps | `AuthModule` ↔ `SentinelModule` resolved via NestJS `forwardRef()` |

**Files Created:**

| File | Purpose |
|------|---------|
| `backend/src/database/redis.service.ts` | Redis client — sentinel sessions, batch_id validation, MFA state |
| `backend/src/sentinel/sentinel.controller.ts` | Streaming proxy endpoints (`POST /sentinel/stream/keyboard`, `/mouse`) |
| `backend/src/sentinel/dto/stream.dto.ts` | Validation DTOs for keyboard/mouse events |
| `frontend/src/components/sentinel/SentinelProvider.tsx` | Client-side event capture + `forceFlush()` |
| `frontend/src/components/sentinel/ChallengeProvider.tsx` | Challenge lifecycle management |
| `frontend/src/components/sentinel/ChallengeModal.tsx` | In-session verification modal with character highlighting |
| `frontend/src/hooks/useChallengeAction.ts` | Wraps server actions with challenge retry (flush + 250ms delay) |
| `frontend/src/app/(auth)/verify/page.tsx` | Behavioral enrollment page (step 2 of auth) |
| `frontend/src/app/(protected)/SentinelWrapper.tsx` | Client component bridge for protected layout |

**Files Modified:**

| File | Change |
|------|--------|
| `backend/src/database/database.module.ts` | Added `RedisService` to providers/exports |
| `backend/src/sentinel/sentinel.service.ts` | Full Sentinel ML proxy — `streamKeyboard`, `streamMouse`, `evaluate` with Redis session state |
| `backend/src/sentinel/sentinel.guard.ts` | Real ALLOW/CHALLENGE/BLOCK enforcement replacing mock |
| `backend/src/sentinel/sentinel.module.ts` | Added controller, guard, `forwardRef(AuthModule)` |
| `backend/src/auth/auth.controller.ts` | Added `POST /verify` and `GET /mfa-status` endpoints |
| `backend/src/auth/auth.module.ts` | Added `forwardRef(SentinelModule)` import |
| `frontend/src/lib/auth/actions.ts` | Login → `/verify` redirect, MFA check in `requireAuth()` |
| `frontend/src/lib/api/smart-fetch.ts` | `X-Sentinel-Session` header, 428 challenge_text parsing, 401 terminated redirect |
| `frontend/src/app/(protected)/layout.tsx` | Wrapped children with `SentinelWrapper` |

---

## 2026-02-11 — Bugfix: Admin Data Disappearing After Re-login

**Bug**: Admin pages (`/admin/signups`, `/admin/users`) showed all data on first backend start, but after any user login the data disappeared — only the logged-in user's own row was visible.

**Root Cause**: `AuthService.login()` called `client.auth.signInWithPassword()` on the shared singleton `SupabaseClient`. This mutated the client's internal auth context from service-role to user-scoped, causing all subsequent queries (admin, payments, accounts) to be filtered by Supabase RLS policies to only that user's rows.

**Fix**: Added a second, dedicated `serviceRoleClient` to `SupabaseService` that is never contaminated by login. `AdminService` now calls `getServiceRoleClient()` instead of `getClient()`.

| Aspect | Before | After |
|--------|--------|-------|
| Shared client | Service-role key, but mutated by login | User-scoped (intentional — treasurers only see own data via RLS) |
| Admin client | Same shared client | Dedicated `serviceRoleClient` — always bypasses RLS |
| `admin` getter | `this.supabase.auth.admin` | `this.serviceRoleClient.auth.admin` |

**Files Modified:**

| File | Change |
|------|--------|
| `backend/src/database/supabase.service.ts` | Added `serviceRoleClient` + `getServiceRoleClient()` method |
| `backend/src/admin/admin.service.ts` | All methods switched from `getClient()` → `getServiceRoleClient()` |

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
