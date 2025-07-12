'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import styles from './layout.module.css';

interface AppWrapperProps {
  children: React.ReactNode;
  user: User | null;
  isAdmin: boolean;
}

export default function AppWrapper({ children, user, isAdmin }: AppWrapperProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Close sidebar on route change
    if (isSidebarOpen) {
      setSidebarOpen(false);
    }
  }, [pathname, isSidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={styles.appContainer}>
      {isSidebarOpen && <div className={styles.overlay} onClick={toggleSidebar}></div>}
      {/* Pass user to Header if it needs it, otherwise it can fetch its own */}
      <Header onToggleSidebar={toggleSidebar} />
      <div className={styles.mainContentWrapper}>
        <Sidebar user={user} isAdmin={isAdmin} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={styles.pageContent}>
          {children}
          <Footer />
        </main>
      </div>
    </div>
  );
} 