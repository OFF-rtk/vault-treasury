"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, ArrowUpRight } from "lucide-react";

export interface LimitErrorInfo {
    type: 'per_transaction' | 'daily';
    accountId: string;
    transactionAmount?: number;
    limitAmount?: number;
    difference?: number;
    currency?: string;
    currentUsage?: number;
    remaining?: number;
}

/**
 * Parse a LIMIT_EXCEEDED error message string.
 *
 * Per-txn format:  LIMIT_EXCEEDED:per_transaction:accountId:txnAmt:limitAmt:diff:currency
 * Daily format:    LIMIT_EXCEEDED:daily:accountId:txnAmt:limitAmt:diff:currency:usage:remaining
 */
export function parseLimitError(message: string): LimitErrorInfo | null {
    if (!message) return null;

    const match = message.match(/LIMIT_EXCEEDED:(per_transaction|daily):([a-f0-9-]+)/);
    if (!match) return null;

    // Split the full match portion to extract amounts
    const fullMatch = message.substring(message.indexOf('LIMIT_EXCEEDED:'));
    const parts = fullMatch.split(':');

    const info: LimitErrorInfo = {
        type: match[1] as 'per_transaction' | 'daily',
        accountId: match[2],
    };

    // parts: [LIMIT_EXCEEDED, type, accountId, txnAmt, limitAmt, diff, currency, ...]
    if (parts.length >= 7) {
        info.transactionAmount = parseFloat(parts[3]);
        info.limitAmount = parseFloat(parts[4]);
        info.difference = parseFloat(parts[5]);
        info.currency = parts[6];
    }

    // Daily has extra: currentUsage, remaining
    if (info.type === 'daily' && parts.length >= 9) {
        info.currentUsage = parseFloat(parts[7]);
        info.remaining = parseFloat(parts[8]);
    }

    return info;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

interface LimitExceededDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    limitInfo: LimitErrorInfo | null;
}

export function LimitExceededDialog({
    open,
    onOpenChange,
    limitInfo,
}: LimitExceededDialogProps) {
    if (!limitInfo) return null;

    const isDaily = limitInfo.type === 'daily';
    const limitLabel = isDaily ? 'Daily Limit' : 'Per-Transaction Limit';
    const hasAmounts = limitInfo.transactionAmount != null && limitInfo.limitAmount != null;
    const currency = limitInfo.currency || 'USD';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Transaction Limit Exceeded
                    </DialogTitle>
                    <DialogDescription>
                        This payment cannot be approved because it exceeds the
                        account&apos;s {limitLabel.toLowerCase()}. You can request a limit
                        increase from an administrator.
                    </DialogDescription>
                </DialogHeader>

                {hasAmounts ? (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm space-y-3">
                        {/* Amount Details */}
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                    Payment Amount
                                </p>
                                <p className="text-sm font-semibold text-slate-900 tabular-nums">
                                    {formatCurrency(limitInfo.transactionAmount!, currency)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                    {limitLabel}
                                </p>
                                <p className="text-sm font-semibold text-slate-900 tabular-nums">
                                    {formatCurrency(limitInfo.limitAmount!, currency)}
                                </p>
                            </div>
                        </div>

                        {/* Daily: Used Today / Remaining */}
                        {isDaily && limitInfo.currentUsage != null && (
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-2 border-t border-slate-200">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                        Used Today
                                    </p>
                                    <p className="text-sm font-semibold text-slate-700 tabular-nums">
                                        {formatCurrency(limitInfo.currentUsage, currency)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                        Remaining
                                    </p>
                                    <p className="text-sm font-semibold text-slate-700 tabular-nums">
                                        {formatCurrency(limitInfo.remaining ?? 0, currency)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Shortfall */}
                        {limitInfo.difference != null && (
                            <div className="rounded-md bg-red-50 border border-red-200 p-3 -mx-0.5">
                                <p className="text-[10px] uppercase font-bold text-red-400 tracking-widest">
                                    Shortfall
                                </p>
                                <p className="text-lg font-bold text-red-600 tabular-nums mt-0.5">
                                    −{formatCurrency(limitInfo.difference, currency)}
                                </p>
                                <p className="text-[10px] text-red-400 mt-1">
                                    {isDaily
                                        ? 'Amount exceeding today\'s remaining daily allowance'
                                        : 'Amount exceeding the per-transaction maximum'}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm">
                        <p className="font-medium text-red-800">
                            {isDaily
                                ? 'The payment would push the account over its daily spending limit.'
                                : 'The payment amount exceeds the maximum allowed per single transaction.'}
                        </p>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button
                        className="bg-slate-900 hover:bg-slate-800"
                        asChild
                    >
                        <Link href={`/accounts/${limitInfo.accountId}?requestLimit=true`}>
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            Request Limit Change
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
