import { createSupabaseServerComponentClient } from "@/lib/supabaseServerComponentClient";
import ArticlePreview from "@/components/ArticlePreview";
import styles from './profile.module.css';
import { Article } from "@/types"; // Import Article type

type ProfilePageProps = {
  params: {
    userId: string;
  };
};

async function getProfileAndArticles(userId: string) {
  const supabase = createSupabaseServerComponentClient();

  const [profileResponse, articlesResponse, sessionUserResponse] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('articles').select('*').eq('author_id', userId).order('created_at', { ascending: false }),
    supabase.auth.getUser()
  ]);

  const { data: profile, error: profileError } = profileResponse;
  const { data: rawArticles, error: articlesError } = articlesResponse;
  const { data: { user: sessionUser } } = sessionUserResponse;

  if (profileError) {
    console.error(`Error fetching profile for user ${userId}:`, profileError);
  }
  if (articlesError) {
    console.error(`Error fetching articles for user ${userId}:`, articlesError);
  }

  // --- FIX: Normalize article data ---
  const articles: Article[] = (rawArticles || []).map((article: any) => ({
    ...article,
    author_full_name: profile?.full_name || 'Anonymous',
    sources: Array.isArray(article.sources) ? article.sources : null,
    // Ensure all required fields are present, even if null
    last_updated: article.last_updated || null, 
    isOwner: sessionUser ? sessionUser.id === article.author_id : false,
  }));

  return { profile, articles, sessionUser };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = params;
  const { profile, articles, sessionUser } = await getProfileAndArticles(userId);

  if (!profile) {
    return <div>Profile not found.</div>;
  }
  
  const isOwnProfile = sessionUser?.id === userId;

  return (
    <div className={styles.profileContainer}>
      <header className={styles.profileHeader}>
        <h1 className={styles.username}>{profile.username}</h1>
        <p className={styles.fullName}>{profile.full_name}</p>
        {isOwnProfile && <p className={styles.email}>{sessionUser?.email}</p>}
        {/* Add more profile details if available */}
      </header>

      <section className={styles.articlesSection}>
        <h2 className={styles.sectionTitle}>
          {isOwnProfile ? 'Your Articles' : `Articles by ${profile.username}`}
        </h2>
        <div className={styles.articlesGrid}>
          {articles.length > 0 ? (
            articles.map(article => (
              <ArticlePreview key={article.id} article={article} />
            ))
          ) : (
            <p>No articles published yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}