import Link from 'next/link';
import styles from './ArticlePreview.module.css';
import { Article } from '@/types';
import { formatDate } from '@/utils/formatDate';

// Define the component's props
interface ArticlePreviewProps {
  article: Article & { isOwner?: boolean, author_full_name?: string };
}

// No longer need the `isOwner` prop separately, it's part of the article object
export default function ArticlePreview({ article }: ArticlePreviewProps) {
  const authorName = article.author_full_name || 'Anonymous';
  
  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <span className={styles.category}>{article.category}</span>
        <h2 className={styles.title}>
          <Link href={`/article/${article.slug}`}>
            {article.headline}
          </Link>
        </h2>
        <p className={styles.excerpt}>{article.excerpt || "No excerpt available."}</p>
        <div className={styles.footer}>
          <span className={styles.author}>By: {authorName}</span>
          <span className={styles.date}>Posted: {formatDate(article.created_at)}</span>
        </div>
        {/* Example of using the isOwner flag */}
        {article.isOwner && (
          <div className={styles.ownerActions}>
            <Link href={`/submit?draftId=${article.id}`} className={styles.editButton}>
              Edit
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
