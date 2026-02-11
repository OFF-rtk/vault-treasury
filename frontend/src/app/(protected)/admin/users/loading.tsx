export default function UsersLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="border-b border-slate-200 pb-5">
                <div className="h-7 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-64 bg-slate-100 rounded mt-2" />
            </div>

            {/* Count skeleton */}
            <div className="flex items-center gap-3">
                <div className="h-5 w-16 bg-slate-100 rounded-full" />
                <div className="h-5 w-24 bg-slate-100 rounded-full" />
            </div>

            {/* Table skeleton */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* Header row */}
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3 flex gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-3 w-20 bg-slate-200 rounded" />
                    ))}
                </div>
                {/* Data rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border-b border-slate-50 px-6 py-4 flex items-center gap-6">
                        <div className="flex-1 space-y-1.5">
                            <div className="h-4 w-32 bg-slate-200 rounded" />
                            <div className="h-3 w-48 bg-slate-100 rounded" />
                        </div>
                        <div className="h-4 w-20 bg-slate-100 rounded" />
                        <div className="h-5 w-16 bg-slate-100 rounded-full" />
                        <div className="h-5 w-16 bg-slate-100 rounded-full" />
                        <div className="h-3 w-20 bg-slate-100 rounded" />
                        <div className="h-7 w-24 bg-slate-100 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
