import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { SentinelService } from './sentinel.service';
import { SupabaseService } from '../database/supabase.service';
import { RedisService } from '../database/redis.service';

/**
 * SentinelGuard — Behavioral biometric enforcement for sensitive actions.
 *
 * Applied on endpoints that require behavioral verification (approve, reject, etc.).
 * Evaluates the user's behavioral data via Sentinel ML and enforces:
 *   - ALLOW → continue to handler
 *   - CHALLENGE → return 428 with { challenge_text }
 *   - BLOCK → invalidate Supabase session, return 401 + X-Session-Terminated
 */
@Injectable()
export class SentinelGuard implements CanActivate {
    private readonly logger = new Logger(SentinelGuard.name);

    constructor(
        private readonly sentinelService: SentinelService,
        private readonly supabaseService: SupabaseService,
        private readonly redisService: RedisService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        const sessionId = request.headers['x-sentinel-session'];
        const userId = request.user?.userId;

        if (!sessionId || !userId) {
            this.logger.warn('Missing session or user ID, fail-safe CHALLENGE');
            throw new HttpException(
                {
                    statusCode: 428,
                    challenge_text: this.sentinelService.getRandomChallengeText(),
                },
                428,
            );
        }

        // Ensure session is initialized in Redis
        const clientIp =
            request.headers['x-forwarded-for'] ||
            request.ip ||
            'unknown';

        const userAgent = request.headers['user-agent'] || 'unknown';
        await this.sentinelService.initSession(sessionId, userId, clientIp, userAgent);

        // Build action context from the route
        const httpMethod = request.method;
        const routePath = request.route?.path || request.url;
        const actionType = this.extractActionType(routePath, httpMethod);
        const resourceTarget = request.params?.id || 'unknown';
        const role = request.user?.role || 'user';
        const deviceId = request.headers['x-device-id'] || undefined;

        // Evaluate via Sentinel ML
        const result = await this.sentinelService.evaluate({
            sessionId,
            endpoint: `/api${routePath}`,
            method: httpMethod,
            actionType,
            resourceTarget,
            role,
            deviceId,
        });

        switch (result.decision) {
            case 'ALLOW':
                this.logger.log(
                    `ALLOW: user=${userId} action=${actionType} risk=${result.risk}`,
                );
                return true;

            case 'CHALLENGE':
                this.logger.warn(
                    `CHALLENGE: user=${userId} action=${actionType} risk=${result.risk}`,
                );
                throw new HttpException(
                    {
                        statusCode: 428,
                        challenge_text: result.challenge_text,
                    },
                    428,
                );

            case 'BLOCK':
                this.logger.error(
                    `BLOCK: user=${userId} action=${actionType} risk=${result.risk}`,
                );
                // Terminate user's Supabase session
                try {
                    await this.supabaseService.admin.signOut(userId);
                } catch (err) {
                    this.logger.error(`Failed to terminate session for ${userId}: ${err}`);
                }
                // Set terminated header
                response.setHeader('X-Session-Terminated', 'true');
                throw new HttpException(
                    { statusCode: 401, message: 'Session terminated by security system' },
                    HttpStatus.UNAUTHORIZED,
                );

            default:
                this.logger.warn(`Unknown decision: ${result.decision}, fail-safe CHALLENGE`);
                throw new HttpException(
                    {
                        statusCode: 428,
                        challenge_text: this.sentinelService.getRandomChallengeText(),
                    },
                    428,
                );
        }
    }

    /**
     * Extract a human-readable action type from the route path.
     * e.g., /payments/:id/approve → approve_payment
     *       /admin/users/:id/deactivate → deactivate_user
     *       /accounts/:id/limits → update_account_limits
     */
    private extractActionType(routePath: string, method: string): string {
        const segments = routePath.split('/').filter(Boolean);
        // Remove :param segments
        const meaningful = segments.filter((s) => !s.startsWith(':'));

        if (meaningful.length >= 2) {
            const resource = meaningful[0]; // payments, admin, accounts
            const action = meaningful[meaningful.length - 1]; // approve, reject, limits
            return `${action}_${resource}`;
        }

        return `${method.toLowerCase()}_${meaningful.join('_') || 'unknown'}`;
    }
}
