"use client";

import { motion } from "framer-motion";

/**
 * SidebarSkeleton — Matches the exact layout of the real Sidebar
 * so the transition from skeleton → real is seamless.
 */
export function SidebarSkeleton() {
    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-50 text-slate-900 border-r border-slate-200 shadow-sm flex flex-col">
            {/* 1. Header */}
            <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-slate-50 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-200 skeleton" />
                    <div className="h-5 w-16 rounded bg-slate-200 skeleton" />
                </div>
            </div>

            {/* 2. Navigation Skeleton */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                {/* Operations Section */}
                <div className="space-y-1">
                    <div className="px-3 mb-2 h-3 w-20 rounded bg-slate-200 skeleton" />
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 rounded-md px-3 py-2"
                        >
                            <div className="h-4 w-4 rounded bg-slate-200 skeleton shrink-0" />
                            <div
                                className="h-4 rounded bg-slate-200 skeleton"
                                style={{ width: `${60 + i * 12}px` }}
                            />
                        </div>
                    ))}
                </div>

                {/* Admin Section (always show skeleton — will be hidden if not admin) */}
                <div className="space-y-1">
                    <div className="px-3 mb-2 h-3 w-28 rounded bg-slate-200 skeleton" />
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 rounded-md px-3 py-2"
                        >
                            <div className="h-4 w-4 rounded bg-slate-200 skeleton shrink-0" />
                            <div
                                className="h-4 rounded bg-slate-200 skeleton"
                                style={{ width: `${70 + i * 10}px` }}
                            />
                        </div>
                    ))}
                </div>
            </nav>

            {/* 3. Footer Skeleton */}
            <div className="border-t border-slate-200 bg-slate-100/50 p-4">
                <div className="flex items-center gap-3 p-2">
                    <div className="h-9 w-9 rounded-full bg-slate-200 skeleton shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-24 rounded bg-slate-200 skeleton" />
                        <div className="h-3 w-16 rounded bg-slate-200 skeleton" />
                    </div>
                </div>
            </div>
        </aside>
    );
}
