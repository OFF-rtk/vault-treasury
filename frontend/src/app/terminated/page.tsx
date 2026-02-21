'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { ShieldAlert, LogOut, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/lib/auth/actions';

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function TerminatedContent() {
    const searchParams = useSearchParams();
    const expiresParam = parseInt(searchParams.get('expires') || '0', 10);
    const [remaining, setRemaining] = useState(Math.max(expiresParam, 0));
    const [expired, setExpired] = useState(expiresParam <= 0);

    // Calculate progress percentage (for circular indicator)
    const initialDuration = Math.max(expiresParam, 1);
    const progress = expired ? 100 : ((initialDuration - remaining) / initialDuration) * 100;

    useEffect(() => {
        if (remaining <= 0) {
            setExpired(true);
            return;
        }

        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    setExpired(true);
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [remaining]);

    return (
        <div className="min-h-dvh w-full flex items-center justify-center bg-slate-50 px-3 sm:px-4 py-8 relative overflow-x-hidden">

            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md relative z-10">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                    {/* Header: High Contrast Error */}
                    <div className={`${expired ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} border-b p-6 flex items-center gap-4 transition-colors duration-500`}>
                        <div className={`h-10 w-10 rounded-lg ${expired ? 'bg-emerald-100 border-emerald-200' : 'bg-red-100 border-red-200'} flex items-center justify-center flex-shrink-0 border transition-colors duration-500`}>
                            {expired
                                ? <CheckCircle className="h-5 w-5 text-emerald-700" />
                                : <ShieldAlert className="h-5 w-5 text-red-700" />
                            }
                        </div>
                        <div>
                            <h1 className={`text-lg font-bold ${expired ? 'text-emerald-950' : 'text-red-950'} tracking-tight transition-colors duration-500`}>
                                {expired ? 'Session Available' : 'Session Terminated'}
                            </h1>
                            <p className={`text-[10px] font-mono font-bold ${expired ? 'text-emerald-800' : 'text-red-800'} uppercase tracking-widest mt-0.5 transition-colors duration-500`}>
                                {expired ? 'BAN_EXPIRED' : 'ERR_ACCESS_REVOKED'}
                            </p>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Explanation */}
                        <div className="mb-6">
                            <p className="text-sm text-slate-700 font-medium mb-2">
                                {expired ? 'Access Restored' : 'Access Denied'}
                            </p>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {expired
                                    ? 'Your temporary ban has expired. You may now sign back in to continue using the system.'
                                    : 'Your session has been forcibly closed due to a security policy violation. All active tokens have been invalidated.'}
                            </p>
                        </div>

                        {/* Ban Timer */}
                        {!expired && expiresParam > 0 && (
                            <div className="mb-6 flex items-center justify-center">
                                <div className="relative flex items-center justify-center">
                                    {/* Circular Progress Background */}
                                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                                        <circle
                                            cx="60" cy="60" r="52"
                                            fill="none"
                                            stroke="#e2e8f0"
                                            strokeWidth="6"
                                        />
                                        <circle
                                            cx="60" cy="60" r="52"
                                            fill="none"
                                            stroke="#ef4444"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 52}`}
                                            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                                            className="transition-all duration-1000 ease-linear"
                                        />
                                    </svg>
                                    {/* Timer Text */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <Clock className="w-3.5 h-3.5 text-slate-400 mb-1" />
                                        <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                                            {formatTime(remaining)}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                                            remaining
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action */}
                        <form action={logoutAction}>
                            <Button
                                type="submit"
                                className={`w-full font-medium h-10 shadow-sm ${expired
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                    } transition-colors duration-500`}
                            >
                                {expired
                                    ? <><LogOut className="w-4 h-4 mr-2" /> Return to Login</>
                                    : <><LogOut className="w-4 h-4 mr-2" /> Acknowledge &amp; Sign Out</>
                                }
                            </Button>
                        </form>
                    </div>

                    {/* Static Footer */}
                    <div className="bg-slate-50 border-t border-slate-100 p-3 text-center">
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                            Vault Security Protocol
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TerminatedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse text-slate-400">Loading...</div>
            </div>
        }>
            <TerminatedContent />
        </Suspense>
    );
}