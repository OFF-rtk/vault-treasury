import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

export interface PendingUser {
    id: string;
    email: string;
    fullName: string;
    department: string | null;
    createdAt: string;
}

export interface TreasuryUser {
    id: string;
    email: string;
    fullName: string;
    department: string | null;
    role: string;
    status: string;
    createdAt: string;
    deactivatedAt: string | null;
}

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(private readonly supabase: SupabaseService) { }

    async getPendingUsers(): Promise<PendingUser[]> {
        const client = this.supabase.getClient();

        const { data, error } = await client
            .from('treasury_profiles')
            .select(`
                user_id,
                full_name,
                department,
                created_at,
                users!treasury_profiles_user_id_fkey!inner (
                    email
                )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            this.logger.error(`Failed to fetch pending users: ${error.message}`);
            throw new BadRequestException('Failed to fetch pending users');
        }

        return (data || []).map((profile: any) => ({
            id: profile.user_id,
            email: profile.users.email,
            fullName: profile.full_name,
            department: profile.department,
            createdAt: profile.created_at,
        }));
    }

    /**
     * Get all users (active + deactivated).
     * Fetches profiles from treasury_profiles, then resolves emails
     * via supabase.auth.admin.listUsers() (auth.users is protected).
     */
    async getAllUsers(): Promise<TreasuryUser[]> {
        const client = this.supabase.getClient();

        // 1. Fetch profiles with role from public.users
        const { data: profiles, error: profileError } = await client
            .from('treasury_profiles')
            .select(`
                user_id,
                full_name,
                department,
                status,
                created_at,
                deactivated_at,
                users!treasury_profiles_user_id_fkey!inner (
                    email,
                    role
                )
            `)
            .in('status', ['active', 'deactivated'])
            .order('created_at', { ascending: false });

        if (profileError) {
            this.logger.error(`Failed to fetch users: ${profileError.message}`);
            throw new BadRequestException('Failed to fetch users');
        }

        return (profiles || []).map((profile: any) => ({
            id: profile.user_id,
            email: profile.users.email,
            fullName: profile.full_name,
            department: profile.department,
            role: profile.users.role,
            status: profile.status,
            createdAt: profile.created_at,
            deactivatedAt: profile.deactivated_at,
        }));
    }

    async approveUser(userId: string, adminUserId: string): Promise<{ message: string }> {
        const client = this.supabase.getClient();

        // Check if user exists and is pending
        const { data: profile, error: fetchError } = await client
            .from('treasury_profiles')
            .select('status')
            .eq('user_id', userId)
            .single();

        if (fetchError || !profile) {
            throw new NotFoundException('User not found');
        }

        if (profile.status !== 'pending') {
            throw new BadRequestException('User is not pending approval');
        }

        // Update status to active
        const { error: updateError } = await client
            .from('treasury_profiles')
            .update({ status: 'active' })
            .eq('user_id', userId);

        if (updateError) {
            this.logger.error(`Failed to approve user: ${updateError.message}`);
            throw new BadRequestException('Failed to approve user');
        }

        return { message: 'User approved successfully' };
    }

    async rejectUser(userId: string, adminUserId: string): Promise<{ message: string }> {
        const client = this.supabase.getClient();

        // Update status to deactivated
        const { error: updateError } = await client
            .from('treasury_profiles')
            .update({
                status: 'deactivated',
                deactivated_at: new Date().toISOString(),
                deactivated_by: adminUserId,
            })
            .eq('user_id', userId);

        if (updateError) {
            this.logger.error(`Failed to reject user: ${updateError.message}`);
            throw new BadRequestException('Failed to reject user');
        }

        return { message: 'User rejected' };
    }

    async deactivateUser(userId: string, adminUserId: string): Promise<{ message: string }> {
        // Guard: admin cannot deactivate themselves
        if (userId === adminUserId) {
            throw new BadRequestException('Cannot deactivate your own account');
        }

        const client = this.supabase.getClient();

        // Check user exists and is active
        const { data: profile, error: fetchError } = await client
            .from('treasury_profiles')
            .select('status')
            .eq('user_id', userId)
            .single();

        if (fetchError || !profile) {
            throw new NotFoundException('User not found');
        }

        if (profile.status !== 'active') {
            throw new BadRequestException('User is not currently active');
        }

        // Deactivate
        const { error: updateError } = await client
            .from('treasury_profiles')
            .update({
                status: 'deactivated',
                deactivated_at: new Date().toISOString(),
                deactivated_by: adminUserId,
            })
            .eq('user_id', userId);

        if (updateError) {
            this.logger.error(`Failed to deactivate user: ${updateError.message}`);
            throw new BadRequestException('Failed to deactivate user');
        }

        return { message: 'User deactivated successfully' };
    }
}

