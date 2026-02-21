import { ReactNode } from 'react';
import LiquiditySnapshot from '@/components/auth/LiquiditySnapshot';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        // min-h-screen allows scrolling on narrow/short screens
        <div className="min-h-screen w-full flex bg-[var(--gray-50)] dark:bg-[var(--dark-bg)]">

            {/* Left Side: Auth Form */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-20 py-8 bg-white dark:bg-[var(--dark-bg)] z-10 border-r border-[var(--gray-200)] dark:border-[var(--dark-border)] overflow-y-auto">
                {children}
            </div>

            {/* Right Side: Visual Dashboard */}
            <div className="hidden lg:flex w-[55%] bg-slate-50 dark:bg-[#0B1120] relative items-center justify-center flex-col">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"></div>

                {/* The Component */}
                <div className="relative z-10 transform scale-100 xl:scale-110 transition-transform duration-500">
                    <LiquiditySnapshot />
                </div>

                {/* Text Context */}
                <div className="relative z-10 mt-12 text-center max-w-sm px-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                        Treasury Manager
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Monitor payment flows and authorized routes
                    </p>
                </div>
            </div>
        </div>
    );
}