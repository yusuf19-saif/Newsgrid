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

export interface Article {
  id: string;
  headline: string;
  content: string;
  category: string;
  slug: string;
  created_at: string;
  last_updated?: string; // New: Tracks the last modification time.
  excerpt?: string | null;
  sources?: Source[] | null; // New: Replaces the old 'source' string.
  source?: string | null; // Old field, can be removed later.
  author_id?: string | null;
  status?: 'Published' | 'Pending' | 'Rejected' | 'draft' | 'pending_review';
  author_full_name?: string | null;
}