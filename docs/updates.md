# Vault Treasury — Architecture Updates Log

> Chronological record of significant architecture and design decisions.

---

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
