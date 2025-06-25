import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase'; // Adjust path if your supabase types are elsewhere

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code'); // Get the auth code from the URL

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );
    
    try {
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        // Redirect to an error page or show an error message
        // You might want a specific page for auth errors.
        return NextResponse.redirect(`${requestUrl.origin}/login?error=Could not authenticate user. Please try again.`);
      }
    } catch (e: any) {
      console.error('Catch block error in auth callback:', e);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=An unexpected error occurred during authentication.`);
    }
  } else {
    console.warn('No auth code found in callback URL.');
    // Redirect to an error page or show an error message if no code is present
    return NextResponse.redirect(`${requestUrl.origin}/login?error=Invalid authentication link.`);
  }

  // After successful authentication (or if no code but no error, though this path is less likely with `exchangeCodeForSession`),
  // redirect the user to the home page or their dashboard.
  console.log('Auth callback successful, redirecting to home.');
  return NextResponse.redirect(requestUrl.origin); // Redirect to the homepage
  // Or redirect to a specific page like a dashboard:
  // return NextResponse.redirect(`${requestUrl.origin}/dashboard`); 
}
