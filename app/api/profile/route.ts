import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// This function will handle PUT requests to update the profile
export async function PUT(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Using ANON_KEY because RLS will protect the table
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.delete({ name, ...options }); } catch (error) {}
        },
      },
    }
  );

  try {
    // 1. Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user or no user:', userError);
      return NextResponse.json({ error: 'You must be logged in to update your profile.' }, { status: 401 });
    }

    // 2. Parse the request body for firstName and lastName
    const { firstName, lastName } = await request.json();

    if (!firstName || !lastName || typeof firstName !== 'string' || typeof lastName !== 'string' || firstName.trim() === '' || lastName.trim() === '') {
      return NextResponse.json({ error: 'First name and last name are required and must be valid strings.' }, { status: 400 });
    }

    // 3. Update the user's profile in the 'profiles' table
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        first_name: firstName.trim(), 
        last_name: lastName.trim() 
        // full_name will be updated automatically by the database as it's a generated column
      })
      .eq('id', user.id) // Ensure we only update the profile of the logged-in user
      .select('id, first_name, last_name, full_name') // Select the fields to return
      .single(); // Expect a single row to be updated

    if (updateError) {
      console.error('Error updating profile in DB:', updateError);
      // Check for specific Supabase errors if needed, e.g., RLS violation
      return NextResponse.json({ error: 'Failed to update profile information.', details: updateError.message }, { status: 500 });
    }

    if (!updatedProfile) {
        return NextResponse.json({ error: 'Failed to update profile or profile not found after update.'}, { status: 404});
    }

    return NextResponse.json({ message: 'Profile updated successfully!', profile: updatedProfile }, { status: 200 });

  } catch (error: any) {
    console.error('Catch block error in PUT /api/profile:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while updating profile.', details: error.message }, { status: 500 });
  }
}
