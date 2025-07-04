import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseServer'; // Adjust path as needed
import { cookies } from 'next/headers';
import { createServerClient } from '../../../../../lib/supabaseServerComponentClient';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const cookieStore = await cookies();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('*') // Select all columns, or specify if you need fewer
      .eq('author_id', userId)
      .order('created_at', { ascending: false }); // Optional: order by creation date

    if (error) {
      console.error('Supabase error fetching user articles:', error);
      throw error; // Propagate the error to be caught by the catch block
    }

    if (!articles) {
      return NextResponse.json({ error: 'No articles found for this user or error fetching them.' }, { status: 404 });
    }

    return NextResponse.json(articles, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching user articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user articles', details: error.message },
      { status: 500 }
    );
  }
}
