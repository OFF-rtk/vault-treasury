-- ============================================================
-- LIMIT CHANGE REQUESTS TABLE
-- Maker-checker flow: treasurers request, admins approve
-- ============================================================

CREATE TABLE IF NOT EXISTS public.limit_change_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    limit_type          TEXT NOT NULL CHECK (limit_type IN ('daily', 'per_transaction')),
    current_amount      DECIMAL(15,2) NOT NULL,
    requested_amount    DECIMAL(15,2) NOT NULL CHECK (requested_amount > 0),
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by        UUID NOT NULL REFERENCES public.users(id),
    reviewed_by         UUID REFERENCES public.users(id),
    reviewed_at         TIMESTAMPTZ,
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_limit_requests_account ON public.limit_change_requests(account_id);
CREATE INDEX IF NOT EXISTS idx_limit_requests_status ON public.limit_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_limit_requests_created ON public.limit_change_requests(created_at DESC);

-- Comments
COMMENT ON TABLE public.limit_change_requests IS 'Limit change requests. Treasurers request, admins approve/reject.';

-- RLS
ALTER TABLE public.limit_change_requests ENABLE ROW LEVEL SECURITY;

-- Treasury users can view requests
CREATE POLICY "limit_requests_select_treasury"
    ON public.limit_change_requests FOR SELECT
    USING (public.is_treasury_user());

-- Treasury users can create requests
CREATE POLICY "limit_requests_insert_treasury"
    ON public.limit_change_requests FOR INSERT
    WITH CHECK (public.is_treasury_user());

-- Only admins can update (approve/reject)
CREATE POLICY "limit_requests_update_admin"
    ON public.limit_change_requests FOR UPDATE
    USING (public.is_treasury_admin())
    WITH CHECK (public.is_treasury_admin());
