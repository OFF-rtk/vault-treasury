import { Suspense } from "react";
import { fetchAccounts } from "@/lib/actions/accounts";
import { AccountList } from "@/components/accounts/AccountList";
import { AccountsSkeleton } from "@/components/accounts/AccountsSkeleton";

export default async function AccountsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    // Logic preserved exactly as requested
    const params = await searchParams;
    const page = params.page ? parseInt(params.page) : 1;
    const data = await fetchAccounts({ page });

    return (
        <div className="space-y-6">
            {/* Header: Clean & Bold (Consistent with Payments) */}
            <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Accounts
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Internal bank accounts and transaction limits.
                </p>
            </div>

            {/* Account List */}
            {/* Note: Loading state is handled by loading.tsx via Suspense/AccountsSkeleton */}
            <AccountList
                accounts={data.accounts}
                total={data.total}
                page={data.page}
                totalPages={data.totalPages}
            />
        </div>
    );
}