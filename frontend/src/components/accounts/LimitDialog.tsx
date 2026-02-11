"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";
import type { AccountLimit } from "@/lib/actions/accounts";

function formatAmount(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
    }).format(amount);
}

interface LimitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accountName: string;
    currentLimits: AccountLimit[];
    onConfirm: (limits: { daily?: number; perTransaction?: number }) => void;
    isPending?: boolean;
}

export function LimitDialog({
    open,
    onOpenChange,
    accountName,
    currentLimits,
    onConfirm,
    isPending,
}: LimitDialogProps) {
    const currentDaily = currentLimits.find(l => l.limit_type === 'daily');
    const currentPerTxn = currentLimits.find(l => l.limit_type === 'per_transaction');

    const [daily, setDaily] = useState(currentDaily?.limit_amount?.toString() || "");
    const [perTransaction, setPerTransaction] = useState(currentPerTxn?.limit_amount?.toString() || "");

    const handleOpenChange = (value: boolean) => {
        if (!value) {
            // Reset to current values when closing
            setDaily(currentDaily?.limit_amount?.toString() || "");
            setPerTransaction(currentPerTxn?.limit_amount?.toString() || "");
        }
        onOpenChange(value);
    };

    const dailyNum = parseFloat(daily);
    const perTxnNum = parseFloat(perTransaction);

    const hasChanges = (
        (!isNaN(dailyNum) && dailyNum > 0 && dailyNum !== currentDaily?.limit_amount) ||
        (!isNaN(perTxnNum) && perTxnNum > 0 && perTxnNum !== currentPerTxn?.limit_amount)
    );

    const handleConfirm = () => {
        const limits: { daily?: number; perTransaction?: number } = {};

        if (!isNaN(dailyNum) && dailyNum > 0 && dailyNum !== currentDaily?.limit_amount) {
            limits.daily = dailyNum;
        }
        if (!isNaN(perTxnNum) && perTxnNum > 0 && perTxnNum !== currentPerTxn?.limit_amount) {
            limits.perTransaction = perTxnNum;
        }

        if (Object.keys(limits).length > 0) {
            onConfirm(limits);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        Modify Limits
                    </DialogTitle>
                    <DialogDescription>
                        Update transaction limits for <span className="font-semibold text-slate-700">{accountName}</span>.
                        This action is protected by behavioral verification.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Daily Limit */}
                    <div className="space-y-2">
                        <Label htmlFor="daily-limit" className="text-sm font-medium text-slate-700">
                            Daily Limit
                        </Label>
                        {currentDaily && (
                            <p className="text-xs text-slate-400">
                                Current: {formatAmount(currentDaily.limit_amount)}
                            </p>
                        )}
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <Input
                                id="daily-limit"
                                type="number"
                                min={0}
                                step={1000}
                                value={daily}
                                onChange={(e) => setDaily(e.target.value)}
                                className="pl-7 font-mono"
                                placeholder="500000"
                            />
                        </div>
                    </div>

                    {/* Per-Transaction Limit */}
                    <div className="space-y-2">
                        <Label htmlFor="per-txn-limit" className="text-sm font-medium text-slate-700">
                            Per-Transaction Limit
                        </Label>
                        {currentPerTxn && (
                            <p className="text-xs text-slate-400">
                                Current: {formatAmount(currentPerTxn.limit_amount)}
                            </p>
                        )}
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <Input
                                id="per-txn-limit"
                                type="number"
                                min={0}
                                step={1000}
                                value={perTransaction}
                                onChange={(e) => setPerTransaction(e.target.value)}
                                className="pl-7 font-mono"
                                placeholder="250000"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-slate-900 hover:bg-slate-800"
                        onClick={handleConfirm}
                        disabled={!hasChanges || isPending}
                    >
                        Update Limits
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
