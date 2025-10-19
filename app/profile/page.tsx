"use client";

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { Article } from '@/types';
import styles from './profile.module.css';
import ArticlePreview from '@/components/ArticlePreview';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [submittedArticles, setSubmittedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchUserDataAndArticles = async () => {
      setLoading(true);
      setError(null);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        try {
          const response = await fetch(`/api/users/${currentUser.id}/articles`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch articles: ${response.statusText}`);
          }
          const articles: Article[] = await response.json();
          setSubmittedArticles(articles);
        } catch (err: any) {
          console.error("Error fetching user's articles:", err);
          setError(err.message || "Could not load your articles.");
        }
      } else {
        setError("You are not logged in.");
      }

      setLoading(false);
    };

    fetchUserDataAndArticles();
  }, [supabase]);

  if (loading) return <div className={styles.container}><p>Loading profile...</p></div>;
  if (error) return <div className={styles.container}><p className={styles.error}>{error}</p></div>;
  if (!user) return <div className={styles.container}><p>Please log in to view your profile.</p></div>;

  return (
    <div className={styles.container}>
      <h1>Your Profile</h1>
      <section className={styles.submittedSection}>
        <h2>Your Submitted Articles</h2>
        {submittedArticles.length > 0 ? (
          <div className={styles.articlesGrid}>
            {submittedArticles.map((article) => {
              const articleWithOwnerFlag = { ...article, isOwner: true };
              return <ArticlePreview key={article.id} article={articleWithOwnerFlag} />;
            })}
          </div>
        ) : (
          <p>You haven't submitted any articles yet.</p>
        )}
      </section>
    </div>
  );
}