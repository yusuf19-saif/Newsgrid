// my-app/app/page.tsx
import Link from 'next/link';
import ArticlePreview from '@/components/ArticlePreview'; // Assuming ArticlePreview is in components
import { Article } from '@/types'; // Assuming your Article type is in types/index.ts
import styles from './page.module.css'; // Assuming you have some page-specific styles

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
  try {
    // IMPORTANT: Ensure this URL is correct and uses port 3000
    const res = await fetch('http://localhost:3000/api/articles', {
      cache: 'no-store', // Fetches fresh data on every request
    });

    if (!res.ok) {
      console.error('Failed to fetch articles, status:', res.status);
      // Consider throwing an error or returning a specific error object
      // For now, returning an empty array or logging should suffice for debugging
      return [];
    }
    const data = await res.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching articles:', error);
    return []; // Return empty array on error
  }
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
