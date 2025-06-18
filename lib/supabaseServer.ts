import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
// Be cautious using the service role key; it bypasses RLS.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // Required for server-side operations
    autoRefreshToken: false,
    persistSession: false,
  },
});

// You could also export a client using the anon key if needed for RLS-aware server operations
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) { /* Loglevel debug */ console.log(`Error setting cookie: ${name}`, error); } },
        remove(name: string, options: CookieOptions) { try { cookieStore.delete({ name, ...options }); } catch (error) { /* Loglevel debug */ console.log(`Error removing cookie: ${name}`, error); } },
      },
    }
  );
};

export async function checkUserRole(userId: string, roleName: string): Promise<boolean> {
  if (!userId) {
    console.warn("checkUserRole called with no userId");
    return false;
  }

  // Using the user's client, RLS must be set up on 'user_roles'
  const supabase = createSupabaseServerClient(); 

  console.log(`Checking role for userId: ${userId}, roleName: ${roleName}`);

  const { error, count } = await supabase
    .from('user_roles') // Make sure this table name is exact
    .select('*', { count: 'exact', head: true }) // Fetching a column isn't needed if only checking existence. head: true is fine here.
    .eq('user_id', userId)    // Ensure 'user_id' is the correct column name
    .eq('role', roleName);    // Ensure 'role' is the correct column name

  if (error) {
    console.error(`Supabase error checking user role for ${userId} / ${roleName}:`, error.message);
    return false;
  }

  console.log(`Role check for ${userId} / ${roleName} - Count: ${count}`);
  
  return count !== null && count > 0;
}

// RLS Policy for user_roles (reminder - run in Supabase SQL Editor):
/*
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
*/
