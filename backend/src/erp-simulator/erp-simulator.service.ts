import { Injectable, BadRequestException, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { UpdateErpConfigDto } from './dto/erp-simulator.dto';

/** Realistic business purposes for generated payments */
const PAYMENT_PURPOSES = [
    'Q1 Equipment Purchase',
    'Vendor Invoice Settlement',
    'Monthly Cloud Infrastructure',
    'Office Supplies Procurement',
    'Annual Software License Renewal',
    'Consulting Services Payment',
    'Marketing Campaign Expense',
    'Warehouse Lease Payment',
    'Employee Relocation Costs',
    'IT Security Audit Services',
    'Legal Retainer Payment',
    'Logistics & Freight Charges',
    'Raw Materials Procurement',
    'Maintenance Contract Payment',
    'Professional Training Services',
];

/** Priority weights: normal 50%, high 30%, low 15%, urgent 5% */
const PRIORITY_POOL: string[] = [
    ...Array(50).fill('normal'),
    ...Array(30).fill('high'),
    ...Array(15).fill('low'),
    ...Array(5).fill('urgent'),
];

/** Currency weights: USD 60%, EUR 15%, GBP 10%, INR 5%, others 10% */
const CURRENCY_POOL: string[] = [
    ...Array(60).fill('USD'),
    ...Array(15).fill('EUR'),
    ...Array(10).fill('GBP'),
    ...Array(5).fill('INR'),
    ...Array(2).fill('JPY'),
    ...Array(2).fill('CAD'),
    ...Array(2).fill('AUD'),
    ...Array(1).fill('CHF'),
    ...Array(1).fill('SGD'),
    ...Array(2).fill('AED'),
];

@Injectable()
export class ErpSimulatorService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ErpSimulatorService.name);
    private isRunning = false;
    private timer: ReturnType<typeof setTimeout> | null = null;

    constructor(private readonly supabase: SupabaseService) { }

    async onModuleInit() {
        // Auto-start if config shows is_active = true
        try {
            const config = await this.getConfig();
            if (config?.is_active) {
                this.logger.log('ERP Simulator was active — resuming generation loop');
                this.isRunning = true;
                this.tick();
            }
        } catch (err) {
            this.logger.warn('Failed to check ERP config on init — simulator inactive');
        }
    }

    onModuleDestroy() {
        this.isRunning = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    // ─── CONFIG CRUD ───────────────────────────────────────

    async getConfig() {
        const client = this.supabase.getServiceRoleClient();
        const { data, error } = await client
            .from('erp_simulator_config')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            this.logger.error(`Failed to fetch ERP config: ${error.message}`);
            throw new BadRequestException('Failed to fetch ERP simulator config');
        }

        return { ...data, is_running: this.isRunning };
    }

    async start(userId: string) {
        if (this.isRunning) {
            return this.getConfig(); // idempotent — already running
        }

        const client = this.supabase.getServiceRoleClient();
        const { error } = await client
            .from('erp_simulator_config')
            .update({ is_active: true, updated_by: userId })
            .eq('id', 1);

        if (error) {
            this.logger.error(`Failed to start ERP simulator: ${error.message}`);
            throw new BadRequestException('Failed to start ERP simulator');
        }

        this.isRunning = true;
        this.tick();
        this.logger.log(`ERP Simulator started by ${userId}`);
        return this.getConfig();
    }

    async stop(userId: string) {
        if (!this.isRunning) {
            return this.getConfig(); // idempotent — already stopped
        }

        this.isRunning = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        const client = this.supabase.getServiceRoleClient();
        const { error } = await client
            .from('erp_simulator_config')
            .update({ is_active: false, updated_by: userId })
            .eq('id', 1);

        if (error) {
            this.logger.error(`Failed to stop ERP simulator: ${error.message}`);
            throw new BadRequestException('Failed to stop ERP simulator');
        }

        this.logger.log(`ERP Simulator stopped by ${userId}`);
        return this.getConfig();
    }

    async updateConfig(dto: UpdateErpConfigDto, userId: string) {
        const client = this.supabase.getServiceRoleClient();

        // If both min and max are provided, validate min < max
        if (dto.min_amount !== undefined && dto.max_amount !== undefined) {
            if (dto.min_amount >= dto.max_amount) {
                throw new BadRequestException('Min amount must be less than Max amount');
            }
        }

        // If only one is provided, check against current config
        if (dto.min_amount !== undefined || dto.max_amount !== undefined) {
            const current = await this.getConfig();
            const effectiveMin = dto.min_amount ?? current.min_amount;
            const effectiveMax = dto.max_amount ?? current.max_amount;
            if (Number(effectiveMin) >= Number(effectiveMax)) {
                throw new BadRequestException('Min amount must be less than Max amount');
            }
        }

        const updatePayload: Record<string, any> = { updated_by: userId };
        if (dto.interval_seconds !== undefined) updatePayload.interval_seconds = dto.interval_seconds;
        if (dto.min_amount !== undefined) updatePayload.min_amount = dto.min_amount;
        if (dto.max_amount !== undefined) updatePayload.max_amount = dto.max_amount;

        const { error } = await client
            .from('erp_simulator_config')
            .update(updatePayload)
            .eq('id', 1);

        if (error) {
            this.logger.error(`Failed to update ERP config: ${error.message}`);
            throw new BadRequestException('Failed to update ERP simulator config');
        }

        this.logger.log(`ERP config updated by ${userId}: ${JSON.stringify(dto)}`);
        return this.getConfig();
    }

    // ─── PAYMENT GENERATION ────────────────────────────────

    private async tick() {
        if (!this.isRunning) return;

        try {
            await this.generatePayment();
        } catch (err) {
            // Death-spiral prevention: log error but DON'T kill the loop
            this.logger.error(`Payment generation failed: ${(err as Error).message}`);
        }

        // Re-read interval from config each tick (in case admin changed it)
        let intervalMs = 30_000; // fallback
        try {
            const client = this.supabase.getServiceRoleClient();
            const { data } = await client
                .from('erp_simulator_config')
                .select('interval_seconds')
                .eq('id', 1)
                .single();
            if (data?.interval_seconds) {
                intervalMs = data.interval_seconds * 1000;
            }
        } catch {
            // use fallback interval
        }

        if (this.isRunning) {
            this.timer = setTimeout(() => this.tick(), intervalMs);
        }
    }

    private async generatePayment() {
        const client = this.supabase.getServiceRoleClient();

        // Fetch internal accounts (source)
        const { data: internalAccounts, error: intErr } = await client
            .from('accounts')
            .select('id, currency')
            .eq('account_type', 'internal')
            .eq('is_active', true);

        if (intErr || !internalAccounts?.length) {
            throw new Error('No internal accounts available for payment generation');
        }

        // Fetch external accounts (destination)
        const { data: externalAccounts, error: extErr } = await client
            .from('accounts')
            .select('id')
            .eq('account_type', 'external')
            .eq('is_active', true);

        if (extErr || !externalAccounts?.length) {
            throw new Error('No external accounts available for payment generation');
        }

        // Get current config for amount range
        const { data: config } = await client
            .from('erp_simulator_config')
            .select('min_amount, max_amount, payments_generated')
            .eq('id', 1)
            .single();

        if (!config) throw new Error('ERP config not found');

        const minAmount = Number(config.min_amount);
        const maxAmount = Number(config.max_amount);

        // Random selections
        const sourceAccount = internalAccounts[Math.floor(Math.random() * internalAccounts.length)];
        const destAccount = externalAccounts[Math.floor(Math.random() * externalAccounts.length)];
        const amount = Math.round((Math.random() * (maxAmount - minAmount) + minAmount) * 100) / 100;
        const priority = PRIORITY_POOL[Math.floor(Math.random() * PRIORITY_POOL.length)];
        const currency = CURRENCY_POOL[Math.floor(Math.random() * CURRENCY_POOL.length)];
        const purpose = PAYMENT_PURPOSES[Math.floor(Math.random() * PAYMENT_PURPOSES.length)];

        // Generate sequential reference number
        const nextNum = (config.payments_generated || 0) + 1;
        const year = new Date().getFullYear();
        const referenceNumber = `PAY-${year}-${String(nextNum).padStart(6, '0')}`;

        // Enrich purpose with PO/Invoice number
        const poNumber = Math.floor(10000 + Math.random() * 90000);
        const fullPurpose = `${purpose} - PO#${poNumber}`;

        // Insert payment
        const { data: payment, error: insertError } = await client
            .from('payments')
            .insert({
                reference_number: referenceNumber,
                from_account_id: sourceAccount.id,
                to_account_id: destAccount.id,
                amount,
                currency,
                purpose: fullPurpose,
                priority,
                status: 'pending',
                created_by: 'erp-system@vault.internal',
            })
            .select('id')
            .single();

        if (insertError) {
            throw new Error(`Failed to insert payment: ${insertError.message}`);
        }

        // Insert 'created' action record
        await client.from('payment_actions').insert({
            payment_id: payment.id,
            action_type: 'created',
            performed_by: 'erp-system@vault.internal',
            notes: `Auto-generated by ERP Simulator (${referenceNumber})`,
        });

        // Update config stats
        await client
            .from('erp_simulator_config')
            .update({
                payments_generated: nextNum,
                last_generated_at: new Date().toISOString(),
            })
            .eq('id', 1);

        this.logger.log(`Generated payment ${referenceNumber}: ${currency} ${amount.toFixed(2)} [${priority}]`);
    }
}
