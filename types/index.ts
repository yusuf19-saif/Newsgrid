export interface Article {
  id: string;
  headline: string;
  content: string;
  category: string;
  slug: string;
  created_at: string;
  excerpt?: string | null;
  source?: string | null;
  author_id?: string | null;
  status?: 'Published' | 'Pending' | 'Rejected';
  author_full_name?: string | null;
}
