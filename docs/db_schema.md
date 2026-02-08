# Vault Treasury — Database Schema

> Extends existing Supabase schema. Integrates with existing `users` table and `user_role` enum.

---

## Existing Tables (Already in Supabase)

These tables already exist from the Sentinel Auditor project:

| Table | Purpose | Modification Needed |
|-------|---------|---------------------|
| `users` | User profiles linked to auth | Extend `user_role` enum |
| `user_behavior_models` | ML models per user | None |
| `audit_logs` | Sentinel audit events | None |
| `agent_traces` | RAG agent traces | None |
| `documents` | Vector embeddings | None |

---

## New Tables for Vault Treasury

| Table | Purpose |
|-------|---------|
| `treasury_profiles` | Treasury-specific user data (department, status) |
| `signup_requests` | Pending access requests |
| `accounts` | Bank accounts |
| `account_limits` | Daily/per-txn limits |
| `payments` | Payment records |
| `payment_actions` | Action history per payment |
| `erp_simulator_config` | Simulator settings |

**Total: 7 new tables**

---

## Entity Relationship Diagram

```
                         ┌─────────────────────┐
                         │    auth.users       │
                         │─────────────────────│
                         │ id (UUID)           │
                         │ email               │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│       users         │  │  treasury_profiles  │  │   signup_requests   │
│   (EXISTING)        │  │     (NEW)           │  │      (NEW)          │
│─────────────────────│  │─────────────────────│  │─────────────────────│
│ id ─────────────────│  │ user_id ────────────│  │ id                  │
│ email               │  │ department          │  │ email               │
│ role (enum)         │  │ status              │  │ justification       │
│ created_at          │  │ full_name           │  │ status              │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘

┌───────────────┐    ┌───────────────┐    ┌─────────────────────┐
│   payments    │    │   accounts    │    │  payment_actions    │
│───────────────│    │───────────────│    │─────────────────────│
│ id            │    │ id            │    │ id                  │
│ from_account ─┼───►│               │    │ payment_id          │
│ to_account ───┼───►│               │    │ sentinel_score      │
│ status        │    └───────┬───────┘    └─────────────────────┘
└───────────────┘            │
                             ▼
                   ┌─────────────────────┐
                   │   account_limits    │
                   │─────────────────────│
                   │ account_id          │
                   │ limit_type          │
                   └─────────────────────┘
```

---

## Complete SQL Script

Run in **Supabase SQL Editor** after the existing schema.

```sql
-- ============================================================
-- VAULT TREASURY DATABASE SCHEMA
-- Extends existing Supabase schema
-- ============================================================


-- ============================================================
-- STEP 1: EXTEND THE USER_ROLE ENUM
-- Add treasury-specific roles to existing enum
-- ============================================================

-- Check current enum values first (run this to see what exists):
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'public.user_role'::regtype;

-- Add new roles to the existing enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'treasurer';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'treasury_admin';

-- Note: After adding enum values, you may need to run:
-- SELECT * FROM pg_enum WHERE enumtypid = 'user_role'::regtype;
-- to verify the new values are present.


-- ============================================================
-- 2. TREASURY PROFILES TABLE
-- Extends users with treasury-specific data
-- ============================================================

CREATE TABLE IF NOT EXISTS public.treasury_profiles (
    user_id         UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    department      TEXT,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
    deactivated_at  TIMESTAMPTZ,
    deactivated_by  UUID REFERENCES public.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_treasury_profiles_status ON public.treasury_profiles(status);

-- Comments
COMMENT ON TABLE public.treasury_profiles IS 'Treasury-specific profile data. Extends base users table.';


-- ============================================================
-- 3. SIGNUP REQUESTS TABLE
-- Pending access requests before admin approval
-- ============================================================

CREATE TABLE IF NOT EXISTS public.signup_requests (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email            TEXT UNIQUE NOT NULL,
    full_name        TEXT NOT NULL,
    department       TEXT,
    justification    TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by      UUID REFERENCES public.users(id),
    reviewed_at      TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON public.signup_requests(status);
CREATE INDEX IF NOT EXISTS idx_signup_requests_created ON public.signup_requests(created_at DESC);

-- Comments
COMMENT ON TABLE public.signup_requests IS 'Treasury access requests awaiting admin approval.';


-- ============================================================
-- 4. ACCOUNTS TABLE
-- Bank accounts (internal company + external vendors)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number  TEXT UNIQUE NOT NULL,
    account_name    TEXT NOT NULL,
    bank_name       TEXT,
    account_type    TEXT NOT NULL DEFAULT 'internal' CHECK (account_type IN ('internal', 'external')),
    balance         DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'USD',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON public.accounts(is_active);

-- Comments
COMMENT ON TABLE public.accounts IS 'Bank accounts. internal=company, external=vendors.';


-- ============================================================
-- 5. ACCOUNT LIMITS TABLE
-- Transaction limits per account
-- ============================================================

CREATE TABLE IF NOT EXISTS public.account_limits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    limit_type      TEXT NOT NULL CHECK (limit_type IN ('daily', 'per_transaction')),
    limit_amount    DECIMAL(15,2) NOT NULL,
    current_usage   DECIMAL(15,2) NOT NULL DEFAULT 0,
    last_reset_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      UUID REFERENCES public.users(id),
    
    UNIQUE(account_id, limit_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_account_limits_account ON public.account_limits(account_id);

-- Comments
COMMENT ON TABLE public.account_limits IS 'Daily and per-transaction limits for accounts.';


-- ============================================================
-- 6. PAYMENTS TABLE
-- Core payment records
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number    TEXT UNIQUE NOT NULL,
    from_account_id     UUID NOT NULL REFERENCES public.accounts(id),
    to_account_id       UUID NOT NULL REFERENCES public.accounts(id),
    amount              DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency            TEXT NOT NULL DEFAULT 'USD',
    purpose             TEXT NOT NULL,
    priority            TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Creation
    created_by          TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Resolution
    resolved_by         UUID REFERENCES public.users(id),
    resolved_at         TIMESTAMPTZ,
    rejection_reason    TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_priority ON public.payments(priority);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_from_account ON public.payments(from_account_id);

-- Comments
COMMENT ON TABLE public.payments IS 'Payment records from ERP simulator.';


-- ============================================================
-- 7. PAYMENT ACTIONS TABLE
-- Action history per payment (contextual history)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_actions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id          UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    action_type         TEXT NOT NULL CHECK (action_type IN ('created', 'approved', 'rejected', 'challenge_passed', 'challenge_failed')),
    performed_by        TEXT NOT NULL,
    performed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Sentinel context
    sentinel_score      DECIMAL(3,2) CHECK (sentinel_score IS NULL OR (sentinel_score >= 0 AND sentinel_score <= 1)),
    sentinel_decision   TEXT CHECK (sentinel_decision IS NULL OR sentinel_decision IN ('ALLOW', 'CHALLENGE', 'BLOCK')),
    
    notes               TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_actions_payment ON public.payment_actions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_actions_time ON public.payment_actions(performed_at DESC);

-- Comments
COMMENT ON TABLE public.payment_actions IS 'Audit trail for payments. Shows in contextual history.';


-- ============================================================
-- 8. ERP SIMULATOR CONFIG TABLE
-- Singleton for simulator settings
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_simulator_config (
    id                  INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    is_active           BOOLEAN NOT NULL DEFAULT FALSE,
    interval_seconds    INTEGER NOT NULL DEFAULT 30 CHECK (interval_seconds >= 5),
    min_amount          DECIMAL(15,2) NOT NULL DEFAULT 1000 CHECK (min_amount > 0),
    max_amount          DECIMAL(15,2) NOT NULL DEFAULT 500000,
    payments_generated  INTEGER NOT NULL DEFAULT 0,
    last_generated_at   TIMESTAMPTZ,
    updated_by          UUID REFERENCES public.users(id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT max_greater_than_min CHECK (max_amount > min_amount)
);

-- Insert singleton row
INSERT INTO public.erp_simulator_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Comments
COMMENT ON TABLE public.erp_simulator_config IS 'Singleton config for ERP payment simulator.';


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if user is a treasury admin
CREATE OR REPLACE FUNCTION public.is_treasury_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.treasury_profiles tp ON u.id = tp.user_id
        WHERE u.id = auth.uid() 
        AND u.role = 'treasury_admin'
        AND tp.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Check if user is any treasury role (admin or treasurer)
CREATE OR REPLACE FUNCTION public.is_treasury_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.treasury_profiles tp ON u.id = tp.user_id
        WHERE u.id = auth.uid() 
        AND u.role IN ('treasurer', 'treasury_admin')
        AND tp.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Check if user is auditor (existing role) or treasury admin
CREATE OR REPLACE FUNCTION public.is_admin_any()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'treasury_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE public.treasury_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_simulator_config ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS: TREASURY PROFILES
-- ============================================================

-- Users can read their own treasury profile
CREATE POLICY "treasury_profiles_select_own"
    ON public.treasury_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Treasury admins can read all profiles
CREATE POLICY "treasury_profiles_select_admin"
    ON public.treasury_profiles FOR SELECT
    USING (public.is_treasury_admin());

-- Treasury admins can update profiles (deactivation)
CREATE POLICY "treasury_profiles_update_admin"
    ON public.treasury_profiles FOR UPDATE
    USING (public.is_treasury_admin())
    WITH CHECK (public.is_treasury_admin());

-- Service role can insert (signup approval flow)
CREATE POLICY "treasury_profiles_insert_service"
    ON public.treasury_profiles FOR INSERT
    WITH CHECK (auth.role() = 'service_role');


-- ============================================================
-- RLS: SIGNUP REQUESTS
-- ============================================================

-- Anyone can insert signup request (public form)
CREATE POLICY "signup_requests_insert_anon"
    ON public.signup_requests FOR INSERT
    WITH CHECK (TRUE);

-- Only treasury admins can view requests
CREATE POLICY "signup_requests_select_admin"
    ON public.signup_requests FOR SELECT
    USING (public.is_treasury_admin());

-- Only treasury admins can update (approve/reject)
CREATE POLICY "signup_requests_update_admin"
    ON public.signup_requests FOR UPDATE
    USING (public.is_treasury_admin())
    WITH CHECK (public.is_treasury_admin());


-- ============================================================
-- RLS: ACCOUNTS
-- ============================================================

-- Treasury users can read accounts
CREATE POLICY "accounts_select_treasury"
    ON public.accounts FOR SELECT
    USING (public.is_treasury_user());

-- Only admins can modify accounts
CREATE POLICY "accounts_insert_admin"
    ON public.accounts FOR INSERT
    WITH CHECK (public.is_treasury_admin());

CREATE POLICY "accounts_update_admin"
    ON public.accounts FOR UPDATE
    USING (public.is_treasury_admin())
    WITH CHECK (public.is_treasury_admin());


-- ============================================================
-- RLS: ACCOUNT LIMITS
-- ============================================================

-- Treasury users can read limits
CREATE POLICY "account_limits_select_treasury"
    ON public.account_limits FOR SELECT
    USING (public.is_treasury_user());

-- Treasury users can update limits (Sentinel-gated in app)
CREATE POLICY "account_limits_update_treasury"
    ON public.account_limits FOR UPDATE
    USING (public.is_treasury_user())
    WITH CHECK (public.is_treasury_user());

-- Admins can insert limits
CREATE POLICY "account_limits_insert_admin"
    ON public.account_limits FOR INSERT
    WITH CHECK (public.is_treasury_admin());


-- ============================================================
-- RLS: PAYMENTS
-- ============================================================

-- Treasury users can read payments
CREATE POLICY "payments_select_treasury"
    ON public.payments FOR SELECT
    USING (public.is_treasury_user());

-- Service role can insert (ERP simulator)
CREATE POLICY "payments_insert_service"
    ON public.payments FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Treasury users can update (approve/reject)
CREATE POLICY "payments_update_treasury"
    ON public.payments FOR UPDATE
    USING (public.is_treasury_user())
    WITH CHECK (public.is_treasury_user());


-- ============================================================
-- RLS: PAYMENT ACTIONS
-- ============================================================

-- Treasury users can read actions
CREATE POLICY "payment_actions_select_treasury"
    ON public.payment_actions FOR SELECT
    USING (public.is_treasury_user());

-- Treasury users and service role can insert
CREATE POLICY "payment_actions_insert_treasury"
    ON public.payment_actions FOR INSERT
    WITH CHECK (public.is_treasury_user() OR auth.role() = 'service_role');


-- ============================================================
-- RLS: ERP SIMULATOR CONFIG
-- ============================================================

-- Treasury users can read config
CREATE POLICY "erp_config_select_treasury"
    ON public.erp_simulator_config FOR SELECT
    USING (public.is_treasury_user());

-- Only admins can update config
CREATE POLICY "erp_config_update_admin"
    ON public.erp_simulator_config FOR UPDATE
    USING (public.is_treasury_admin())
    WITH CHECK (public.is_treasury_admin());


-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_account_limits_updated_at
    BEFORE UPDATE ON public.account_limits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_erp_config_updated_at
    BEFORE UPDATE ON public.erp_simulator_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();
```

---

## Seed Data

Run after the schema:

```sql
-- ============================================================
-- SEED DATA
-- ============================================================

-- Internal accounts (company funds)
INSERT INTO public.accounts (account_number, account_name, bank_name, account_type, balance) VALUES
    ('****4521', 'Operating Account', 'Chase Bank', 'internal', 1500000.00),
    ('****7823', 'Payroll Account', 'Chase Bank', 'internal', 450000.00),
    ('****9102', 'Reserve Account', 'Bank of America', 'internal', 2800000.00)
ON CONFLICT (account_number) DO NOTHING;

-- External accounts (vendors)
INSERT INTO public.accounts (account_number, account_name, bank_name, account_type, balance) VALUES
    ('****8834', 'TechSupply Inc', 'Wells Fargo', 'external', 0),
    ('****2291', 'Acme Corporation', 'Citibank', 'external', 0),
    ('****5567', 'Global Logistics LLC', 'US Bank', 'external', 0),
    ('****3348', 'Office Solutions Co', 'PNC Bank', 'external', 0),
    ('****9921', 'CloudHost Services', 'Silicon Valley Bank', 'external', 0),
    ('****4455', 'Marketing Partners Ltd', 'Bank of America', 'external', 0)
ON CONFLICT (account_number) DO NOTHING;

-- Default limits for internal accounts
INSERT INTO public.account_limits (account_id, limit_type, limit_amount)
SELECT id, 'daily', 500000.00 
FROM public.accounts 
WHERE account_type = 'internal'
ON CONFLICT (account_id, limit_type) DO NOTHING;

INSERT INTO public.account_limits (account_id, limit_type, limit_amount)
SELECT id, 'per_transaction', 250000.00 
FROM public.accounts 
WHERE account_type = 'internal'
ON CONFLICT (account_id, limit_type) DO NOTHING;

-- Ensure ERP simulator config exists
INSERT INTO public.erp_simulator_config (id, is_active, interval_seconds, min_amount, max_amount)
VALUES (1, FALSE, 30, 1000, 500000)
ON CONFLICT (id) DO NOTHING;
```

---

## Creating Treasury Admin

After running schema, create a treasury admin:

### Option A: New User

1. **Supabase Dashboard → Auth → Users → Add User**
   - Email: `treasury-admin@vault.demo`
   - Password: (your choice)
   - Auto Confirm: Yes

2. **Run SQL** (replace `<USER_ID>` with UUID from step 1):

```sql
-- Add to existing users table with treasury_admin role
INSERT INTO public.users (id, email, role)
VALUES ('<USER_ID>', 'treasury-admin@vault.demo', 'treasury_admin')
ON CONFLICT (id) DO UPDATE SET role = 'treasury_admin';

-- Add treasury profile
INSERT INTO public.treasury_profiles (user_id, full_name, department, status)
VALUES ('<USER_ID>', 'Treasury Admin', 'Finance', 'active');
```

### Option B: Upgrade Existing Auditor Admin

If your existing admin should also be treasury admin:

```sql
-- Update existing admin to treasury_admin role
UPDATE public.users 
SET role = 'treasury_admin' 
WHERE email = 'your-existing-admin@email.com';

-- Add treasury profile for them
INSERT INTO public.treasury_profiles (user_id, full_name, department, status)
SELECT id, 'Admin Name', 'Finance', 'active'
FROM public.users 
WHERE email = 'your-existing-admin@email.com'
ON CONFLICT (user_id) DO NOTHING;
```

---

## Role Hierarchy

| Role | Auditor Dashboard | Vault Treasury |
|------|-------------------|----------------|
| `user` | ❌ | ❌ |
| `auditor` | ✅ View only | ❌ |
| `admin` | ✅ Full access | ❌ |
| `treasurer` | ❌ | ✅ Standard access |
| `treasury_admin` | ✅ Full access | ✅ Full access |

---

## RLS Policy Summary

| Table | SELECT | INSERT | UPDATE |
|-------|--------|--------|--------|
| `treasury_profiles` | Own + Admins | Service role | Admins |
| `signup_requests` | Admins | Anyone (public) | Admins |
| `accounts` | Treasury users | Admins | Admins |
| `account_limits` | Treasury users | Admins | Treasury users |
| `payments` | Treasury users | Service role | Treasury users |
| `payment_actions` | Treasury users | Treasury + Service | — |
| `erp_simulator_config` | Treasury users | — | Admins |
