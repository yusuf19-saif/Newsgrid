"use client";

import Link from 'next/link';
import styles from './Header.module.css';
import { useState, useEffect } from 'react';
import { handleSignOut } from '@/app/actions/authActions';
import { ThemeToggleButton } from './ThemeToggleButton';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleCollapse: () => void;
}

export default function Header({ onToggleSidebar, onToggleCollapse: _onToggleCollapse }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className={styles.headerShell}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.iconButton}
            onClick={onToggleSidebar}
            aria-label="Open Menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className={styles.logoContainer}>
            <Link href="/" aria-label="NewsGrid Home">
              <span className={styles.logoWordNews}>News</span>
              <span className={styles.logoWordGrid}>Grid</span>
            </Link>
          </div>
        </div>

        <div className={styles.headerRight}>
          <form action="/search" method="GET" className={styles.desktopSearchForm}>
            <input
              type="search"
              name="q"
              placeholder="Search NewsGrid..."
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchSubmitButton} aria-label="Search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
          </form>

          <button
            type="button"
            className={`${styles.iconButton} ${styles.mobileSearchToggle}`}
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            aria-expanded={isMobileSearchOpen}
            aria-controls="mobile-search-panel"
            aria-label="Toggle Search"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>

          <div className={styles.themeToggleWrap}>
            <ThemeToggleButton />
          </div>

          {user ? (
            <form action={handleSignOut} className={styles.desktopAuthAction}>
              <button type="submit" className={styles.secondaryButton}>Sign Out</button>
            </form>
          ) : (
            <>
              <Link href="/login" className={`${styles.primaryButton} ${styles.desktopAuthAction}`}>
                Log In
              </Link>
              <Link href="/login" className={styles.compactAccountButton}>
                Account
              </Link>
            </>
          )}
        </div>
      </header>

      <div
        id="mobile-search-panel"
        className={`${styles.mobileSearchPanel} ${isMobileSearchOpen ? styles.mobileSearchPanelOpen : ''}`}
        aria-hidden={!isMobileSearchOpen}
      >
        <form action="/search" method="GET" className={styles.mobileSearchForm}>
          <input
            type="search"
            name="q"
            placeholder="Search NewsGrid..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchSubmitButton} aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
