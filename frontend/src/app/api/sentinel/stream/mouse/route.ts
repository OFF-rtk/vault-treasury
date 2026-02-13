import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Next.js API Route — Proxy for sentinel mouse streaming.
 *
 * Why: SentinelProvider runs client-side but can't read the httpOnly
 * vault_session cookie. This route reads it server-side and forwards
 * to NestJS with proper Authorization header.
 */
export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get('vault_session')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId =
        request.headers.get('x-sentinel-session') ||
        cookieStore.get('sentinel_session')?.value ||
        '';

    const body = await request.json();

    try {
        const response = await fetch(
            `${process.env.VAULT_API_URL}/api/sentinel/stream/mouse`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'X-Sentinel-Session': sessionId,
                    'X-Forwarded-For':
                        request.headers.get('x-forwarded-for') || '',
                    'User-Agent': request.headers.get('user-agent') || '',
                },
                body: JSON.stringify(body),
            },
        );

        if (response.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch {
        // Fire-and-forget — don't break the client
        return new NextResponse(null, { status: 204 });
    }
}
