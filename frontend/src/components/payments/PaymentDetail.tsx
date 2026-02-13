"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Check,
    X,
    Clock,
    ShieldCheck,
    AlertTriangle,
    Building2,
    ArrowRight,
    Landmark,
    Calendar,
    User,
    FileText,
    Ban
} from "lucide-react";
import { approvePayment, rejectPayment } from "@/lib/actions/payments";
import type { PaymentWithActions, PaymentAction } from "@/lib/actions/payments";
import { cn } from "@/lib/utils";
import { ApproveDialog, RejectDialog } from "./PaymentDialogs";
import { useChallengeAction } from "@/hooks/useChallengeAction";

// --- Helpers ---
function formatAmount(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(dateStr));
}

function maskAccountNumber(num: string): string {
    if (num.length <= 4) return num;
    return "****" + num.slice(-4);
}

// --- Minimalist Visual Configs ---
// Note: No background colors (bg-), just text and dots.
const statusConfig: Record<string, { label: string; color: string; text: string }> = {
    pending: { label: "Pending Review", color: "bg-amber-500", text: "text-amber-700" },
    approved: { label: "Approved", color: "bg-emerald-500", text: "text-emerald-700" },
    rejected: { label: "Rejected", color: "bg-red-500", text: "text-red-700" },
};

const priorityConfig: Record<string, { label: string; text: string }> = {
    urgent: { label: "Urgent Priority", text: "text-red-700" },
    high: { label: "High Priority", text: "text-orange-700" },
    normal: { label: "Normal Priority", text: "text-blue-700" },
    low: { label: "Low Priority", text: "text-slate-500" },
};

export function PaymentDetailClient({ payment }: { payment: PaymentWithActions }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

    const status = statusConfig[payment.status] || statusConfig.pending;
    const priority = priorityConfig[payment.priority] || priorityConfig.normal;

    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: payment.currency || 'USD',
        minimumFractionDigits: 2,
    }).format(payment.amount);

    // Challenge-aware actions
    const { execute: challengeApprove } = useChallengeAction({
        action: approvePayment,
        onSuccess: () => router.refresh(),
        onError: (err) => console.error('Approve failed:', err),
    });

    const { execute: challengeReject } = useChallengeAction({
        action: rejectPayment,
        onSuccess: () => router.refresh(),
        onError: (err) => console.error('Reject failed:', err),
    });

    const handleApproveConfirm = () => {
        setApproveOpen(false);
        startTransition(async () => {
            try {
                await challengeApprove(payment.id);
                router.refresh();
            } catch (error) {
                console.error("Failed to approve:", error);
            }
        });
    };

    const handleRejectConfirm = (reason: string) => {
        setRejectOpen(false);
        startTransition(async () => {
            try {
                await challengeReject(payment.id, reason);
                router.refresh();
            } catch (error) {
                console.error("Failed to reject:", error);
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT COLUMN: Financial Ticket */}
            <div className="lg:col-span-2 space-y-6">

                {/* 1. Header Card (Clean, No Pills) */}
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            {/* Priority Text (No Badge) */}
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", priority.text)}>
                                {priority.label}
                            </p>
                            <h1 className="text-4xl font-bold text-slate-900 tracking-tight tabular-nums">
                                {formatAmount(payment.amount, payment.currency)}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="font-mono text-sm text-slate-500">
                                    Ref: {payment.reference_number}
                                </span>
                            </div>
                        </div>

                        {/* Status Dot (No Badge) */}
                        <div className="flex items-center gap-2 mt-1">
                            <div className={cn("w-2 h-2 rounded-full animate-pulse", status.color)} />
                            <span className={cn("text-sm font-bold tracking-tight", status.text)}>
                                {status.label}
                            </span>
                        </div>
                    </div>

                    {/* Action Bar (Only if Pending) */}
                    {payment.status === "pending" && (
                        <div className="pt-6 border-t border-slate-100 flex gap-4">
                            <Button
                                onClick={() => setApproveOpen(true)}
                                disabled={isPending}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium h-10 shadow-sm"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Approve Transfer
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setRejectOpen(true)}
                                disabled={isPending}
                                className="px-8 border-slate-200 text-slate-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>

                {/* 2. Route Details */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {/* FROM */}
                        <div className="p-6 space-y-4 bg-slate-50/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-3 h-3" /> Source
                            </p>
                            <div>
                                <p className="text-base font-semibold text-slate-900">
                                    {payment.from_account?.account_name}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 font-mono">
                                    <Landmark className="w-3 h-3 text-slate-400" />
                                    <span>{payment.from_account?.bank_name}</span>
                                    <span className="text-slate-300">/</span>
                                    <span>{maskAccountNumber(payment.from_account?.account_number || "")}</span>
                                </div>
                            </div>
                        </div>

                        {/* TO */}
                        <div className="p-6 space-y-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ArrowRight className="w-3 h-3" /> Beneficiary
                            </p>
                            <div>
                                <p className="text-base font-semibold text-slate-900">
                                    {payment.to_account?.account_name}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 font-mono">
                                    <Landmark className="w-3 h-3 text-slate-400" />
                                    <span>{payment.to_account?.bank_name}</span>
                                    <span className="text-slate-300">/</span>
                                    <span>{maskAccountNumber(payment.to_account?.account_number || "")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="bg-white px-6 py-5 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1.5">Purpose Code</p>
                            <p className="text-sm text-slate-700 font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-300" />
                                {payment.purpose}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1.5">Date Submitted</p>
                            <p className="text-sm text-slate-700 font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-300" />
                                {formatDate(payment.created_at)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rejection Alert */}
                {payment.rejection_reason && (
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 flex gap-4 items-start">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">Transaction Blocked</h3>
                            <p className="text-sm text-slate-600 mt-1 italic">
                                "{payment.rejection_reason}"
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Audit Log */}
            <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-full">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Audit Trail
                    </h3>

                    <div className="relative border-l border-slate-200 ml-3 space-y-8 pb-2">
                        {payment.actions?.map((action: PaymentAction, idx: number) => (
                            <TimelineItem key={action.id || idx} action={action} />
                        ))}

                        {/* Origin Point */}
                        <div className="relative pl-8">
                            <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-slate-300 bg-white" />
                            <div className="flex flex-col">
                                <p className="text-xs font-medium text-slate-500">Request Created</p>
                                <span className="text-[10px] text-slate-400 mt-0.5">by {payment.created_by}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shared Dialogs */}
            <ApproveDialog
                open={approveOpen}
                onOpenChange={setApproveOpen}
                referenceNumber={payment.reference_number}
                amount={formattedAmount}
                onConfirm={handleApproveConfirm}
                isPending={isPending}
            />
            <RejectDialog
                open={rejectOpen}
                onOpenChange={setRejectOpen}
                onConfirm={handleRejectConfirm}
                isPending={isPending}
            />
        </div>
    );
}

// --- Minimalist Timeline Item ---
function TimelineItem({ action }: { action: PaymentAction }) {
    const isSentinel = action.action_type.includes('sentinel') || action.action_type.includes('challenge');
    const isRejection = action.action_type === 'rejected';
    const isApproval = action.action_type === 'approved';

    let icon = <Clock className="w-3 h-3 text-slate-500" />;
    let ringColor = "border-slate-300";

    if (isSentinel) {
        icon = <ShieldCheck className="w-3 h-3 text-blue-600" />;
        ringColor = "border-blue-400";
    } else if (isApproval) {
        icon = <Check className="w-3 h-3 text-emerald-600" />;
        ringColor = "border-emerald-500";
    } else if (isRejection) {
        icon = <X className="w-3 h-3 text-red-600" />;
        ringColor = "border-red-500";
    }

    const performedBy = (action as any).performed_by_name || action.performed_by;

    return (
        <div className="relative pl-8">
            {/* The Dot (Hollow Ring style for cleaner look) */}
            <div className={cn(
                "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 flex items-center justify-center bg-white z-10",
                ringColor
            )}>
                {/* No icon inside dot for ultra-minimalism, or keep tiny icon if preferred. Keeping tiny icon for clarity. */}
                {/* Actually, let's remove the icon from INSIDE the dot and put it next to text for cleaner look? 
                    No, let's keep the icon but make the dot white bg. */}
                <div className="scale-75">{icon}</div>
            </div>

            <div>
                <p className="text-sm font-semibold text-slate-900 capitalize flex items-center gap-2">
                    {action.action_type.replace(/_/g, " ")}
                </p>

                <div className="flex flex-col gap-0.5 mt-1">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        {performedBy}
                    </span>
                    <span className="text-[10px] text-slate-300">
                        {(action as any).performed_at ? formatDate((action as any).performed_at) : "Just now"}
                    </span>
                </div>

                {action.notes && (
                    <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                        "{action.notes}"
                    </p>
                )}

                {/* Sentinel Score (Slim Bar) */}
                {action.sentinel_score !== undefined && action.sentinel_score !== null && (
                    <div className="mt-3">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Risk Score</span>
                            <span className="text-[10px] font-mono text-slate-600">{Number(action.sentinel_score).toFixed(2)}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full", Number(action.sentinel_score) > 0.8 ? "bg-emerald-500" : "bg-amber-500")}
                                style={{ width: `${Number(action.sentinel_score) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}