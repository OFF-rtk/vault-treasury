import { Controller, Post, Get, Body, UseGuards, Request, Headers, HttpCode, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { AuthService, LoginResponse, UserProfile } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SentinelService } from '../sentinel/sentinel.service';
import { RedisService } from '../database/redis.service';
import { SupabaseService } from '../database/supabase.service';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(
        private readonly authService: AuthService,
        private readonly sentinelService: SentinelService,
        private readonly redisService: RedisService,
        private readonly supabaseService: SupabaseService,
    ) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req): Promise<{ message: string }> {
        await this.authService.logout(req.user.userId);
        return { message: 'Logged out successfully' };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req): Promise<UserProfile> {
        return this.authService.getProfile(req.user.userId);
    }

    /**
     * Behavioral step-up verification.
     * Called from /verify page after user types the challenge sentence.
     *
     * After confirming that streaming data was received (session exists in Redis),
     * calls Sentinel ML's /evaluate endpoint via SentinelService to get a risk
     * assessment. The evaluate payload matches exactly what SentinelGuard sends:
     *   - session_id, request_context (ip, ua, endpoint, method, user_id),
     *     business_context (service, action_type, resource_target),
     *     role, mfa_status, session_start_time, client_fingerprint
     *
     * Decision handling:
     *   - ALLOW  → set MFA verified, return { verified: true }
     *   - CHALLENGE → return { verified: false, challenge: true, challengeText }
     *   - BLOCK  → terminate Supabase session, return 401
     */
    @Post('verify')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async verifyBehavioral(
        @Request() req: any,
        @Headers('x-sentinel-session') sessionId: string,
    ): Promise<{ verified: boolean; challenge?: boolean; challengeText?: string }> {
        const userId = req.user.userId;
        const role = req.user.role || 'user';

        if (!sessionId) {
            return { verified: false };
        }

        // Initialize session in Redis if not already
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        await this.sentinelService.initSession(sessionId, userId, clientIp, userAgent);

        // Verify that Sentinel has received streaming data for this session
        // (the session existing in Redis means /stream/keyboard was called)
        const session = await this.redisService.getSentinelSession(sessionId);
        if (!session) {
            this.logger.warn(`No streaming data found for session ${sessionId}`);
            return { verified: false };
        }

        // Evaluate behavioral risk via Sentinel ML.
        // Uses the same EvaluateParams structure as SentinelGuard:
        //   SentinelService.evaluate() builds the full payload from Redis session data
        //   (ip_address, user_agent, session_start_time, mfa_status) — no mocked values.
        const deviceId = req.headers['x-device-id'] || undefined;
        const result = await this.sentinelService.evaluate({
            sessionId,
            endpoint: '/api/auth/verify',
            method: 'POST',
            actionType: 'verify_behavioral',
            resourceTarget: userId,
            role,
            deviceId,
        });

        switch (result.decision) {
            case 'ALLOW':
                // Set MFA verified in Redis (12h absolute TTL)
                await this.redisService.setMfaVerified(userId);
                this.logger.log(
                    `MFA verified for user ${userId} (session ${sessionId}) risk=${result.risk}`,
                );
                return { verified: true };

            case 'CHALLENGE':
                this.logger.warn(
                    `CHALLENGE during verify: user=${userId} session=${sessionId} risk=${result.risk}`,
                );
                return {
                    verified: false,
                    challenge: true,
                    challengeText: result.challenge_text || this.sentinelService.getRandomChallengeText(),
                };

            case 'BLOCK':
                this.logger.error(
                    `BLOCK during verify: user=${userId} session=${sessionId} risk=${result.risk}`,
                );
                // Terminate user's Supabase session (same as SentinelGuard)
                try {
                    await this.supabaseService.admin.signOut(userId);
                } catch (err) {
                    this.logger.error(`Failed to terminate session for ${userId}: ${err}`);
                }
                throw new HttpException(
                    { statusCode: 401, message: 'Session terminated by security system' },
                    HttpStatus.UNAUTHORIZED,
                );

            default:
                // Unknown decision — fail-safe CHALLENGE
                this.logger.warn(`Unknown decision during verify: ${result.decision}, fail-safe CHALLENGE`);
                return {
                    verified: false,
                    challenge: true,
                    challengeText: this.sentinelService.getRandomChallengeText(),
                };
        }
    }

    /**
     * Check MFA verification status for the current user.
     * Used by requireAuth() to decide whether to redirect to /verify.
     */
    @Get('mfa-status')
    @UseGuards(JwtAuthGuard)
    async getMfaStatus(@Request() req: any): Promise<{ status: string }> {
        const status = await this.redisService.getMfaStatus(req.user.userId);
        return { status };
    }
}
