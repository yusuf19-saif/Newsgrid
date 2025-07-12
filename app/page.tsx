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
async function getArticles() {
  const supabase = createSupabaseServerComponentClient();

  // Fetch articles that are 'Published' and join with the author's profile
  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      author:profiles (
        full_name
      )
    `)
    .eq("status", "Published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching articles:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // --- FIX: Normalize the 'sources' data ---
  // The 'any' type is used here to handle the inconsistent data from the DB
  const articles: Article[] = data.map((article: any) => ({
    ...article,
    author_full_name: article.author?.full_name || 'Anonymous',
    // Ensure sources is always an array or null, never a string
    sources: Array.isArray(article.sources) ? article.sources : null,
  }));

  return articles;
}


export default async function HomePage() {
  const supabase = await createSupabaseServerComponentClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  const articles = await getArticles();

  return (
    <div className={styles.homeContainer}>
      <h1 className={styles.pageTitle}>Latest News</h1>
      <div className={styles.articlesGrid}>
        {articles.length > 0 ? (
          articles.map((article) => (
            <ArticlePreview key={article.id} article={article} />
          ))
        ) : (
          <p>No articles found.</p>
        )}
      </div>
    </div>
  );
}
