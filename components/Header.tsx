"use client";

import Link from 'next/link';
import styles from './Header.module.css';
import { useState, useEffect } from 'react';
import { handleSignOut } from '@/app/actions/authActions';
import { ThemeToggleButton } from './ThemeToggleButton';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { FiMenu, FiSearch } from 'react-icons/fi';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleCollapse: () => void;
}

export default function Header({ onToggleSidebar, onToggleCollapse }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  
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
    <header className={styles.header}>
      {/* Left: Brand & Sidebar Toggle */}
      <div className={styles.headerLeft}>
        <button
          className={styles.sidebarToggleButton}
          onClick={onToggleSidebar}
          aria-label="Open Menu"
        >
          <FiMenu />
        </button>
        <div className={styles.logoContainer}>
          <Link href="/">
            <span className="text-slate-900 dark:text-white transition-colors">News</span>
            <span className="text-[#10b981]">Grid</span>
          </Link>
        </div>
      </div>

      {/* Right: Utilities Cluster */}
      <div className={styles.headerRight}>
        
        {/* CLEAN SEARCH BAR (No expansion, just simple and aligned) */}
        <form action="/search" method="GET" className="relative hidden md:block">
            <input 
              type="search" 
              name="q" 
              placeholder="Search NewsGrid..." 
              className="w-64 h-10 pl-4 pr-10 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
            />
            <button 
              type="submit" 
              className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-slate-400 hover:text-green-500"
            >
               <FiSearch size={18} />
            </button>
        </form>

        {/* Mobile Search Icon (Only visible on small screens) */}
        <Link href="/search" className="md:hidden p-2 text-slate-500 dark:text-slate-400">
           <FiSearch size={22} />
        </Link>

        <ThemeToggleButton />
        
        <div className={styles.authSection}>
          {user ? (
            <form action={handleSignOut}>
              <button type="submit" className={styles.logoutButton}>Sign Out</button>
            </form>
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
