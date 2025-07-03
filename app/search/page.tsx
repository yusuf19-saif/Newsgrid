import ArticlePreview from '@/components/ArticlePreview'; // Adjust path if needed
import { Article } from '@/types'; // Adjust path if needed
import styles from './search.module.css'; // We'll create this next

// --- Re-use or import dummy data ---
// Ideally, get data from API/database based on search query
const dummyArticles: Article[] = [
    { id: '1', headline: 'Local Council Approves New Park Development', content: 'Full content about the park approval...', excerpt: 'The city council voted yesterday to allocate funds for a new recreational park in the downtown area...', source: 'Verified Journalist', category: 'Local', created_at: '2025-05-05T14:00:00Z', slug: 'local-council-approves-park' },
    { id: '2', headline: 'Tech Startup Announces Breakthrough in Battery Technology', content: 'Details about the new battery technology...', excerpt: 'Innovatech claims their new solid-state battery offers double the lifespan...', source: 'Citizen Report', category: 'Technology', created_at: '2025-05-05T11:00:00Z', slug: 'tech-startup-battery-breakthrough' },
    { id: '3', headline: 'Protestors Gather Outside Parliament Building', content: 'More details about the protest...', excerpt: 'Several hundred individuals gathered today demanding action on recent environmental policy changes...', source: 'Anonymous', category: 'Politics', created_at: '2025-05-04T10:00:00Z', slug: 'protestors-parliament-building' },
    { id: '4', headline: 'New Political Poll Shows Shift in Voter Sentiment', content: 'In-depth poll results and analysis...', excerpt: 'A recent nationwide poll indicates a significant shift in voter preferences ahead of the upcoming election cycle...', source: 'Verified Journalist', category: 'Politics', created_at: '2025-05-02T09:00:00Z', slug: 'political-poll-shift' },
    { id: '5', headline: 'Downtown Hosts Annual Music Festival and Park Events', content: 'Full coverage of the music festival...', excerpt: 'The annual festival featured local bands and various activities in the newly approved park area...', source: 'Citizen Report', category: 'Local', created_at: '2025-05-01T16:00:00Z', slug: 'downtown-music-festival' },
];
// --- End of Dummy Data ---


// Define the expected shape of searchParams
interface SearchPageProps {
  searchParams?: Promise<{ // searchParams is now a Promise
    q?: string; // The 'q' parameter might not exist
  }>;
}

// Pages in App Router receive searchParams as a prop
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams; // Await the searchParams
  const query = params?.q || ''; // Get query 'q' or default to empty string

  // Simple search filter (case-insensitive check in headline or excerpt)
  const filteredArticles = query
    ? dummyArticles.filter(article => {
        const queryLower = query.toLowerCase();
        const headlineMatch = article.headline.toLowerCase().includes(queryLower);
        // Check if excerpt exists before calling methods on it:
        const excerptMatch = typeof article.excerpt === 'string' &&
                             article.excerpt.toLowerCase().includes(queryLower);
        return headlineMatch || excerptMatch;
      })
    : []; // If no query, show no results initially

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {query ? `Search Results for: "${query}"` : 'Search Articles'}
      </h1>

      {/* Optional: Add search input form here later */}

      {query ? ( // Only show results if there was a query
        filteredArticles.length > 0 ? (
          <div className={styles.resultsList}>
            {filteredArticles.map((article) => (
              <ArticlePreview key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className={styles.noResultsMessage}>
            No articles found matching your search term "{query}".
          </p>
        )
      ) : (
        // Message shown when navigating directly to /search without a query
        <p className={styles.promptMessage}>
          Please enter a search term to find articles. (Search bar coming soon!)
        </p>
      )}
    </div>
  );
}
