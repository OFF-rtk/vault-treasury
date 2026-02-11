import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
            <div className="w-full max-w-md">

                {/* Main Card */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-10 text-center">

                        {/* 1. Icon */}
                        <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 border border-slate-200">
                            <FileQuestion className="h-8 w-8 text-slate-900" strokeWidth={1.5} />
                        </div>

                        {/* 2. The 404 (High Contrast) */}
                        <h1 className="text-6xl font-bold text-slate-900 tracking-tighter mb-2">
                            404
                        </h1>

                        {/* 3. Message */}
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">
                            Page Not Found
                        </h2>
                        <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">
                            The system could not locate the requested resource. It may have been moved or the URL is incorrect.
                        </p>

                        {/* 4. Single Action */}
                        <Link href="/payments" className="block w-full">
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-11 shadow-sm transition-all">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Return to Payments
                            </Button>
                        </Link>
                    </div>

                    {/* Technical Footer Strip */}
                    <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                            Error Code: ERR_NOT_FOUND
                        </p>
                    </div>
                </div>

                {/* System Watermark */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-400 font-mono font-medium">
                        VAULT TREASURY SYSTEM
                    </p>
                </div>
            </div>
        </div>
    );
}