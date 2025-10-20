import ArticlePreview from "@/components/ArticlePreview";
import styles from "./search.module.css";
import { Article } from "@/types"; // Import the Article type

// This is a placeholder function. In a real app, this would fetch data.
async function getSearchResults(query: string | undefined): Promise<Article[]> {
  // Ideally, get data from API/database based on search query
  const dummyArticles: Article[] = [
    { 
      id: '1',
      headline: 'Local Council Approves New Park Development',
      content: 'Full content about the park approval...',
      excerpt: 'The city council voted yesterday to allocate funds for a new recreational park in the downtown area...',
      category: 'Local',
      author_id: 'user1',
      status: 'published',
      created_at: '2025-05-05T14:00:00Z',
      last_updated: '2025-05-05T14:00:00Z',
      slug: 'local-council-approves-park',
      author_name: 'Demo Reporter',
      author_avatar_url: '',
      sources: [],                // FIX: must be an array, not null
      analysis_result: null,      // placeholder to satisfy type
      trust_score: null,
      image_url: null
    },
    { 
      id: '2',
      headline: 'Tech Startup Announces Breakthrough in Battery Technology',
      content: 'Details about the new battery technology...',
      excerpt: 'Innovatech claims their new solid-state battery offers double the lifespan...',
      category: 'Technology',
      author_id: 'user2',
      status: 'published',
      created_at: '2025-05-05T11:00:00Z',
      last_updated: '2025-05-05T11:00:00Z',
      slug: 'tech-startup-battery-breakthrough',
      author_name: 'Tech Correspondent',
      author_avatar_url: '',
      sources: [],                // FIX: must be an array, not null
      analysis_result: null,
      trust_score: null,
      image_url: null
    }
  ];

  if (!query) {
    return []; // Return no results if there's no query
  }

  // Simple filtering for demonstration
  return dummyArticles.filter(
    article => article.headline.toLowerCase().includes(query.toLowerCase())
  );
}

// Define the props for the SearchPage component
type SearchPageProps = {
  searchParams: {
    q?: string;
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q;
  const articles = await getSearchResults(query);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {query ? `Search Results for "${query}"` : 'Search'}
      </h1>
      <div className={styles.resultsContainer}>
        {articles.length > 0 ? (
          articles.map((article) => (
            <ArticlePreview key={article.id} article={article} />
          ))
        ) : (
          <p>{query ? 'No articles found.' : 'Please enter a search term to begin.'}</p>
        )}
      </div>
    </div>
  );
}