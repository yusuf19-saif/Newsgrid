import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../../lib/supabaseServer'; // For fetching articles
import { checkUserRole } from '../../../../lib/authUtils';   // For checking admin role

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabaseUserClient = createServerClient( // To get the current user
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized: You must be logged in.' }, { status: 401 });
  }

  const isAdmin = await checkUserRole(user.id, 'admin');
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden: You do not have admin privileges.' }, { status: 403 });
  }

  // Admins can fetch articles based on status, default to 'pending_review'
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'pending_review';

  try {
    const { data: articles, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('*') // Select all details for admin review
      .eq('status', status)
      .order('created_at', { ascending: true }); // Show oldest pending first

    if (fetchError) {
      console.error('Error fetching articles for admin:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch articles for admin.', details: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(articles, { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/admin/articles:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}
