import { Bot } from "lucide-react";
import { fetchErpConfig } from "@/lib/actions/erp-simulator";
import { ErpSimulatorPanel } from "@/components/admin/ErpSimulatorPanel";

export default async function SettingsPage() {
    const config = await fetchErpConfig();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            ERP Simulator Agent
                        </h1>
                        <p className="text-sm text-slate-500">
                            Automated payment generation for testing and demonstration.
                        </p>
                    </div>
                </div>
            </div>

            {/* Panel (Client Component) */}
            <ErpSimulatorPanel initialConfig={config} />
        </div>
    );
}
