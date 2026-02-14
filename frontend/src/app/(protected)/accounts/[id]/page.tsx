import { notFound } from "next/navigation";
import { fetchAccount, fetchPendingLimitRequests } from "@/lib/actions/accounts";
import { requireAuth } from "@/lib/auth/actions";
import { AccountDetailClient } from "@/components/accounts/AccountDetail";

export default async function AccountDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const user = await requireAuth();
    const isAdmin = user.role === 'treasury_admin';

    try {
        // Fetch account and (for admins) pending requests in parallel
        const [account, pendingRequests] = await Promise.all([
            fetchAccount(id),
            isAdmin ? fetchPendingLimitRequests(id) : Promise.resolve([]),
        ]);

        return (
            <AccountDetailClient
                account={account}
                userRole={user.role}
                pendingRequests={pendingRequests}
            />
        );
    } catch {
        notFound();
    }
}
