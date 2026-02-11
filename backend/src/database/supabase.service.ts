import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
    private supabase: SupabaseClient;
    private serviceRoleClient: SupabaseClient;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
        }

        // Primary client — auth context gets set by signInWithPassword() on login.
        // This means all queries through this client are RLS-scoped to the
        // logged-in user. Treasurers only see their own data. This is intentional.
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Dedicated service-role client — never contaminated by user login.
        // Used exclusively by admin operations that need to bypass RLS
        // (e.g., viewing all users, pending signups, deactivating accounts).
        this.serviceRoleClient = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        console.log('✅ Supabase client initialized');
    }

    /**
     * Returns the user-scoped client. After login, this client's auth context
     * is set to the logged-in user, so all queries respect RLS policies.
     */
    getClient(): SupabaseClient {
        return this.supabase;
    }

    /**
     * Returns a clean service-role client that always bypasses RLS.
     * Use this ONLY for admin operations that need to see all data
     * (e.g., listing all users, pending signups, managing accounts).
     */
    getServiceRoleClient(): SupabaseClient {
        return this.serviceRoleClient;
    }

    // Helper method for admin auth operations (signOut, etc.)
    get admin() {
        return this.serviceRoleClient.auth.admin;
    }
}
