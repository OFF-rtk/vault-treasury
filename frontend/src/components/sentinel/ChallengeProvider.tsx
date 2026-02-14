'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ProcessingState = 'idle' | 'processing' | 'success';

interface ChallengeContextValue {
    isActive: boolean;
    challengeText: string;
    processingState: ProcessingState;
    setProcessingState: (state: ProcessingState) => void;
    dismissProcessing: () => void;
    triggerChallenge: (text: string) => Promise<void>;
    resolveChallenge: () => void;
    rejectChallenge: () => void;
}

const ChallengeContext = createContext<ChallengeContextValue>({
    isActive: false,
    challengeText: '',
    processingState: 'idle',
    setProcessingState: () => { },
    dismissProcessing: () => { },
    triggerChallenge: async () => { },
    resolveChallenge: () => { },
    rejectChallenge: () => { },
});

export const useChallenge = () => useContext(ChallengeContext);

interface Props {
    children: React.ReactNode;
}

export function ChallengeProvider({ children }: Props) {
    const [isActive, setIsActive] = useState(false);
    const [challengeText, setChallengeText] = useState('');
    const [processingState, setProcessingStateInternal] = useState<ProcessingState>('idle');
    const resolverRef = useRef<(() => void) | null>(null);
    const rejecterRef = useRef<(() => void) | null>(null);

    const setProcessingState = useCallback((state: ProcessingState) => {
        setProcessingStateInternal(state);
    }, []);

    const dismissProcessing = useCallback(() => {
        setProcessingStateInternal('idle');
    }, []);

    const triggerChallenge = useCallback((text: string): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            setChallengeText(text);
            setIsActive(true);
            resolverRef.current = resolve;
            rejecterRef.current = reject;
        });
    }, []);

    const resolveChallenge = useCallback(() => {
        setIsActive(false);
        setChallengeText('');
        resolverRef.current?.();
        resolverRef.current = null;
        rejecterRef.current = null;
    }, []);

    const rejectChallenge = useCallback(() => {
        setIsActive(false);
        setChallengeText('');
        rejecterRef.current?.();
        resolverRef.current = null;
        rejecterRef.current = null;
    }, []);

    return (
        <ChallengeContext.Provider
            value={{ isActive, challengeText, processingState, setProcessingState, dismissProcessing, triggerChallenge, resolveChallenge, rejectChallenge }}
        >
            {children}
        </ChallengeContext.Provider>
    );
}
