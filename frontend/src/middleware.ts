import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'vault_session';

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup'];

// Routes for pending users only
const pendingRoutes = ['/under-review'];

// Routes for terminated users only
const terminatedRoutes = ['/terminated'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('vault_session')?.value;
    const status = request.cookies.get('vault_user_status')?.value;

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    const isPendingRoute = pendingRoutes.some(route => pathname.startsWith(route));
    const isTerminatedRoute = terminatedRoutes.some(route => pathname.startsWith(route));

    // If no token and trying to access protected route
    if (!token && !isPublicRoute && !isPendingRoute && !isTerminatedRoute) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // If has token and trying to access login/signup, redirect to payments
    if (token && isPublicRoute) {
        return NextResponse.redirect(new URL('/payments', request.url));
    }

    if (token && status === 'pending' && !request.nextUrl.pathname.startsWith('/under-review')) {
        return NextResponse.redirect(new URL('/under-review', request.url));
    }

    if (token && status === 'active' && request.nextUrl.pathname.startsWith('/under-review')) {
        return NextResponse.redirect(new URL('/payments', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};