'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { type User } from '@supabase/supabase-js';
import { handleSignOut } from '@/app/actions/authActions';
import { 
  FiUser, FiFileText, FiSettings, FiPlusSquare, FiShield, 
  FiLogOut, FiLogIn, FiUserPlus, FiHome, FiGrid, FiInfo, FiCheckCircle, FiBookmark 
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
  const isActive = (path: string) => pathname === path;

  // Moved from Header
  const mainNavItems = [
    { href: "/", label: "Home", icon: <FiHome /> },
    { href: "/categories", label: "Categories", icon: <FiGrid /> },
    { href: "/trustscore", label: "TrustScore", icon: <FiCheckCircle /> },
    { href: "/about", label: "About", icon: <FiInfo /> },
    { href: "/guidelines", label: "Guidelines", icon: <FiFileText /> },
  ];

  const userNavItems = [
    { href: user ? `/profile/${user.id}` : '/profile', label: 'My Profile', icon: <FiUser /> },
    { href: '/bookmarks', label: 'Saved Articles', icon: <FiBookmark /> },
    { href: '/drafts', label: 'My Drafts', icon: <FiFileText /> },
    { href: '/settings', label: 'Settings', icon: <FiSettings /> },
    { href: '/submit', label: 'Submit Article', icon: <FiPlusSquare /> }
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Admin Dashboard', icon: <FiShield /> }
  ];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isCollapsed ? styles.collapsed : ''}`}>
      <nav className={styles.nav}>
        
        {/* SECTION 1: MAIN NAVIGATION (Moved from Header) */}
        <ul className={styles.navList}>
            <li className={styles.navSectionTitle}>Explore</li>
            {mainNavItems.map(item => (
              <li key={item.href}>
                <Link href={item.href} className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`} onClick={onClose}>
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            ))}
        </ul>

        {/* SECTION 2: USER ACCOUNT */}
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

        {/* SECTION 3: AUTH (If not logged in) */}
        {!user && (
           <ul className={styles.navList}>
              <li className={styles.navSectionTitle}>Join NewsGrid</li>
              <li key="login">
                <Link href="/login" className={styles.navLink} onClick={onClose}>
                  <span className={styles.navIcon}><FiLogIn /></span>
                  <span className={styles.navLabel}>Log In</span>
                </Link>
              </li>
              <li key="signup">
                <Link href="/signup" className={styles.navLink} onClick={onClose}>
                  <span className={styles.navIcon}><FiUserPlus /></span>
                  <span className={styles.navLabel}>Sign Up</span>
                </Link>
              </li>
           </ul>
        )}
      </nav>
    </aside>
  );
}
