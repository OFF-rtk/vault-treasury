/**
 * PaymentsSkeleton — Loading skeleton for the payments list page.
 * Shows shimmer cards matching the PaymentCard layout.
 */
export function PaymentsSkeleton() {
    return (
        <>
            {/* Page Header Skeleton */}
            <div className="mb-6">
                <div className="h-7 w-48 rounded bg-slate-200 skeleton" />
                <div className="mt-2 h-4 w-72 rounded bg-slate-200 skeleton" />
            </div>

            {/* Filters Skeleton */}
            <div className="mb-6 flex items-center gap-3">
                <div className="h-9 w-[140px] rounded-md bg-slate-200 skeleton" />
                <div className="h-9 w-[140px] rounded-md bg-slate-200 skeleton" />
                <div className="h-9 w-[200px] rounded-md bg-slate-200 skeleton" />
            </div>

            {/* Payment Card Skeletons */}
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <PaymentCardSkeleton key={i} />
                ))}
            </div>
        </>
    );
}

function PaymentCardSkeleton() {
    return (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="h-4 w-28 rounded bg-slate-200 skeleton" />
                    <div className="h-5 w-16 rounded-full bg-slate-200 skeleton" />
                </div>
                <div className="h-5 w-20 rounded-full bg-slate-200 skeleton" />
            </div>

            {/* Card Body */}
            <div className="px-4 py-3 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <div className="h-3 w-8 rounded bg-slate-200 skeleton" />
                        <div className="h-4 w-32 rounded bg-slate-200 skeleton" />
                        <div className="h-3 w-20 rounded bg-slate-200 skeleton" />
                    </div>
                    <div className="space-y-1.5">
                        <div className="h-3 w-8 rounded bg-slate-200 skeleton" />
                        <div className="h-4 w-36 rounded bg-slate-200 skeleton" />
                        <div className="h-3 w-20 rounded bg-slate-200 skeleton" />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="h-3 w-12 rounded bg-slate-200 skeleton" />
                    <div className="h-6 w-28 rounded bg-slate-200 skeleton" />
                </div>

                <div className="h-4 w-3/4 rounded bg-slate-200 skeleton" />
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/30">
                <div className="h-3 w-36 rounded bg-slate-200 skeleton" />
                <div className="flex items-center gap-2">
                    <div className="h-8 w-20 rounded-md bg-slate-200 skeleton" />
                    <div className="h-8 w-24 rounded-md bg-slate-200 skeleton" />
                </div>
            </div>
        </div>
    );
}
