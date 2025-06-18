"use client"; // Add "use client" if you plan state/effects here, otherwise can be server component

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { Article } from '@/types'; // Adjust path if needed ('../../types')
import styles from './profile.module.css'; // We'll create this next
import ArticlePreview from '@/components/ArticlePreview'; // Adjust path as needed
import { formatDate } from '@/utils/formatDate'; // Adjust path as needed

// --- Placeholder User Data ---
// This would normally come from an authentication context or session
const placeholderUser = {
    username: 'NewsFan123',
    email: 'user@example.com',
};
// --- End Placeholder User Data ---


// --- Placeholder Submitted Articles (with created_at) ---
// Using ISO 8601 format for dates is good practice
const dummySubmittedArticles: Article[] = [
    { id: '3', headline: 'Protestors Gather Outside Parliament Building', content: 'Full details about the protest...', excerpt: '...', source: 'Anonymous', category: 'Politics', created_at: '2025-05-04T10:00:00Z', slug: 'protestors-parliament-building', status: 'Published' },
    { id: '5', headline: 'Downtown Hosts Annual Music Festival and Park Events', content: 'Full coverage of the festival...', excerpt: '...', source: 'Citizen Report', category: 'Local', created_at: '2025-05-01T15:30:00Z', slug: 'downtown-music-festival', status: 'Published' },
    { id: 'sub1', headline: 'Inquiry Launched into Local Water Quality Concerns', content: 'Details on the water quality investigation...', excerpt: 'Officials confirmed an investigation is underway following multiple resident complaints...', source: 'Self', category: 'Local', created_at: '2025-05-05T09:00:00Z', slug: 'local-water-quality-inquiry', status: 'Pending' },
    { id: 'sub2', headline: 'Opinion: Why We Need More Bike Lanes', content: 'The full opinion piece content...', excerpt: 'An argument for expanding cycling infrastructure in the city...', source: 'Self', category: 'Opinion', created_at: '2025-05-03T12:00:00Z', slug: 'opinion-bike-lanes', status: 'Rejected' }, // Example of rejected item
];
// --- End Placeholder Submitted Articles ---


// Helper function to get status class
const getStatusClass = (status?: Article['status']) => {
    switch (status) {
        case 'Published': return styles.statusPublished;
        case 'Pending': return styles.statusPending;
        case 'Rejected': return styles.statusRejected;
        default: return '';
    }
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null); // Using 'any' for simplicity, define a User type if preferred
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
          // Fetch articles submitted by the user
          const response = await fetch(`/api/users/${currentUser.id}/articles`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch articles: ${response.statusText}`);
          }
          const articles: Article[] = await response.json();
          setSubmittedArticles(articles);
        } catch (err: any) {
          console.error("Error fetching user's articles:", err);
          setError(err.message || "Could not load your articles.");
        }
      } else {
        // Handle case where user is not logged in, though profile page should ideally be protected
        setError("You are not logged in.");
      }
      setLoading(false);
    };

    fetchUserDataAndArticles();
  }, [supabase]); // Re-run if supabase client instance changes (though it shouldn't often)

  if (loading) {
    return <div className={styles.container}><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p className={styles.error}>{error}</p></div>;
  }

  if (!user) {
    // This case should ideally be handled by a route guard or redirect
    return <div className={styles.container}><p>Please log in to view your profile.</p></div>;
  }

  return (
    <div className={styles.container}>
      <h1>Your Profile</h1>

      <section className={styles.submittedSection}>
        <h2>Your Submitted Articles</h2>
        {submittedArticles.length > 0 ? (
          <div className={styles.articlesGrid}>
            {submittedArticles.map((article) => (
              <ArticlePreview key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p>You haven't submitted any articles yet.</p>
        )}
      </section>

      {/* Placeholder for editing profile information if you add that later */}
      {/* 
      <section className={styles.editProfileSection}>
        <h2>Edit Profile</h2>
        <p>Profile editing functionality coming soon.</p>
      </section> 
      */}
    </div>
  );
}
