import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * SentinelGuard — Mock implementation for protected routes.
 *
 * Apply this guard on sensitive endpoints (approve, reject, etc.).
 * Currently always returns true (ALLOW).
 *
 * TODO: Replace with actual Sentinel-ML /evaluate integration:
 *   - ALLOW → continue to handler
 *   - CHALLENGE → return 428 with { challenge_text }
 *   - BLOCK → invalidate Supabase session, return 401 + X-Session-Terminated
 */
@Injectable()
export class SentinelGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        // TODO: Replace with actual Sentinel evaluation (reference sentinel_middleware.md)
        // const request = context.switchToHttp().getRequest();
        // const sessionId = request.user?.userId;
        // const result = await this.sentinelService.evaluate(sessionId, actionType);
        // Handle ALLOW / CHALLENGE / BLOCK decisions
        return true;
    }
}
