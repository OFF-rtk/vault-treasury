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

// --- Approve Limit Request Confirmation ---

interface ApproveLimitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    limitType?: string;
    currentAmount?: string;
    requestedAmount?: string;
    requesterName?: string;
    onConfirm: () => void;
    isPending?: boolean;
}

export function ApproveLimitDialog({
    open,
    onOpenChange,
    limitType,
    currentAmount,
    requestedAmount,
    requesterName,
    onConfirm,
    isPending,
}: ApproveLimitDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        Confirm Approval
                    </DialogTitle>
                    <DialogDescription>
                        This will apply the limit change immediately. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm space-y-2">
                    <div>
                        <p className="text-slate-500">Limit Type</p>
                        <p className="font-medium text-slate-900 capitalize">
                            {limitType?.replace('_', ' ')}
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <div>
                            <p className="text-slate-500">Current</p>
                            <p className="font-mono font-medium text-slate-900">{currentAmount}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Requested</p>
                            <p className="text-lg font-bold text-slate-900 tabular-nums">{requestedAmount}</p>
                        </div>
                    </div>
                    {requesterName && (
                        <div>
                            <p className="text-slate-500">Requested By</p>
                            <p className="font-medium text-slate-900">{requesterName}</p>
                        </div>
                    )}
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
                        Approve Change
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Reject Limit Request Confirmation ---

interface RejectLimitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    isPending?: boolean;
}

export function RejectLimitDialog({
    open,
    onOpenChange,
    onConfirm,
    isPending,
}: RejectLimitDialogProps) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
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
                    <DialogTitle>Reject Limit Request</DialogTitle>
                    <DialogDescription>
                        The requester will be notified. You may provide a reason below.
                    </DialogDescription>
                </DialogHeader>
                <Textarea
                    placeholder="Reason for rejection (optional)..."
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
                        disabled={isPending}
                    >
                        Confirm Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
