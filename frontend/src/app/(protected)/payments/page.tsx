import { Suspense } from 'react';
import { fetchPayments } from '@/lib/actions/payments';
import { PaymentList } from '@/components/payments/PaymentList';
import { PaymentFilters } from '@/components/payments/PaymentFilters';

interface PageProps {
    searchParams: Promise<{
        status?: string;
        priority?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        sortBy?: string;
        page?: string;
    }>;
}

export default async function PaymentsPage({ searchParams }: PageProps) {
    const params = await searchParams;

    const data = await fetchPayments({
        status: params.status,
        priority: params.priority,
        search: params.search,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        sortBy: params.sortBy,
        page: params.page ? parseInt(params.page) : 1,
    });

    return (
        <div className="space-y-6">
            {/* Header: Clean & Bold */}
            <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Payment Queue
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Review and process pending payment requests.
                </p>
            </div>

            {/* Filters: White Card "Pop" */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5">
                <Suspense fallback={<div className="h-12 bg-slate-50 animate-pulse rounded-lg" />}>
                    <PaymentFilters />
                </Suspense>
            </div>

            {/* The List */}
            <PaymentList
                payments={data.payments}
                total={data.total}
                page={data.page}
                totalPages={data.totalPages}
            />
        </div>
    );
}