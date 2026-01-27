'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { FiBookmark } from 'react-icons/fi';
import { FaBookmark } from 'react-icons/fa';
import styles from './BookmarkButton.module.css';

type BookmarkButtonProps = {
  articleId: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
};

export const BookmarkButton = ({ articleId, size = 'medium', showLabel = false }: BookmarkButtonProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  // Check if article is bookmarked on mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .single();

      if (data && !error) {
        setIsBookmarked(true);
      }
      setIsLoading(false);
    };

    checkBookmarkStatus();
  }, [articleId, supabase]);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside a link
    e.stopPropagation();

    if (!userId) {
      // Redirect to login if not authenticated
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    setIsLoading(true);

    if (isBookmarked) {
      // Remove bookmark
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId);

      if (!error) {
        setIsBookmarked(false);
      }
    } else {
      // Add bookmark
      const { error } = await supabase
        .from('bookmarks')
        .insert({ user_id: userId, article_id: articleId });

      if (!error) {
        setIsBookmarked(true);
      }
    }

    setIsLoading(false);
  };

  const sizeClasses = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  return (
    <button
      onClick={handleToggleBookmark}
      className={`${styles.bookmarkButton} ${sizeClasses[size]} ${isBookmarked ? styles.bookmarked : ''}`}
      disabled={isLoading}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this article'}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this article'}
    >
      {isBookmarked ? (
        <FaBookmark className={styles.icon} />
      ) : (
        <FiBookmark className={styles.icon} />
      )}
      {showLabel && (
        <span className={styles.label}>
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
};

export default BookmarkButton;

