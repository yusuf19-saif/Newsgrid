import Link from 'next/link'; // Keep Link if you want category links etc.
import { notFound } from 'next/navigation'; // Import notFound for 404 handling
import { Article } from '../../../types'; // Adjusted path to use relative path
import styles from './article.module.css';

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

// Function to fetch a single article by slug from our API route
async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    // Using port 3003 based on user feedback
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Fetch from the specific slug endpoint
    const res = await fetch(`${apiUrl}/api/articles/${slug}`, {
        cache: 'no-store', // Fetch fresh data, good for development
    });

    // If the API returns 404, the article wasn't found or published
    if (res.status === 404) {
      console.log(`Article with slug "${slug}" not found (404).`);
      return null;
    }

    // Handle other non-OK responses
    if (!res.ok) {
      console.error(`Failed to fetch article ${slug}: ${res.status} ${res.statusText}`);
      // Potentially log res.text() for more detailed error from API
      // const errorBody = await res.text();
      // console.error("API Error Body:", errorBody);
      return null;
    }

    const article: Article = await res.json();
    return article;

  } catch (error) {
    console.error(`Error fetching article ${slug}:`, error);
    return null; // Return null on general fetch error
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

  // console.log(`Rendering ArticlePage for slug: ${slug}`); // Add log - keep if helpful
  // Fetch the specific article
  const article = await getArticleBySlug(slug);

  // If article is not found (or fetch failed), render the Next.js 404 page
  if (!article) {
    // console.log(`Article not found or fetch failed for slug: ${slug}, calling notFound().`); // Add log - keep if helpful
    notFound(); // This is a special Next.js function
  }

  // console.log(`Article found for slug "${slug}" with author: ${article.author_full_name}`, article); // Log to check data
  // If article IS found, render its content
  return (
    <div className={styles.container}>
      <article className={styles.articleContent}>
        {/* Display actual fetched data */}
        <h1 className={styles.headline}>{article.headline}</h1>

        <div className={styles.meta}>
          {/* Display Author Name as a Link if author_id exists */}
          {article.author_id && article.author_full_name && article.author_full_name !== 'Unknown Author' ? (
            <span>
              By: <Link href={`/profile/${article.author_id}`} className={styles.authorLink}>{article.author_full_name}</Link>
            </span>
          ) : article.author_full_name && article.author_full_name !== 'Unknown Author' ? (
            <span>By: {article.author_full_name}</span>
          ) : null} {/* Or a fallback for "Unknown Author" if desired */}
          {/* Conditionally render source */}
          {article.source && <span>Source: {article.source}</span>}
          {/* Link to category page */}
          <Link href={`/category/${encodeURIComponent(article.category.toLowerCase())}`}>
              Category: {article.category}
          </Link>
          <span>Posted: {formatDate(article.created_at)}</span>
        </div>

        {/* Display the full article content */}
        {/* Warning: Rendering raw HTML from user input is dangerous (XSS).
            If 'content' could contain HTML, use a sanitizer library (like DOMPurify)
            or render it as plain text. For now, assuming plain text or trusted content. */}
        <div className={styles.body}>
           {/* Render content - split into paragraphs if content has line breaks */}
           {article.content.split('\n').map((paragraph, index) => (
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
