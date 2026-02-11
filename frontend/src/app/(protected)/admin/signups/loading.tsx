export default function SignupsLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="border-b border-slate-200 pb-5">
                <div className="h-7 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-72 bg-slate-100 rounded mt-2" />
            </div>

            {/* Cards skeleton */}
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                                <div className="h-5 w-40 bg-slate-200 rounded" />
                                <div className="h-3 w-56 bg-slate-100 rounded" />
                                <div className="flex gap-4">
                                    <div className="h-3 w-20 bg-slate-100 rounded" />
                                    <div className="h-3 w-24 bg-slate-100 rounded" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 w-20 bg-slate-100 rounded" />
                                <div className="h-8 w-24 bg-slate-200 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
