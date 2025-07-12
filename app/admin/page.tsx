// Remove "use client"; - This is now a Server Component

// Keep necessary server-side imports
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerComponentClient } from '@/lib/supabaseServerComponentClient';
import { checkUserRole } from '@/lib/authUtils';
import AdminDashboardClient from './AdminDashboardClient';
import { Article, Source } from '@/types'; // Import Article and Source types

const AdminPage = async () => {
  const supabase = createSupabaseServerComponentClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isAdmin = await checkUserRole(user.id, 'admin');

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }
  
  const { data: rawArticles, error: articlesError } = await supabase
    .from('articles')
    .select(`
      *,
      profiles:author_id (
        username
      )
    `)
    .order('created_at', { ascending: false });

  if (articlesError) {
    console.error('Error fetching articles for admin:', articlesError);
  }

  // Normalize the 'sources' field to ensure it's always an array or null
  const articles: Article[] = (rawArticles || []).map((article: any) => ({
    ...article,
    sources: Array.isArray(article.sources) ? article.sources : null,
  }));

  return <AdminDashboardClient initialArticles={articles} />;
};

export default AdminPage;
