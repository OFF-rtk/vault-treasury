"use client";

import { Building2, ArrowUpRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiquidityOverviewProps {
    totalLiquidity: number;
    pendingExposure: number;
    currency?: string;
}

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export function LiquidityOverview({
    totalLiquidity,
    pendingExposure,
    currency = "USD"
}: LiquidityOverviewProps) {

    const projectedClose = totalLiquidity - pendingExposure;
    const exposurePercent = totalLiquidity > 0
        ? (pendingExposure / totalLiquidity) * 100
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

            {/* 1. Global Cash Position */}
            <div className="bg-slate-900 rounded-xl p-6 shadow-sm text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Building2 className="w-16 h-16 -mr-4 -mt-4" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <Building2 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            Global Liquidity
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold font-mono tracking-tighter">
                            {formatCurrency(totalLiquidity, currency)}
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">
                        Internal Balance
                    </p>
                </div>
            </div>

            {/* 2. Pending Exposure */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-500">
                        <ArrowUpRight className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            Pending Outflows
                        </span>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {exposurePercent.toFixed(1)}% of Cash
                    </span>
                </div>

                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono tracking-tighter text-slate-900">
                        {formatCurrency(pendingExposure, currency)}
                    </span>
                </div>

                {/* Visual Risk Bar */}
                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-500", exposurePercent > 50 ? "bg-red-500" : "bg-amber-500")}
                        style={{ width: `${Math.min(exposurePercent, 100)}%` }}
                    />
                </div>
            </div>

            {/* 3. Projected Close */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-500">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        Projected Close
                    </span>
                </div>

                <div className="flex items-baseline gap-2">
                    <span className={cn(
                        "text-3xl font-bold font-mono tracking-tighter",
                        projectedClose < 0 ? "text-red-600" : "text-emerald-600"
                    )}>
                        {formatCurrency(projectedClose, currency)}
                    </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    Net Position after approvals
                </p>
            </div>
        </div>
    );
}
