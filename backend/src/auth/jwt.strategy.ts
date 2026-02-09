import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

export interface JwtPayload {
    sub: string;
    email: string;
    role?: string;
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService
    ) {
        const jwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');

        if (!jwtSecret) {
            throw new Error('SUPABASE_JWT_SECRET is not configured');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
        });
    }

    async validate(payload: JwtPayload) {

        const user = await this.authService.getProfile(payload.sub);
        // Attach user info to request
        return {
            userId: payload.sub,
            email: payload.email,
            role: user.role,
            status: user.status
        };
    }
}
