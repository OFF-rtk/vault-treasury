'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'vault_session';
const SENTINEL_COOKIE = 'sentinel_session';
const DEVICE_COOKIE = 'sentinel_device_id';

/**
 * SmartFetch — Server-side API client with session management.
 *
 * Handles:
 * - Auth headers from cookie
 * - X-Sentinel-Session + X-Device-Id header forwarding
 * - 428 Challenge Required → throws CHALLENGE_REQUIRED:{text}
 * - 401 + X-Session-Terminated → redirect to /terminated
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const sentinelSession = cookieStore.get(SENTINEL_COOKIE)?.value;
    const deviceId = cookieStore.get(DEVICE_COOKIE)?.value;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (sentinelSession) {
        headers['X-Sentinel-Session'] = sentinelSession;
    }

    if (deviceId) {
        headers['X-Device-Id'] = deviceId;
    }

    return headers;
}

async function handleErrorResponse(response: Response): Promise<never> {
    // 428 Challenge Required → parse challenge_text
    if (response.status === 428) {
        const body = await response.json().catch(() => ({}));
        const text = body.challenge_text || 'Please verify your identity';
        throw new Error(`CHALLENGE_REQUIRED:${text}`);
    }

    // 401 → check for session termination
    if (response.status === 401) {
        const terminated = response.headers.get('X-Session-Terminated');
        if (terminated === 'true') {
            redirect('/terminated');
        }
        redirect('/login');
    }

    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${response.status}`);
}

export async function smartGet<T = any>(path: string): Promise<T> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${process.env.VAULT_API_URL}${path}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
    });

    if (!response.ok) {
        await handleErrorResponse(response);
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
        await handleErrorResponse(response);
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
        await handleErrorResponse(response);
    }

    return response.json();
}
