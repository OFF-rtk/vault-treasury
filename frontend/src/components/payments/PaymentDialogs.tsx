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
import { Textarea } from "@/components/ui/textarea";
import { Check, ShieldAlert } from "lucide-react";

// --- Approve Confirmation Dialog ---

interface ApproveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    referenceNumber?: string;
    amount?: string;
    onConfirm: () => void;
    isPending?: boolean;
}

export function ApproveDialog({
    open,
    onOpenChange,
    referenceNumber,
    amount,
    onConfirm,
    isPending,
}: ApproveDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        Confirm Approval
                    </DialogTitle>
                    <DialogDescription>
                        This will authorize the payment for processing. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm">
                    <p className="text-slate-500">Payment</p>
                    <p className="font-mono font-medium text-slate-900">
                        {referenceNumber}
                    </p>
                    <p className="text-slate-500 mt-2">Amount</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">
                        {amount}
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-slate-900 hover:bg-slate-800"
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        <Check className="h-4 w-4 mr-1" />
                        Approve Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Reject Confirmation Dialog ---

interface RejectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    isPending?: boolean;
}

export function RejectDialog({
    open,
    onOpenChange,
    onConfirm,
    isPending,
}: RejectDialogProps) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(reason.trim());
        setReason("");
    };

    const handleOpenChange = (value: boolean) => {
        if (!value) setReason("");
        onOpenChange(value);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Payment</DialogTitle>
                    <DialogDescription>
                        This action is irreversible. Funds will remain in source account.
                    </DialogDescription>
                </DialogHeader>
                <Textarea
                    placeholder="Reason for rejection (Required)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[100px]"
                />
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!reason.trim() || isPending}
                    >
                        Confirm Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
