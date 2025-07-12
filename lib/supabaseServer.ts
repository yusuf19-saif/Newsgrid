import { createClient } from '@supabase/supabase-js';

// Ensure your environment variables are correctly defined in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Ensure variables are defined
if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing from environment variables.");
}
if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
}

// Create a single supabase client for server-side operations (admin privileges)
// This client has full access and bypasses RLS. Use with caution.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // For server-side operations, session persistence is not needed.
    autoRefreshToken: false,
    persistSession: false,
  },
});

// The createSupabaseServerClient and checkUserRole functions that used next/headers
// have been removed from this file to prevent client-side import errors.
// createSupabaseServerClient now resides in its own file for server component usage.
