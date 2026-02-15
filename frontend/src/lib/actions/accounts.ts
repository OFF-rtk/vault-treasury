'use server';

import { revalidatePath } from 'next/cache';
import { smartGet, smartPost, smartPatch } from '@/lib/api/smart-fetch';

// --- Types ---

export interface AccountLimit {
    id: string;
    limit_type: 'daily' | 'per_transaction';
    limit_amount: number;
    current_usage: number;
    last_reset_at: string;
    updated_at: string;
    updated_by?: string;
    updated_by_name?: string | null;
}

export interface Account {
    id: string;
    account_number: string;
    account_name: string;
    bank_name: string;
    account_type: 'internal' | 'external';
    balance: number;
    currency: string;
    is_active: boolean;
    created_at: string;
    limits: AccountLimit[];
}

export interface RecentPayment {
    id: string;
    reference_number: string;
    amount: number;
    currency: string;
    status: 'pending' | 'approved' | 'rejected';
    purpose: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    created_at: string;
    from_account: { id: string; account_name: string; account_number: string };
    to_account: { id: string; account_name: string; account_number: string };
}

export interface AccountWithDetails extends Account {
    recentPayments: RecentPayment[];
}

export interface AccountListResponse {
    accounts: Account[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface LimitChangeRequest {
    id: string;
    account_id: string;
    limit_type: 'daily' | 'per_transaction';
    current_amount: number;
    requested_amount: number;
    status: 'pending' | 'approved' | 'rejected';
    requested_by: string;
    requested_by_name: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    created_at: string;
}

// --- Actions ---

export async function fetchAccounts(filters: { page?: number; limit?: number } = {}): Promise<AccountListResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const query = params.toString();
    return smartGet<AccountListResponse>(`/api/accounts${query ? `?${query}` : ''}`);
}

export async function fetchAccount(id: string): Promise<AccountWithDetails> {
    return smartGet<AccountWithDetails>(`/api/accounts/${id}`);
}

export async function updateAccountLimits(
    id: string,
    limits: { daily?: number; perTransaction?: number },
): Promise<{ accountId: string; limits: AccountLimit[] }> {
    const result = await smartPatch<{ accountId: string; limits: AccountLimit[] }>(
        `/api/accounts/${id}/limits`,
        limits,
    );
    revalidatePath('/accounts');
    revalidatePath(`/accounts/${id}`);
    return result;
}

export async function updateAccountBalance(
    id: string,
    balance: number,
): Promise<{ id: string; balance: number }> {
    const result = await smartPatch<{ id: string; balance: number }>(
        `/api/accounts/${id}/balance`,
        { balance },
    );
    revalidatePath('/accounts');
    revalidatePath(`/accounts/${id}`);
    return result;
}

// --- Limit Change Requests ---

export async function requestLimitChange(
    accountId: string,
    limitType: 'daily' | 'per_transaction',
    requestedAmount: number,
): Promise<LimitChangeRequest> {
    const result = await smartPost<LimitChangeRequest>(
        `/api/accounts/${accountId}/limit-request`,
        { limitType, requestedAmount },
    );
    revalidatePath('/accounts');
    revalidatePath(`/accounts/${accountId}`);
    return result;
}

export async function fetchPendingLimitRequests(accountId: string): Promise<LimitChangeRequest[]> {
    return smartGet<LimitChangeRequest[]>(`/api/accounts/${accountId}/limit-requests`);
}

export async function fetchPendingRequestCounts(): Promise<Record<string, number>> {
    return smartGet<Record<string, number>>('/api/accounts/pending-request-counts');
}

// --- Liquidity Stats ---

export interface LiquidityStats {
    totalLiquidity: number;
    pendingExposure: number;
}

export async function fetchLiquidityStats(): Promise<LiquidityStats> {
    return smartGet<LiquidityStats>('/api/accounts/stats');
}
