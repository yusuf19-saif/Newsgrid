import { createSupabaseServerComponentClient } from "@/lib/supabaseServerComponentClient";
import ArticlePreview from "@/components/ArticlePreview";
import styles from './category.module.css';
import { Article } from "@/types"; // Import the Article type

type CategoryPageProps = {
  params: {
    categoryName: string;
  };
};

async function getArticlesByCategory(categoryName: string) {
  const supabase = createSupabaseServerComponentClient();
  
  // Fetch both articles and the current user
  const [articlesResponse, userResponse] = await Promise.all([
    supabase
      .from('articles')
      .select(`
        *,
        author:profiles (
          full_name
        )
      `)
      .eq('category', categoryName)
      .eq('status', 'Published')
      .order('created_at', { ascending: false }),
    supabase.auth.getUser()
  ]);

  const { data: rawArticles, error } = articlesResponse;
  const { data: { user } } = userResponse;

  if (error) {
    console.error(`Error fetching articles for category ${categoryName}:`, error);
    return [];
  }
  if (!rawArticles) {
    return [];
  }

  // --- FIX: Normalize data and add isOwner flag ---
  const articles: Article[] = rawArticles.map((article: any) => ({
    ...article,
    author_full_name: article.author?.full_name || 'Anonymous',
    sources: Array.isArray(article.sources) ? article.sources : null,
    isOwner: user ? user.id === article.author_id : false,
  }));
  
  return articles;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryName } = params;
  const articles = await getArticlesByCategory(categoryName);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Category: {decodeURIComponent(categoryName)}
      </h1>
      <div className={styles.articlesGrid}>
        {articles.length > 0 ? (
          articles.map((article) => (
            // The `isOwner` prop is now part of the article object
            <ArticlePreview key={article.id} article={article} />
          ))
        ) : (
          <p>No articles found in this category.</p>
        )}
      </div>
    </div>
  );
}
