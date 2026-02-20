'use server';

import { revalidatePath } from 'next/cache';
import { smartGet, smartPost, smartPatch, type ChallengeResponse } from '@/lib/api/smart-fetch';

// --- Types ---

export interface ErpSimulatorConfig {
    id: number;
    is_active: boolean;
    is_running: boolean;
    interval_seconds: number;
    min_amount: number;
    max_amount: number;
    payments_generated: number;
    last_generated_at: string | null;
    updated_by: string | null;
    updated_at: string;
}

// --- Actions ---

export async function fetchErpConfig(): Promise<ErpSimulatorConfig> {
    return smartGet<ErpSimulatorConfig>('/api/erp-simulator/config');
}

export async function startSimulator(): Promise<ErpSimulatorConfig | ChallengeResponse> {
    const result = await smartPost<ErpSimulatorConfig>('/api/erp-simulator/start');
    revalidatePath('/admin/settings');
    return result;
}

export async function stopSimulator(): Promise<ErpSimulatorConfig | ChallengeResponse> {
    const result = await smartPost<ErpSimulatorConfig>('/api/erp-simulator/stop');
    revalidatePath('/admin/settings');
    return result;
}

export async function updateErpConfig(
    data: { interval_seconds?: number; min_amount?: number; max_amount?: number },
): Promise<ErpSimulatorConfig | ChallengeResponse> {
    const result = await smartPatch<ErpSimulatorConfig>('/api/erp-simulator/config', data);
    revalidatePath('/admin/settings');
    return result;
}
