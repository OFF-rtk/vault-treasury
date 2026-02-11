"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Building2,
    ArrowLeft,
    Settings2,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    User,
    Landmark,
    CreditCard,
    Activity,
    History
} from "lucide-react";
import { LimitDialog } from "./LimitDialog";
import { updateAccountLimits } from "@/lib/actions/accounts";
import type { AccountWithDetails, RecentPayment, AccountLimit } from "@/lib/actions/accounts";

// --- Formatters ---

function formatAmount(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatCompactAmount(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(dateStr));
}

// --- Status Config ---

const paymentStatusConfig = {
    pending: { label: "Pending", color: "bg-amber-500", text: "text-amber-700" },
    approved: { label: "Approved", color: "bg-emerald-500", text: "text-emerald-700" },
    rejected: { label: "Rejected", color: "bg-red-500", text: "text-red-700" },
};

// --- Component ---

interface AccountDetailProps {
    account: AccountWithDetails;
}

export function AccountDetailClient({ account }: AccountDetailProps) {
    const router = useRouter();
    const [limitDialogOpen, setLimitDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Limit Logic
    const dailyLimit = account.limits?.find((l: AccountLimit) => l.limit_type === 'daily');
    const perTxnLimit = account.limits?.find((l: AccountLimit) => l.limit_type === 'per_transaction');

    // Usage Calc
    const currentUsage = dailyLimit?.current_usage || 0;
    const maxDaily = dailyLimit?.limit_amount || 1;
    const dailyUsagePercent = Math.min((currentUsage / maxDaily) * 100, 100);

    // Color Logic
    const usageColor = dailyUsagePercent > 90
        ? "bg-red-600"
        : dailyUsagePercent > 75
            ? "bg-amber-500"
            : "bg-blue-600";

    const handleUpdateLimits = (limits: { daily?: number; perTransaction?: number }) => {
        startTransition(async () => {
            try {
                await updateAccountLimits(account.id, limits);
                setLimitDialogOpen(false);
                router.refresh();
            } catch (error) {
                console.error("Failed to update limits:", error);
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Navigation */}
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/accounts")}
                    className="pl-0 text-slate-500 hover:text-slate-900 hover:bg-transparent"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Accounts
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* ───── LEFT COLUMN (Info & Controls) ───── */}
                <div className="lg:col-span-3 space-y-6">

                    {/* 1. Account Identity & Balance Hero */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-8">
                            {/* Identity Header */}
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <Landmark className="w-6 h-6 text-slate-700" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                            {account.account_name}
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                {account.bank_name}
                                            </span>
                                            <span className="text-xs text-slate-300">•</span>
                                            <span className="font-mono text-xs text-slate-400">
                                                {account.account_number}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Balance Display */}
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Building2 className="w-3 h-3" />
                                    Available Funds
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold text-slate-900 tracking-tighter tabular-nums">
                                        {formatAmount(account.balance, account.currency)}
                                    </span>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                        {account.currency}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Limits Dashboard Section */}
                        <div className="bg-slate-50 border-t border-slate-100 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-slate-500" />
                                    <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                        Limit Utilization
                                    </h2>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 bg-white text-xs font-medium text-slate-600 hover:text-slate-900 shadow-sm"
                                    onClick={() => setLimitDialogOpen(true)}
                                >
                                    <Settings2 className="w-3.5 h-3.5 mr-2" />
                                    Configure
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {/* Daily Limit Meter */}
                                {dailyLimit ? (
                                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-semibold text-slate-600">Daily Volume</span>
                                            <div className="text-right">
                                                <span className="text-sm font-mono font-bold text-slate-900">
                                                    {Math.round(dailyUsagePercent)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Precision Bar */}
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-700 ease-out", usageColor)}
                                                style={{ width: `${dailyUsagePercent}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                                            <span>Used: {formatCompactAmount(dailyLimit.current_usage, account.currency)}</span>
                                            <span>Max: {formatCompactAmount(dailyLimit.limit_amount, account.currency)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-100 rounded-lg border border-dashed border-slate-300 text-center">
                                        <p className="text-xs text-slate-500 italic">No daily limit configured</p>
                                    </div>
                                )}

                                {/* Per-Txn Stat */}
                                {perTxnLimit ? (
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <CreditCard className="w-4 h-4" />
                                            <span className="text-xs font-medium">Max Per Transaction</span>
                                        </div>
                                        <span className="text-sm font-mono font-bold text-slate-900">
                                            {formatCompactAmount(perTxnLimit.limit_amount, account.currency)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between px-1 opacity-50">
                                        <span className="text-xs text-slate-500">Max Per Transaction</span>
                                        <span className="text-xs italic text-slate-400">Unlimited</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ───── RIGHT COLUMN (Activity) ───── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Recent Transactions List */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                                Recent Activity
                            </h2>
                        </div>

                        {account.recentPayments.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-slate-400">No recent transactions recorded.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {account.recentPayments.map((payment: RecentPayment) => {
                                    const isOutflow = payment.from_account?.id === account.id;
                                    const status = paymentStatusConfig[payment.status as keyof typeof paymentStatusConfig] || paymentStatusConfig.pending;

                                    return (
                                        <button
                                            key={payment.id}
                                            onClick={() => router.push(`/payments/${payment.id}`)}
                                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                                                    isOutflow ? "bg-white border-slate-200" : "bg-emerald-50 border-emerald-100"
                                                )}>
                                                    {isOutflow
                                                        ? <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                                        : <ArrowDownLeft className="w-4 h-4 text-emerald-600" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                                        {isOutflow
                                                            ? payment.to_account?.account_name
                                                            : payment.from_account?.account_name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                            {payment.reference_number}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right flex-shrink-0 ml-4">
                                                <p className={cn(
                                                    "text-sm font-bold tabular-nums tracking-tight",
                                                    isOutflow ? "text-slate-900" : "text-emerald-600"
                                                )}>
                                                    {isOutflow ? "-" : "+"}{formatCompactAmount(payment.amount, payment.currency)}
                                                </p>
                                                <div className="flex items-center justify-end gap-1.5 mt-1">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", status.color)} />
                                                    <span className={cn("text-[10px] font-medium", status.text)}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Audit Log (Limits) */}
                    {account.limits?.some((l: AccountLimit) => l.updated_by) && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-400" />
                                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                                    Configuration Log
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {account.limits
                                    .filter((l: AccountLimit) => l.updated_by)
                                    .sort((a: AccountLimit, b: AccountLimit) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                                    .map((limit: AccountLimit) => (
                                        <div key={limit.id} className="px-6 py-4 flex items-start gap-4">
                                            <div className="h-2 w-2 rounded-full bg-slate-200 mt-2 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-slate-600 leading-relaxed">
                                                    <span className="font-bold text-slate-900">{limit.updated_by_name || 'System'}</span>
                                                    {' '}updated{' '}
                                                    <span className="font-medium text-slate-700">
                                                        {limit.limit_type === 'daily' ? 'Daily Limit' : 'Txn Limit'}
                                                    </span>
                                                </p>
                                                <p className="text-sm font-mono font-bold text-slate-900 mt-1">
                                                    {formatAmount(limit.limit_amount, account.currency)}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <Clock className="w-3 h-3 text-slate-300" />
                                                    <span className="text-[10px] text-slate-400">
                                                        {formatDate(limit.updated_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Limit Modification Dialog */}
            <LimitDialog
                open={limitDialogOpen}
                onOpenChange={setLimitDialogOpen}
                accountName={account.account_name}
                currentLimits={account.limits || []}
                onConfirm={handleUpdateLimits}
                isPending={isPending}
            />
        </div>
    );
}