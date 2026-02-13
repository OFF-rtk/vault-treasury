'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SentinelProvider, useSentinel } from '@/components/sentinel/SentinelProvider';
// FIX: Import Server Action statically at the top level
import { verifyBehavioral } from '@/lib/auth/actions';

const CHALLENGE_TEXTS = [
    'The quick brown fox jumps over the lazy dog near the riverbank today',
    'Security protocols require continuous verification of user identity now',
    'Please type this sentence to verify your behavioral signature pattern',
    'Advanced threat detection systems monitor keystroke dynamics carefully',
    'Every transaction in the treasury system requires proper authorization',
    'Behavioral biometrics provide a seamless layer of invisible security',
];

function VerifyContent() {
    const router = useRouter();
    // FIX: Extract sessionId from context to pass to the server action
    const { forceFlush, sessionId } = useSentinel();

    // Hydration safe random text
    const [challengeText, setChallengeText] = useState('');

    // Ensure challenge text is set only on client to avoid hydration mismatch
    useState(() => {
        setChallengeText(CHALLENGE_TEXTS[Math.floor(Math.random() * CHALLENGE_TEXTS.length)]);
    });

    const [typedText, setTypedText] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [verified, setVerified] = useState(false);

    const matchPercentage = challengeText.length > 0
        ? Math.round(
            (challengeText.split('').filter((char, i) => typedText[i] === char).length /
                challengeText.length) * 100,
        )
        : 0;

    const canVerify = typedText.length >= challengeText.length * 0.9 && matchPercentage >= 85;

    const handleVerify = useCallback(async () => {
        if (!sessionId) {
            setError('Session initialization failed. Please refresh.');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            // 1. Force flush remaining events to backend
            await forceFlush();

            // 2. Wait slightly for network propagation (prevent race condition)
            await new Promise((r) => setTimeout(r, 250));

            // 3. Call Server Action directly (no dynamic import needed)
            const result = await verifyBehavioral(sessionId);

            if (result.success) {
                setVerified(true);
                // Brief success animation then redirect
                setTimeout(() => router.push('/payments'), 800);
            } else if (result.challenge && result.challengeText) {
                // Sentinel ML flagged risk — re-prompt with new challenge text
                setChallengeText(result.challengeText);
                setTypedText('');
                setError(result.error || 'Additional verification required. Please type the new sentence.');
            } else {
                setError(result.error || 'Verification failed. Please try again.');
                setTypedText(''); // Clear text on failure to force re-typing
            }
        } catch (err) {
            console.error(err);
            setError('Connection failed. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    }, [forceFlush, sessionId, router]);

    // Prevent rendering until hydration is complete (challenge text)
    if (!challengeText) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-md mx-auto space-y-6"
        >
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-8 w-8 bg-slate-900 rounded flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <div className="h-4 w-4 bg-white rounded-full"></div>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        VAULT
                    </span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                    <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${verified
                            ? 'bg-emerald-50 dark:bg-emerald-900/20'
                            : 'bg-blue-50 dark:bg-blue-900/20'
                            }`}
                    >
                        {verified ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                            {verified ? 'Identity Verified' : 'Behavioral Verification'}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {verified
                                ? 'Redirecting to dashboard...'
                                : 'Step 2 of 2 — Type to verify your identity'}
                        </p>
                    </div>
                </div>
            </div>

            {verified ? (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/20 rounded-xl text-center"
                >
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Behavioral signature established
                    </p>
                </motion.div>
            ) : (
                <>
                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-md flex items-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Explanation */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            This system uses behavioral biometrics as a second factor of authentication.
                            Your typing pattern creates a unique signature that protects your session.
                            This is a{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                zero-trust security model
                            </span>{' '}
                            — every session must be verified.
                        </p>
                    </div>

                    {/* Challenge text with highlighting */}
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-2">
                            Type this sentence
                        </p>
                        <p className="text-sm font-medium leading-relaxed tracking-wide font-mono select-none">
                            {challengeText.split('').map((char, i) => {
                                let color = 'text-slate-400 dark:text-slate-600'; // Default untyped
                                if (i < typedText.length) {
                                    color =
                                        typedText[i] === char
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-red-500 dark:text-red-400';
                                } else {
                                    // Highlight the next character to type
                                    if (i === typedText.length) color = 'text-slate-900 dark:text-white underline decoration-blue-500 underline-offset-4';
                                }
                                return (
                                    <span key={i} className={color}>
                                        {char}
                                    </span>
                                );
                            })}
                        </p>
                    </div>

                    {/* Input */}
                    <textarea
                        autoFocus
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        placeholder="Start typing here..."
                        className="w-full h-24 p-4 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none resize-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                        onPaste={(e) => e.preventDefault()} // Security: Disable paste
                    />

                    {/* Progress */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full rounded-full transition-colors ${matchPercentage >= 85 ? 'bg-emerald-500' : 'bg-blue-500'
                                    }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(matchPercentage, 100)}%` }}
                                transition={{ duration: 0.2 }}
                            />
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums min-w-[3ch]">
                            {matchPercentage}%
                        </span>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleVerify}
                        disabled={!canVerify || isVerifying}
                        className="w-full h-11 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white font-medium shadow-lg shadow-slate-900/10 dark:shadow-blue-600/20 transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isVerifying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <ShieldCheck className="w-4 h-4" />
                                Verify Identity
                            </>
                        )}
                    </button>
                </>
            )}
        </motion.div>
    );
}

export default function VerifyPage() {
    return (
        <SentinelProvider>
            <VerifyContent />
        </SentinelProvider>
    );
}