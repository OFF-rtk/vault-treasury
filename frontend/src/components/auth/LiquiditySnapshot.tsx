'use client';

import { motion } from 'framer-motion';

export default function LiquiditySnapshotHero() {
    return (
        <div className="relative w-[460px] min-h-[320px] rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 overflow-hidden pointer-events-none select-none flex flex-col">

            {/* Header KPIs */}
            <div className="flex justify-between">
                <KPI label="Total Volume (30d)" value="$8.6M" tone="emerald" />
                <KPI label="Successful Routes" value="98.2%" tone="indigo" />
            </div>

            {/* Flow Trend */}
            <div className="mt-6">
                <div className="text-[11px] text-slate-500 mb-2">
                    Payment Flow Trend
                </div>

                <motion.svg viewBox="0 0 360 80" className="w-full h-20">
                    <motion.path
                        d="M0 55 C 60 50, 120 40, 180 45, 240 35, 300 38, 360 32"
                        fill="none"
                        stroke="rgb(99,102,241)"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2, ease: 'easeOut' }}
                    />
                </motion.svg>
            </div>

            {/* Payment Routes */}
            <div className="mt-6 space-y-2">
                <RouteRow label="Acme Corp → Nova Retail" value="$2.4M" width="70%" />
                <RouteRow label="Zenith Ltd → Orion Supplies" value="$1.9M" width="55%" />
                <RouteRow label="Pulse Commerce → Atlas Group" value="$1.1M" width="40%" />
            </div>

            {/* Divider */}
            <div className="my-4 h-px bg-slate-200/60 dark:bg-slate-800/60" />

            {/* Flow Status */}
            <div>
                <div className="mb-2 text-[11px] text-slate-500">
                    Flow Status
                </div>
                <div className="flex gap-3">
                    <StatusChip label="Settled" value="92%" tone="emerald" />
                    <StatusChip label="Pending" value="6%" tone="amber" />
                    <StatusChip label="At Risk" value="2%" tone="rose" />
                </div>
            </div>

            {/* Subtle Grid */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:56px_100%]" />
        </div>
    );
}

/* ---------- Subcomponents ---------- */

function KPI({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: 'emerald' | 'indigo';
}) {
    return (
        <div>
            <div className="text-[11px] text-slate-500">{label}</div>
            <div className={`text-lg font-semibold text-${tone}-500`}>
                {value}
            </div>
        </div>
    );
}

function RouteRow({
    label,
    value,
    width,
}: {
    label: string;
    value: string;
    width: string;
}) {
    return (
        <div className="flex items-center gap-3 text-[11px]">
            <div className="w-48 text-slate-500 truncate">{label}</div>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ width }}
                    className="h-full origin-left bg-emerald-500/70"
                />
            </div>
            <div className="w-14 text-right text-slate-600 dark:text-slate-400">
                {value}
            </div>
        </div>
    );
}

function StatusChip({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: 'emerald' | 'amber' | 'rose';
}) {
    return (
        <div className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[10px] font-mono">
            <span className="text-slate-500">{label}</span>
            <span className={`ml-2 text-${tone}-500`}>{value}</span>
        </div>
    );
}
