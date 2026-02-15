'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot,
    Play,
    Square,
    Save,
    Activity,
    Clock,
    DollarSign,
    Settings2,
    Zap,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChallengeAction } from '@/hooks/useChallengeAction';
import {
    ErpSimulatorConfig,
    startSimulator,
    stopSimulator,
    updateErpConfig,
} from '@/lib/actions/erp-simulator';

// ─── Relative time helper ─────────────────────────────────

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return 'Never';

    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// ─── Main Component ───────────────────────────────────────

interface ErpSimulatorPanelProps {
    initialConfig: ErpSimulatorConfig;
}

export function ErpSimulatorPanel({ initialConfig }: ErpSimulatorPanelProps) {
    const [config, setConfig] = useState(initialConfig);
    const [intervalInput, setIntervalInput] = useState(String(config.interval_seconds));
    const [minInput, setMinInput] = useState(String(config.min_amount));
    const [maxInput, setMaxInput] = useState(String(config.max_amount));
    const [configError, setConfigError] = useState<string | null>(null);
    const [lastGeneratedTime, setLastGeneratedTime] = useState(
        timeAgo(config.last_generated_at),
    );

    // Live relative-time ticker
    useEffect(() => {
        const interval = setInterval(() => {
            setLastGeneratedTime(timeAgo(config.last_generated_at));
        }, 5000);
        return () => clearInterval(interval);
    }, [config.last_generated_at]);

    // Poll config while active for live stats
    useEffect(() => {
        if (!config.is_active && !config.is_running) return;
        const interval = setInterval(async () => {
            try {
                const { fetchErpConfig } = await import('@/lib/actions/erp-simulator');
                const fresh = await fetchErpConfig();
                setConfig(fresh);
                setLastGeneratedTime(timeAgo(fresh.last_generated_at));
            } catch {
                // silent
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [config.is_active, config.is_running]);

    // Detect config drift (has user changed the inputs?)
    const hasChanges =
        intervalInput !== String(config.interval_seconds) ||
        minInput !== String(config.min_amount) ||
        maxInput !== String(config.max_amount);

    // ─── Sentinel-gated actions ────────────────────────────

    const { execute: execStart, isLoading: startLoading } = useChallengeAction({
        action: startSimulator,
        onSuccess: (result) => setConfig(result),
        onError: (err) => setConfigError(err.message),
    });

    const { execute: execStop, isLoading: stopLoading } = useChallengeAction({
        action: stopSimulator,
        onSuccess: (result) => setConfig(result),
        onError: (err) => setConfigError(err.message),
    });

    const { execute: execUpdate, isLoading: updateLoading } = useChallengeAction({
        action: updateErpConfig,
        onSuccess: (result) => {
            setConfig(result);
            setIntervalInput(String(result.interval_seconds));
            setMinInput(String(result.min_amount));
            setMaxInput(String(result.max_amount));
            setConfigError(null);
        },
        onError: (err) => setConfigError(err.message),
    });

    const handleSaveConfig = useCallback(() => {
        const interval = parseInt(intervalInput, 10);
        const min = parseFloat(minInput);
        const max = parseFloat(maxInput);

        if (isNaN(interval) || interval < 5) {
            setConfigError('Interval must be at least 5 seconds');
            return;
        }
        if (isNaN(min) || min < 100) {
            setConfigError('Minimum amount must be at least $100');
            return;
        }
        if (isNaN(max) || max < 100) {
            setConfigError('Maximum amount must be at least $100');
            return;
        }
        if (min >= max) {
            setConfigError('Min amount must be less than Max amount');
            return;
        }

        setConfigError(null);
        execUpdate({ interval_seconds: interval, min_amount: min, max_amount: max });
    }, [intervalInput, minInput, maxInput, execUpdate]);

    const isActive = config.is_active || config.is_running;
    const isToggling = startLoading || stopLoading;

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className={`h-14 w-14 rounded-xl flex items-center justify-center transition-colors duration-300 ${isActive
                                    ? 'bg-emerald-50 border border-emerald-200'
                                    : 'bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <Bot
                                className={`h-7 w-7 transition-colors duration-300 ${isActive ? 'text-emerald-600' : 'text-slate-400'
                                    }`}
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-lg font-semibold text-slate-900">ERP Agent</h2>
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-300 ${isActive
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                                        }`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                            }`}
                                    />
                                    {isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Automated payment generation for treasury workflow testing
                            </p>
                        </div>
                    </div>

                    <Button
                        variant={isActive ? 'destructive' : 'default'}
                        size="lg"
                        onClick={() => (isActive ? execStop() : execStart())}
                        disabled={isToggling}
                        className="min-w-[120px]"
                    >
                        {isActive ? (
                            <>
                                <Square className="h-4 w-4 mr-2" />
                                Stop
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Start
                            </>
                        )}
                    </Button>
                </div>

                {/* Sentinel Security Notice */}
                <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 flex items-start gap-2.5">
                    <Zap className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Start, stop, and configuration changes are protected by{' '}
                        <span className="font-medium text-slate-700">Sentinel behavioral security</span>.
                        A verification challenge may be triggered if unusual activity is detected.
                    </p>
                </div>
            </motion.div>

            {/* Statistics Card */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="flex items-center gap-2 mb-5">
                    <Activity className="h-4 w-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Generation Statistics
                    </h3>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Payments Generated
                        </p>
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {config.payments_generated.toLocaleString()}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Last Generated
                        </p>
                        <p className="text-2xl font-bold text-slate-900">
                            {lastGeneratedTime}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Interval
                        </p>
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {config.interval_seconds}s
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Configuration Card */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="flex items-center gap-2 mb-5">
                    <Settings2 className="h-4 w-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Configuration
                    </h3>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label
                            htmlFor="erp-interval"
                            className="text-xs font-medium text-slate-500 flex items-center gap-1.5"
                        >
                            <Clock className="h-3.5 w-3.5" />
                            Interval (seconds)
                        </Label>
                        <Input
                            id="erp-interval"
                            type="number"
                            min={5}
                            value={intervalInput}
                            onChange={(e) => setIntervalInput(e.target.value)}
                            className="tabular-nums"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="erp-min"
                            className="text-xs font-medium text-slate-500 flex items-center gap-1.5"
                        >
                            <DollarSign className="h-3.5 w-3.5" />
                            Min Amount
                        </Label>
                        <Input
                            id="erp-min"
                            type="number"
                            min={100}
                            value={minInput}
                            onChange={(e) => setMinInput(e.target.value)}
                            className="tabular-nums"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="erp-max"
                            className="text-xs font-medium text-slate-500 flex items-center gap-1.5"
                        >
                            <DollarSign className="h-3.5 w-3.5" />
                            Max Amount
                        </Label>
                        <Input
                            id="erp-max"
                            type="number"
                            min={100}
                            value={maxInput}
                            onChange={(e) => setMaxInput(e.target.value)}
                            className="tabular-nums"
                        />
                    </div>
                </div>

                {/* Error display */}
                <AnimatePresence>
                    {configError && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 flex items-center gap-2"
                        >
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700">{configError}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Save button */}
                <div className="mt-5 flex justify-end">
                    <Button
                        variant="outline"
                        onClick={handleSaveConfig}
                        disabled={!hasChanges || updateLoading}
                        className="min-w-[160px]"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Save Configuration
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
