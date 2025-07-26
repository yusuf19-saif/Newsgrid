'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { ThemeProvider } from '@/contexts/ThemeContext'; // Import the provider

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
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <ThemeProvider>
      <div className={`${styles.appContainer} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        {isSidebarOpen && <div className={styles.overlay} onClick={toggleSidebar}></div>}
        {/* Pass user to Header if it needs it, otherwise it can fetch its own */}
        <Header onToggleSidebar={toggleSidebar} onToggleCollapse={toggleSidebarCollapse} />
        <div className={styles.mainContentWrapper}>
          <Sidebar user={user} isAdmin={isAdmin} isOpen={isSidebarOpen} isCollapsed={isSidebarCollapsed} onClose={() => setSidebarOpen(false)} />
          <main className={styles.pageContent}>
            {/* Wrap children in a div that can grow */}
            <div className={styles.contentArea}>
              {children}
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
} 