import Link from 'next/link';
import Image from 'next/image'; // Import the Next.js Image component
import styles from './ArticlePreview.module.css';
import { Article } from '@/types';
import { formatDate } from '@/utils/formatDate';

interface ArticlePreviewProps {
  article: Article & { isOwner?: boolean, author_full_name?: string };
}

export default function ArticlePreview({ article }: ArticlePreviewProps) {
  const authorName = article.author_full_name || 'Anonymous';
  const placeholderImage = '/placeholder.png'; // A default image in your /public folder

  return (
    <div className={styles.article}>
      <Link href={`/article/${article.slug}`} className={styles.cardImage}>
        <Image
          src={article.image_url || placeholderImage}
          alt={article.headline}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.image}
        />
      </Link>
      
      <div className={styles.cardContent}>
        <Link href={`/category/${article.category.toLowerCase()}`} className={styles.category}>{article.category}</Link>
        
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
    </div>
  );
}
