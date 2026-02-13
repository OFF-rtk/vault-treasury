'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ChallengeContextValue {
    isActive: boolean;
    challengeText: string;
    triggerChallenge: (text: string) => Promise<void>;
    resolveChallenge: () => void;
    rejectChallenge: () => void;
}

const ChallengeContext = createContext<ChallengeContextValue>({
    isActive: false,
    challengeText: '',
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
    const resolverRef = useRef<(() => void) | null>(null);
    const rejecterRef = useRef<(() => void) | null>(null);

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
            value={{ isActive, challengeText, triggerChallenge, resolveChallenge, rejectChallenge }}
        >
            {children}
        </ChallengeContext.Provider>
    );
}
