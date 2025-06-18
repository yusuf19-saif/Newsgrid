// lib/supabaseClient.ts
// Client component client (for use in browser)
// import { createBrowserClient } from '@supabase/auth-helpers-nextjs'; // Keep commented or remove if error persists

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// if (!supabaseUrl || !supabaseAnonKey) {
//     console.error("Supabase URL or Anon Key potentially missing...");
// }

// TEMPORARILY EXPORT NULL TO ISOLATE THE PROBLEM
export const supabase = null;
// export const supabase = createBrowserClient(supabaseUrl!, supabaseAnonKey!); // Comment this out

// No server client needed here; we use a different helper for server actions/components

import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
