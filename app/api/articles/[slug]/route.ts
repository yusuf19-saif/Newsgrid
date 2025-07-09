import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseServer'; // Adjust path if needed
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Define the expected shape of the params object
interface RouteParams {
  slug: string;
}

// The handler receives params containing the dynamic route segments
export async function GET(
  request: Request, // First argument is always request
  { params }: { params: Promise<{ slug: string }> } // Second argument contains params, now as a Promise
) {
  const { slug } = await params; // Extract the slug after awaiting

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  try {
    // Fetch a single article matching the slug AND status 'Published'
    // Also fetch the author's full name from the profiles table
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select(`
        id,
        headline,
        content,
        excerpt,
        source,
        category,
        slug,
        created_at,
        status,
        author_id, 
        profiles ( full_name ) 
      `)
      .eq('slug', slug)          // Filter by slug
      .eq('status', 'Published')  // Ensure it's published
      .single();                 // Expect only one result

    if (error) {
      // Log the specific error for debugging
      console.error(`Supabase error fetching slug "${slug}":`, error);
      // Check if the error is "PGRST116" which means no rows found
      if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Article not found or not published' }, { status: 404 });
      }
      // Otherwise, it's likely a server error
      return NextResponse.json({ error: 'Failed to fetch article data' }, { status: 500 });
    }

    // If data is null after .single() without an error, it means not found
    if (!data) {
        return NextResponse.json({ error: 'Article not found or not published' }, { status: 404 });
    }

    // We need to transform the data slightly to make the author's name more accessible
    let authorFullName = 'Unknown Author';
    if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
      authorFullName = data.profiles[0].full_name;
    } else if (data.profiles && !Array.isArray(data.profiles)) {
      // Fallback in case it's an object (though TS suggests it's an array)
      authorFullName = (data.profiles as { full_name: string }).full_name;
    }

    const articleData = {
      ...data,
      author_full_name: authorFullName
    };

    // Clean up the profiles object from the main response if you don't want it nested
    // delete articleData.profiles; // Optional: uncomment if you want to remove the nested profiles object

    // Return the single article object with the author's name
    return NextResponse.json(articleData, { status: 200 });

  } catch (err) {
    console.error(`API Route error for slug "${slug}":`, err);
    return NextResponse.json({ error: 'Internal ServerError' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: You must be logged in.' }, { status: 401 });
  }

  if (!slug) {
    return NextResponse.json({ error: 'Article slug is required.' }, { status: 400 });
  }

  try {
    const { data: article, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('id, author_id')
      .eq('slug', slug)
      .single();

    if (fetchError || !article) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    if (article.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You are not the author of this article.' }, { status: 403 });
    }

    const { status: newStatus } = await request.json();

    if (!newStatus || !['Published', 'pending_review'].includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status provided. Must be Published or pending_review.' }, { status: 400 });
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('articles')
      .update({ status: newStatus })
      .eq('id', article.id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update article status.' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error(`Unexpected error in PUT /api/articles/${slug}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized: You must be logged in.' }, { status: 401 });
    }

    if (!slug) {
        return NextResponse.json({ error: 'Article slug is required.' }, { status: 400 });
    }

    try {
        const { data: article, error: fetchError } = await supabaseAdmin
            .from('articles')
            .select('id, author_id')
            .eq('slug', slug)
            .single();

        if (fetchError || !article) {
            return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
        }

        if (article.author_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden: You are not the author of this article.' }, { status: 403 });
        }

        const { error: deleteError } = await supabaseAdmin
            .from('articles')
            .delete()
            .eq('id', article.id);

        if (deleteError) {
            return NextResponse.json({ error: 'Failed to delete article.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Article deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error(`Unexpected error in DELETE /api/articles/${slug}:`, error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
