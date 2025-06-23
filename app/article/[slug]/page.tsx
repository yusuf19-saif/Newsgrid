import Link from 'next/link'; // Keep Link if you want category links etc.
import { notFound } from 'next/navigation'; // Import notFound for 404 handling
import { Article } from '../../../types'; // Adjusted path to use relative path
import styles from './article.module.css';
import { createSupabaseServerComponentClient } from '@/lib/supabaseServerComponentClient';

// Helper function to format date (can be shared in a utils file later)
function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown date';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateString;
    }
}

// Define the expected shape of the params object
interface ArticlePageParams {
  slug: string;
}

// The component receives params containing the dynamic route segments
// Make the Page component async to use await for data fetching
export default async function ArticlePage({ params }: { params: ArticlePageParams }) {
  const { slug } = params; // Extract the slug from the params
  const supabase = createSupabaseServerComponentClient();

  const { data: article, error } = await supabase
    .from('articles')
    .select(`
      *,
      author:profiles (
        full_name
      )
    `)
    .eq('slug', slug)
    .eq('status', 'Published')
    .single();

  if (error || !article) {
    console.error(`Error fetching article with slug ${slug}:`, error);
    notFound();
  }
  
  // Map the author data to the expected property
  const articleWithAuthor = {
      ...article,
      author_full_name: article.author?.full_name || 'Anonymous'
  };

  // console.log(`Rendering ArticlePage for slug: ${slug}`); // Add log - keep if helpful
  // If article IS found, render its content
  return (
    <div className={styles.container}>
      <article className={styles.articleContent}>
        {/* Display actual fetched data */}
        <h1 className={styles.headline}>{articleWithAuthor.headline}</h1>

        <div className={styles.meta}>
          {/* Display Author Name as a Link if author_id exists */}
          {articleWithAuthor.author_id && articleWithAuthor.author_full_name && articleWithAuthor.author_full_name !== 'Anonymous' ? (
            <span>
              By: <Link href={`/profile/${articleWithAuthor.author_id}`} className={styles.authorLink}>{articleWithAuthor.author_full_name}</Link>
            </span>
          ) : articleWithAuthor.author_full_name && articleWithAuthor.author_full_name !== 'Anonymous' ? (
            <span>By: {articleWithAuthor.author_full_name}</span>
          ) : null} {/* Or a fallback for "Anonymous" if desired */}
          {/* Conditionally render source */}
          {articleWithAuthor.source && <span>Source: {articleWithAuthor.source}</span>}
          {/* Link to category page */}
          <Link href={`/category/${encodeURIComponent(articleWithAuthor.category.toLowerCase())}`}>
              Category: {articleWithAuthor.category}
          </Link>
          <span>Posted: {formatDate(articleWithAuthor.created_at)}</span>
        </div>

        {/* Display the full article content */}
        {/* Warning: Rendering raw HTML from user input is dangerous (XSS).
            If 'content' could contain HTML, use a sanitizer library (like DOMPurify)
            or render it as plain text. For now, assuming plain text or trusted content. */}
            <div className={styles.body}>
      {/* Render content - split into paragraphs if content has line breaks */}
      {articleWithAuthor.content && articleWithAuthor.content.split('\n').map((paragraph: string, index: number) => (
        paragraph.trim() ? <p key={index}>{paragraph}</p> : null
      ))}
    </div>
      </article>
    </div>
  );
}

// Optional: Generate Metadata dynamically based on the article
// export async function generateMetadata({ params }: { params: ArticlePageParams }) {
//   const article = await getArticleBySlug(params.slug);
//   if (!article) {
//     return { title: 'Article Not Found' };
//   }
//   return {
//     title: article.headline,
//     description: article.excerpt || 'Article on NewsGrid',
//   };
// }
