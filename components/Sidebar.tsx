import Link from 'next/link';
import styles from './Sidebar.module.css';
import { type User } from '@supabase/supabase-js';

type SidebarProps = {
  user: User | null;
  isAdmin: boolean;
};

export default function Sidebar({ user, isAdmin }: SidebarProps) {
  if (!user) {
    return null; 
  }

  return (
    <aside className={styles.sidebar}>
      <nav>
        <ul>
          <li>
            <Link href={`/profile/${user.id}`}>Profile</Link>
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
