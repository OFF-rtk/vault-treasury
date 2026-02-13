'use client';

import { useCallback, useState } from 'react';
import { useChallenge } from '@/components/sentinel/ChallengeProvider';
import { useSentinel } from '@/components/sentinel/SentinelProvider';

interface UseChallengeActionOptions<T extends (...args: any[]) => Promise<any>> {
    action: T;
    onSuccess?: (result: Awaited<ReturnType<T>>) => void;
    onError?: (error: Error) => void;
}

/**
 * Wraps a server action to handle CHALLENGE_REQUIRED errors.
 * When a 428 is received:
 *   1. Show the ChallengeModal
 *   2. Wait for user to complete typing
 *   3. Force-flush remaining events
 *   4. Wait 250ms for Sentinel to process
 *   5. Retry the original action
 */
export function useChallengeAction<T extends (...args: any[]) => Promise<any>>({
    action,
    onSuccess,
    onError,
}: UseChallengeActionOptions<T>) {
    const [isLoading, setIsLoading] = useState(false);
    const { triggerChallenge } = useChallenge();
    const { forceFlush } = useSentinel();

    const execute = useCallback(
        async (...args: Parameters<T>) => {
            setIsLoading(true);
            try {
                const result = await action(...args);
                onSuccess?.(result);
                return result;
            } catch (error: any) {
                const message = error?.message || '';

                // Check if this is a CHALLENGE_REQUIRED error
                if (message.startsWith('CHALLENGE_REQUIRED:')) {
                    const challengeText = message.replace('CHALLENGE_REQUIRED:', '').trim();

                    try {
                        // Show challenge modal and wait for completion
                        await triggerChallenge(challengeText);

                        // Force flush remaining events from the challenge typing
                        await forceFlush();

                        // Wait for Sentinel to process the newly streamed data
                        await new Promise((r) => setTimeout(r, 250));

                        // Retry the original action
                        const retryResult = await action(...args);
                        onSuccess?.(retryResult);
                        return retryResult;
                    } catch (challengeError) {
                        // User cancelled the challenge
                        onError?.(new Error('Verification cancelled'));
                    }
                } else {
                    onError?.(error);
                }
            } finally {
                setIsLoading(false);
            }
        },
        [action, triggerChallenge, forceFlush, onSuccess, onError],
    );

    return { execute, isLoading };
}
