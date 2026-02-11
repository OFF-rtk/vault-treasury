import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { AccountFiltersDto, UpdateLimitsDto } from './dto/account.dto';

/**
 * Static exchange rates to USD for pending exposure conversion.
 * Mirrors the rates in payments.service.ts.
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

@Injectable()
export class AccountsService {
    private readonly logger = new Logger(AccountsService.name);

    constructor(private readonly supabase: SupabaseService) { }

    /**
     * Aggregate liquidity stats: total internal balances + pending outflow exposure.
     * Pending amounts are converted to USD using static exchange rates.
     */
    async getLiquidityStats() {
        const client = this.supabase.getClient();

        // Total internal account balances (all USD)
        const { data: accounts, error: accError } = await client
            .from('accounts')
            .select('balance')
            .eq('account_type', 'internal')
            .eq('is_active', true);

        if (accError) {
            this.logger.error(`Failed to fetch account balances: ${accError.message}`);
            throw new BadRequestException('Failed to fetch liquidity stats');
        }

        const totalLiquidity = (accounts || []).reduce(
            (sum: number, a: any) => sum + Number(a.balance), 0,
        );

        // Sum of pending payment amounts (converted to USD)
        const { data: payments, error: payError } = await client
            .from('payments')
            .select('amount, currency')
            .eq('status', 'pending');

        if (payError) {
            this.logger.error(`Failed to fetch pending payments: ${payError.message}`);
            throw new BadRequestException('Failed to fetch liquidity stats');
        }

        const pendingExposure = (payments || []).reduce(
            (sum: number, p: any) => {
                const rate = EXCHANGE_RATES_TO_USD[p.currency] || 1.0;
                return sum + (Number(p.amount) * rate);
            }, 0,
        );

        return { totalLiquidity, pendingExposure };
    }

    /**
     * List internal accounts with their limits.
     * External (vendor) accounts are excluded — they're reference data only.
     */
    async findAll(filters: AccountFiltersDto) {
        const client = this.supabase.getClient();
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const offset = (page - 1) * limit;

        const { data, error, count } = await client
            .from('accounts')
            .select(`
                *,
                limits:account_limits(id, limit_type, limit_amount, current_usage, last_reset_at, updated_at)
            `, { count: 'exact' })
            .eq('account_type', 'internal')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            this.logger.error(`Failed to fetch accounts: ${error.message}`);
            throw new BadRequestException('Failed to fetch accounts');
        }

        return {
            accounts: data || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        };
    }

    /**
     * Get single account with limits and recent payment activity.
     * Resolves user UUIDs to names from treasury_profiles.
     */
    async findOne(id: string) {
        const client = this.supabase.getClient();

        // Fetch account with limits
        const { data: account, error: accountError } = await client
            .from('accounts')
            .select(`
                *,
                limits:account_limits(id, limit_type, limit_amount, current_usage, last_reset_at, updated_at, updated_by)
            `)
            .eq('id', id)
            .eq('account_type', 'internal')
            .single();

        if (accountError || !account) {
            throw new NotFoundException(`Account ${id} not found`);
        }

        // Fetch recent payments involving this account (as source or destination)
        const { data: recentPayments, error: paymentsError } = await client
            .from('payments')
            .select(`
                id, reference_number, amount, currency, status, purpose, priority, created_at,
                from_account:accounts!payments_from_account_id_fkey(id, account_name, account_number),
                to_account:accounts!payments_to_account_id_fkey(id, account_name, account_number)
            `)
            .or(`from_account_id.eq.${id},to_account_id.eq.${id}`)
            .order('created_at', { ascending: false })
            .limit(10);

        if (paymentsError) {
            this.logger.warn(`Failed to fetch payments for account ${id}: ${paymentsError.message}`);
        }

        // Collect user IDs from limits to resolve names
        const userIds = new Set<string>();
        (account.limits || []).forEach((l: any) => {
            if (l.updated_by) userIds.add(l.updated_by);
        });

        const nameMap: Record<string, string> = {};
        if (userIds.size > 0) {
            const { data: profiles } = await client
                .from('treasury_profiles')
                .select('user_id, full_name')
                .in('user_id', Array.from(userIds));

            (profiles || []).forEach((p: any) => {
                nameMap[p.user_id] = p.full_name;
            });
        }

        // Enrich limits with updater names
        const enrichedLimits = (account.limits || []).map((l: any) => ({
            ...l,
            updated_by_name: l.updated_by ? (nameMap[l.updated_by] || l.updated_by) : null,
        }));

        return {
            ...account,
            limits: enrichedLimits,
            recentPayments: recentPayments || [],
        };
    }

    /**
     * Update account limits (daily and/or per-transaction).
     * At least one value must be provided.
     */
    async updateLimits(id: string, userId: string, dto: UpdateLimitsDto) {
        const client = this.supabase.getClient();

        if (!dto.daily && !dto.perTransaction) {
            throw new BadRequestException('At least one limit value must be provided');
        }

        // Verify account exists and is internal
        const { data: account, error: fetchError } = await client
            .from('accounts')
            .select('id, account_type')
            .eq('id', id)
            .single();

        if (fetchError || !account) {
            throw new NotFoundException(`Account ${id} not found`);
        }

        if (account.account_type !== 'internal') {
            throw new BadRequestException('Cannot modify limits on external accounts');
        }

        const results: any[] = [];

        // Update daily limit
        if (dto.daily) {
            const { data, error } = await client
                .from('account_limits')
                .upsert(
                    {
                        account_id: id,
                        limit_type: 'daily',
                        limit_amount: dto.daily,
                        updated_by: userId,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'account_id,limit_type' },
                )
                .select()
                .single();

            if (error) {
                this.logger.error(`Failed to update daily limit for ${id}: ${error.message}`);
                throw new BadRequestException('Failed to update daily limit');
            }
            results.push(data);
        }

        // Update per-transaction limit
        if (dto.perTransaction) {
            const { data, error } = await client
                .from('account_limits')
                .upsert(
                    {
                        account_id: id,
                        limit_type: 'per_transaction',
                        limit_amount: dto.perTransaction,
                        updated_by: userId,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'account_id,limit_type' },
                )
                .select()
                .single();

            if (error) {
                this.logger.error(`Failed to update per-txn limit for ${id}: ${error.message}`);
                throw new BadRequestException('Failed to update per-transaction limit');
            }
            results.push(data);
        }

        this.logger.log(`Limits updated for account ${id} by ${userId}`);
        return { accountId: id, limits: results };
    }
}
