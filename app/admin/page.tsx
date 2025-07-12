// Remove "use client"; - This is now a Server Component

// Keep necessary server-side imports
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerComponentClient } from '@/lib/supabaseServerComponentClient'; // CORRECTED PATH
import { checkUserRole } from '@/lib/authUtils'; // CORRECTED PATH
import AdminDashboardClient from './AdminDashboardClient';

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
  
  // Fetch data on the server and pass it to the client component
  const { data: articles, error: articlesError } = await supabase
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
    // You might want to render an error state in the client component
  }

  return <AdminDashboardClient initialArticles={articles || []} />;
};

export default AdminPage;
