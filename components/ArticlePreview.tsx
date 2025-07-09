import Link from 'next/link';
import { Article } from '@/types'; // Ensure Article type is correctly imported
import styles from './ArticlePreview.module.css';
import ArticleManagementButtons from './ArticleManagementButtons'; // Import the new component

// Props interface should NOT include formatDate
interface ArticlePreviewProps {
  article: Article;
  isOwner: boolean; // We expect this prop to be passed
}

// Component signature should NOT destructure formatDate from props
export default function ArticlePreview({ article, isOwner }: ArticlePreviewProps) {
  if (!article) {
    return <p>Article data is not available.</p>; // Or some other placeholder
  }

  // Helper function to format the date
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  }

  return (
    <article className={styles.article}>
      <div className={styles.cardHeader}>
        <h2 className={styles.headline}>
          <Link href={`/article/${article.slug}`} className={styles.link}>
            {article.headline}
          </Link>
        </h2>
        {isOwner && <div className={styles.statusPill}>{article.status}</div>}
      </div>
      {article.category && (
        <div className={styles.category}>{article.category}</div>
      )}
      <p className={styles.excerpt}>{article.excerpt || 'No excerpt available.'}</p>
      <div className={styles.meta}>
        <span>By: {article.author_full_name || 'Anonymous'}</span>
        <span>Posted: {formatDate(article.created_at)}</span>
      </div>
      {/* Conditionally render the management buttons */}
      {isOwner && (
        <ArticleManagementButtons 
          articleSlug={article.slug}
          currentStatus={article.status} 
        />
      )}
    </article>
  );
}
