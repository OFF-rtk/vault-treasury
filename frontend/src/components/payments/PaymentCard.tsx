"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Check,
    X,
    ArrowRight,
    Building2,
    Ban,
    Landmark
} from "lucide-react";
import type { Payment } from "@/lib/actions/payments";

// --- Formatting Helpers ---
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
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(dateStr));
}

// --- Visual Configs (Minimalist) ---
const statusConfig = {
    pending: {
        label: "Pending Review",
        dotColor: "bg-amber-500",
        textColor: "text-amber-700"
    },
    approved: {
        label: "Approved",
        dotColor: "bg-emerald-500",
        textColor: "text-emerald-700"
    },
    rejected: {
        label: "Rejected",
        dotColor: "bg-red-500",
        textColor: "text-red-700"
    },
};

// Left Border Colors (The main priority indicator)
const priorityColors = {
    urgent: "bg-red-600",
    high: "bg-orange-500",
    normal: "bg-blue-600",
    low: "bg-slate-300",
};

// Text Color for the Priority Label
const priorityTextColors = {
    urgent: "text-red-700",
    high: "text-orange-700",
    normal: "text-blue-700",
    low: "text-slate-500",
};

interface PaymentCardProps {
    payment: Payment;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    isActing?: boolean;
}

export function PaymentCard({ payment, onApprove, onReject, isActing }: PaymentCardProps) {
    const status = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
    const isPending = payment.status === 'pending';

    const priorityKey = payment.priority as keyof typeof priorityColors;

    return (
        <div className="group relative bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col md:flex-row">

            {/* 1. Slim Priority Strip (Left Edge) - The only "loud" color */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1", priorityColors[priorityKey])} />

            {/* 2. Main Content */}
            <Link href={`/payments/${payment.id}`} className="flex-1 p-5 pl-7 cursor-pointer block">

                {/* Header: Ref ID | Priority Label | Date */}
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                        {/* Reference Number */}
                        <span className="font-mono text-[11px] font-semibold text-slate-700">
                            {payment.reference_number}
                        </span>

                        {/* Divider */}
                        <span className="text-slate-300 text-[10px]">•</span>

                        {/* Priority Text Label (No Badge) */}
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            priorityTextColors[priorityKey]
                        )}>
                            {payment.priority} Priority
                        </span>
                    </div>

                    {/* Minimalist Status (Dot + Text) */}
                    <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", status.dotColor)} />
                        <span className={cn("text-xs font-medium", status.textColor)}>
                            {status.label}
                        </span>
                    </div>
                </div>

                {/* Transaction Details */}
                <div className="flex items-end justify-between">
                    <div className="space-y-1">
                        {/* From -> To Flow */}
                        <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <span className="truncate max-w-[120px]">
                                    {payment.from_account?.account_name || 'Operating Account'}
                                </span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                            <div className="flex items-center gap-2 text-slate-900 font-semibold">
                                <span className="truncate max-w-[150px]">
                                    {payment.to_account?.account_name || 'Vendor / Client'}
                                </span>
                            </div>
                        </div>

                        {/* Purpose / Date */}
                        <div className="flex items-center gap-3 pl-6">
                            <p className="text-xs text-slate-400 truncate max-w-xs">
                                {payment.purpose}
                            </p>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <span className="text-xs text-slate-400 font-medium">
                                {formatDate(payment.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Clean Amount (No Badges nearby) */}
                    <div className="text-right">
                        <span className="block text-xl font-bold text-slate-900 tracking-tight tabular-nums">
                            {formatAmount(payment.amount, payment.currency)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {payment.currency}
                        </span>
                    </div>
                </div>
            </Link>

            {/* 3. Action Panel (Fixed Width) */}
            <div className="border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50/50 p-4 flex flex-col justify-center items-center gap-3 w-full md:w-[220px] shrink-0">

                {/* PENDING STATE */}
                {isPending && (
                    <>
                        <Button
                            size="sm"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm transition-all h-9"
                            onClick={(e) => {
                                e.stopPropagation();
                                onApprove(payment.id);
                            }}
                            disabled={isActing}
                        >
                            <Check className="w-3.5 h-3.5 mr-2" />
                            Approve
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50 h-8 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                onReject(payment.id);
                            }}
                            disabled={isActing}
                        >
                            <X className="w-3.5 h-3.5 mr-2" />
                            Reject
                        </Button>
                    </>
                )}

                {/* APPROVED STATE */}
                {!isPending && payment.status === 'approved' && (
                    <div className="flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-2 border border-slate-200 shadow-sm">
                            <Landmark className="w-5 h-5 text-slate-700" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                            Sent to Bank
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Processing
                        </span>
                    </div>
                )}

                {/* REJECTED STATE */}
                {!isPending && payment.status === 'rejected' && (
                    <div className="flex flex-col items-center justify-center text-center w-full px-2 animate-in fade-in duration-300">
                        <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center mb-2 border border-red-100">
                            <Ban className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">
                            Flagged
                        </span>
                        {payment.rejection_reason && (
                            <p className="text-[10px] leading-tight text-slate-500 line-clamp-2 italic px-1">
                                "{payment.rejection_reason}"
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}