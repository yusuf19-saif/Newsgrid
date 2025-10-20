import ArticlePreview from "@/components/ArticlePreview";
import styles from "./search.module.css";
import { Article } from "@/types";

async function getSearchResults(query: string | undefined): Promise<Article[]> {
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
      sources: [],
      analysis_result: null,
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
      sources: [],
      analysis_result: null,
      trust_score: null,
      image_url: null
    }
  ];

  if (!query) {
    return [];
  }

  return dummyArticles.filter(
    article => article.headline.toLowerCase().includes(query.toLowerCase())
  );
}

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