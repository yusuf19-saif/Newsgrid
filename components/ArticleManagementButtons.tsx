'use client';

import { useRouter } from 'next/navigation';
import styles from './ArticlePreview.module.css';

interface ArticleManagementButtonsProps {
  articleSlug: string;
  currentStatus: string;
}

export default function ArticleManagementButtons({ articleSlug, currentStatus }: ArticleManagementButtonsProps) {
  const router = useRouter();

  const handleUpdateStatus = async (newStatus: 'Published' | 'pending_review') => {
    try {
      const response = await fetch(`/api/articles/${articleSlug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status.');
      }

      alert(`Article has been ${newStatus === 'pending_review' ? 'unpublished' : 'published'}.`);
      router.refresh();
    } catch (error) {
      console.error('Error updating article status:', error);
      alert((error as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this article?')) {
      return;
    }

    try {
      const response = await fetch(`/api/articles/${articleSlug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete article.');
      }

      alert('Article has been deleted.');
      router.refresh();
    } catch (error) {
      console.error('Error deleting article:', error);
      alert((error as Error).message);
    }
  };

  return (
    <div className={styles.managementControls}>
      {currentStatus === 'pending_review' && (
        <button onClick={() => handleUpdateStatus('Published')} className={styles.publishButton}>
          Publish
        </button>
      )}
      {currentStatus === 'Published' && (
        <button onClick={() => handleUpdateStatus('pending_review')} className={styles.unpublishButton}>
          Unpublish
        </button>
      )}
      <button onClick={handleDelete} className={styles.deleteButton}>
        Delete
      </button>
    </div>
  );
}
