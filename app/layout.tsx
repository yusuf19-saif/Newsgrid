import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import { createSupabaseServerComponentClient } from '../lib/supabaseServerComponentClient';
import { checkUserRole } from '@/lib/authUtils';
import AppWrapper from "./AppWrapper";

// Distinctive font pairing - Sora for headings (geometric, modern), DM Sans for body (warm, readable)
const headingFont = Sora({ 
  subsets: ["latin"],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const bodyFont = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "NewsGrid",
  description: "Open Platform for Factual News - Verified. Factual. Trusted.",
  keywords: ["news", "fact-checking", "verified news", "journalism", "trust score"],
  authors: [{ name: "NewsGrid Team" }],
  openGraph: {
    title: "NewsGrid",
    description: "Open Platform for Factual News - Verified. Factual. Trusted.",
    type: "website",
    siteName: "NewsGrid",
  },
  twitter: {
    card: "summary_large_image",
    title: "NewsGrid",
    description: "Open Platform for Factual News - Verified. Factual. Trusted.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createSupabaseServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user ? await checkUserRole(user.id, 'admin') : false;

  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>
          <AppWrapper user={user} isAdmin={isAdmin}>
            {children}
          </AppWrapper>
      </body>
    </html>
  );
}
