'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { type User } from '@supabase/supabase-js';
import { handleSignOut } from '@/app/actions/authActions';
import { 
  FiUser, 
  FiFileText, 
  FiSettings, 
  FiPlusSquare, 
  FiShield, 
  FiLogOut,
  FiLogIn,
  FiUserPlus
} from 'react-icons/fi';

type SidebarProps = {
  user: User | null;
  isAdmin: boolean;
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
};

export function Sidebar({ user, isAdmin, isOpen, isCollapsed, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));

  const userNavItems = [
    { href: user ? `/profile/${user.id}` : '/profile', label: 'Profile', icon: <FiUser /> },
    { href: '/drafts', label: 'Drafts', icon: <FiFileText /> },
    { href: '/settings', label: 'Settings', icon: <FiSettings /> },
    { href: '/submit', label: 'Submit Article', icon: <FiPlusSquare /> }
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Admin', icon: <FiShield /> }
  ];

  const authNavItems = [
    { href: '/login', label: 'Log In', icon: <FiLogIn /> },
    { href: '/signup', label: 'Sign Up', icon: <FiUserPlus /> }
  ];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isCollapsed ? styles.collapsed : ''}`}>
      <nav className={styles.nav}>
        {/* User-Specific Navigation */}
        {user && (
          <ul className={styles.navList}>
            <li className={styles.navSectionTitle}>My Account</li>
            {userNavItems.map(item => (
              <li key={item.href}>
                <Link href={item.href} className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`} onClick={onClose}>
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            ))}

            {isAdmin && adminNavItems.map(item => (
              <li key={item.href}>
                <Link href={item.href} className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`} onClick={onClose}>
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            ))}
            <li>
                <form action={handleSignOut} className={styles.signOutForm}>
                    <button type="submit" className={styles.signOutButton}>
                      <span className={styles.navIcon}><FiLogOut /></span>
                      <span className={styles.navLabel}>Sign Out</span>
                    </button>
                </form>
            </li>
          </ul>
        )}

        {/* Auth actions if no user */}
        {!user && (
             <ul className={styles.navList}>
                <li className={styles.navSectionTitle}>Account</li>
                {authNavItems.map(item => (
                  <li key={item.href}>
                    <Link href={item.href} className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`} onClick={onClose}>
                      <span className={styles.navIcon}>{item.icon}</span>
                      <span className={styles.navLabel}>{item.label}</span>
                    </Link>
                  </li>
                ))}
            </ul>
        )}
      </nav>
    </aside>
  );
}
