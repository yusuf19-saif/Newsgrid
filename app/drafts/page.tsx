import Link from 'next/link';
import { createSupabaseServerComponentClient } from '@/lib/supabaseServerComponentClient';
import { Article } from '@/types';
import styles from './drafts.module.css';
import { redirect } from 'next/navigation';
import { SupabaseClient } from '@supabase/supabase-js';

async function getDrafts(supabase: SupabaseClient, userId: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*') // Select all fields to match the Article type
    .eq('author_id', userId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching drafts:', error);
    return [];
  }
  return data || [];
}

function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
    });
}

export default async function DraftsPage() {
  const supabase = await createSupabaseServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=You must be logged in to view drafts');
  }

  const drafts = await getDrafts(supabase, user.id);

  return (
    <div className={styles.draftsContainer}>
      <h1 className={styles.title}>Your Drafts</h1>
      <p className={styles.subtitle}>
        Select a draft to continue editing where you left off.
      </p>

      {drafts.length > 0 ? (
        <div className={styles.draftsList}>
          {drafts.map((draft) => (
            <Link key={draft.id} href={`/submit?draftId=${draft.id}`} className={styles.draftLink}>
              <div className={styles.draftItem}>
                <h2 className={styles.draftHeadline}>{draft.headline || 'Untitled Draft'}</h2>
                <p className={styles.draftExcerpt}>{draft.excerpt || 'No excerpt available.'}</p>
                <p className={styles.lastSaved}>Created on: {formatDate(draft.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.noDraftsMessage}>You don't have any saved drafts.</p>
      )}
    </div>
  );
}
