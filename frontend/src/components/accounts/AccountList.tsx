"use client";

import { AccountCard } from "./AccountCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Building2, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Account } from "@/lib/actions/accounts";
import { motion, AnimatePresence } from "framer-motion";

interface AccountListProps {
    accounts: Account[];
    total: number;
    page: number;
    totalPages: number;
}

export function AccountList({ accounts, total, page, totalPages }: AccountListProps) {
    const router = useRouter();

    const goToPage = (newPage: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set("page", String(newPage));
        router.push(`/accounts?${params.toString()}`);
    };

    // --- Empty State (Matched to PaymentList) ---
    if (accounts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-4 bg-white border border-dashed border-slate-300 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Briefcase className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">No accounts found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">
                    Internal accounts are created via database seeding. None are currently active.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Account Grid */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.05 } }
                }}
            >
                <AnimatePresence mode="popLayout">
                    {accounts.map((account) => (
                        <motion.div
                            key={account.id}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <AccountCard account={account} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Pagination Footer (Matched to PaymentList) */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                        Showing <span className="font-medium text-slate-900">{accounts.length}</span> of {total} accounts
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
        </>
    );
}