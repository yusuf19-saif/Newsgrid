// my-app/app/page.tsx
import Link from 'next/link';
import ArticlePreview from '@/components/ArticlePreview'; // Assuming ArticlePreview is in components
import { Article } from '@/types'; // Assuming your Article type is in types/index.ts
import styles from './page.module.css'; // Assuming you have some page-specific styles
import { createSupabaseServerComponentClient } from '@/lib/supabaseServerComponentClient';

// Utility function to format date (can be moved to a utils file later)
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Date not available';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Invalid date';
  }
}

// This function fetches the articles from your database.
async function getArticlesAndUser() {
  const supabase = createSupabaseServerComponentClient();

  // Fetch both the articles and the current user in parallel
  const [articlesResponse, userResponse] = await Promise.all([
    supabase
      .from("articles")
      .select(`
        *,
        author:profiles (
          full_name
        )
      `)
      .eq("status", "Published")
      .order("created_at", { ascending: false }),
    supabase.auth.getUser()
  ]);

  const { data: rawArticles, error: articlesError } = articlesResponse;
  const { data: { user } } = userResponse;

  if (articlesError) {
    console.error("Error fetching articles:", articlesError);
    return { articles: [], user: null };
  }

  if (!rawArticles) {
    return { articles: [], user: null };
  }

  // Normalize the data and add the isOwner flag
  const articles: Article[] = rawArticles.map((article: any) => ({
    ...article,
    author_full_name: article.author?.full_name || 'Anonymous',
    sources: Array.isArray(article.sources) ? article.sources : null,
    // --- FIX: Add the isOwner property ---
    isOwner: user ? user.id === article.author_id : false
  }));

  return { articles, user };
}


export default async function HomePage() {
  // We don't need the user here directly, but fetching it sets the `isOwner` flag
  const { articles } = await getArticlesAndUser();

  return (
    <div className={styles.homeContainer}>
      <h1 className={styles.pageTitle}>Latest News</h1>
      <div className={styles.articlesGrid}>
        {articles.length > 0 ? (
          articles.map((article) => (
            // The `isOwner` prop is now implicitly on the article object
            <ArticlePreview key={article.id} article={article} />
          ))
        ) : (
          <p>No articles found.</p>
        )}
      </div>
    </div>
  );
}
