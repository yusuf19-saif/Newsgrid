import Link from 'next/link'; // Keep Link if you want category links etc.
import { notFound } from 'next/navigation'; // Import notFound for 404 handling
import { Article } from '../../../types'; // Adjusted path to use relative path
import styles from './article.module.css';
import { createSupabaseServerComponentClient } from '@/lib/supabaseServerComponentClient';
import { TrustScoreMeter } from '@/components/TrustScoreMeter'; // Corrected: Use named import

// Helper function to format date (can be shared in a utils file later)
function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown date';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateString;
    }
}

// Define the expected shape of the params object
interface ArticlePageParams {
  slug: string;
}

// The component receives params containing the dynamic route segments
// Make the Page component async to use await for data fetching
export default async function ArticlePage({ params }: { params: Promise<ArticlePageParams> }) {
  const { slug } = await params; // Extract the slug after awaiting params
  const supabase = await createSupabaseServerComponentClient();

  // Get the current user's session to check if they are the author
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  // Fetch the article by slug, but don't filter by status yet
  const { data: article, error } = await supabase
    .from('articles')
    .select(`
      id,
      headline,
      content,
      excerpt,
      sources,
      trust_score,
      category,
      slug,
      created_at,
      status,
      author_id,
      profiles (
        full_name
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !article) {
    console.error(`Error fetching article with slug ${slug}:`, error);
    notFound();
  }

  const isPublished = article.status === 'Published';
  const isOwner = article.author_id === userId;

  // If the article is not published and the person viewing it is not the author,
  // then show a 404 page.
  if (!isPublished && !isOwner) {
    notFound();
  }
  
  // The join result is now in `article.profiles`. Handle case where it might be null.
  const authorName = (article.profiles as { full_name: string })?.full_name || 'Anonymous';
  
  // Map the author data to the expected property
  const articleWithAuthor = {
      ...article,
      author_full_name: authorName,
      // Make sure profiles is not passed down if you are not using it elsewhere
      profiles: undefined 
  };

  // console.log(`Rendering ArticlePage for slug: ${slug}`); // Add log - keep if helpful
  // If article IS found, render its content
  return (
    <div className={styles.pageLayout}>
      <div className={styles.mainContent}>
        <article className={styles.articleContent}>
          {/* Display actual fetched data */}
          <h1 className={styles.headline}>{articleWithAuthor.headline}</h1>

          <div className={styles.meta}>
            {/* Display Author Name as a Link if author_id exists */}
            {articleWithAuthor.author_id && articleWithAuthor.author_full_name && articleWithAuthor.author_full_name !== 'Anonymous' ? (
              <span>
                By: <Link href={`/profile/${articleWithAuthor.author_id}`} className={styles.authorLink}>{articleWithAuthor.author_full_name}</Link>
              </span>
            ) : articleWithAuthor.author_full_name && articleWithAuthor.author_full_name !== 'Anonymous' ? (
              <span>By: {articleWithAuthor.author_full_name}</span>
            ) : null} {/* Or a fallback for "Anonymous" if desired */}
            <span>
              Category: <Link href={`/category/${encodeURIComponent(articleWithAuthor.category.toLowerCase())}`} className={styles.categoryLink}>{articleWithAuthor.category}</Link>
            </span>
            <span>Posted: {formatDate(articleWithAuthor.created_at)}</span>
          </div>

          {/* Display the full article content */}
          {/* Warning: Rendering raw HTML from user input is dangerous (XSS).
              If 'content' could contain HTML, use a sanitizer library (like DOMPurify)
              or render it as plain text. For now, assuming plain text or trusted content. */}
          <div className={styles.body}>
            {/* Render content - split into paragraphs if content has line breaks */}
            {articleWithAuthor.content && articleWithAuthor.content.split('\n').map((paragraph: string, index: number) => (
              paragraph.trim() ? <p key={index}>{paragraph}</p> : null
            ))}
          </div>

          {/* Updated Sources section */}
          {Array.isArray(articleWithAuthor.sources) && articleWithAuthor.sources.length > 0 && (
            <div className={styles.sourcesSection}>
              <h3 className={styles.sourcesTitle}>Sources</h3>
              <ol className={styles.sourcesList}>
                {articleWithAuthor.sources.map((source: any, index) => {
                  if (!source || !source.value) return null;

                  if (source.type === 'url') {
                    return (
                      <li key={index}>
                        <a href={source.value} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                          {source.value}
                        </a>
                      </li>
                    );
                  } else if (source.type === 'pdf') {
                    return (
                      <li key={index}>
                        Uploaded PDF: {source.name || 'PDF Source'}
                      </li>
                    );
                  }
                  return null;
                })}
              </ol>
            </div>
          )}
        </article>
      </div>

      <aside className={styles.trustScoreWrapper}>
        {articleWithAuthor.trust_score !== null && typeof articleWithAuthor.trust_score === 'number' && (
          <div>
            <h3>Credibility Score</h3>
            <TrustScoreMeter score={articleWithAuthor.trust_score} />
          </div>
        )}
      </aside>
    </div>
  );
}

// Optional: Generate Metadata dynamically based on the article
// export async function generateMetadata({ params }: { params: ArticlePageParams }) {
//   const article = await getArticleBySlug(params.slug);
//   if (!article) {
//     return { title: 'Article Not Found' };
//   }
//   return {
//     title: article.headline,
//     description: article.excerpt || 'Article on NewsGrid',
//   };
// }
