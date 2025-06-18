"use client"; // This component handles client-side interactions and state

import { useEffect, useState, useCallback } from 'react';
import styles from './admin.module.css'; // Assuming admin.module.css is in app/admin/
import { Article } from '@/types';
import { formatDate } from '@/utils/formatDate';

export default function AdminDashboardClient() {
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPendingArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Make sure your API route is correctly defined, e.g., /api/admin/pending-articles
      const response = await fetch('/api/admin/articles?status=Pending'); // Ensure 'Pending' matches the status your API expects
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch pending articles: ${response.statusText}`);
      }
      const articlesData = await response.json();
      // If your API returns { articles: [...] }, use articlesData.articles
      // If it returns directly an array, articlesData is fine.
      setPendingArticles(articlesData.articles || articlesData); 
    } catch (err: any) {
      console.error("Error fetching pending articles:", err);
      setError(err.message || "Could not load pending articles. The API might be down or you might not have permissions if the API checks them.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingArticles();
  }, [fetchPendingArticles]);

  const handleUpdateStatus = async (articleId: string, newStatus: 'Published' | 'Rejected') => {
    setActionError(null);
    try {
      // Make sure your API route is correctly defined, e.g., /api/admin/articles/[articleId]/status
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
      await fetchPendingArticles(); // Refresh the list
    } catch (err: any) {
      console.error(`Error updating status for article ${articleId}:`, err);
      setActionError(err.message || `Could not ${newStatus === 'Published' ? 'publish' : 'reject'} article.`);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading pending articles...</div>;
  }

  if (error) {
    return <div className={styles.container}><p className={styles.error}>{error}</p></div>;
  }

  return (
    <div className={styles.container}>
      <h1>Admin Dashboard - Pending Articles</h1>
      
      {actionError && <p className={styles.error}>{actionError}</p>}

      {pendingArticles.length === 0 ? (
        <p>No articles are currently pending review.</p>
      ) : (
        <div>
          {pendingArticles.map((article) => (
            <div key={article.id} className={styles.articleItem}>
              <h3>{article.headline}</h3>
              <div className={styles.articleDetails}>
                <p><strong>Content Preview:</strong> {article.content?.substring(0, 200)}...</p>
                <p><strong>Category:</strong> {article.category}</p>
                <p><strong>Source:</strong> {article.source || 'N/A'}</p>
                <p><strong>Submitted:</strong> {formatDate(article.created_at)}</p>
                <p><strong>Current Status:</strong> {article.status}</p>
                <p><strong>Author ID:</strong> {article.author_id || 'N/A'}</p>
              </div>
              <div className={styles.actions}>
                <button 
                  onClick={() => handleUpdateStatus(article.id, 'Published')}
                  className={styles.publishButton}
                >
                  Publish
                </button>
                <button 
                  onClick={() => handleUpdateStatus(article.id, 'Rejected')}
                  className={styles.rejectButton} // Add a class for reject button
                >
                  Reject
                </button> 
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
