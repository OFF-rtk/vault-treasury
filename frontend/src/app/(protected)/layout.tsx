import { ReactNode, Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarSkeleton } from '@/components/layout/SidebarSkeleton';
import { requireAuth } from '@/lib/auth/actions';
import { SentinelWrapper } from './SentinelWrapper';

/**
 * Async server component that fetches user data.
 */
async function SidebarWrapper() {
    const user = await requireAuth();
    return <Sidebar user={user} />;
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
    return (
        // 1. Background Color: Slate-100 (Light Mode) / Slate-950 (Dark Mode)
        // This provides the "subtle distinction" from the Sidebar (Slate-50)
        <div className="flex min-h-screen bg-slate-100 dark:bg-black">

            {/* 2. Sidebar (Suspended) */}
            <Suspense fallback={<SidebarSkeleton />}>
                <SidebarWrapper />
            </Suspense>

            {/* 3. Main Content Area with Sentinel + Challenge wrappers */}
            <main className="flex-1 ml-0 md:ml-64">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 pt-16 md:pt-10 pb-6 md:pb-10">
                    <SentinelWrapper>
                        {children}
                    </SentinelWrapper>
                </div>
            </main>
        </div>
    );
}