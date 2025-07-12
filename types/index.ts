// A new type to represent a single source, which can be a URL or PDF content.
export type Source = {
  type: 'url' | 'pdf';
  // 'value' holds the URL string or the extracted text content from a PDF.
  value: string;
  // 'name' is optional, useful for displaying the original filename of a PDF.
  name?: string;
  // New: Add status and reason for frontend validation tracking
  status?: 'valid' | 'invalid' | 'broken' | 'checking';
  reason?: string;
};

// --- NEW: Define and export the UserProfile type ---
export type UserProfile = {
  id: string;
  username: string;
  full_name: string | null;
  email?: string; // Email is often handled separately and might be optional here
};

export type Article = {
  id: string;
  created_at: string;
  headline: string;
  content: string;
  category: string;
  sources: Source[] | null; // <-- CORRECTED: Can now be an array or null
  author_id: string | null;
  excerpt: string | null;
  last_updated: string | null;
  slug: string | null;
  status: string; // <-- This is now required
  article_type?: string; // Should be optional
  analysis_result?: any | null; // Should be optional
  // This allows for the joined author's username
  profiles?: {
    username: string;
  } | null;
};