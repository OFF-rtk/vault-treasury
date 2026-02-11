import { ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/lib/auth/actions';

export default function TerminatedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">

            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                    {/* Header: High Contrast Error */}
                    <div className="bg-red-50 border-b border-red-100 p-6 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 border border-red-200">
                            <ShieldAlert className="h-5 w-5 text-red-700" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-red-950 tracking-tight">
                                Session Terminated
                            </h1>
                            <p className="text-[10px] font-mono font-bold text-red-800 uppercase tracking-widest mt-0.5">
                                ERR_ACCESS_REVOKED
                            </p>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Explanation */}
                        <div className="mb-8">
                            <p className="text-sm text-slate-700 font-medium mb-2">
                                Access Denied
                            </p>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Your session has been forcibly closed due to a security policy violation or administrative revocation. All active tokens have been invalidated.
                            </p>
                        </div>

                        {/* Action */}
                        <form action={logoutAction}>
                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-10 shadow-sm"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Acknowledge & Sign Out
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