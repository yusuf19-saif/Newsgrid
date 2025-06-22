import Link from 'next/link';
import styles from './Sidebar.module.css';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { checkUserRole } from '@/lib/authUtils'; // Adjust path if needed

export default async function Sidebar() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // No need for set/remove in a read-only component like this for auth state
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    isAdmin = await checkUserRole(user.id, 'admin');
  }

  if (!user) {
    // If no user is logged in, perhaps don't render the sidebar 
    // or render a minimal version. For now, let's not render it if no user.
    // This depends on how you want your layout to behave for logged-out users.
    // Alternatively, the layout itself could decide not to include the Sidebar.
    return null; 
  }

  return (
    <aside className={styles.sidebar}>
      <nav>
        <ul>
          <li>
            <Link href="/profile">Profile</Link>
          </li>
          {isAdmin && (
            <li>
              <Link href="/admin">Admin</Link>
            </li>
          )}
          <li>
            <Link href="/settings">Settings</Link>
          </li>
          {/* Add other links as needed, e.g., Submit Article */}
          <li>
            <Link href="/submit">Submit Article</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
