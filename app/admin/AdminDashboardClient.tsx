"use client";

import { useEffect, useState, useCallback } from 'react';
import styles from './admin.module.css';
import { Article } from '@/types';
import { formatDate } from '@/utils/formatDate';

// Define the type for the props the component will accept
interface AdminDashboardClientProps {
  initialArticles: Article[];
}

// Update the component to accept the props
export default function AdminDashboardClient({ initialArticles }: AdminDashboardClientProps) {
  // Use the passed-in articles as the initial state
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [isLoading, setIsLoading] = useState(false); // No longer loading initially
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // This function can now be used just for refreshing data after an action
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // The API route should probably fetch all articles, not just pending,
      // or be adapted based on what this dashboard should show.
      // For now, let's assume it fetches all articles for the admin view.
      const response = await fetch('/api/admin/articles');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch articles');
      }
      const articlesData = await response.json();
      setArticles(articlesData || []);
    } catch (err: any) {
      console.error("Error fetching articles:", err);
      setError(err.message || "Could not load articles.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // We no longer need a useEffect to fetch on initial load,
  // since we get the data via props.

  const handleUpdateStatus = async (articleId: string, newStatus: 'Published' | 'Rejected' | 'pending_review') => {
    setActionError(null);
    setIsLoading(true); // Show loading feedback during the update
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update status for article ${articleId}`);
      }
      // Instead of fetching all articles again, just remove the one we acted on.
      // This is more optimistic and faster.
      setArticles(prevArticles => prevArticles.filter(a => a.id !== articleId));
    } catch (err: any) {
      console.error(`Error updating status for article ${articleId}:`, err);
      setActionError(err.message || `Could not update article status.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Admin Dashboard</h1>
      
      {actionError && <p className={styles.error}>{actionError}</p>}
      
      {isLoading && <div className={styles.loading}>Updating...</div>}

      {articles.length === 0 && !isLoading ? (
        <p>No articles are available.</p>
      ) : (
        <div className={styles.articlesGrid}>
          {articles.map((article) => (
            <div key={article.id} className={styles.articleItem}>
              <h3>{article.headline}</h3>
              <div className={styles.articleDetails}>
                <p><strong>Content Preview:</strong> {article.content?.substring(0, 150)}...</p>
                <p><strong>Category:</strong> {article.category}</p>
                {/* It's better to display the author's username */}
                <p><strong>Author:</strong> {(article as any).profiles?.username || 'N/A'}</p>
                <p><strong>Submitted:</strong> {formatDate(article.created_at)}</p>
                <p><strong>Status:</strong> <span className={`${styles.status} ${styles[article.status.toLowerCase().replace(/ /g, '')]}`}>{article.status}</span></p>
              </div>
              {article.status === 'pending_review' && (
                <div className={styles.actions}>
                  <button 
                    onClick={() => handleUpdateStatus(article.id, 'Published')}
                    className={`${styles.button} ${styles.publishButton}`}
                  >
                    Publish
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(article.id, 'Rejected')}
                    className={`${styles.button} ${styles.rejectButton}`}
                  >
                    Reject
                  </button> 
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
