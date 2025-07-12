import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { createSupabaseServerComponentClient } from '../lib/supabaseServerComponentClient';
import { checkUserRole } from '@/lib/authUtils';
import AppWrapper from "./AppWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NewsGrid",
  description: "Open Platform for Factual News",
};

// Layout is an async Server Component again
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createSupabaseServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user ? await checkUserRole(user.id, 'admin') : false;

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          {/* AppWrapper is a client component that handles state */}
          <AppWrapper user={user} isAdmin={isAdmin}>
            {children}
          </AppWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}