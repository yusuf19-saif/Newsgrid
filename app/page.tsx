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

async function getArticles(): Promise<Article[]> {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      author:profiles (
        full_name
      )
    `)
    .eq('status', 'Published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  // The query now returns an 'author' object with 'full_name'
  // We need to map this to the 'author_full_name' property expected by the Article type
  return data.map(article => ({
    ...article,
    author_full_name: article.author?.full_name || 'Anonymous'
  }));
}

export default async function HomePage() {
  const articles = await getArticles();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Latest News</h1>
      {articles && articles.length > 0 ? (
        <div className={styles.articlesGrid}>
          {articles.map((article) => (
            <ArticlePreview key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <p>No articles found. Check back later or try submitting one!</p>
      )}
    </div>
  );
}
