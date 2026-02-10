'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'vault_session';
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

        return { success: true, redirectTo: '/payments' };
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

    return session.user;
}

export async function requireAdmin(): Promise<UserProfile> {
    const user = await requireAuth();

    if (user.role !== 'treasury_admin') {
        redirect('/payments');
    }

    return user;
}
