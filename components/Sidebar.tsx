'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { type User } from '@supabase/supabase-js';
import { ThemeToggleButton } from './ThemeToggleButton';
import { handleSignOut } from '@/app/actions/authActions';

type SidebarProps = {
  user: User | null;
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ user, isAdmin, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));

  const mainNavItems = [
    { href: "/", label: "Home" },
    { href: "/categories", label: "Categories" },
    { href: "/about", label: "About" },
    { href: "/guidelines", label: "Guidelines" },
    { href: "/trustscore", label: "Trustscore" },
  ];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarHeader}>
        <span>Navigation</span>
        <ThemeToggleButton />
      </div>
      <nav className={styles.nav}>
        {/* General Navigation */}
        <ul className={styles.navList}>
           <li className={styles.navSectionTitle}>Menu</li>
          {mainNavItems.map(item => (
            <li key={item.href}>
              <Link href={item.href} className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`} onClick={onClose}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* User-Specific Navigation */}
        {user && (
          <ul className={styles.navList}>
            <li className={styles.navSectionTitle}>My Account</li>
            <li>
              <Link href={`/profile/${user.id}`} className={`${styles.navLink} ${isActive(`/profile/${user.id}`) ? styles.active : ''}`} onClick={onClose}>
                Profile
              </Link>
            </li>
             <li>
                <Link href="/drafts" className={`${styles.navLink} ${isActive('/drafts') ? styles.active : ''}`} onClick={onClose}>
                    Drafts
                </Link>
            </li>
            <li>
              <Link href="/settings" className={`${styles.navLink} ${isActive('/settings') ? styles.active : ''}`} onClick={onClose}>
                Settings
              </Link>
            </li>
            <li>
                <Link href="/submit" className={`${styles.navLink} ${isActive('/submit') ? styles.active : ''}`} onClick={onClose}>
                Submit Article
                </Link>
            </li>
            {isAdmin && (
              <li>
                <Link href="/admin" className={`${styles.navLink} ${isActive('/admin') ? styles.active : ''}`} onClick={onClose}>
                  Admin
                </Link>
              </li>
            )}
            <li>
                <form action={handleSignOut} className={styles.signOutForm}>
                    <button type="submit" className={styles.signOutButton}>Sign Out</button>
                </form>
            </li>
          </ul>
        )}

        {/* Auth actions if no user */}
        {!user && (
             <ul className={styles.navList}>
                <li className={styles.navSectionTitle}>Account</li>
                <li><Link href="/login" className={styles.navLink} onClick={onClose}>Log In</Link></li>
                <li><Link href="/signup" className={styles.navLink} onClick={onClose}>Sign Up</Link></li>
            </ul>
        )}
      </nav>
    </aside>
  );
}
