import { Injectable, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { CreateSignupDto } from './dto/create-signup.dto';

export interface SignupResponse {
    message: string;
    userId: string;
    status: 'pending';
}

@Injectable()
export class SignupsService {
    private readonly logger = new Logger(SignupsService.name);

    constructor(private readonly supabase: SupabaseService) { }

    async create(dto: CreateSignupDto): Promise<SignupResponse> {
        const client = this.supabase.getClient();

        // Create user in Supabase Auth
        this.logger.log(`Creating user: ${dto.email}`);

        const { data: authData, error: authError } = await client.auth.admin.createUser({
            email: dto.email,
            password: dto.password,
            email_confirm: true,
            user_metadata: {
                full_name: dto.fullName,
                department: dto.department || 'Unassigned',
            },
        });

        if (authError) {
            this.logger.error(`Auth error: ${authError.message}`);
            if (authError.message.includes('already registered')) {
                throw new ConflictException('Email already registered');
            }
            throw new InternalServerErrorException(`Auth failed: ${authError.message}`);
        }

        if (!authData.user) {
            throw new InternalServerErrorException('Failed to create user - no user returned');
        }

        this.logger.log(`Auth user created: ${authData.user.id}`);

        // Create entry in users table with treasurer role
        const { error: userError } = await client
            .from('users')
            .insert({
                id: authData.user.id,
                email: dto.email,
                role: 'treasurer',
            });

        if (userError) {
            this.logger.error(`Users table error: ${userError.message}`);
            // Rollback: delete auth user
            await client.auth.admin.deleteUser(authData.user.id);
            throw new InternalServerErrorException(`Profile failed: ${userError.message}`);
        }

        this.logger.log(`User profile created successfully`);

        // Create treasury_profiles entry manually (in case trigger doesn't exist)
        const { error: profileError } = await client
            .from('treasury_profiles')
            .insert({
                user_id: authData.user.id,
                full_name: dto.fullName,
                department: dto.department || 'Unassigned',
                status: 'pending',
            });

        if (profileError) {
            this.logger.warn(`Treasury profile error (may already exist via trigger): ${profileError.message}`);
            // Don't fail - trigger might have already created it
        }

        return {
            message: 'Account created. Pending admin approval.',
            userId: authData.user.id,
            status: 'pending',
        };
    }
}
