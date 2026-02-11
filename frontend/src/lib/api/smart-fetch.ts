'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'vault_session';

interface SmartFetchOptions extends RequestInit {
    /** If true, will not throw on non-ok responses, returns the response as-is */
    rawResponse?: boolean;
}

/**
 * SmartFetch — Server-side API client with session management.
 *
 * Handles:
 * - Auth headers from cookie
 * - 428 Challenge Required → stub for Module 5
 * - 401 + X-Session-Terminated → will trigger redirect
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export async function smartGet<T = any>(path: string): Promise<T> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${process.env.VAULT_API_URL}${path}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
    });

    if (!response.ok) {
        // Handle 428 Challenge Required — stub for Module 5
        if (response.status === 428) {
            throw new Error('CHALLENGE_REQUIRED');
        }

        // Handle 401 — redirect to login (prevents infinite re-render loop)
        if (response.status === 401) {
            redirect('/login');
        }

        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Request failed: ${response.status}`);
    }

    return response.json();
}

export async function smartPost<T = any>(path: string, body?: any): Promise<T> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${process.env.VAULT_API_URL}${path}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
    });

    if (!response.ok) {
        if (response.status === 428) {
            throw new Error('CHALLENGE_REQUIRED');
        }

        // Handle 401 — redirect to login
        if (response.status === 401) {
            redirect('/login');
        }

        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Request failed: ${response.status}`);
    }

    return response.json();
}

export async function smartPatch<T = any>(path: string, body?: any): Promise<T> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${process.env.VAULT_API_URL}${path}`, {
        method: 'PATCH',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
    });

    if (!response.ok) {
        if (response.status === 428) {
            throw new Error('CHALLENGE_REQUIRED');
        }

        if (response.status === 401) {
            redirect('/login');
        }

        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Request failed: ${response.status}`);
    }

    return response.json();
}
