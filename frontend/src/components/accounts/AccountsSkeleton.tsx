export function AccountsSkeleton() {
    return (
        <div>
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-6">
                <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
            </div>

            {/* Card Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
                    >
                        {/* Header section */}
                        <div className="p-5 pb-4">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-slate-200 animate-pulse" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-3 w-48 bg-slate-100 rounded animate-pulse" />
                                </div>
                            </div>

                            {/* Balance */}
                            <div className="mb-4">
                                <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse mb-2" />
                                <div className="h-7 w-40 bg-slate-200 rounded animate-pulse mb-1" />
                                <div className="h-2.5 w-8 bg-slate-100 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* Limits section */}
                        <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50 space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="h-2.5 w-16 bg-slate-200 rounded animate-pulse" />
                                <div className="h-3 w-28 bg-slate-200 rounded animate-pulse" />
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full animate-pulse" />
                            <div className="flex justify-between items-center">
                                <div className="h-2.5 w-20 bg-slate-200 rounded animate-pulse" />
                                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
