import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class ErpSimulatorService {
    constructor(private readonly supabase: SupabaseService) { }
}
