import { requireAdmin } from '@/lib/auth/actions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // Gate: only treasury_admin can access /admin/* pages
    await requireAdmin();

    return <>{children}</>;
}
