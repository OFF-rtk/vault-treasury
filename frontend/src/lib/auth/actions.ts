'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'vault_session';
const DEVICE_COOKIE = 'sentinel_device_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

interface LoginResult {
    success: boolean;
    error?: string;
    redirectTo?: string;
}

interface UserProfile {
    id: string;
    email: string;
    role: string;
    fullName: string;
    department: string | null;
    status: 'pending' | 'active' | 'deactivated';
}

export async function loginAction(email: string, password: string): Promise<LoginResult> {
    try {
        const response = await fetch(`${process.env.VAULT_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.message || 'Invalid credentials' };
        }

        // Set HTTP-only secure cookie
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });

        // Determine redirect based on user status
        if (data.user.status === 'pending') {
            return { success: true, redirectTo: '/under-review' };
        }

        return { success: true, redirectTo: '/verify' };
    } catch (error) {
        return { success: false, error: 'Connection failed. Please try again.' };
    }
}

export async function logoutAction(): Promise<void> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
        // Call backend to invalidate session
        try {
            await fetch(`${process.env.VAULT_API_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        } catch {
            // Ignore errors - just clear the cookie
        }
    }

    // Clear the cookie
    cookieStore.delete(COOKIE_NAME);
    redirect('/login');
}

export async function getSession(): Promise<{ token: string; user: UserProfile } | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    try {
        const response = await fetch(`${process.env.VAULT_API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            // Token is expired/invalid — clear the stale cookie so
            // middleware won't redirect /login → /payments in a loop
            cookieStore.delete(COOKIE_NAME);
            return null;
        }

        const user = await response.json();
        return { token, user };
    } catch {
        return null;
    }
}

export async function requireAuth(): Promise<UserProfile> {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    if (session.user.status === 'pending') {
        redirect('/under-review');
    }

    if (session.user.status === 'deactivated') {
        redirect('/terminated');
    }

    // Check MFA status — redirect to /verify if behavioral verification expired
    try {
        const mfaResponse = await fetch(`${process.env.VAULT_API_URL}/api/auth/mfa-status`, {
            headers: { 'Authorization': `Bearer ${session.token}` },
            cache: 'no-store',
        });
        if (mfaResponse.ok) {
            const mfaData = await mfaResponse.json();
            if (mfaData.status !== 'verified') {
                redirect('/verify');
            }
        }
    } catch (e: any) {
        // If this throws a redirect, let it propagate
        if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e;
        // Otherwise ignore — don't block access for MFA check failures
    }

    return session.user;
}

export async function requireAdmin(): Promise<UserProfile> {
    const user = await requireAuth();

    if (user.role !== 'treasury_admin') {
        redirect('/payments');
    }

    return user;
}

// Add this to lib/auth/actions.ts

export async function verifyBehavioral(sessionId: string): Promise<{ success: boolean; error?: string; challenge?: boolean; challengeText?: string }> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return { success: false, error: 'Session expired. Please log in again.' };
    }

    try {
        // Read device ID from cookie (same as smartFetch does)
        const deviceId = cookieStore.get(DEVICE_COOKIE)?.value;

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Sentinel-Session': sessionId,
        };

        if (deviceId) {
            headers['X-Device-Id'] = deviceId;
        }

        // Call the NestJS endpoint we just planned
        const response = await fetch(`${process.env.VAULT_API_URL}/api/auth/verify`, {
            method: 'POST',
            headers,
        });

        if (!response.ok) {
            // If the backend returns 401/403 (BLOCK), we fail here
            return { success: false, error: 'Behavioral verification failed.' };
        }

        const data = await response.json();

        if (data.verified) {
            return { success: true };
        }

        // CHALLENGE response — sentinel-ml flagged risk, re-prompt with new text
        if (data.challenge) {
            return {
                success: false,
                challenge: true,
                challengeText: data.challengeText,
                error: 'Additional verification required. Please type the new sentence.',
            };
        }

        return { success: false, error: 'Verification declined.' };

    } catch (error) {
        console.error('Behavioral verification error:', error);
        return { success: false, error: 'Connection failed during verification.' };
    }
}

/**
 * Returns the current user's role. Used by the /verify page
 * to determine the correct post-verification redirect target.
 */
export async function getUserRole(): Promise<string | null> {
    const session = await getSession();
    return session?.user.role ?? null;
}
