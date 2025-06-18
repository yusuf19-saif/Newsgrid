import Link from 'next/link';
import { Article } from '@/types'; // Ensure Article type is correctly imported
import styles from './ArticlePreview.module.css';
import { formatDate } from '@/utils/formatDate'; // <--- Imported here

// Props interface should NOT include formatDate
interface ArticlePreviewProps {
  article: Article;
}

// Component signature should NOT destructure formatDate from props
export default function ArticlePreview({ article }: ArticlePreviewProps) {
  if (!article) {
    return <p>Article data is not available.</p>; // Or some other placeholder
  }

  return (
    <article className={styles.articlePreview}>
      <Link href={`/article/${article.slug}`} className={styles.titleLink}>
        <h2>{article.headline || 'Untitled Article'}</h2>
      </Link>
      {article.category && (
        <Link 
          href={`/category/${article.category.toLowerCase()}`} 
          className={`${styles.categoryTag} button-style-category`}
        >
          {article.category}
        </Link>
      )}
      <p className={styles.excerpt}>{article.excerpt || 'No excerpt available.'}</p>
      <div className={styles.metadata}>
        {/* Replace Source with Author */}
        {article.author_full_name && article.author_full_name !== 'Unknown Author' ? (
          <p className={styles.author}>By: {article.author_full_name}</p>
        ) : (
          <p className={styles.author}>By: Anonymous</p> // Or don't show if unknown, your preference
        )}
        <p className={styles.timestamp}>
          Posted: {formatDate(article.created_at)}
        </p>
      </div>
    </article>
  );
}
