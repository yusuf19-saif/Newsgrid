// Remove "use client"; - This is now a Server Component

// Keep necessary server-side imports
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer'; // Or your actual server client helper
import { checkUserRole } from '@/lib/supabaseServer'; // Assuming this is also from your server helper
import AdminDashboardClient from './AdminDashboardClient'; // Import the new Client Component

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  // Ensure createSupabaseServerClient is correctly set up for server components
  // It might need cookieStore passed, or it might get cookies internally.
  // Based on your previous setup for lib/supabaseServerComponentClient,
  // it likely handles cookies internally. Adjust if your lib/supabaseServer is different.
  const supabase = await createSupabaseServerClient(); 

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Error fetching user or no user found:", userError);
    redirect('/login?message=You must be logged in to view this page.');
    return null; // Ensure redirect is followed
  }

  const isAdmin = await checkUserRole(user.id, 'admin'); // Ensure this function exists and works

  if (!isAdmin) {
    redirect('/?message=Access Denied. You do not have permission to view this page.'); 
    return null; // Ensure redirect is followed
  }

  // If user is authenticated and is an admin, render the client component
  return <AdminDashboardClient />;
}
