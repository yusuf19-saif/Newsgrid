"use client";

import Link from 'next/link';
import styles from './Header.module.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// No longer directly using redirect from 'next/navigation' here for the action
// import { redirect } from 'next/navigation'; 

// Import the Server Action
import { handleSignOut } from '@/app/actions/authActions'; // Correcting the path

// Import the ThemeToggleButton
import { ThemeToggleButton } from './ThemeToggleButton'; // Ensure this path is correct

// Define a simple type for the user if needed, or import Supabase's User type
// import type { User as SupabaseUser } from '@supabase/supabase-js';
interface User {
  id: string;
  email?: string;
  // Add other properties you might expect from the user object
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true; // Flag to prevent setting state on unmounted component

    const fetchUserAndSubscribe = async () => {
      setIsLoadingUser(true);
      // Assuming '@/lib/supabaseClient' exports createSupabaseBrowserClient correctly
      // This file should initialize a Supabase client suitable for the browser
      const { createSupabaseBrowserClient } = await import('@/lib/supabaseClient');
      const supabaseBrowserClient = createSupabaseBrowserClient();

      // Get initial session
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      if (isMounted && session) {
        setUser(session.user as User);
      } else if (isMounted) {
        setUser(null);
      }
      if (isMounted) setIsLoadingUser(false);

      // Listen to auth changes
      const { data: { subscription } } = supabaseBrowserClient.auth.onAuthStateChange((_event, currentSession) => {
        if (isMounted) {
          setUser(currentSession?.user as User ?? null);
          setIsLoadingUser(false); // Ensure loading is false after auth state change
        }
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    };

    fetchUserAndSubscribe();
    
    // Cleanup function will be returned and called when the component unmounts
    return () => {
        isMounted = false;
        // If there was a subscription variable accessible here, unsubscribe it.
        // The one inside fetchUserAndSubscribe is scoped there, so we handle with isMounted.
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/submit", label: "Submit Article" },
    { href: "/categories", label: "Categories" },
    { href: "/about", label: "About" },
    { href: "/guidelines", label: "Guidelines" },
    { href: "/trustscore", label: "Trustscore" },
  ];

  if (isLoadingUser) {
    return (
        <header className={styles.header}>
            <div className={styles.headerCenterGroup}>
                <div className={styles.logoContainer}><Link href="/">NewsGrid</Link></div>
            </div>
            <div className={styles.headerRightGroup}>
                <ThemeToggleButton />
                <div className={styles.authSection}>Loading user...</div>
            </div>
        </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.logoAndToggler}>
        <div className={styles.logoContainer}>
          <Link href="/">NewsGrid</Link>
        </div>
        <button
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle navigation"
        >
          <span className={styles.hamburgerIconLine}></span>
          <span className={styles.hamburgerIconLine}></span>
          <span className={styles.hamburgerIconLine}></span>
        </button>
      </div>

      <nav className={`${styles.navLinks} ${styles.desktopNav}`}>
        <ul>
          {navItems.map(item => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}
        </ul>
      </nav>

      {isMobileMenuOpen && (
        <nav className={styles.mobileNav}>
          <ul>
            {navItems.map(item => (
              <li key={item.href}><Link href={item.href} onClick={() => setIsMobileMenuOpen(false)}>{item.label}</Link></li>
            ))}
            {!user && (
                <li><Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link></li>
            )}
             {/* Add Signup for mobile if not logged in */}
            {!user && (
                <li><Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link></li>
            )}
          </ul>
           {user && (
             <div className={styles.mobileAuthSection}>
                <span className={styles.userEmailMobile}>{user.email}</span>
                {/* Profile and Settings links for mobile */}
                <Link href="/profile" className={styles.navLinkMobile} onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
                <Link href="/settings" className={styles.navLinkMobile} onClick={() => setIsMobileMenuOpen(false)}>Settings</Link>
                <form action={handleSignOut} onSubmit={() => setIsMobileMenuOpen(false)}>
                    <button type="submit" className={styles.signOutButtonMobile}>Sign Out</button>
                </form>
             </div>
            )}
        </nav>
      )}

      <div className={styles.headerRightGroup}>
        <div className={styles.searchContainer}>
          <form action="/search" method="GET" className={styles.searchForm}>
            <input type="search" name="q" placeholder="Search articles..." className={styles.searchInput} />
            <button type="submit" className={styles.searchButton}>Search</button>
          </form>
        </div>

        <ThemeToggleButton />

        <div className={`${styles.authSection} ${styles.desktopAuth}`}>
          {user ? (
            <>
              <span className={styles.userEmail}>{user.email}</span>
              <form action={handleSignOut}>
                <button type="submit" className={styles.logoutButton}>Logout</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={`${styles.loginButton} ${styles.buttonStyle}`}>Log In</Link>
              <Link href="/signup" className={styles.navLink}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
