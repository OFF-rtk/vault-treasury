import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { PaymentFiltersDto } from './dto/payment.dto';

/**
 * Static exchange rates (all rates are TO USD).
 * To convert FROM currency A TO currency B:
 *   amount_in_B = amount_in_A * (rate_A_to_USD / rate_B_to_USD)
 */
const EXCHANGE_RATES_TO_USD: Record<string, number> = {
    USD: 1.0,
    EUR: 1.08,
    GBP: 1.27,
    INR: 0.012,
    JPY: 0.0067,
    CAD: 0.74,
    AUD: 0.65,
    CHF: 1.13,
    SGD: 0.75,
    AED: 0.27,
};

function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = EXCHANGE_RATES_TO_USD[fromCurrency.toUpperCase()];
    const toRate = EXCHANGE_RATES_TO_USD[toCurrency.toUpperCase()];

    if (!fromRate || !toRate) {
        // If rate unknown, treat as 1:1 (safe fallback for demo)
        return amount;
    }

    return amount * (fromRate / toRate);
}

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

        // "Recently Actioned" sort: order by latest action from payment_actions
        if (filters.sortBy === 'resolved_at') {
            return this.findAllByRecentAction(client, filters, page, limit, offset);
        }

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
     * Fetch payments ordered by most recent action from payment_actions table.
     * Actions like 'approved', 'rejected' surface first; pending (no action) sink to bottom.
     */
    private async findAllByRecentAction(
        client: any,
        filters: PaymentFiltersDto,
        page: number,
        limit: number,
        offset: number,
    ) {
        // 1. Get recent actions (excluding 'created') ordered by performed_at DESC
        const { data: actions, error: actionsError } = await client
            .from('payment_actions')
            .select('payment_id, performed_at')
            .in('action_type', ['approved', 'rejected', 'challenge_passed', 'challenge_failed'])
            .order('performed_at', { ascending: false });

        if (actionsError) {
            this.logger.error(`Failed to fetch payment actions: ${actionsError.message}`);
            throw new BadRequestException('Failed to fetch payment actions');
        }

        // 2. Deduplicate: keep only the latest action per payment
        const seen = new Set<string>();
        const orderedPaymentIds: string[] = [];
        for (const action of (actions || [])) {
            if (!seen.has(action.payment_id)) {
                seen.add(action.payment_id);
                orderedPaymentIds.push(action.payment_id);
            }
        }

        // 3. Fetch ALL payment IDs (for total count and to append un-actioned ones)
        let countQuery = client
            .from('payments')
            .select('id', { count: 'exact', head: false });

        if (filters.status) countQuery = countQuery.eq('status', filters.status);
        if (filters.priority) countQuery = countQuery.eq('priority', filters.priority);
        if (filters.dateFrom) countQuery = countQuery.gte('created_at', filters.dateFrom);
        if (filters.dateTo) countQuery = countQuery.lte('created_at', filters.dateTo);
        if (filters.search) countQuery = countQuery.ilike('reference_number', `%${filters.search}%`);

        const { data: allIds, count: totalCount, error: countError } = await countQuery;

        if (countError) {
            this.logger.error(`Failed to count payments: ${countError.message}`);
            throw new BadRequestException('Failed to fetch payments');
        }

        // 4. Build final ordered ID list: actioned first, then pending (by created_at desc)
        const allPaymentIds = new Set((allIds || []).map((p: any) => p.id));
        const filteredActionedIds = orderedPaymentIds.filter(id => allPaymentIds.has(id));
        const unactionedIds = (allIds || [])
            .map((p: any) => p.id)
            .filter((id: string) => !seen.has(id));

        const finalOrderedIds = [...filteredActionedIds, ...unactionedIds];
        const pageIds = finalOrderedIds.slice(offset, offset + limit);

        if (pageIds.length === 0) {
            return { payments: [], total: totalCount || 0, page, limit, totalPages: Math.ceil((totalCount || 0) / limit) };
        }

        // 5. Fetch full payment data for this page
        const { data: payments, error: paymentsError } = await client
            .from('payments')
            .select(`
                *,
                from_account:accounts!payments_from_account_id_fkey(id, account_name, account_number, bank_name, account_type, balance),
                to_account:accounts!payments_to_account_id_fkey(id, account_name, account_number, bank_name, account_type)
            `)
            .in('id', pageIds);

        if (paymentsError) {
            this.logger.error(`Failed to fetch payments: ${paymentsError.message}`);
            throw new BadRequestException('Failed to fetch payments');
        }

        // 6. Re-sort to match the ordered IDs (Supabase .in() doesn't preserve order)
        const paymentMap = new Map((payments || []).map((p: any) => [p.id, p]));
        const sortedPayments = pageIds
            .map(id => paymentMap.get(id))
            .filter(Boolean);

        return {
            payments: sortedPayments,
            total: totalCount || 0,
            page,
            limit,
            totalPages: Math.ceil((totalCount || 0) / limit),
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
     * 1. Enforces per-transaction and daily limits (with auto-reset)
     * 2. Updates payment status + inserts action record
     * 3. Increments daily usage + deducts source account balance
     */
    async approve(id: string, userId: string, notes?: string) {
        const client = this.supabase.getClient();

        // Verify payment exists and is pending — also fetch amount, currency + source account
        const { data: payment, error: fetchError } = await client
            .from('payments')
            .select('id, status, amount, currency, from_account_id')
            .eq('id', id)
            .single();

        if (fetchError || !payment) {
            throw new NotFoundException(`Payment ${id} not found`);
        }

        if (payment.status !== 'pending') {
            throw new BadRequestException(`Payment is already ${payment.status}`);
        }

        // --- LIMIT ENFORCEMENT (before approving) ---
        let convertedAmount = Number(payment.amount);
        let sourceAccount: any = null;

        if (payment.from_account_id) {
            // Fetch source account for currency conversion
            const { data: acct } = await client
                .from('accounts')
                .select('id, balance, currency, account_name')
                .eq('id', payment.from_account_id)
                .single();
            sourceAccount = acct;

            // Convert payment amount to source account currency
            const paymentCurrency = payment.currency || 'USD';
            const accountCurrency = sourceAccount?.currency || 'USD';
            convertedAmount = convertCurrency(
                Number(payment.amount),
                paymentCurrency,
                accountCurrency,
            );

            this.logger.log(
                `Currency conversion: ${payment.amount} ${paymentCurrency} → ${convertedAmount.toFixed(2)} ${accountCurrency}`,
            );

            // Check per-transaction limit
            const { data: perTxnLimit } = await client
                .from('account_limits')
                .select('id, limit_amount')
                .eq('account_id', payment.from_account_id)
                .eq('limit_type', 'per_transaction')
                .single();

            if (perTxnLimit && convertedAmount > Number(perTxnLimit.limit_amount)) {
                const diff = parseFloat((convertedAmount - Number(perTxnLimit.limit_amount)).toFixed(2));
                throw new BadRequestException(
                    `LIMIT_EXCEEDED:per_transaction:${payment.from_account_id}:${parseFloat(convertedAmount.toFixed(2))}:${Number(perTxnLimit.limit_amount)}:${diff}:${sourceAccount?.currency || 'USD'}`,
                );
            }

            // Check daily limit (with auto-reset if past 24h)
            const { data: dailyLimit } = await client
                .from('account_limits')
                .select('id, limit_amount, current_usage, last_reset_at')
                .eq('account_id', payment.from_account_id)
                .eq('limit_type', 'daily')
                .single();

            if (dailyLimit) {
                const lastReset = new Date(dailyLimit.last_reset_at);
                const now = new Date();
                const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

                // Auto-reset if last reset was more than 24 hours ago
                if (hoursSinceReset >= 24) {
                    this.logger.log(
                        `Daily limit reset for account ${payment.from_account_id} (last reset: ${hoursSinceReset.toFixed(1)}h ago)`,
                    );
                    await client
                        .from('account_limits')
                        .update({
                            current_usage: 0,
                            last_reset_at: now.toISOString(),
                        })
                        .eq('id', dailyLimit.id);
                    dailyLimit.current_usage = 0;
                }

                const currentUsage = Number(dailyLimit.current_usage);
                const dailyCap = Number(dailyLimit.limit_amount);
                const projectedUsage = currentUsage + convertedAmount;

                if (projectedUsage > dailyCap) {
                    const remaining = Math.max(0, dailyCap - currentUsage);
                    const diff = parseFloat((convertedAmount - remaining).toFixed(2));
                    throw new BadRequestException(
                        `LIMIT_EXCEEDED:daily:${payment.from_account_id}:${parseFloat(convertedAmount.toFixed(2))}:${dailyCap}:${diff}:${sourceAccount?.currency || 'USD'}:${parseFloat(currentUsage.toFixed(2))}:${parseFloat(remaining.toFixed(2))}`,
                    );
                }
            }
        }

        // --- APPROVE (limits passed) ---
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

        // --- POST-APPROVAL: update usage + balance ---
        if (payment.from_account_id) {
            // Increment daily limit usage
            const { data: dailyLimit } = await client
                .from('account_limits')
                .select('id, current_usage')
                .eq('account_id', payment.from_account_id)
                .eq('limit_type', 'daily')
                .single();

            if (dailyLimit) {
                const newUsage = Number(dailyLimit.current_usage) + convertedAmount;
                await client
                    .from('account_limits')
                    .update({ current_usage: newUsage })
                    .eq('id', dailyLimit.id);
            }

            // Deduct balance from source account
            if (sourceAccount) {
                const newBalance = Number(sourceAccount.balance) - convertedAmount;
                await client
                    .from('accounts')
                    .update({ balance: newBalance })
                    .eq('id', sourceAccount.id);
            }
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
