import { Injectable, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

export interface UserProfile {
    id: string;
    email: string;
    role: string;
    fullName: string;
    department: string | null;
    status: 'pending' | 'active' | 'deactivated';
}

export interface LoginResponse {
    accessToken: string;
    user: UserProfile;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(private readonly supabase: SupabaseService) { }

    async login(email: string, password: string): Promise<LoginResponse> {
        const client = this.supabase.getClient();

        this.logger.log(`Login attempt: ${email}`);

        // Authenticate with Supabase
        const { data: authData, error: authError } = await client.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !authData.user) {
            this.logger.error(`Auth error: ${authError?.message}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        this.logger.log(`Auth successful for user: ${authData.user.id}`);

        // Fetch user profile with treasury data
        const profile = await this.getProfile(authData.user.id);

        // Check if user is deactivated
        if (profile.status === 'deactivated') {
            throw new ForbiddenException('Account has been deactivated');
        }

        return {
            accessToken: authData.session.access_token,
            user: profile,
        };
    }

    async logout(userId: string): Promise<void> {
        // Sign out all sessions for this user
        await this.supabase.admin.signOut(userId);
    }

    async getProfile(userId: string): Promise<UserProfile> {
        const client = this.supabase.getClient();

        this.logger.log(`Fetching profile for: ${userId}`);

        // Fetch user from users table
        const { data: userData, error: userError } = await client
            .from('users')
            .select('id, email, role')
            .eq('id', userId)
            .single();

        if (userError) {
            this.logger.error(`Users table error: ${userError.message}`);
            throw new UnauthorizedException('User not found in users table');
        }

        if (!userData) {
            throw new UnauthorizedException('User not found');
        }

        // Fetch treasury profile
        const { data: profileData, error: profileError } = await client
            .from('treasury_profiles')
            .select('full_name, department, status')
            .eq('user_id', userId)
            .single();

        if (profileError) {
            this.logger.warn(`Treasury profile not found: ${profileError.message}`);
        }

        return {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            fullName: profileData?.full_name || 'Unknown',
            department: profileData?.department || null,
            status: profileData?.status || 'pending',
        };
    }
}
