import { createSupabaseServerComponentClient } from '@/lib/supabaseServerComponentClient';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './bookmarks.module.css';
import { BookmarkButton } from '@/components/BookmarkButton';
import { FiBookmark } from 'react-icons/fi';

// Helper to calculate time ago
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

async function getBookmarkedArticles(userId: string) {
  const supabase = createSupabaseServerComponentClient();
  
  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      article:articles (
        id,
        headline,
        excerpt,
        slug,
        category,
        trust_score,
        image_url,
        created_at,
        author:profiles (
          full_name
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookmarks:', error);
    return [];
  }

  return bookmarks || [];
}

export default async function BookmarksPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/bookmarks');
  }

  const bookmarks = await getBookmarkedArticles(user.id);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <FiBookmark className={styles.titleIcon} />
          Saved Articles
        </h1>
        <p className={styles.subtitle}>
          {bookmarks.length} {bookmarks.length === 1 ? 'article' : 'articles'} saved
        </p>
      </header>

      {bookmarks.length === 0 ? (
        <div className={styles.emptyState}>
          <FiBookmark className={styles.emptyIcon} />
          <h2>No saved articles yet</h2>
          <p>Articles you bookmark will appear here for easy access.</p>
          <Link href="/" className={styles.browseLink}>
            Browse Articles
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {bookmarks.map((bookmark: any) => {
            const article = bookmark.article;
            if (!article) return null;
            
            const authorName = article.author?.full_name || 'Anonymous';
            const score = article.trust_score || 0;
            const gradient = `conic-gradient(var(--accent-primary) ${score}%, transparent 0)`;

            return (
              <article key={bookmark.id} className={styles.card}>
                <Link href={`/article/${article.slug}`} className={styles.cardLink}>
                  <div className={styles.imageContainer}>
                    {article.image_url ? (
                      <Image
                        src={article.image_url}
                        alt={article.headline}
                        fill
                        className={styles.image}
                      />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <span>NG</span>
                      </div>
                    )}
                    <div className={styles.trustScoreBadge}>
                      <div className={styles.trustScoreRing} style={{ background: gradient }}></div>
                      {score}
                    </div>
                  </div>
                  
                  <div className={styles.content}>
                    <div className={styles.meta}>
                      <span className={styles.category}>{article.category || 'General'}</span>
                      <span className={styles.dot}>•</span>
                      <span className={styles.time}>{timeAgo(article.created_at)}</span>
                    </div>
                    
                    <h2 className={styles.headline}>{article.headline}</h2>
                    
                    {article.excerpt && (
                      <p className={styles.excerpt}>{article.excerpt}</p>
                    )}
                    
                    <div className={styles.footer}>
                      <span className={styles.author}>By {authorName}</span>
                    </div>
                  </div>
                </Link>
                
                <div className={styles.bookmarkAction}>
                  <BookmarkButton articleId={article.id} size="small" />
                  <span className={styles.savedTime}>Saved {timeAgo(bookmark.created_at)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

