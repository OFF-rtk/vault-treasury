import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../database/redis.service';

export interface SentinelEvaluateResponse {
    decision: 'ALLOW' | 'CHALLENGE' | 'BLOCK';
    risk: number;
    mode: string;
    challenge_text?: string;
    ban_expires_in_seconds?: number;
}

export interface EvaluateParams {
    sessionId: string;
    endpoint: string;
    method: string;
    actionType: string;
    resourceTarget: string;
    role: string;
    deviceId?: string;
}

export const CHALLENGE_TEXTS = [
    'The quick brown fox jumps over the lazy dog near the riverbank today',
    'Security protocols require continuous verification of user identity now',
    'Please type this sentence to verify your behavioral signature pattern',
    'Advanced threat detection systems monitor keystroke dynamics carefully',
    'Every transaction in the treasury system requires proper authorization',
    'Behavioral biometrics provide a seamless layer of invisible security',
    'Financial systems demand rigorous authentication to protect all assets',
    'Continuous identity verification ensures only authorized users proceed',
    'Modern security infrastructure relies on behavioral patterns for trust',
    'Keystroke timing analysis creates a unique fingerprint for every person',
    'Treasury operations require multi-factor authentication at every level',
    'Automated threat detection scans for anomalous user behavior patterns',
    'Digital identity verification protects sensitive financial transactions',
    'Real-time behavioral analysis adapts to evolving cybersecurity threats',
    'Secure access management prevents unauthorized financial system access',
    'Biometric authentication layers strengthen enterprise security posture',
    'Typing rhythm analysis detects impersonation attempts in real time now',
    'Institutional grade security frameworks protect high value transactions',
    'Anomaly detection systems flag deviations from established user patterns',
    'Comprehensive security auditing tracks every action within the platform',
];

@Injectable()
export class SentinelService {
    private readonly sentinelUrl: string;
    private readonly logger = new Logger(SentinelService.name);

    constructor(
        private configService: ConfigService,
        private redisService: RedisService,
    ) {
        this.sentinelUrl =
            this.configService.get<string>('SENTINEL_API_URL') || 'http://localhost:8001';
    }

    /**
     * Initialize a sentinel session in Redis (called on first request).
     */
    async initSession(
        sessionId: string,
        userId: string,
        clientIp: string,
        userAgent: string,
    ): Promise<void> {
        await this.redisService.initSentinelSession(sessionId, userId, clientIp, userAgent);
    }

    /**
     * Proxy keyboard events to Sentinel ML.
     * Batch_id validation is handled by Sentinel ML (single source of truth).
     */
    async streamKeyboard(
        sessionId: string,
        userId: string,
        batchId: number,
        events: any[],
    ): Promise<void> {
        this.logger.log(
            `KB stream: session=${sessionId} batch=${batchId} events=${events.length}`,
        );
        try {
            const response = await fetch(`${this.sentinelUrl}/stream/keyboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    user_id: userId,
                    batch_id: batchId,
                    events,
                }),
            });

            this.logger.log(`KB stream response: status=${response.status}`);

            if (response.status === 400) {
                const err = await response.json().catch(() => ({}));
                this.logger.warn(`KB stream 400: ${JSON.stringify(err)}`);
                if (err?.detail?.includes('Duplicate')) {
                    throw new Error('REPLAY_DETECTED');
                }
            }

            if (response.status >= 500) {
                const errText = await response.text().catch(() => '');
                this.logger.error(`KB stream 5xx: ${errText}`);
            }
        } catch (error) {
            if ((error as Error).message === 'REPLAY_DETECTED') throw error;
            this.logger.warn(`Keyboard stream proxy failed: ${error}`);
        }
    }

    /**
     * Proxy mouse events to Sentinel ML.
     * Batch_id validation is handled by Sentinel ML (single source of truth).
     */
    async streamMouse(
        sessionId: string,
        userId: string,
        batchId: number,
        events: any[],
    ): Promise<void> {
        try {
            const response = await fetch(`${this.sentinelUrl}/stream/mouse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    user_id: userId,
                    batch_id: batchId,
                    events,
                }),
            });

            if (response.status === 400) {
                const err = await response.json().catch(() => ({}));
                if (err?.detail?.includes('Duplicate')) {
                    throw new Error('REPLAY_DETECTED');
                }
            }
        } catch (error) {
            if ((error as Error).message === 'REPLAY_DETECTED') throw error;
            this.logger.warn(`Mouse stream proxy failed: ${error}`);
        }
    }

    /**
     * Evaluate behavioral risk via Sentinel ML.
     * Builds the full payload from Redis session state.
     */
    async evaluate(params: EvaluateParams): Promise<SentinelEvaluateResponse> {
        const session = await this.redisService.getSentinelSession(params.sessionId);
        if (!session) {
            this.logger.warn(`No session in Redis for ${params.sessionId}, fail-safe CHALLENGE`);
            return this.failSafeChallenge();
        }

        const mfaStatus = await this.redisService.getMfaStatus(session.user_id);

        try {
            const payload = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: params.sessionId,
                    request_context: {
                        ip_address: session.client_ip,
                        user_agent: session.user_agent,
                        endpoint: params.endpoint,
                        method: params.method,
                        user_id: session.user_id,
                    },
                    business_context: {
                        service: 'vault_treasury',
                        action_type: params.actionType,
                        resource_target: params.resourceTarget,
                    },
                    role: params.role,
                    mfa_status: mfaStatus,
                    session_start_time: parseInt(session.session_start_time, 10),
                    client_fingerprint: params.deviceId
                        ? { device_id: params.deviceId }
                        : undefined,
                }),
            };
            this.logger.log(`Evaluate payload: ${JSON.stringify(payload)}`);
            console.log(`Evaluate payload: ${JSON.stringify(payload)}`);
            const response = await fetch(`${this.sentinelUrl}/evaluate`, payload);
            console.log(`Evaluate response: ${JSON.stringify(response)}`);

            if (!response.ok) {
                throw new Error(`Sentinel API returned ${response.status}`);
            }

            const result = await response.json();
            this.logger.log(
                `Evaluate: session=${params.sessionId} action=${params.actionType} ` +
                `decision=${result.decision} risk=${result.risk}`,
            );

            // Attach challenge text if decision is CHALLENGE
            if (result.decision === 'CHALLENGE') {
                result.challenge_text = this.getRandomChallengeText();
            }

            // Refresh MFA idle TTL on ALLOW
            if (result.decision === 'ALLOW') {
                await this.redisService.refreshMfaIdle(session.user_id);
            }

            return result;
        } catch (error) {
            this.logger.error(`Sentinel evaluate failed: ${error}`);
            return this.failSafeChallenge();
        }
    }

    /**
     * Fail-safe: return CHALLENGE with random text when Sentinel is unreachable.
     */
    private failSafeChallenge(): SentinelEvaluateResponse {
        return {
            decision: 'CHALLENGE',
            risk: 0.5,
            mode: 'NORMAL',
            challenge_text: this.getRandomChallengeText(),
        };
    }

    getRandomChallengeText(): string {
        return CHALLENGE_TEXTS[Math.floor(Math.random() * CHALLENGE_TEXTS.length)];
    }
}
