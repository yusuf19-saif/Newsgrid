import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
// Assuming you have a supabaseAdmin client initialized with the service role key
// If not, adjust the import path and initialization as needed.
// For example, if it's in lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/supabase'; // Ensure this path is correct

// Define a type for the item when fetching categories for de-duplication
interface CategoryItem {
  category: string | null; // Category can be null
}

// Define a type for the item returned by the RPC function
interface RPCCategoryItem {
  category: string; // RPC function ensures category is not null
}

// Initialize Supabase client with Service Role Key for unrestricted access
// Ensure these environment variables are set in your .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables.");
  // In a real app, you might throw an error or handle this more gracefully
}

// Create a single Supabase client instance for this module
// IMPORTANT: Use the service role key for direct database access in API routes
// to bypass RLS if necessary for fetching aggregate data like distinct categories.
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
    ? createClient<Database>(supabaseUrl, supabaseServiceKey) 
    : null;

export const dynamic = 'force-dynamic'; // Ensures the route is not cached and always fetches fresh data

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
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

    // Call the RPC function to get distinct categories
    const { data, error } = await supabase.rpc('get_distinct_categories');

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories', details: error.message }, { status: 500 });
    }

    // The RPC function returns an array of objects, e.g., [{ category: 'Technology' }, { category: 'Sports' }]
    // We'll map this to an array of strings for easier use on the frontend.
    const categories = data ? data.map(item => item.category) : [];

    return NextResponse.json(categories, { status: 200 });

  } catch (e: any) {
    console.error('Unexpected error in categories route:', e);
    return NextResponse.json({ error: 'An unexpected error occurred', details: e.message }, { status: 500 });
  }
}
