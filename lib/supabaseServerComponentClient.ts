// lib/supabaseServerComponentClient.ts
// Server component client (for use in Server Components, Server Actions, Route Handlers)
// Important: Needs cookies() from next/headers
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers'; // Import cookies

// Function to create a Supabase client for Server Components
// It reads cookies to determine the user's session server-side
export const createSupabaseServerComponentClient = async () => {
    const cookieStore = await cookies(); // Get cookie store

    // Create and return the client
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );
}

// We keep the supabaseAdmin client (using service_role) separate in supabaseServer.ts
// for operations that need to bypass RLS.
