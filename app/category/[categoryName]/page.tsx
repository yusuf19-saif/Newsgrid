import ArticlePreview from '@/components/ArticlePreview'; // Adjust path if needed
import { Article } from '@/types'; // Adjust path if needed
import styles from './category.module.css'; // We'll create this next

interface CategoryPageProps {
  params: {
    categoryName: string; // Matches the folder name [categoryName]
  };
  // searchParams could be used if we were to pass additional query params to this page
}

// Function to fetch articles by category from our API
async function getArticlesByCategory(categoryName: string): Promise<Article[]> {
  try {
    // Use NEXT_PUBLIC_APP_URL for absolute path to API route
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/articles?category=${encodeURIComponent(categoryName)}`;
    console.log(`Fetching articles for category from: ${apiUrl}`); // For debugging

    const res = await fetch(apiUrl, {
      cache: 'no-store', // Ensures fresh data
    });

    if (!res.ok) {
      console.error(`Failed to fetch articles for category ${categoryName}: ${res.status} ${res.statusText}`);
      return []; // Return empty array or throw error
    }
    const articles: Article[] = await res.json();
    return articles;
  } catch (error) {
    console.error(`Error in getArticlesByCategory for ${categoryName}:`, error);
    return [];
  }
}

// Function to capitalize first letter (optional helper, can be kept or moved)
function capitalizeFirstLetter(string: string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // Decode the category name from the URL (handles spaces %20 etc.)
  // The API will handle case-insensitivity with .ilike(), so we send it as is from the URL
  const categoryNameFromUrl = decodeURIComponent(params.categoryName);

  const articles = await getArticlesByCategory(categoryNameFromUrl);

  // Capitalize for display purposes (e.g., "technology" from URL becomes "Technology" for heading)
  const displayCategoryName = capitalizeFirstLetter(categoryNameFromUrl);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Category: {displayCategoryName}</h1>

      {articles.length > 0 ? (
        <div className={styles.articleList}>
          {articles.map((article) => (
            <ArticlePreview key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <p className={styles.noArticlesMessage}>
          No articles found in the &ldquo;{displayCategoryName}&rdquo; category yet.
        </p>
      )}
    </div>
  );
}

// Optional: Generate static params if you know all categories beforehand and want to pre-render
// export async function generateStaticParams() {
//   // Fetch all unique category names (e.g., from your /api/categories endpoint)
//   const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/categories`);
//   const categories: string[] = await res.json();
//
//   return categories.map((category) => ({
//     categoryName: category.toLowerCase(), // ensure it matches the URL format
//   }));
// }
