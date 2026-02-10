import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { PaymentFiltersDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(private readonly supabase: SupabaseService) { }

    /**
     * List payments with filters and pagination.
     * Joins from_account and to_account for display names.
     */
    async findAll(filters: PaymentFiltersDto) {
        const client = this.supabase.getClient();
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const offset = (page - 1) * limit;

        let query = client
            .from('payments')
            .select(`
                *,
                from_account:accounts!payments_from_account_id_fkey(id, account_name, account_number, bank_name, account_type, balance),
                to_account:accounts!payments_to_account_id_fkey(id, account_name, account_number, bank_name, account_type)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.priority) {
            query = query.eq('priority', filters.priority);
        }

        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }

        if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo);
        }

        if (filters.search) {
            query = query.ilike('reference_number', `%${filters.search}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            this.logger.error(`Failed to fetch payments: ${error.message}`);
            throw new BadRequestException('Failed to fetch payments');
        }

        return {
            payments: data || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        };
    }

    /**
     * Get single payment with its action history.
     * Resolves user UUIDs to names from treasury_profiles.
     */
    async findOne(id: string) {
        const client = this.supabase.getClient();

        const { data: payment, error: paymentError } = await client
            .from('payments')
            .select(`
                *,
                from_account:accounts!payments_from_account_id_fkey(id, account_name, account_number, bank_name, account_type, balance),
                to_account:accounts!payments_to_account_id_fkey(id, account_name, account_number, bank_name, account_type)
            `)
            .eq('id', id)
            .single();

        if (paymentError || !payment) {
            throw new NotFoundException(`Payment ${id} not found`);
        }

        // Fetch action history
        const { data: actions, error: actionsError } = await client
            .from('payment_actions')
            .select('*')
            .eq('payment_id', id)
            .order('performed_at', { ascending: true });

        if (actionsError) {
            this.logger.warn(`Failed to fetch actions for payment ${id}: ${actionsError.message}`);
        }

        // Collect all unique user IDs to resolve names
        const userIds = new Set<string>();
        if (payment.resolved_by) userIds.add(payment.resolved_by);
        (actions || []).forEach((a) => {
            if (a.performed_by) userIds.add(a.performed_by);
        });

        // Batch-fetch names from treasury_profiles
        const nameMap: Record<string, string> = {};
        if (userIds.size > 0) {
            const { data: profiles } = await client
                .from('treasury_profiles')
                .select('user_id, full_name')
                .in('user_id', Array.from(userIds));

            (profiles || []).forEach((p) => {
                nameMap[p.user_id] = p.full_name;
            });
        }

        // Map names into actions
        const enrichedActions = (actions || []).map((a) => ({
            ...a,
            performed_by_name: nameMap[a.performed_by] || a.performed_by,
        }));

        return {
            ...payment,
            resolved_by_name: payment.resolved_by ? (nameMap[payment.resolved_by] || payment.resolved_by) : null,
            actions: enrichedActions,
        };
    }

    /**
     * Approve a pending payment.
     * Updates payment status, inserts action record.
     */
    async approve(id: string, userId: string, notes?: string) {
        const client = this.supabase.getClient();

        // Verify payment exists and is pending
        const { data: payment, error: fetchError } = await client
            .from('payments')
            .select('id, status')
            .eq('id', id)
            .single();

        if (fetchError || !payment) {
            throw new NotFoundException(`Payment ${id} not found`);
        }

        if (payment.status !== 'pending') {
            throw new BadRequestException(`Payment is already ${payment.status}`);
        }

        // Update payment status
        const { error: updateError } = await client
            .from('payments')
            .update({
                status: 'approved',
                resolved_by: userId,
                resolved_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (updateError) {
            this.logger.error(`Failed to approve payment ${id}: ${updateError.message}`);
            throw new BadRequestException('Failed to approve payment');
        }

        // Insert action record
        await client.from('payment_actions').insert({
            payment_id: id,
            action_type: 'approved',
            performed_by: userId,
            notes: notes || null,
        });

        this.logger.log(`Payment ${id} approved by ${userId}`);
        return { id, status: 'approved' };
    }

    /**
     * Reject a pending payment.
     * Updates payment status, inserts action record with reason.
     */
    async reject(id: string, userId: string, reason: string) {
        const client = this.supabase.getClient();

        // Verify payment exists and is pending
        const { data: payment, error: fetchError } = await client
            .from('payments')
            .select('id, status')
            .eq('id', id)
            .single();

        if (fetchError || !payment) {
            throw new NotFoundException(`Payment ${id} not found`);
        }

        if (payment.status !== 'pending') {
            throw new BadRequestException(`Payment is already ${payment.status}`);
        }

        // Update payment status
        const { error: updateError } = await client
            .from('payments')
            .update({
                status: 'rejected',
                resolved_by: userId,
                resolved_at: new Date().toISOString(),
                rejection_reason: reason,
            })
            .eq('id', id);

        if (updateError) {
            this.logger.error(`Failed to reject payment ${id}: ${updateError.message}`);
            throw new BadRequestException('Failed to reject payment');
        }

        // Insert action record
        await client.from('payment_actions').insert({
            payment_id: id,
            action_type: 'rejected',
            performed_by: userId,
            notes: reason,
        });

        this.logger.log(`Payment ${id} rejected by ${userId}`);
        return { id, status: 'rejected' };
    }
}
