"use client";

import Link from 'next/link';
import styles from './Header.module.css';
import { useState, useEffect } from 'react';
// No longer using useRouter directly
// import { useRouter } from 'next/navigation';

import { handleSignOut } from '@/app/actions/authActions';
import { ThemeToggleButton } from './ThemeToggleButton';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { FiMenu } from 'react-icons/fi';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleCollapse: () => void; // For desktop collapse
}

export default function Header({ onToggleSidebar, onToggleCollapse }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createSupabaseBrowserClient();

    const fetchUserAndSubscribe = async () => {
      setIsLoadingUser(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (isMounted) {
        setUser(session?.user ?? null);
        setIsLoadingUser(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        if (isMounted) {
          setUser(currentSession?.user ?? null);
        }
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    };

    fetchUserAndSubscribe();
    
    return () => { isMounted = false; };
  }, []);

  const mainNavItems = [
    { href: "/", label: "Home" },
    { href: "/categories", label: "Categories" },
    { href: "/about", label: "About" },
    { href: "/guidelines", label: "Guidelines" },
    { href: "/trustscore", label: "Trustscore" },
  ];

  if (isLoadingUser) {
    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <div className={styles.logoContainer}><Link href="/">NewsGrid</Link></div>
            </div>
            <div className={styles.headerRight}>
                <div className={styles.authSection}>Loading...</div>
            </div>
        </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button
          className={`${styles.sidebarToggleButton} ${styles.desktopOnly}`}
          onClick={onToggleCollapse}
          aria-label="Toggle sidebar collapse"
        >
          <FiMenu />
        </button>
        <div className={styles.logoContainer}>
          <Link href="/">NewsGrid</Link>
        </div>
        <nav className={`${styles.navLinks} ${styles.desktopOnly}`}>
          <ul>
            {mainNavItems.map(item => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}
          </ul>
        </nav>
      </div>

      <div className={styles.headerRight}>
        <div className={`${styles.searchContainer} ${styles.desktopOnly}`}>
          <form action="/search" method="GET" className={styles.searchForm}>
            <input type="search" name="q" placeholder="Search..." className={styles.searchInput} />
            <button type="submit" className={styles.searchButton}>Search</button>
          </form>
        </div>

        <div className={`${styles.desktopOnly}`}>
          <ThemeToggleButton />
        </div>
        
        <div className={`${styles.authSection} ${styles.desktopOnly}`}>
          {user ? (
            <>
              {/* Profile/settings links are in the sidebar now */}
              <form action={handleSignOut}>
                <button type="submit" className={styles.logoutButton}>Sign Out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={`${styles.loginButton} ${styles.buttonStyle}`}>Log In</Link>
              <Link href="/signup" className={styles.navLink}>Sign Up</Link>
            </>
          )}
        </div>

        <button
          className={styles.mobileMenuButton}
          onClick={onToggleSidebar} // This now controls the main sidebar
          aria-label="Toggle sidebar"
        >
          <span className={styles.hamburgerIconLine}></span>
          <span className={styles.hamburgerIconLine}></span>
          <span className={styles.hamburgerIconLine}></span>
        </button>
      </div>
    </header>
  );
}
