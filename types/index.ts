// A new type to represent a single source, which can be a URL or PDF content.
export type Source = {
  type: 'url' | 'pdf' | 'image';
  // 'value' holds the URL string, the extracted text content from a PDF, or a base64 image string.
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
  headline: string;
  content: string;
  category: string;
  author_id: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  created_at: string;
  last_updated: string;
  slug: string;
  excerpt: string;
  author_name: string;
  author_avatar_url: string;
  sources: Source[];
  analysis_result: any;
  trust_score: number | null;
  image_url?: string | null;
};