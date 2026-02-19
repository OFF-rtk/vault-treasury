'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useChallenge } from './ChallengeProvider';

export function ChallengeModal() {
    const { isActive, challengeText, resolveChallenge, rejectChallenge } = useChallenge();
    const [typedText, setTypedText] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTypedText(e.target.value);
    }, []);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        toast.error('Security requirement: Please type the text manually.');
    }, []);

    const matchPercentage = challengeText.length > 0
        ? Math.round(
            (challengeText.split('').filter((char, i) => typedText[i] === char).length /
                challengeText.length) * 100,
        )
        : 0;

    const canVerify = typedText.length >= challengeText.length * 0.9 && matchPercentage >= 85;

    const handleVerify = useCallback(async () => {
        setIsVerifying(true);
        // Small delay to let the last events flush
        await new Promise((r) => setTimeout(r, 150));
        setTypedText('');
        setIsVerifying(false);
        resolveChallenge();
    }, [resolveChallenge]);

    const handleCancel = useCallback(() => {
        setTypedText('');
        rejectChallenge();
    }, [rejectChallenge]);

    if (!isActive) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                    <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Behavioral Verification
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Type the sentence below to verify your identity
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="h-4 w-4 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Challenge text */}
                    <div className="px-6 py-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed tracking-wide font-mono">
                                {challengeText.split('').map((char, i) => {
                                    let color = 'text-slate-700 dark:text-slate-300'; // default
                                    if (i < typedText.length) {
                                        color = typedText[i] === char
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-red-500 dark:text-red-400';
                                    }
                                    return (
                                        <span key={i} className={color}>
                                            {char}
                                        </span>
                                    );
                                })}
                            </p>
                        </div>

                        <textarea
                            autoFocus
                            value={typedText}
                            onChange={handleChange}
                            onPaste={handlePaste}
                            placeholder="Start typing..."
                            className="w-full h-24 p-4 text-sm font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none resize-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                        />

                        {/* Progress bar */}
                        <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${matchPercentage >= 85 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(matchPercentage, 100)}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums min-w-[3ch]">
                                {matchPercentage}%
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6 flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="flex-1 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleVerify}
                            disabled={!canVerify || isVerifying}
                            className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck className="h-4 w-4" />
                                    Verify
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
