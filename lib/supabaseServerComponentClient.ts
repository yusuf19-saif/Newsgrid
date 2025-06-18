// lib/supabaseServerComponentClient.ts
// Server component client (for use in Server Components, Server Actions, Route Handlers)
// Important: Needs cookies() from next/headers
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'; // Import cookies

// Function to create a Supabase client for Server Components
// It reads cookies to determine the user's session server-side
export const createSupabaseServerComponentClient = () => {
    const cookieStore = cookies(); // Get cookie store
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create and return the client
    return createServerComponentClient({ cookies: () => cookieStore }, {
         supabaseUrl: supabaseUrl,
         supabaseKey: supabaseAnonKey
    });
}

// We keep the supabaseAdmin client (using service_role) separate in supabaseServer.ts
// for operations that need to bypass RLS.
