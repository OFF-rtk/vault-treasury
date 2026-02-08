import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SentinelEvaluateResponse {
    decision: 'ALLOW' | 'CHALLENGE' | 'BLOCK';
    risk_score: number;
    trust_level: number;
    challenge_text?: string;
}

@Injectable()
export class SentinelService {
    private readonly sentinelUrl: string;

    constructor(private configService: ConfigService) {
        this.sentinelUrl = this.configService.get<string>('SENTINEL_API_URL') || 'http://localhost:8000';
    }

    /**
     * Evaluate a user's behavioral data for a sensitive action
     */
    async evaluate(sessionId: string, actionType: string): Promise<SentinelEvaluateResponse> {
        try {
            const response = await fetch(`${this.sentinelUrl}/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    action_type: actionType,
                }),
            });

            if (!response.ok) {
                throw new Error(`Sentinel API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Default to CHALLENGE on error (fail-safe)
            console.error('Sentinel API error:', error);
            return {
                decision: 'CHALLENGE',
                risk_score: 0.5,
                trust_level: 0.5,
                challenge_text: 'Please verify your identity by typing the following paragraph.',
            };
        }
    }
}
