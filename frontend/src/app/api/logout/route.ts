import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    const token = (await cookies()).get('vault_session')?.value;

    if (token) {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_VAULT_API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
        } catch (error) {
            console.error('Backend Logout Failed:', error);
        }
    }

    const response = NextResponse.json({ success: true });

    response.cookies.delete('vault_session');
    response.cookies.delete('vault_user_status');

    return response;
}