import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface SentinelSessionData {
    user_id: string;
    session_start_time: string;
    client_ip: string;
    user_agent: string;
    kb_last_batch_id: string;
    mouse_last_batch_id: string;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private redis: Redis;
    private readonly logger = new Logger(RedisService.name);

    private static readonly SENTINEL_SESSION_TTL = 1800;   // 30 minutes
    private static readonly MFA_ABSOLUTE_TTL = 43200;      // 12 hours
    private static readonly MFA_IDLE_TTL = 1800;           // 30 minutes

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL');
        if (!redisUrl) {
            throw new Error('Missing REDIS_URL environment variable.');
        }

        this.redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                return Math.min(times * 200, 2000);
            },
        });

        this.redis.on('connect', () => this.logger.log('✅ Redis connected'));
        this.redis.on('error', (err) => this.logger.error('Redis error:', err.message));
    }

    onModuleDestroy() {
        this.redis?.disconnect();
    }

    getClient(): Redis {
        return this.redis;
    }

    // ── Sentinel Session ──────────────────────────────────────────────

    /**
     * Create sentinel session in Redis if it doesn't already exist.
     * Stores user metadata captured from the real HTTP request headers.
     */
    async initSentinelSession(
        sessionId: string,
        userId: string,
        clientIp: string,
        userAgent: string,
    ): Promise<boolean> {
        const key = `client:sentinel:${sessionId}`;
        const exists = await this.redis.exists(key);
        if (exists) return false;

        await this.redis.hset(key, {
            user_id: userId,
            session_start_time: Date.now().toString(),
            client_ip: clientIp,
            user_agent: userAgent,
            kb_last_batch_id: '0',
            mouse_last_batch_id: '0',
        });
        await this.redis.expire(key, RedisService.SENTINEL_SESSION_TTL);
        return true;
    }

    /**
     * Get all fields from a sentinel session hash.
     */
    async getSentinelSession(sessionId: string): Promise<SentinelSessionData | null> {
        const key = `client:sentinel:${sessionId}`;
        const data = await this.redis.hgetall(key);
        if (!data || !data.user_id) return null;

        // Refresh TTL on every access (sliding window)
        await this.redis.expire(key, RedisService.SENTINEL_SESSION_TTL);
        return data as unknown as SentinelSessionData;
    }

    /**
     * Validate client-sent batch_id against the last accepted value.
     * Returns true if valid (strictly greater than last), false if replay.
     * Updates the stored value on success.
     */
    async validateBatchId(
        sessionId: string,
        stream: 'kb' | 'mouse',
        clientBatchId: number,
    ): Promise<boolean> {
        const key = `client:sentinel:${sessionId}`;
        const field = stream === 'kb' ? 'kb_last_batch_id' : 'mouse_last_batch_id';

        const lastRaw = await this.redis.hget(key, field);
        const lastBatchId = parseInt(lastRaw || '0', 10);

        if (clientBatchId <= lastBatchId) {
            this.logger.warn(
                `Replay detected: session=${sessionId} stream=${stream} ` +
                `client_batch=${clientBatchId} last_accepted=${lastBatchId}`,
            );
            return false;
        }

        await this.redis.hset(key, field, clientBatchId.toString());
        return true;
    }

    // ── MFA Status ────────────────────────────────────────────────────

    /**
     * Mark user as MFA-verified. Uses absolute TTL (12h).
     */
    async setMfaVerified(userId: string): Promise<void> {
        const key = `client:mfa:${userId}`;
        await this.redis.set(key, 'verified', 'EX', RedisService.MFA_ABSOLUTE_TTL);
    }

    /**
     * Check if user has a valid MFA verification.
     */
    async getMfaStatus(userId: string): Promise<'verified' | 'not_verified'> {
        const key = `client:mfa:${userId}`;
        const value = await this.redis.get(key);
        return value === 'verified' ? 'verified' : 'not_verified';
    }

    /**
     * Refresh the idle TTL on MFA. Called after each successful gated action.
     * Only sets if shorter than current TTL (won't extend past absolute).
     */
    async refreshMfaIdle(userId: string): Promise<void> {
        const key = `client:mfa:${userId}`;
        const currentTtl = await this.redis.ttl(key);

        // Only apply idle TTL if current remaining > idle threshold
        // (prevents extending past the absolute 12h expiry)
        if (currentTtl > RedisService.MFA_IDLE_TTL) {
            await this.redis.expire(key, RedisService.MFA_IDLE_TTL);
        }
    }
}
