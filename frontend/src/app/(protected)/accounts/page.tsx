import { Suspense } from "react";
import { fetchAccounts, fetchLiquidityStats } from "@/lib/actions/accounts";
import { AccountList } from "@/components/accounts/AccountList";
import { AccountsSkeleton } from "@/components/accounts/AccountsSkeleton";
import { LiquidityOverview } from "@/components/accounts/LiquidityOverview";

export default async function AccountsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const params = await searchParams;
    const page = params.page ? parseInt(params.page) : 1;

    // Fetch accounts and liquidity stats in parallel
    const [data, stats] = await Promise.all([
        fetchAccounts({ page }),
        fetchLiquidityStats(),
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Accounts & Liquidity
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Internal bank accounts and transaction limits.
                </p>
            </div>

            {/* Liquidity Ticker */}
            <LiquidityOverview
                totalLiquidity={stats.totalLiquidity}
                pendingExposure={stats.pendingExposure}
            />

            {/* Account List */}
            <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">
                    Internal Accounts
                </h2>
                <AccountList
                    accounts={data.accounts}
                    total={data.total}
                    page={data.page}
                    totalPages={data.totalPages}
                />
            </div>
        </div>
    );
}