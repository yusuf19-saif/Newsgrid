import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../../../../lib/supabaseServer'; // Adjust path
import { checkUserRole } from '../../../../../../lib/authUtils';   // Adjust path

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const { articleId } = await params;
  const cookieStore = cookies();
  const supabaseUserClient = createServerClient(
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

  if (!articleId) {
    return NextResponse.json({ error: 'Article ID is required.' }, { status: 400 });
  }

  try {
    const { status: newStatus } = await request.json(); // Expecting {"status": "Published"} or {"status": "Rejected"}

    if (!newStatus || !['Published', 'Rejected', 'pending_review'].includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status provided. Must be Published, Rejected, or pending_review.' }, { status: 400 });
    }

    const { data: updatedArticle, error: updateError } = await supabaseAdmin
      .from('articles')
      .update({ status: newStatus })
      .eq('id', articleId)
      .select()
      .single();

    if (updateError) {
      console.error(`Error updating status for article ${articleId}:`, updateError);
      return NextResponse.json({ error: 'Failed to update article status.', details: updateError.message }, { status: 500 });
    }

    if (!updatedArticle) {
        return NextResponse.json({ error: 'Article not found or failed to update.' }, { status: 404 });
    }

    return NextResponse.json(updatedArticle, { status: 200 });
  } catch (error: any) {
    console.error(`Unexpected error in PUT /api/admin/articles/${articleId}/status:`, error);
     if (error instanceof SyntaxError) { // Handle malformed JSON
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}
