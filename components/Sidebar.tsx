'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { type User } from '@supabase/supabase-js';

type SidebarProps = {
  user: User | null;
  isAdmin: boolean;
};

export function Sidebar({ user, isAdmin }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  if (!user) {
    return null; 
  }

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link href={`/profile/${user.id}`} className={`${styles.navLink} ${isActive('/profile') ? styles.active : ''}`}>
              Profile
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link href="/admin" className={`${styles.navLink} ${isActive('/admin') ? styles.active : ''}`}>
                Admin
              </Link>
            </li>
          )}
          <li>
            <Link href="/drafts" className={`${styles.navLink} ${isActive('/drafts') ? styles.active : ''}`}>
              Drafts
            </Link>
          </li>
          <li>
            <Link href="/settings" className={`${styles.navLink} ${isActive('/settings') ? styles.active : ''}`}>
              Settings
            </Link>
          </li>
          {/* Add other links as needed, e.g., Submit Article */}
          <li>
            <Link href="/submit" className={`${styles.navLink} ${isActive('/submit') ? styles.active : ''}`}>
              Submit Article
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
