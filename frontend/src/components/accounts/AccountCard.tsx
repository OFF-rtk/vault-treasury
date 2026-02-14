"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Building2, ArrowRight, Landmark, CreditCard, Activity } from "lucide-react";
import type { Account } from "@/lib/actions/accounts";

// --- Helpers ---
function formatCompact(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
        notation: "compact" // e.g., $50K
    }).format(amount);
}

function formatFullAmount(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

interface AccountCardProps {
    account: Account;
    pendingRequestCount?: number;
}

export function AccountCard({ account, pendingRequestCount = 0 }: AccountCardProps) {
    // Logic to find limits (Safe access)
    const dailyLimit = account.limits?.find((l: any) => l.limit_type === 'daily');
    const perTxnLimit = account.limits?.find((l: any) => l.limit_type === 'per_transaction');

    // Calculate Usage
    const currentUsage = dailyLimit?.current_usage || 0;
    const maxDaily = dailyLimit?.limit_amount || 1; // Prevent div by zero
    const usagePercent = Math.min((currentUsage / maxDaily) * 100, 100);

    // Color Logic (Traffic Light)
    const getProgressColor = (percent: number) => {
        if (percent > 90) return "bg-red-600";
        if (percent > 75) return "bg-amber-500";
        return "bg-blue-600"; // Standard Corporate Blue
    };

    return (
        <Link
            href={`/accounts/${account.id}`}
            className="group block bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden relative"
        >
            {/* Top Accent Line (Optional aesthetic touch) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 to-white group-hover:from-blue-500 group-hover:to-blue-400 transition-all" />

            <div className="p-6">
                {/* 1. Header: Identity */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <Landmark className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm leading-tight">
                                {account.account_name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {account.bank_name}
                                </span>
                                <span className="text-[10px] text-slate-300">•</span>
                                <span className="text-[10px] font-mono text-slate-500">
                                    ****{account.account_number.slice(-4)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Arrow Icon (Only appears on hover) */}
                    <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>

                {/* 2. Hero: Balance */}
                <div className="mb-6">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3" />
                        Available Funds
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                            {formatFullAmount(account.balance, account.currency)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {account.currency}
                        </span>
                    </div>
                </div>

                {/* 3. Footer: Limits Dashboard */}
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-3 space-y-3">

                    {/* Daily Limit Bar */}
                    {dailyLimit ? (
                        <div>
                            <div className="flex justify-between items-end mb-1.5">
                                <div className="flex items-center gap-1.5">
                                    <Activity className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Daily Utilization
                                    </span>
                                    {/* Pending request badge — near limits */}
                                    {pendingRequestCount > 0 && (
                                        <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold leading-none">
                                            {pendingRequestCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-mono font-medium text-slate-700">
                                    {Math.round(usagePercent)}%
                                </span>
                            </div>

                            {/* Progress Bar Container */}
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500 ease-out", getProgressColor(usagePercent))}
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>

                            <div className="flex justify-between mt-1">
                                <span className="text-[10px] text-slate-400">
                                    Used: {formatCompact(currentUsage, account.currency)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    Limit: {formatCompact(maxDaily, account.currency)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 py-1">
                            <Activity className="w-3 h-3 text-slate-300" />
                            <span className="text-xs text-slate-400 italic">No daily limit configured</span>
                            {/* Badge even when no daily limit */}
                            {pendingRequestCount > 0 && (
                                <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold leading-none">
                                    {pendingRequestCount}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Separator */}
                    {dailyLimit && perTxnLimit && <div className="h-px bg-slate-200/60" />}

                    {/* Per Txn Limit */}
                    {perTxnLimit && (
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                                <CreditCard className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Max / Txn
                                </span>
                            </div>
                            <span className="text-xs font-mono font-semibold text-slate-700">
                                {formatCompact(perTxnLimit.limit_amount, account.currency)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}