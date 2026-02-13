import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { RedisService } from './redis.service';

@Global()
@Module({
    providers: [SupabaseService, RedisService],
    exports: [SupabaseService, RedisService],
})
export class DatabaseModule { }
