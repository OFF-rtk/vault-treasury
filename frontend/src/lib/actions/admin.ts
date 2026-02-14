'use server';

import { smartGet, smartPost } from '@/lib/api/smart-fetch';
import { revalidatePath } from 'next/cache';

// --- Types ---

export interface PendingUser {
    id: string;
    email: string;
    fullName: string;
    department: string | null;
    createdAt: string;
}

export interface TreasuryUser {
    id: string;
    email: string;
    fullName: string;
    department: string | null;
    role: string;
    status: string;
    createdAt: string;
    deactivatedAt: string | null;
}

// --- Server Actions ---

export async function fetchPendingUsers(): Promise<PendingUser[]> {
    return smartGet<PendingUser[]>('/api/admin/pending-users');
}

export async function fetchAllUsers(): Promise<TreasuryUser[]> {
    return smartGet<TreasuryUser[]>('/api/admin/users');
}

export async function approveUser(userId: string): Promise<{ message: string }> {
    const result = await smartPost<{ message: string }>(`/api/admin/users/${userId}/approve`, {});
    revalidatePath('/admin/signups');
    revalidatePath('/admin/users');
    return result;
}

export async function rejectUser(userId: string): Promise<{ message: string }> {
    const result = await smartPost<{ message: string }>(`/api/admin/users/${userId}/reject`, {});
    revalidatePath('/admin/signups');
    return result;
}

export async function deactivateUser(userId: string): Promise<{ message: string }> {
    const result = await smartPost<{ message: string }>(`/api/admin/users/${userId}/deactivate`, {});
    revalidatePath('/admin/users');
    return result;
}

// --- Limit Request Admin Actions ---

export async function approveLimitRequest(requestId: string): Promise<{ message: string }> {
    const result = await smartPost<{ message: string }>(`/api/admin/limit-requests/${requestId}/approve`, {});
    revalidatePath('/accounts');
    return result;
}

export async function rejectLimitRequest(requestId: string, reason?: string): Promise<{ message: string }> {
    const result = await smartPost<{ message: string }>(`/api/admin/limit-requests/${requestId}/reject`, { reason });
    revalidatePath('/accounts');
    return result;
}
