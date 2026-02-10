import { PaymentsSkeleton } from '@/components/payments/PaymentsSkeleton';

/**
 * Next.js loading.tsx — automatically shown while
 * the payments page.tsx is fetching data server-side.
 */
export default function PaymentsLoading() {
    return <PaymentsSkeleton />;
}
