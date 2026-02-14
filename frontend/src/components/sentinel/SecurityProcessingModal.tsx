'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LockKeyhole, Check } from 'lucide-react';
import { useChallenge } from './ChallengeProvider';

/**
 * Full-screen overlay that appears while a Sentinel-guarded action is being
 * processed. Transitions to success state on ALLOW.
 */
export function SecurityProcessingModal() {
    const { processingState, dismissProcessing } = useChallenge();

    if (processingState === 'idle') return null;

    return (
        <AnimatePresence mode="wait">
            {/* ------------------- PROCESSING STATE ------------------- */}
            {processingState === 'processing' && (
                <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    // Changed bg-slate-50/80 -> bg-slate-50/60
                    // Changed backdrop-blur-sm -> backdrop-blur-[2px]
                    className="fixed inset-0 z-[45] flex items-center justify-center bg-slate-50/60 backdrop-blur-[2px]"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: -5 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="relative overflow-hidden flex flex-col items-center justify-center w-full max-w-[280px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
                    >
                        {/* Scanner Icon Container */}
                        <div className="relative h-14 w-14 mb-5 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                            {/* Static Icon */}
                            <LockKeyhole className="h-6 w-6 text-slate-400" strokeWidth={2} />

                            {/* Scanning Beam Animation */}
                            <motion.div
                                animate={{ top: ['-20%', '120%'] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                    ease: "linear"
                                }}
                                className="absolute left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                            />
                        </div>

                        <div className="space-y-1 text-center">
                            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                                Verifying Identity
                            </h3>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                Sentinel Analysis
                            </p>
                        </div>

                        {/* Aesthetic Footer Indicator */}
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-50" />
                    </motion.div>
                </motion.div>
            )}

            {/* ------------------- SUCCESS STATE ------------------- */}
            {processingState === 'success' && (
                <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    // Changed bg-slate-50/80 -> bg-slate-50/60
                    // Changed backdrop-blur-sm -> backdrop-blur-[2px]
                    className="fixed inset-0 z-[45] flex items-center justify-center bg-slate-50/60 backdrop-blur-[2px]"
                    onClick={dismissProcessing}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="flex flex-col items-center w-full max-w-[280px] p-8 bg-white rounded-2xl shadow-xl border border-slate-100 cursor-pointer"
                        onClick={dismissProcessing}
                    >
                        {/* Success Icon */}
                        <div className="h-14 w-14 mb-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                            >
                                <Check className="h-7 w-7 text-emerald-600" strokeWidth={3} />
                            </motion.div>
                        </div>

                        <div className="space-y-1 text-center mb-6">
                            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                                Authorized
                            </h3>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                Identity Confirmed
                            </p>
                        </div>

                        <button
                            onClick={dismissProcessing}
                            className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm tracking-wide"
                        >
                            Continue
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}