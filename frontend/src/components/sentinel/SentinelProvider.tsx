'use client';

import React, { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';

interface SentinelContextValue {
    sessionId: string | null;
    forceFlush: () => Promise<void>;
}

const SentinelContext = createContext<SentinelContextValue>({
    sessionId: null,
    forceFlush: async () => { },
});

export const useSentinel = () => useContext(SentinelContext);

// Sensitive input types — skip keyboard capture on these
const SENSITIVE_TYPES = new Set(['password', 'tel', 'number']);

// Minimum delay between flushes (ms).
// Uses recursive setTimeout (not setInterval) to prevent overlapping flushes.
const FLUSH_DELAY = 300;

interface Props {
    children: React.ReactNode;
}

export function SentinelProvider({ children }: Props) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const kbBuffer = useRef<any[]>([]);
    const mouseBuffer = useRef<any[]>([]);
    const kbBatchId = useRef(0);
    const mouseBatchId = useRef(0);
    const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFlushing = useRef(false);

    // Generate session ID and stable device ID on mount
    useEffect(() => {
        const sid = crypto.randomUUID();
        setSessionId(sid);

        // Stable device_id — persists across sessions via localStorage
        let deviceId = localStorage.getItem('sentinel_device_id');
        if (!deviceId) {
            deviceId = crypto.randomUUID();
            localStorage.setItem('sentinel_device_id', deviceId);
        }

        // Set cookies (non-httpOnly so server actions can read them)
        document.cookie = `sentinel_session=${sid}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `sentinel_device_id=${deviceId}; path=/; max-age=31536000; SameSite=Lax`;

        return () => {
            document.cookie = 'sentinel_session=; path=/; max-age=0';
            // Don't clear device_id cookie on unmount — it's persistent
        };
    }, []);

    // Flush buffers to backend via Next.js API route proxies.
    // Serialized: only one flush runs at a time to prevent out-of-order batch_ids.
    const flush = useCallback(async () => {
        if (!sessionId || isFlushing.current) return;
        isFlushing.current = true;

        try {
            const kbEvents = kbBuffer.current.splice(0);
            const mouseEvents = mouseBuffer.current.splice(0);

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Sentinel-Session': sessionId,
            };

            // Flush keyboard events → NestJS → Sentinel ML /stream/keyboard
            if (kbEvents.length > 0) {
                kbBatchId.current += 1;
                try {
                    await fetch('/api/sentinel/stream/keyboard', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            batch_id: kbBatchId.current,
                            events: kbEvents,
                        }),
                    });
                } catch {
                    // Fire-and-forget — don't block UI
                }
            }

            // Flush mouse events → NestJS → Sentinel ML /stream/mouse
            if (mouseEvents.length > 0) {
                mouseBatchId.current += 1;
                try {
                    await fetch('/api/sentinel/stream/mouse', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            batch_id: mouseBatchId.current,
                            events: mouseEvents,
                        }),
                    });
                } catch {
                    // Fire-and-forget
                }
            }
        } finally {
            isFlushing.current = false;
        }
    }, [sessionId]);

    // Force flush — callable before verify/challenge retries
    const forceFlush = useCallback(async () => {
        await flush();
    }, [flush]);

    // Attach keyboard + mouse event listeners
    useEffect(() => {
        if (!sessionId) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLInputElement;
            if (el?.type && SENSITIVE_TYPES.has(el.type)) return;

            kbBuffer.current.push({
                key: e.key,
                event_type: 'DOWN',
                timestamp: performance.now(),
            });
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLInputElement;
            if (el?.type && SENSITIVE_TYPES.has(el.type)) return;

            kbBuffer.current.push({
                key: e.key,
                event_type: 'UP',
                timestamp: performance.now(),
            });
        };

        // Throttled mousemove (~16ms = 60fps)
        let lastMouseTime = 0;
        const handleMouseMove = (e: MouseEvent) => {
            const now = performance.now();
            if (now - lastMouseTime < 16) return;
            lastMouseTime = now;

            mouseBuffer.current.push({
                x: e.clientX,
                y: e.clientY,
                event_type: 'MOVE',
                timestamp: now,
            });
        };

        const handleClick = (e: MouseEvent) => {
            mouseBuffer.current.push({
                x: e.clientX,
                y: e.clientY,
                event_type: 'CLICK',
                timestamp: performance.now(),
            });
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('click', handleClick);

        // Recursive setTimeout — next flush only schedules AFTER current completes.
        // This prevents overlapping flushes that cause out-of-order batch_ids.
        const scheduleFlush = () => {
            flushTimeoutRef.current = setTimeout(async () => {
                await flush();
                scheduleFlush(); // Schedule next only after this one finishes
            }, FLUSH_DELAY);
        };
        scheduleFlush();

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('click', handleClick);
            if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
        };
    }, [sessionId, flush]);

    return (
        <SentinelContext.Provider value={{ sessionId, forceFlush }}>
            {children}
        </SentinelContext.Provider>
    );
}
