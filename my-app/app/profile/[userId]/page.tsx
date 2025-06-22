import { supabaseAdmin } from '@/lib/supabaseServer'; // Or your server-side client
import { notFound } from 'next/navigation';
import { Article } from '@/types'; // Import your main Article type
import ArticlePreview from '@/components/ArticlePreview'; // Import ArticlePreview
import styles from './profile.module.css'; // Let's assume you'll create this for styling
// You might want a specific type for Profile if it differs significantly or for clarity
// import { Profile } from '@/types'; // Assuming you might create a Profile type

interface ProfilePageParams {
  userId: string;
}

// Define a simple type for the profile data we expect to fetch
interface UserProfile {
  id: string;
  full_name: string;
  // Add any other fields from your profiles table you want to display
  // e.g., created_at, first_name, last_name
}

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name') // Select only the fields you need for now
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data as UserProfile; // Cast to UserProfile
  } catch (err) {
    console.error('Catch error fetching user profile:', err);
    return null;
  }
}

// New function to fetch articles by author
async function getArticlesByAuthor(authorId: string): Promise<Article[]> {
  if (!authorId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select(`
        id,
        headline,
        content,
        excerpt,
        source,
        category,
        slug,
        created_at,
        status,
        author_id,
        profiles ( full_name ) 
      `)
      .eq('author_id', authorId)
      .eq('status', 'Published') // Only show published articles
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching articles for author ${authorId}:`, error);
      return [];
    }

    // Transform data to include author_full_name directly
    // This is consistent with how your other article fetches work
    const transformedArticles = data ? data.map(article => {
      let authorFullName = 'Unknown Author';
      if (article.profiles && typeof article.profiles === 'object' && 'full_name' in article.profiles) {
        authorFullName = (article.profiles as { full_name: string }).full_name;
      }
      const { profiles, ...restOfArticle } = article;
      return {
        ...restOfArticle,
        author_full_name: authorFullName
      };
    }) : [];
    
    return transformedArticles;

  } catch (err) {
    console.error(`Catch error fetching articles for author ${authorId}:`, err);
    return [];
  }
}

export default async function UserProfilePage({ params }: { params: ProfilePageParams }) {
  const { userId } = params;
  
  // Fetch profile and articles in parallel
  const [userProfile, articlesByAuthor] = await Promise.all([
    getUserProfile(userId),
    getArticlesByAuthor(userId) // userId is the authorId here
  ]);

  if (!userProfile) {
    notFound(); // Or display a "Profile not found" message
  }

  return (
    <div className={styles.profileContainer}> {/* Added a container class */}
      <section className={styles.profileHeader}>
        <h1>{userProfile.full_name}'s Articles</h1>
        {/* You could add more profile details here later, like join date, bio, etc. */}
      </section>

      <section className={styles.articlesSection}>
        {articlesByAuthor && articlesByAuthor.length > 0 ? (
          <div className={styles.articlesGrid}> {/* Reuse homepage grid style if desired */}
            {articlesByAuthor.map((article) => (
              <ArticlePreview key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p>This author has not published any articles yet.</p>
        )}
      </section>
    </div>
  );
}
