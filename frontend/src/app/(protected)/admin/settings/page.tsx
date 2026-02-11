import { Bot, ArrowRight } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    ERP Simulator Agent
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Automated payment generation for testing and demonstration.
                </p>
            </div>

            {/* Placeholder */}
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-20 w-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-6">
                    <Bot className="h-10 w-10 text-slate-400" />
                </div>

                <h2 className="text-lg font-semibold text-slate-700 mb-2">
                    Coming Soon — Module 6
                </h2>
                <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                    The ERP Simulator Agent will generate realistic payment requests
                    at configurable intervals. Toggle on/off, set rate and amount
                    ranges, and monitor generation status — all Sentinel-gated.
                </p>

                <div className="mt-8 flex items-center gap-2 text-xs text-slate-300 font-mono">
                    <span>BullMQ Worker</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>@nestjs/schedule</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>Payment Queue</span>
                </div>
            </div>
        </div>
    );
}
