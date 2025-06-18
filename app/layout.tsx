import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header"; // Assuming Header is in components
import Footer from "@/components/Footer"; // Assuming Footer is in components
import Sidebar from "@/components/Sidebar"; // Import the new Sidebar
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext"; // Import ThemeProvider
import styles from './layout.module.css'; // Import the new CSS module

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NewsGrid",
  description: "Open Platform for Factual News",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider> {/* Wrap your main content with ThemeProvider */}
          <div className={styles.appContainer}>
            <Header />
            <div className={styles.mainContentWrapper}>
              {/* 
                We might only want to show the sidebar if a user is logged in.
                The Sidebar component itself returns null if no user, which is one way.
                Or, you could fetch user here and conditionally render Sidebar.
                For simplicity now, Sidebar handles its own visibility based on user session.
              */}
              <Sidebar /> {/* Add the Sidebar component */}
              <main className={styles.pageContent}>
                {children} {/* This is where your page content will go */}
                <Footer /> {/* Footer is now at the end of the scrollable content */}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}