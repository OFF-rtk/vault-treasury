"use client";

import { useOptimistic, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentCard } from "./PaymentCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { approvePayment, rejectPayment } from "@/lib/actions/payments";
import type { Payment } from "@/lib/actions/payments";
import { motion, AnimatePresence } from "framer-motion";
import { ApproveDialog, RejectDialog } from "./PaymentDialogs";

interface PaymentListProps {
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
}

export function PaymentList({ payments, total, page, totalPages }: PaymentListProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Optimistic UI
    const [optimisticPayments, setOptimisticPayments] = useOptimistic(
        payments,
        (state: Payment[], update: { id: string; status: "approved" | "rejected" }) =>
            state.map((p) =>
                p.id === update.id ? { ...p, status: update.status } : p
            )
    );

    // Approve State
    const [approveTarget, setApproveTarget] = useState<string | null>(null);

    // Reject State
    const [rejectTarget, setRejectTarget] = useState<string | null>(null);
    const [isActing, setIsActing] = useState(false);

    // --- Actions ---
    const handleApproveClick = (id: string) => {
        setApproveTarget(id);
    };

    const handleApproveConfirm = () => {
        if (!approveTarget) return;
        const targetId = approveTarget;

        setIsActing(true);
        setApproveTarget(null);
        startTransition(async () => {
            setOptimisticPayments({ id: targetId, status: "approved" });
            try {
                await approvePayment(targetId);
            } catch (error) {
                console.error("Failed to approve:", error);
                router.refresh();
            }
            setIsActing(false);
        });
    };

    const handleRejectClick = (id: string) => {
        setRejectTarget(id);
    };

    const handleRejectConfirm = (reason: string) => {
        if (!rejectTarget) return;
        const targetId = rejectTarget;

        setIsActing(true);
        setRejectTarget(null);
        startTransition(async () => {
            setOptimisticPayments({ id: targetId, status: "rejected" });
            try {
                await rejectPayment(targetId, reason);
            } catch (error) {
                console.error("Failed to reject:", error);
                router.refresh();
            }
            setIsActing(false);
        });
    };

    const goToPage = (newPage: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(newPage));
        router.push(`/payments?${params.toString()}`);
    };

    // --- Empty State ---
    if (optimisticPayments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-4 bg-white border border-dashed border-slate-300 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Inbox className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">No pending payments</h3>
                <p className="text-xs text-slate-500 mt-1">
                    New requests will appear here automatically.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* List Container */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {optimisticPayments.map((payment) => (
                        <motion.div
                            key={payment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                        >
                            <PaymentCard
                                payment={payment}
                                onApprove={handleApproveClick}
                                onReject={handleRejectClick}
                                isActing={isActing || isPending}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                        Showing <span className="font-medium text-slate-900">{optimisticPayments.length}</span> of {total} results
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-white"
                            onClick={() => goToPage(page - 1)}
                            disabled={page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <span className="text-xs font-mono font-medium text-slate-700 px-2">
                            Page {page} of {totalPages}
                        </span>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-white"
                            onClick={() => goToPage(page + 1)}
                            disabled={page >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Shared Dialogs */}
            <ApproveDialog
                open={!!approveTarget}
                onOpenChange={(open) => { if (!open) setApproveTarget(null); }}
                referenceNumber={approveTarget ? optimisticPayments.find(p => p.id === approveTarget)?.reference_number : undefined}
                amount={approveTarget ? (() => {
                    const p = optimisticPayments.find(p => p.id === approveTarget);
                    return p ? new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency || 'USD' }).format(p.amount) : '';
                })() : undefined}
                onConfirm={handleApproveConfirm}
                isPending={isActing}
            />
            <RejectDialog
                open={!!rejectTarget}
                onOpenChange={(open) => { if (!open) setRejectTarget(null); }}
                onConfirm={handleRejectConfirm}
                isPending={isActing}
            />
        </>
    );
}