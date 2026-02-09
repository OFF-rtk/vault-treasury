import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_VAULT_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
        return NextResponse.json({ error: data.message }, { status: res.status });
    }

    const response = NextResponse.json(data);

    response.cookies.set({
        name: 'vault_session',
        value: data.accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set({
        name: 'vault_user_status',
        value: data.user.status,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    return response;
}