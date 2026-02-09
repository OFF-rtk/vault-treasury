import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

export interface PendingUser {
    id: string;
    email: string;
    fullName: string;
    department: string | null;
    createdAt: string;
}

@Injectable()
export class AdminService {
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
                users!inner (
                    email
                )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error('Failed to fetch pending users');
        }

        return (data || []).map((profile: any) => ({
            id: profile.user_id,
            email: profile.users.email,
            fullName: profile.full_name,
            department: profile.department,
            createdAt: profile.created_at,
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
            throw new Error('User is not pending approval');
        }

        // Update status to active
        const { error: updateError } = await client
            .from('treasury_profiles')
            .update({ status: 'active' })
            .eq('user_id', userId);

        if (updateError) {
            throw new Error('Failed to approve user');
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
            throw new Error('Failed to reject user');
        }

        return { message: 'User rejected' };
    }
}
