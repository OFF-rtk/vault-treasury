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
import { Wallet } from "lucide-react";

function formatAmount(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

interface BalanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accountName: string;
    currentBalance: number;
    currency: string;
    onConfirm: (newBalance: number) => void;
    isPending?: boolean;
}

export function BalanceDialog({
    open,
    onOpenChange,
    accountName,
    currentBalance,
    currency,
    onConfirm,
    isPending,
}: BalanceDialogProps) {
    const [balance, setBalance] = useState(currentBalance.toString());

    const handleOpenChange = (value: boolean) => {
        if (!value) {
            setBalance(currentBalance.toString());
        }
        onOpenChange(value);
    };

    const balanceNum = parseFloat(balance);
    const isValid = !isNaN(balanceNum) && balanceNum >= 0;
    const hasChanged = isValid && balanceNum !== currentBalance;

    const handleConfirm = () => {
        if (hasChanged) {
            onConfirm(balanceNum);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-blue-500" />
                        Update Balance
                    </DialogTitle>
                    <DialogDescription>
                        Manually adjust the balance for <span className="font-semibold text-slate-700">{accountName}</span>.
                        This action is protected by behavioral verification.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="account-balance" className="text-sm font-medium text-slate-700">
                            New Balance
                        </Label>
                        <p className="text-xs text-slate-400">
                            Current: {formatAmount(currentBalance, currency)}
                        </p>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <Input
                                id="account-balance"
                                type="number"
                                min={0}
                                step={1000}
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                className="pl-7 font-mono"
                                placeholder="1500000"
                            />
                        </div>
                        {isValid && hasChanged && (
                            <p className="text-xs text-slate-500">
                                Change:{" "}
                                <span className={balanceNum > currentBalance ? "text-emerald-600" : "text-red-600"}>
                                    {balanceNum > currentBalance ? "+" : ""}
                                    {formatAmount(balanceNum - currentBalance, currency)}
                                </span>
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-slate-900 hover:bg-slate-800"
                        onClick={handleConfirm}
                        disabled={!hasChanged || isPending}
                    >
                        Update Balance
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
