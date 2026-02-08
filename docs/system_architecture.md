# Vault Treasury — System Architecture

> Full-stack architecture for the Treasury Portal integrated with Sentinel-ML.

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USERS                                           │
│                    Treasurers / Treasury Admins                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                           │
│                         (Next.js 14+)                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Pages:                                                                 │ │
│  │  • /login                    • /accounts                                │ │
│  │  • /signup                   • /accounts/[id]                           │ │
│  │  • /payments (main)          • /admin/signups                           │ │
│  │  • /payments/[id]            • /admin/users                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Behavioral Telemetry Collector                                         │ │
│  │  • Keyboard events → buffer → POST /stream/keyboard                     │ │
│  │  • Mouse events → buffer → POST /stream/mouse                           │ │
│  │  • Beacon every 100ms (non-blocking)                                    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────────────┐
│        VAULT BACKEND            │  │           SENTINEL-ML API               │
│        (NestJS/TypeScript)      │  │           (Already Built)               │
│  ───────────────────────────    │  │  ─────────────────────────────────────  │
│  Port: 8001                     │  │  Port: 8000                             │
│                                 │  │                                         │
│  Endpoints:                     │  │  Endpoints:                             │
│  • POST /api/payments/:id/act   │  │  • POST /stream/keyboard                │
│  • GET  /api/payments           │  │  • POST /stream/mouse                   │
│  • GET  /api/accounts           │  │  • POST /evaluate                       │
│  • POST /api/signups            │  │                                         │
│  • POST /api/admin/*            │  │  Returns:                               │
│  • POST /api/erp-simulator/*    │  │  { decision, risk_score, trust_level }  │
│                                 │  │                                         │
│  JWT Verification:              │  │                                         │
│  SUPABASE_JWT_SECRET            │  │                                         │
└─────────────────────────────────┘  └─────────────────────────────────────────┘
                    │                               │
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             SUPABASE                                         │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────────┐│
│  │       Auth Service          │  │           PostgreSQL Database           ││
│  │  ─────────────────────────  │  │  ─────────────────────────────────────  ││
│  │  • Email/Password login     │  │  Existing:                              ││
│  │  • JWT generation           │  │  • users (with role enum)               ││
│  │  • Session management       │  │  • user_behavior_models                 ││
│  │  • Admin API (invalidate)   │  │  • audit_logs                           ││
│  │                             │  │                                         ││
│  │  SUPABASE_JWT_SECRET        │  │  New (Vault Treasury):                  ││
│  │  used by backend to verify  │  │  • treasury_profiles                    ││
│  │                             │  │  • signup_requests                      ││
│  │                             │  │  • accounts                             ││
│  │                             │  │  • account_limits                       ││
│  │                             │  │  • payments                             ││
│  │                             │  │  • payment_actions                      ││
│  │                             │  │  • erp_simulator_config                 ││
│  └─────────────────────────────┘  └─────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture: Middleware + Smart Fetch

### Why Backend Middleware?

The frontend calling Sentinel `/evaluate` directly is a **security vulnerability**:
- Attacker could bypass the frontend and call the API directly
- Frontend could be manipulated to skip the Sentinel check

**Solution:** Move Sentinel evaluation to a **backend middleware** that intercepts all sensitive requests.

### The 428 Challenge Required Pattern

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      VAULT BACKEND MIDDLEWARE                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  SentinelMiddleware                                                    │  │
│  │  ──────────────────────────────────────────────────────────────────    │  │
│  │                                                                        │  │
│  │  1. Intercepts protected routes (/api/payments/*/approve, etc.)        │  │
│  │  2. Calls Sentinel /evaluate with user's session_id                    │  │
│  │  3. Decision logic:                                                    │  │
│  │                                                                        │  │
│  │     ALLOW     → Pass request to handler                                │  │
│  │     CHALLENGE → Return 428 with challenge prompt                       │  │
│  │     BLOCK     → Invalidate session, return 401                         │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### HTTP 428 Precondition Required

| Status | Meaning | Frontend Action |
|--------|---------|-----------------|
| `200` | ALLOW - Action succeeded | Update UI |
| `428` | CHALLENGE - Need behavioral verification | Show modal, retry after |
| `401` | BLOCK - Session terminated | Redirect to /terminated |

---

## Smart Fetch Wrapper (Frontend)

The frontend uses a wrapper that **automatically handles the 428 retry loop**:

```typescript
// lib/api/smartFetch.ts
class SmartFetchClient {
  private pendingChallenge: Promise<void> | null = null;
  
  async post(url: string, data: any): Promise<Response> {
    const response = await this.fetch(url, { method: 'POST', body: data });
    
    if (response.status === 428) {
      // Trigger challenge modal and wait for completion
      await this.handleChallenge(response);
      
      // Replay the original request
      return this.post(url, data);
    }
    
    if (response.status === 401 && response.headers.get('X-Session-Terminated')) {
      // Redirect to terminated page
      window.location.href = '/terminated';
    }
    
    return response;
  }
  
  private async handleChallenge(response: Response): Promise<void> {
    const { challenge_text } = await response.json();
    
    // Show modal and wait for user to complete typing
    await showChallengeModal(challenge_text);
    
    // After modal completes, trust is updated in Sentinel
    // The replayed request will now pass
  }
}
```

---

## Request Flow: ALLOW (Happy Path)

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐     ┌──────────┐
│ Browser │     │ Smart Fetch │     │ Vault API   │     │ Sentinel  │     │ Supabase │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └─────┬─────┘     └────┬─────┘
     │                 │                   │                  │                │
     │ ── Keyboard/Mouse Events (continuous) ───────────────►│                │
     │                 │                   │                  │                │
     │ Click "Approve" │                   │                  │                │
     │ ───────────────►│                   │                  │                │
     │                 │ POST /api/payments/:id/approve       │                │
     │                 │ ─────────────────►│                  │                │
     │                 │                   │                  │                │
     │                 │                   │ ┌──────────────────────────────┐  │
     │                 │                   │ │ MIDDLEWARE: Sentinel Check   │  │
     │                 │                   │ │ POST /evaluate ─────────────►│  │
     │                 │                   │ │ ◄─── decision: ALLOW ────────│  │
     │                 │                   │ └──────────────────────────────┘  │
     │                 │                   │                  │                │
     │                 │                   │ UPDATE payments  │                │
     │                 │                   │ ─────────────────┼───────────────►│
     │                 │                   │                  │                │
     │                 │◄── 200 OK ────────│                  │                │
     │◄── UI Update ───│                   │                  │                │
```

---

## Request Flow: CHALLENGE (428 Retry)

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐     ┌──────────┐
│ Browser │     │ Smart Fetch │     │ Vault API   │     │ Sentinel  │     │ Supabase │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └─────┬─────┘     └────┬─────┘
     │                 │                   │                  │                │
     │ Click "Approve" │                   │                  │                │
     │ ───────────────►│                   │                  │                │
     │                 │ POST /api/payments/:id/approve       │                │
     │                 │ ─────────────────►│                  │                │
     │                 │                   │                  │                │
     │                 │                   │ ┌──────────────────────────────┐  │
     │                 │                   │ │ MIDDLEWARE: Sentinel Check   │  │
     │                 │                   │ │ POST /evaluate ─────────────►│  │
     │                 │                   │ │ ◄─ decision: CHALLENGE ──────│  │
     │                 │                   │ └──────────────────────────────┘  │
     │                 │                   │                  │                │
     │                 │◄── 428 + challenge_text ─────────────│                │
     │                 │                   │                  │                │
     │◄─ Show Modal ───│                   │                  │                │
     │   "Type this    │                   │                  │                │
     │    paragraph"   │                   │                  │                │
     │                 │                   │                  │                │
     │ ── User types paragraph ──────────────────────────────►│                │
     │                 │                   │                  │ Updates trust  │
     │                 │                   │                  │                │
     │ Done typing     │                   │                  │                │
     │ ───────────────►│                   │                  │                │
     │                 │                   │                  │                │
     │                 │ ┌─────────────────────────────────┐  │                │
     │                 │ │ SMART FETCH: Replay original    │  │                │
     │                 │ │ POST /api/payments/:id/approve  │  │                │
     │                 │ └─────────────────────────────────┘  │                │
     │                 │ ─────────────────►│                  │                │
     │                 │                   │                  │                │
     │                 │                   │ ┌──────────────────────────────┐  │
     │                 │                   │ │ MIDDLEWARE: Sentinel Check   │  │
     │                 │                   │ │ POST /evaluate ─────────────►│  │
     │                 │                   │ │ ◄─── decision: ALLOW ────────│  │
     │                 │                   │ └──────────────────────────────┘  │
     │                 │                   │                  │                │
     │                 │                   │ UPDATE payments  │                │
     │                 │                   │ ─────────────────┼───────────────►│
     │                 │◄── 200 OK ────────│                  │                │
     │◄── UI Update ───│                   │                  │                │
```

---

## Request Flow: BLOCK (Session Termination)

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐     ┌──────────┐
│ Browser │     │ Smart Fetch │     │ Vault API   │     │ Sentinel  │     │ Supabase │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └─────┬─────┘     └────┬─────┘
     │                 │                   │                  │                │
     │ Any action      │                   │                  │                │
     │ ───────────────►│                   │                  │                │
     │                 │ POST /api/...     │                  │                │
     │                 │ ─────────────────►│                  │                │
     │                 │                   │                  │                │
     │                 │                   │ ┌──────────────────────────────┐  │
     │                 │                   │ │ MIDDLEWARE: Sentinel Check   │  │
     │                 │                   │ │ POST /evaluate ─────────────►│  │
     │                 │                   │ │ ◄─── decision: BLOCK ────────│  │
     │                 │                   │ └──────────────────────────────┘  │
     │                 │                   │                  │                │
     │                 │                   │ supabase.auth.admin.signOut() ───►│
     │                 │                   │                  │  Invalidate   │
     │                 │                   │                  │  all sessions │
     │                 │                   │                  │                │
     │                 │◄── 401 + X-Session-Terminated ───────│                │
     │                 │                   │                  │                │
     │◄─ Redirect ─────│                   │                  │                │
     │   /terminated   │                   │                  │                │
```

---

## Protected Routes (Middleware Applied)

| Route | Action | Sentinel Check |
|-------|--------|----------------|
| `POST /api/payments/:id/approve` | Approve payment | ✅ Required |
| `POST /api/payments/:id/reject` | Reject payment | ✅ Required |
| `PATCH /api/accounts/:id/limits` | Modify limits | ✅ Required |
| `POST /api/signups/:id/approve` | Approve signup | ✅ Required |
| `POST /api/signups/:id/reject` | Reject signup | ✅ Required |
| `POST /api/admin/users/:id/deactivate` | Deactivate user | ✅ Required |
| `POST /api/erp-simulator/start` | Start simulator | ✅ Required |
| `POST /api/erp-simulator/stop` | Stop simulator | ✅ Required |
| `GET /api/payments` | List payments | ❌ Not required |
| `GET /api/accounts` | List accounts | ❌ Not required |

---

## Component Architecture

### Frontend (Next.js)

```
vault-treasury/
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (protected)/
│   │   │   ├── layout.tsx              # Auth guard + telemetry provider
│   │   │   ├── payments/
│   │   │   │   ├── page.tsx            # Payment queue (main)
│   │   │   │   └── [id]/page.tsx       # Payment detail
│   │   │   ├── accounts/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── admin/
│   │   │       ├── signups/page.tsx
│   │   │       └── users/page.tsx
│   │   ├── terminated/page.tsx         # Session terminated screen
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/                         # Base UI components
│   │   ├── payments/
│   │   │   ├── PaymentCard.tsx
│   │   │   ├── PaymentList.tsx
│   │   │   └── PaymentFilters.tsx
│   │   ├── accounts/
│   │   ├── admin/
│   │   └── modals/
│   │       └── ChallengeModal.tsx      # Behavioral 2FA modal
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser client
│   │   │   └── server.ts               # Server client
│   │   ├── sentinel/
│   │   │   ├── telemetry.ts            # Keyboard/mouse collection
│   │   │   └── evaluate.ts             # /evaluate calls
│   │   └── api.ts                      # Vault API client
│   │
│   └── middleware.ts                   # Auth + JWT validation
```

### Backend (NestJS)

```
vault-treasury/
├── backend/
│   ├── src/
│   │   ├── main.ts                      # NestJS app entry
│   │   ├── app.module.ts                # Root module
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.guard.ts            # JWT guard
│   │   │   ├── auth.service.ts
│   │   │   └── jwt.strategy.ts          # Passport JWT strategy
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts   # /api/payments/*
│   │   │   ├── payments.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── accounts/
│   │   │   ├── accounts.module.ts
│   │   │   ├── accounts.controller.ts   # /api/accounts/*
│   │   │   └── accounts.service.ts
│   │   │
│   │   ├── signups/
│   │   │   ├── signups.module.ts
│   │   │   ├── signups.controller.ts    # /api/signups/*
│   │   │   └── signups.service.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.module.ts
│   │   │   ├── admin.controller.ts      # /api/admin/*
│   │   │   └── admin.service.ts
│   │   │
│   │   ├── erp-simulator/
│   │   │   ├── erp-simulator.module.ts
│   │   │   ├── erp-simulator.controller.ts
│   │   │   └── erp-simulator.service.ts # Background job scheduler
│   │   │
│   │   ├── sentinel/
│   │   │   ├── sentinel.module.ts
│   │   │   ├── sentinel.guard.ts        # Middleware for /evaluate
│   │   │   └── sentinel.service.ts      # HTTP client for Sentinel API
│   │   │
│   │   └── database/
│   │       ├── database.module.ts
│   │       └── supabase.service.ts      # Supabase client
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
```

---

## Environment Variables

### Frontend (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# APIs
NEXT_PUBLIC_VAULT_API_URL=http://localhost:8001
NEXT_PUBLIC_SENTINEL_API_URL=http://localhost:8000
```

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Sentinel (for proxying if needed)
SENTINEL_API_URL=http://localhost:8000

# Server
PORT=8001
DEBUG=true
```

---

## API Endpoints

### Vault Backend API

| Method | Endpoint | Description | Auth | Sentinel |
|--------|----------|-------------|------|----------|
| **Payments** |
| GET | `/api/payments` | List payments (with filters) | JWT | — |
| GET | `/api/payments/:id` | Get payment detail + actions | JWT | — |
| POST | `/api/payments/:id/approve` | Approve payment | JWT | Pre-validated |
| POST | `/api/payments/:id/reject` | Reject payment | JWT | Pre-validated |
| **Accounts** |
| GET | `/api/accounts` | List all accounts | JWT | — |
| GET | `/api/accounts/:id` | Get account + limits + history | JWT | — |
| PATCH | `/api/accounts/:id/limits` | Update account limits | JWT | Pre-validated |
| **Signups** |
| POST | `/api/signups` | Submit signup request | Public | — |
| GET | `/api/signups` | List pending (admin) | JWT+Admin | — |
| POST | `/api/signups/:id/approve` | Approve signup | JWT+Admin | Pre-validated |
| POST | `/api/signups/:id/reject` | Reject signup | JWT+Admin | Pre-validated |
| **Admin** |
| GET | `/api/admin/users` | List treasury users | JWT+Admin | — |
| POST | `/api/admin/users/:id/deactivate` | Deactivate user | JWT+Admin | Pre-validated |
| **ERP Simulator** |
| GET | `/api/erp-simulator/config` | Get simulator config | JWT | — |
| POST | `/api/erp-simulator/start` | Start simulator | JWT+Admin | Pre-validated |
| POST | `/api/erp-simulator/stop` | Stop simulator | JWT+Admin | Pre-validated |
| PATCH | `/api/erp-simulator/config` | Update settings | JWT+Admin | Pre-validated |
| **Health** |
| GET | `/api/health` | Health check | — | — |

**Note:** "Pre-validated" means frontend calls `/evaluate` first, then sends action to backend only if ALLOW.

---

## Redis Integration

### Why Redis?

Redis provides **one key benefit** that simplifies the ERP Simulator:

| Use Case | Without Redis | With Redis |
|----------|--------------|------------|
| **ERP Simulator Background Job** | Complex: need APScheduler or Celery, handle restarts, coordinate state | Simple: Redis-based job queue with `arq` (Python) |

### What Redis Handles

```
┌─────────────────────────────────────────────────────────────────┐
│                        REDIS                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ERP Simulator Job Queue                                  │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │  • Scheduled job: "generate_payment" every N seconds      │  │
│  │  • Job survives backend restarts                          │  │
│  │  • Start/stop via API toggles the scheduled job           │  │
│  │                                                           │  │
│  │  Key: erp_simulator:job_id                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Note: Sentinel-ML ALREADY uses Redis for behavioral streams   │
│  We can share the same Redis instance                          │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation: BullMQ (Redis Queue for Node.js)

```typescript
// backend/src/erp-simulator/erp-simulator.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ErpSimulatorService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly queue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async generatePayment() {
    // Check if simulator is active
    const config = await this.getErpConfig();
    if (!config.is_active) return;

    // Generate random payment
    await this.createRandomPayment(config);
  }
}
```

**Dependencies:**
```bash
npm install @nestjs/schedule @nestjs/bull bullmq
```

**Why BullMQ over alternatives?**
- Native Node.js (matches NestJS stack)
- Built-in cron scheduling via @nestjs/schedule
- Redis-backed job persistence
- First-class NestJS integration

---

## Deployment Architecture (Docker)

### Local Development

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        docker-compose.yml                               │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │  │
│  │  │  frontend   │  │   backend   │  │   worker    │  │  redis   │  │  │
│  │  │  (Next.js)  │  │  (NestJS)   │  │  (BullMQ)   │  │          │  │  │
│  │  │  Port:3000  │  │  Port:8001  │  │  (no port)  │  │  :6379   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  │  │
│  │         │                │                │               │       │  │
│  │         └────────────────┴────────────────┴───────────────┘       │  │
│  │                                   │                               │  │
│  │                           vault-network                           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                      │                                  │
│                                      ▼                                  │
│                   ┌─────────────────────────────────┐                   │
│                   │  sentinel-ml (separate compose) │                   │
│                   │  Port: 8000                     │                   │
│                   └─────────────────────────────────┘                   │
│                                      │                                  │
│                                      ▼                                  │
│                   ┌─────────────────────────────────┐                   │
│                   │         Supabase (Cloud)        │                   │
│                   └─────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_VAULT_API_URL=http://backend:8001
      - NEXT_PUBLIC_SENTINEL_API_URL=${SENTINEL_API_URL}
    depends_on:
      - backend
    networks:
      - vault-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    networks:
      - vault-network

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: arq backend.services.erp_worker.WorkerSettings
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    networks:
      - vault-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - vault-network

networks:
  vault-network:
    driver: bridge

volumes:
  redis-data:
```

### Development Compose Override

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  frontend:
    build:
      target: development
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

  backend:
    volumes:
      - ./backend:/app
    command: uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Dockerfile: Frontend

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS base

# Development
FROM base AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Production build
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production
FROM base AS production
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Dockerfile: Backend

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS base

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 8001
CMD ["node", "dist/main.js"]
```

---

## Production Deployment

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION                                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         Railway / Fly.io                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │   frontend   │  │   backend    │  │    worker    │  │    redis    │  │ │
│  │  │   (Next.js)  │  │   (NestJS)   │  │   (BullMQ)   │  │  (Upstash)  │  │ │
│  │  │              │  │              │  │              │  │      or     │  │ │
│  │  │  vault.com   │  │ api.vault.com│  │  (internal)  │  │   Railway   │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│          ┌───────────────────────────┼───────────────────────────┐           │
│          │                           │                           │           │
│          ▼                           ▼                           ▼           │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐      │
│  │   Sentinel-ML    │     │     Supabase     │     │   Sentinel Redis │      │
│  │   (Railway)      │     │     (Cloud)      │     │   (shared w/ ML) │      │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Option: Share Redis with Sentinel-ML

Since Sentinel-ML already runs Redis, you can share the same instance:

```env
# Both Vault and Sentinel-ML use same Redis
REDIS_URL=redis://your-redis-host:6379

# Key namespacing prevents conflicts:
# - sentinel:* (Sentinel-ML behavioral data)
# - vault:erp:* (Vault ERP simulator jobs)
```

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14+ (App Router) | UI, SSR, Middleware |
| **UI Components** | Shadcn UI + Radix | Professional component library |
| **Styling** | Tailwind CSS | Design system, responsive |
| **Animations** | Framer Motion | Snappy micro-interactions |
| **Backend** | NestJS (TypeScript) | API, business logic |
| **Worker** | BullMQ + @nestjs/schedule | ERP Simulator background jobs |
| **Cache/Queue** | Redis 7 | Job scheduling, shared with Sentinel |
| **Database** | Supabase (PostgreSQL) | Persistence, RLS |
| **Auth** | Supabase Auth | JWT, session mgmt |
| **ML Security** | Sentinel-ML | Behavioral analysis |
| **Containers** | Docker + Docker Compose | Local dev & deployment |
| **Deployment** | Railway / Fly.io | Container hosting |
