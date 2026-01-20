import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import styles from './article.module.css';
import { createSupabaseServerComponentClient } from '@/lib/supabaseServerComponentClient';
import { TrustScoreMeter } from '@/components/TrustScoreMeter';
import { TrustScoreBreakdown } from '@/components/TrustScoreBreakdown';

// Helper function to format date
function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown date';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateString;
    }
}

// Helper to sanitize text content - removes HTML tags and escapes special characters
function sanitizeTextContent(content: string): string {
  if (!content) return '';
  // Remove any HTML tags
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface ArticlePageParams {
  slug: string;
}

// Dynamic metadata generation for SEO
export async function generateMetadata({ params }: { params: Promise<ArticlePageParams> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createSupabaseServerComponentClient();
  
  const { data: article, error } = await supabase
    .from('articles')
    .select('headline, excerpt, content, category')
    .eq('slug', slug)
    .eq('status', 'Published')
    .single();

  if (error || !article) {
    return { 
      title: 'Article Not Found | NewsGrid',
      description: 'The requested article could not be found.'
    };
  }

  const description = article.excerpt || article.content?.substring(0, 160) || 'Read this verified article on NewsGrid';

  return {
    title: `${article.headline} | NewsGrid`,
    description: description,
    keywords: [article.category, 'news', 'fact-check', 'NewsGrid'].filter(Boolean),
    openGraph: {
      title: article.headline,
      description: description,
      type: 'article',
      siteName: 'NewsGrid',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.headline,
      description: description,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<ArticlePageParams> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerComponentClient();

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

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
      image_url,
      verification_report,
      credibility_rating,
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

  if (!isPublished && !isOwner) {
    notFound();
  }
  
  const authorName = Array.isArray(article.profiles) && article.profiles.length > 0
    ? article.profiles[0].full_name
    : 'Anonymous';
  
  const articleWithAuthor = {
      ...article,
      author_full_name: authorName,
      profiles: undefined 
  };

  // Sanitize the content for safe rendering
  const sanitizedContent = sanitizeTextContent(articleWithAuthor.content || '');

  return (
    <div className={styles.pageLayout}>
      <div className={styles.mainContent}>
        <article className={styles.articleContent}>
          {/* Category Badge */}
          {articleWithAuthor.category && (
            <Link 
              href={`/category/${encodeURIComponent(articleWithAuthor.category.toLowerCase())}`} 
              className={styles.categoryBadge}
            >
              {articleWithAuthor.category}
            </Link>
          )}

          <h1 className={styles.headline}>{articleWithAuthor.headline}</h1>

          <div className={styles.meta}>
            {articleWithAuthor.author_id && articleWithAuthor.author_full_name && articleWithAuthor.author_full_name !== 'Anonymous' ? (
              <span className={styles.metaItem}>
                By <Link href={`/profile/${articleWithAuthor.author_id}`} className={styles.authorLink}>{articleWithAuthor.author_full_name}</Link>
              </span>
            ) : articleWithAuthor.author_full_name && articleWithAuthor.author_full_name !== 'Anonymous' ? (
              <span className={styles.metaItem}>By {articleWithAuthor.author_full_name}</span>
            ) : null}
            <span className={styles.metaItem}>{formatDate(articleWithAuthor.created_at)}</span>
            {articleWithAuthor.trust_score !== null && (
              <span className={styles.trustBadge}>
                {articleWithAuthor.trust_score}% Trust Score
              </span>
            )}
          </div>

          {/* Article Body - safely rendered as plain text paragraphs */}
          <div className={styles.body}>
            {sanitizedContent.split('\n\n').map((paragraph: string, index: number) => (
              paragraph.trim() ? <p key={index}>{paragraph}</p> : null
            ))}
          </div>

          {/* Sources section */}
          {Array.isArray(articleWithAuthor.sources) && articleWithAuthor.sources.length > 0 && (
            <div className={styles.sourcesSection}>
              <h3 className={styles.sourcesTitle}>Sources</h3>
              <ol className={styles.sourcesList}>
                {articleWithAuthor.sources.map((source: any, index: number) => {
                  if (!source || !source.value) return null;

                  if (source.type === 'url') {
                    return (
                      <li key={index}>
                        <a 
                          href={source.value} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.sourceLink}
                        >
                          {source.name || source.value}
                        </a>
                      </li>
                    );
                  } else if (source.type === 'pdf') {
                    return (
                      <li key={index}>
                        📄 {source.name || 'PDF Source'}
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
          <TrustScoreBreakdown
            score={articleWithAuthor.trust_score}
            credibilityRating={article.credibility_rating}
            verificationReport={article.verification_report as Record<string, unknown> | null}
          />
        )}
      </aside>
    </div>
  );
}
