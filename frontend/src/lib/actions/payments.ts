'use server';

import { revalidatePath } from 'next/cache';
import { smartGet, smartPost } from '@/lib/api/smart-fetch';

// --- Types ---

export interface Payment {
    id: string;
    reference_number: string;
    from_account_id: string;
    to_account_id: string;
    amount: number;
    currency: string;
    purpose: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    status: 'pending' | 'approved' | 'rejected';
    created_by: string;
    created_at: string;
    resolved_by: string | null;
    resolved_at: string | null;
    rejection_reason: string | null;
    from_account: {
        id: string;
        account_name: string;
        account_number: string;
        bank_name: string;
        account_type: string;
        balance?: number;
    };
    to_account: {
        id: string;
        account_name: string;
        account_number: string;
        bank_name: string;
        account_type: string;
    };
}

export interface PaymentAction {
    id: string;
    payment_id: string;
    action_type: 'created' | 'approved' | 'rejected' | 'challenge_passed' | 'challenge_failed';
    performed_by: string;
    performed_at: string;
    sentinel_score: number | null;
    sentinel_decision: string | null;
    notes: string | null;
    performed_by_name?: string;
}

export interface PaymentWithActions extends Payment {
    actions: PaymentAction[];
    resolved_by_name?: string | null;
}

export interface PaymentListResponse {
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaymentFilters {
    status?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
}

// --- Actions ---

export async function fetchPayments(filters: PaymentFilters = {}): Promise<PaymentListResponse> {
    const params = new URLSearchParams();

    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const query = params.toString();
    return smartGet<PaymentListResponse>(`/api/payments${query ? `?${query}` : ''}`);
}

export async function fetchPayment(id: string): Promise<PaymentWithActions> {
    return smartGet<PaymentWithActions>(`/api/payments/${id}`);
}

export async function approvePayment(id: string, notes?: string): Promise<{ id: string; status: string }> {
    const result = await smartPost<{ id: string; status: string }>(`/api/payments/${id}/approve`, {
        notes: notes || undefined,
    });
    revalidatePath('/payments');
    return result;
}

export async function rejectPayment(id: string, reason: string): Promise<{ id: string; status: string }> {
    const result = await smartPost<{ id: string; status: string }>(`/api/payments/${id}/reject`, {
        reason,
    });
    revalidatePath('/payments');
    return result;
}
