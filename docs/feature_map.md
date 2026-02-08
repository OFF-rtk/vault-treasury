# Vault Treasury — Feature Map

> A behavioral-security-protected Treasury Management System for demonstrating Sentinel-ML integration.

---

## Project Scope

A **simplified but realistic Treasury Operations Portal** focused on:

1. **Payment Authorization Workflow** — The core TMS function
2. **Behavioral Security Gating** — Sentinel-ML protects every sensitive action
3. **Access Control** — Admin-approved signup, Supabase JWT authentication

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Roles** | Single `treasurer` + `admin` | Multiple tiers add complexity without demo value |
| **Payment Source** | ERP Simulator Agent | Dynamic demo, shows integration patterns |
| **Challenge Mechanism** | Behavioral 2FA (type paragraph) | Generates fresh keyboard data for Sentinel |
| **BLOCK Response** | Invalidate Supabase JWT, force re-login | Clean security posture |
| **Audit Logs** | Contextual only (no dedicated page) | Full audit lives in Sentinel Auditor dashboard |

---

## Authentication Flow (Supabase JWT)

```
1. Login
   └─→ supabase.auth.signInWithPassword(email, password)
       └─→ Returns: { access_token (JWT), refresh_token }

2. Frontend stores JWT (httpOnly cookie or memory)

3. Every API request
   └─→ Header: Authorization: Bearer <jwt>

4. Backend (NestJS)
   └─→ JWT Guard verifies using SUPABASE_JWT_SECRET
   └─→ Extracts user_id, role from claims

5. On BLOCK from Sentinel
   └─→ supabase.auth.admin.signOut(user_id)
   └─→ Invalidates all sessions for that user
   └─→ Frontend receives 401, redirects to login
```

---

## Feature Breakdown

### Module 1: Authentication & Access Control

| Feature | Description | Sentinel |
|---------|-------------|----------|
| **Login** | Email + password via Supabase Auth | Telemetry starts on page load |
| **Signup Request** | Form: name, email, department, justification | — |
| **Admin Review** | Approve/reject in admin panel | ✅ Gated |
| **Session Management** | Supabase JWT with refresh, inactivity logout | Linked to session_id |

---

### Module 2: Payment Queue (Main Interface)

The **primary working screen** — what a treasurer sees 90% of the time.

| Feature | Description | Sentinel |
|---------|-------------|----------|
| **Payment List** | Table of pending payments | — |
| **Filters** | By status, amount, priority, date | — |
| **Payment Detail** | Expand for full info + action history | — |
| **Approve Payment** | Single-click approval | ✅ `/evaluate` |
| **Reject Payment** | Reject with reason | ✅ `/evaluate` |
| **Batch Approve** | Multi-select approve | ✅ `/evaluate` (elevated) |

**Payment Card Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ REF: PAY-2024-001847                     Priority: HIGH   │
├────────────────────────────────────────────────────────────┤
│ From: Operating Account (****4521)     Balance: $847,293  │
│ To:   Vendor - Acme Corp (****7832)                       │
├────────────────────────────────────────────────────────────┤
│ Amount: $125,000.00 USD                                   │
│ Purpose: Q4 Equipment Purchase - PO#89234                 │
├────────────────────────────────────────────────────────────┤
│ Initiated by: erp-system@vault.internal                   │
│ Submitted: Feb 7, 2026 at 2:34 PM                         │
├────────────────────────────────────────────────────────────┤
│ History                                                    │
│ ───────────────────────────────────────────────────────    │
│ Feb 7, 14:34  Created by ERP System                        │
├────────────────────────────────────────────────────────────┤
│              [ REJECT ]            [ APPROVE ]            │
└────────────────────────────────────────────────────────────┘
```

---

### Module 3: Account Overview

| Feature | Description | Sentinel |
|---------|-------------|----------|
| **Account List** | View bank accounts with balances | — |
| **Account Details** | Transaction history + limit change history | — |
| **Modify Limits** | Change daily/per-txn limits | ✅ `/evaluate` |

**Account Detail includes contextual history:**
```
┌────────────────────────────────────────────────────────────┐
│ Operating Account (****4521)              Balance: $847K  │
├────────────────────────────────────────────────────────────┤
│ Recent Transactions                                        │
│ ───────────────────────────────────────────────────────    │
│ Feb 8   -$125,000   PAY-1847 (Acme Corp)                   │
│ Feb 7   -$23,400    PAY-1845 (TechSupply)                  │
├────────────────────────────────────────────────────────────┤
│ Limit History                                              │
│ ───────────────────────────────────────────────────────    │
│ Feb 5   Daily limit changed: $100K → $250K by admin@...    │
└────────────────────────────────────────────────────────────┘
```

---

### Module 4: Admin Panel

| Feature | Description | Sentinel |
|---------|-------------|----------|
| **Pending Signups** | List of access requests | — |
| **Approve/Reject User** | Grant or deny access | ✅ `/evaluate` |
| **User List** | View approved users | — |
| **Deactivate User** | Revoke access | ✅ `/evaluate` |
| **ERP Simulator** | Toggle payment generation | ✅ `/evaluate` |

---

### Module 5: ERP Simulator Agent

Admin-controlled background agent that generates realistic payment requests.

| Feature | Description | Sentinel |
|---------|-------------|----------|
| **Toggle On/Off** | Start/stop generation | ✅ `/evaluate` |
| **Configure Rate** | Set interval (e.g., 1 per 30s) | ✅ `/evaluate` |
| **Amount Range** | Min/max payment amounts | — |
| **View Status** | Last generated, total count | — |

**Admin UI:**
```
┌───────────────────────────────────────────────────────────┐
│  ERP Simulator                                            │
│  ─────────────────────────────────────────────────────    │
│  Status: ● ACTIVE                          [STOP]         │
│  Rate:   1 payment / 30 seconds                           │
│  Range:  $1,000 — $500,000                                │
│  Last:   PAY-2024-001849 ($23,400) — 12 seconds ago       │
└───────────────────────────────────────────────────────────┘
```

---

## Behavioral 2FA Challenge Flow

When Sentinel returns `decision: CHALLENGE`:

```
┌─────────────────────────────────────────────────────────────────┐
│              🔒 Behavioral Verification Required                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Unusual activity detected. Please type the following          │
│  paragraph to verify your identity:                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ "The quick brown fox jumps over the lazy dog near the    │  │
│  │  riverbank where the morning mist still lingers."        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Type here:                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ The quick brown fox jumps over the la|                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│              [ CANCEL ]              [ VERIFY ]                 │
└─────────────────────────────────────────────────────────────────┘
```

**Flow:**
1. User types paragraph → keyboard events stream to Sentinel
2. User clicks VERIFY → mouse velocity captured
3. Sentinel `/evaluate` called with fresh behavioral data
4. **ALLOW** → Action proceeds
5. **CHALLENGE** → Rare, show error
6. **BLOCK** → Invalidate JWT via Supabase Admin API, redirect to login

---

## BLOCK Response Flow

When Sentinel returns `decision: BLOCK`:

1. Backend calls `supabase.auth.admin.signOut(user_id)`
2. All user sessions invalidated
3. Frontend shows termination screen:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ⛔ Session Terminated                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your session has been terminated due to security concerns.    │
│                                                                 │
│  If you believe this is an error, please contact your          │
│  administrator.                                                 │
│                                                                 │
│                      [ RETURN TO LOGIN ]                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Screen Inventory

| # | Screen | Purpose | Primary Action |
|---|--------|---------|----------------|
| 1 | Login | Authenticate | Submit credentials |
| 2 | Signup Request | Request access | Submit form |
| 3 | Payment Queue | Main work area | Approve/Reject |
| 4 | Payment Detail | Full info + history | Approve/Reject |
| 5 | Accounts | View balances | — |
| 6 | Account Detail | History, modify limits | Modify limits |
| 7 | Admin: Signups | Review requests | Approve/Reject |
| 8 | Admin: Users + ERP | Manage users, simulator | Control |

**Total: 8 screens**

---

## Sentinel Integration Summary

| Action | Sentinel Call | On CHALLENGE | On BLOCK |
|--------|---------------|--------------|----------|
| Approve payment | `/evaluate` | Type paragraph | Invalidate JWT |
| Reject payment | `/evaluate` | Type paragraph | Invalidate JWT |
| Batch approve | `/evaluate` | Type paragraph | Invalidate JWT |
| Modify limits | `/evaluate` | Type paragraph | Invalidate JWT |
| Approve user | `/evaluate` | Type paragraph | Invalidate JWT |
| Deactivate user | `/evaluate` | Type paragraph | Invalidate JWT |
| Toggle ERP sim | `/evaluate` | Type paragraph | Invalidate JWT |

---

## Ecosystem View

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   VAULT TREASURY                    SENTINEL AUDITOR            │
│   (This project)                    (Already built)             │
│   ─────────────────                 ─────────────────           │
│   Treasurers work here              Security team reviews here  │
│   • Approve payments                • Full audit logs           │
│   • Manage accounts                 • Risk analysis             │
│   • Contextual history              • Flagged session review    │
│                                                                 │
│                    ↓ writes to ↓                                │
│              ┌─────────────────────┐                            │
│              │   Sentinel-ML API   │                            │
│              │   + Supabase DB     │                            │
│              └─────────────────────┘                            │
│                    ↑ reads from ↑                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What We Are NOT Building

- ❌ Dedicated audit log page (lives in Sentinel Auditor)
- ❌ Cash flow forecasting
- ❌ FX/hedging tools
- ❌ Bank connectivity (SWIFT/EBICS)
- ❌ Multi-currency support
- ❌ Dashboard widgets/charts
- ❌ Multiple treasurer permission tiers

---

## Next Steps

- [ ] Define database schema
- [ ] Create system architecture diagram
- [ ] Define API endpoints
- [ ] Create implementation plan
