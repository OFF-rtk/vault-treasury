import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPayment } from '@/lib/actions/payments';
import { PaymentDetailClient } from '@/components/payments/PaymentDetail'; // Adjusted import path
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({ params }: PageProps) {
    const { id } = await params;

    let payment;
    try {
        payment = await fetchPayment(id);
    } catch (error) {
        notFound();
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Navigation Header */}
            <div>
                <Link href="/payments">
                    <Button variant="ghost" size="sm" className="pl-0 text-slate-500 hover:text-slate-900 hover:bg-transparent">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Queue
                    </Button>
                </Link>
            </div>

            <PaymentDetailClient payment={payment} />
        </div>
    );
}