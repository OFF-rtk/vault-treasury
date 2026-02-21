import Link from 'next/link';
import { Loader2, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/lib/auth/actions';

export default function UnderReviewPage() {
    return (
        <div className="min-h-dvh flex items-center justify-center bg-slate-50 px-4 py-8">
            <div className="w-full max-w-xs sm:max-w-md">

                {/* Status Card */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
                    {/* Status Strip */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />

                    <div className="p-8">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                                    Clearance Pending
                                </h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Queue Status: Active
                                </p>
                            </div>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-slate-600 leading-relaxed mb-6">
                            Your identity has been verified, but your account requires final authorization from a Treasury Administrator.
                        </p>

                        {/* ETA Box (Cleaned) */}
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-8 flex items-center gap-3">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Estimated Wait
                                </span>
                                <span className="text-xs font-mono font-medium text-slate-900">
                                    ~24 Hours
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                            <form action={logoutAction} className="w-full">
                                <Button
                                    type="submit"
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-10 shadow-sm"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Return to Login
                                </Button>
                            </form>
                            <p className="text-center text-[10px] text-slate-400">
                                Need urgent access? Contact your systems administrator.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}