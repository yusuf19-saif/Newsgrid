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

  // Use the correct class names from the CSS module
  return (
    <div className={styles.article}>
      <Link href={`/article/${article.slug}`} className={styles.category}>{article.category}</Link>
      
      <h2 className={styles.headline}>
        <Link href={`/article/${article.slug}`} className={styles.link}>
          {article.headline}
        </Link>
      </h2>

      <p className={styles.excerpt}>{article.excerpt || "No excerpt available."}</p>

      <div className={styles.meta}>
        <span>By: {authorName}</span>
        <span>Posted: {formatDate(article.created_at)}</span>
      </div>

      {article.isOwner && (
        <div className={styles.managementControls}>
          <Link href={`/submit?draftId=${article.id}`}>
            <button className={styles.editButton}>Edit</button>
          </Link>
        </div>
      )}
    </div>
  );
}
