import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import slugify from 'slugify';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Define the expected structure of the request body from the frontend
interface ArticlePostBody {
  headline: string;
  content: string;
  category: string;
  source?: string | null;
  article_type: 'Factual' | 'Reporting/Rumor' | ''; 
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            let expiresDate: Date | undefined = undefined;
            if (options.expires) {
              if (typeof options.expires === 'number') {
                // If it's a number, assume it's a Unix timestamp in seconds
                expiresDate = new Date(options.expires * 1000);
              } else if (options.expires instanceof Date) {
                // If it's already a Date object, use it directly
                expiresDate = options.expires;
              }
              // You could add a console.warn or error here if options.expires is an unexpected type
            }

            cookieStore.set(name, value, {
              domain: options.domain,
              path: options.path,
              expires: expiresDate, // Use the processed expiresDate
              httpOnly: options.httpOnly,
              maxAge: options.maxAge,
              // priority: options.priority, // Check if 'priority' is valid for your Next.js version's cookies().set()
              sameSite: typeof options.sameSite === 'boolean' 
                          ? (options.sameSite ? 'strict' : undefined)
                          : options.sameSite,
              secure: options.secure,
            });
          } catch (error) {
            console.error('Error setting cookie in API route:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({
              name: name,
              domain: options.domain,
              path: options.path,
            });
          } catch (error) {
            console.error('Error removing cookie in API route:', error);
          }
        },
      },
    }
  );

  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    let query = supabase
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
      .eq('status', 'Published');

    if (category) {
      query = query.ilike('category', category);
    }

    const { data: articlesData, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      return NextResponse.json({ error: 'Failed to fetch articles from database', details: error.message }, { status: 500 });
    }

    // Transform data to include author_full_name directly
    const transformedArticles = articlesData ? articlesData.map(article => {
      let authorFullName = 'Unknown Author';
      // Ensure profiles is an object and not an array from the query, or handle array if necessary
      // Based on previous fix for single article, Supabase might give profiles as an object here too if correctly joined.
      // If profiles can be an array:
      // if (article.profiles && Array.isArray(article.profiles) && article.profiles.length > 0) {
      //   authorFullName = article.profiles[0].full_name;
      // } else if (article.profiles && !Array.isArray(article.profiles)) { // if it's a single object
      //   authorFullName = (article.profiles as { full_name: string }).full_name;
      // }
      
      // Simpler assumption if profiles is always an object or null from the select query:
      if (article.profiles && typeof article.profiles === 'object' && 'full_name' in article.profiles) {
        authorFullName = (article.profiles as { full_name: string }).full_name;
      }


      // Create a new object to avoid modifying the original and to control the structure
      const { profiles, ...restOfArticle } = article; // Destructure to remove the nested profiles object
      return {
        ...restOfArticle,
        author_full_name: authorFullName
      };
    }) : [];

    return NextResponse.json(transformedArticles); // Return the transformed articles

  } catch (error: any) { // Add type annotation for error
    console.error('Catch block error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles data', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            let expiresDate: Date | undefined = undefined;
            if (options.expires) {
              if (typeof options.expires === 'number') {
                expiresDate = new Date(options.expires * 1000);
              } else if (options.expires instanceof Date) {
                expiresDate = options.expires;
              }
            }
            cookieStore.set(name, value, { 
              domain: options.domain,
              path: options.path,
              expires: expiresDate,
              httpOnly: options.httpOnly,
              maxAge: options.maxAge,
              sameSite: typeof options.sameSite === 'boolean' 
                          ? (options.sameSite ? 'strict' : undefined)
                          : options.sameSite,
              secure: options.secure,
            });
          } catch (error) {
            // console.error('Error setting cookie in API route (POST):', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ 
              name: name, 
              domain: options.domain,
              path: options.path,
            });
          } catch (error) {
            // console.error('Error removing cookie in API route (POST):', error);
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  try {
    const body: ArticlePostBody = await request.json();
    const { headline, content, category, source, article_type } = body;

    if (!headline || !content || !category || !article_type) {
      return NextResponse.json({ error: 'Headline, content, category, and article type are required.' }, { status: 400 });
    }
    if (article_type !== 'Factual' && article_type !== 'Reporting/Rumor') {
        return NextResponse.json({ error: 'Invalid article_type.' }, { status: 400 });
    }
    if (article_type === 'Factual' && (!source || source.trim() === '')) {
      return NextResponse.json({ error: 'Sources are mandatory for factual articles.' }, { status: 400 });
    }

    const generatedSlug = slugify(headline);
    const excerptContent = content.length > 150 ? content.substring(0, 150) + "..." : content;
    let articleStatus: string;
    let triggerAI = false;

    if (article_type === 'Factual') {
      articleStatus = 'Pending AI Verification'; // Factual articles wait for AI
      triggerAI = true;
    } else { // Reporting/Rumor
      articleStatus = 'Published'; // Reporting/Rumor articles are published immediately
    }

    const { data: newArticle, error: insertError } = await supabase
      .from('articles')
      .insert([{
          headline,
          content,
          category,
          source: source?.trim() || null,
          slug: generatedSlug,
          author_id: user.id,
          status: articleStatus, // Set status based on article_type
          article_type,
          excerpt: excerptContent,
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting article:', insertError);
      if (insertError.code === '23505') { 
          return NextResponse.json({ error: 'An article with a similar headline already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to submit article: ' + insertError.message }, { status: 500 });
    }

    if (triggerAI && newArticle) {
      console.log(`Factual article ${newArticle.id} submitted. Status: ${newArticle.status}. Triggering AI verification (async).`);
      // Call your Next.js API route that then calls the Edge Function
      fetch(`/api/ai-verify-article`, { // Relative path to your Next.js API route
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article_id: newArticle.id }),
      }).catch(fetchError => console.error("Error triggering AI verification via API route:", fetchError));
    }
    
    const successMessage = article_type === 'Factual' 
        ? 'Factual article submitted and is now pending AI verification.'
        : 'Article published successfully!';

    return NextResponse.json({ message: successMessage, article: newArticle }, { status: 201 });

  } catch (e: any) {
    console.error("Error in POST /api/articles:", e);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Optional: Define dynamic behavior if needed, though likely not for simple GET
// export const dynamic = 'force-dynamic';
