'use client';

import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import { useChallenge } from '@/components/sentinel/ChallengeProvider';
import { useSentinel } from '@/components/sentinel/SentinelProvider';
import type { ChallengeResponse } from '@/lib/api/smart-fetch';

/**
 * Type guard — checks if a server action result is a challenge response.
 * Uses a structural check (__challenge: true) that survives Next.js
 * production serialization, unlike error.message parsing.
 */
function isChallengeResponse(result: unknown): result is ChallengeResponse {
    return (
        typeof result === 'object' &&
        result !== null &&
        '__challenge' in result &&
        (result as any).__challenge === true
    );
}

interface UseChallengeActionOptions<T extends (...args: any[]) => Promise<any>> {
    action: T;
    onSuccess?: (result: Awaited<ReturnType<T>>) => void;
    onError?: (error: Error) => void;
}

/**
 * Wraps a server action to handle CHALLENGE_REQUIRED responses.
 * When a 428 ChallengeResponse is returned:
 *   1. Show the ChallengeModal
 *   2. Wait for user to complete typing
 *   3. Force-flush remaining events
 *   4. Wait 500ms for Sentinel to process
 *   5. Retry the original action
 */
export function useChallengeAction<T extends (...args: any[]) => Promise<any>>({
    action,
    onSuccess,
    onError,
}: UseChallengeActionOptions<T>) {
    const [isLoading, setIsLoading] = useState(false);
    const { triggerChallenge, setProcessingState } = useChallenge();
    const { forceFlush } = useSentinel();

    const execute = useCallback(
        async (...args: Parameters<T>) => {
            setIsLoading(true);
            // flushSync forces React to render the processing modal immediately,
            // even inside a startTransition block
            flushSync(() => setProcessingState('processing'));
            try {
                const result = await action(...args);

                // Check if result is a ChallengeResponse (structured object, not thrown error)
                if (isChallengeResponse(result)) {
                    // Hide processing modal before showing challenge modal
                    setProcessingState('idle');

                    try {
                        // Show challenge modal and wait for completion
                        await triggerChallenge(result.challengeText);

                        // Force flush remaining events from the challenge typing
                        await forceFlush();

                        // Show processing modal during retry
                        flushSync(() => setProcessingState('processing'));

                        // Wait for Sentinel to process the newly streamed data
                        // (needs time: browser → NestJS → Sentinel ML → Redis)
                        await new Promise((r) => setTimeout(r, 500));

                        // Retry the original action
                        const retryResult = await action(...args);

                        // Check if retry also got challenged
                        if (isChallengeResponse(retryResult)) {
                            setProcessingState('idle');
                            onError?.(new Error('Behavioral data still processing. Please try again.'));
                            return null;
                        }

                        setProcessingState('success');
                        onSuccess?.(retryResult);
                        return retryResult;
                    } catch (challengeError: any) {
                        // User cancelled the challenge modal
                        setProcessingState('idle');
                        onError?.(new Error('Verification cancelled'));
                        return null;
                    }
                }

                // Normal success path
                setProcessingState('success');
                onSuccess?.(result);
                return result;
            } catch (error: any) {
                setProcessingState('idle');
                onError?.(error);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [action, triggerChallenge, forceFlush, setProcessingState, onSuccess, onError],
    );

    return { execute, isLoading };
}
