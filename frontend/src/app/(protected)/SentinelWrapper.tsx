'use client';

import { ReactNode } from 'react';
import { SentinelProvider } from '@/components/sentinel/SentinelProvider';
import { ChallengeProvider } from '@/components/sentinel/ChallengeProvider';
import { ChallengeModal } from '@/components/sentinel/ChallengeModal';
import { SecurityProcessingModal } from '@/components/sentinel/SecurityProcessingModal';

/**
 * Client component wrapper that provides Sentinel event collection
 * and Challenge handling for all protected routes.
 *
 * Separated from the server layout because SentinelProvider and
 * ChallengeProvider use client-side hooks (useEffect, useState).
 */
export function SentinelWrapper({ children }: { children: ReactNode }) {
    return (
        <SentinelProvider>
            <ChallengeProvider>
                {children}
                <SecurityProcessingModal />
                <ChallengeModal />
            </ChallengeProvider>
        </SentinelProvider>
    );
}

