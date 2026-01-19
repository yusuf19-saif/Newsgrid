'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { ThemeProvider } from '@/contexts/ThemeContext';
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
    if (isSidebarOpen) setSidebarOpen(false);
  }, [pathname]);

  return (
    <ThemeProvider>
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:font-medium"
        style={{ 
          backgroundColor: 'var(--background-secondary)',
          color: 'var(--text-primary)',
          border: '2px solid var(--accent-primary)'
        }}
      >
        Skip to main content
      </a>
      
      <div 
        className={`${styles.appContainer} min-h-screen transition-colors duration-300`}
        style={{ 
          backgroundColor: 'var(--background-primary)', 
          color: 'var(--text-primary)' 
        }}
      >
        
        {/* Main Wrapper - Full Width */}
        <div className="flex-1 flex flex-col transition-all duration-300">
            
            {/* Header */}
            <Header 
              onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
              onToggleCollapse={() => {}} 
            />

            <div className="relative flex flex-1">
              
              {/* Off-Canvas Sidebar (Mega Menu) */}
              <Sidebar 
                user={user} 
                isAdmin={isAdmin} 
                isOpen={isSidebarOpen} 
                isCollapsed={false} 
                onClose={() => setSidebarOpen(false)} 
              />
              
              {/* Overlay for mobile */}
              {isSidebarOpen && (
                <div 
                  className="fixed inset-0 bg-black/50 z-[1010] md:hidden"
                  onClick={() => setSidebarOpen(false)}
                  aria-hidden="true"
                />
              )}

              {/* Page Content */}
              <main id="main-content" className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8" tabIndex={-1}>
                {children}
              </main>

            </div>
            <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
}
