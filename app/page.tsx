import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/types';
import { createSupabaseServerComponentClient } from '@/lib/supabaseServerComponentClient';
import styles from './page.module.css';
import { FiArrowRight, FiActivity } from 'react-icons/fi';

// Helper to calculate time ago
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

async function getArticlesAndUser() {
  const supabase = createSupabaseServerComponentClient();
  const [articlesResponse, userResponse] = await Promise.all([
    supabase
      .from("articles")
      .select(`*, author:profiles(full_name)`)
      .eq("status", "Published")
      .order("created_at", { ascending: false }),
    supabase.auth.getUser()
  ]);

  const articles = articlesResponse.data?.map((article: any) => ({
    ...article,
    author_full_name: article.author?.full_name || 'Anonymous',
  })) || [];

  return { articles, user: userResponse.data.user };
}

// Reusable Card Component for the Grid
const ArticleCard = ({ article, className, showImage = true, animationClass = '' }: { article: Article, className?: string, showImage?: boolean, animationClass?: string }) => {
  const score = article.trust_score || 0;
  const gradient = `conic-gradient(var(--accent-primary) ${score}%, transparent 0)`;
  
  return (
    <Link href={`/article/${article.slug}`} className={`${styles.articleCard} ${className} ${animationClass} group`}>
      <div className="relative h-full flex flex-col">
        {showImage && (
            <div className="relative w-full h-48 sm:h-56 overflow-hidden">
             {article.image_url ? (
                <Image 
                  src={article.image_url} 
                  alt={article.headline} 
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
             ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-accent)' }}>
                    <span style={{ color: 'var(--text-muted)' }} className="text-4xl font-bold">NG</span>
                </div>
             )}
             {/* Trust Score Badge */}
             <div className={styles.trustScoreBadge}>
               <div className={styles.trustScoreRing} style={{ background: gradient }}></div>
               {score}
             </div>
            </div>
        )}

        <div className="p-5 flex flex-col flex-grow">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
             {article.category || 'General'}
             <span style={{ color: 'var(--text-muted)' }}>•</span>
             <span className="font-medium normal-case" style={{ color: 'var(--text-muted)' }}>{timeAgo(article.created_at)}</span>
          </div>
          <h3 className="text-xl font-bold mb-2 leading-tight transition-colors group-hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
            {article.headline}
          </h3>
          <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
             {article.summary || "No summary available."}
          </p>
          
          <div className="mt-auto flex items-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
             By {article.author_full_name}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default async function HomePage() {
  const { articles } = await getArticlesAndUser();

  const heroArticle = articles[0];
  const trendingArticles = articles.slice(1, 4);
  const feedArticles = articles.slice(4);

  // Stagger classes for animations
  const staggerClasses = ['', styles.stagger1, styles.stagger2, styles.stagger3, styles.stagger4, styles.stagger5, styles.stagger6];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background-primary)', color: 'var(--text-primary)' }}>
      <main className={styles.container}>
        
        {/* Header */}
        <header className={styles.headerSection}>
          <div>
            <h1 className={styles.pageTitle}>
              <span className={styles.highlight}>News</span>Grid
            </h1>
            <p className={styles.tagline}>Verified. Factual. Trusted.</p>
          </div>
          <Link href="/categories" className="hidden md:flex items-center gap-2 text-sm font-bold transition-colors hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
             Explore Categories <FiArrowRight />
          </Link>
        </header>

        {/* BENTO GRID LAYOUT */}
        {articles.length > 0 ? (
          <div className={styles.bentoGrid}>
            
            {/* 1. HERO SECTION */}
            <div className={`${styles.heroItem} ${styles.animateHero} group relative`}>
               <Link href={`/article/${heroArticle.slug}`} className="block w-full h-full">
                 <div className="absolute inset-0">
                    {heroArticle.image_url ? (
                        <Image src={heroArticle.image_url} alt={heroArticle.headline} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
                    ) : (
                        <div className="w-full h-full" style={{ backgroundColor: 'var(--background-accent)' }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
                 </div>

                 <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-4/5">
                    <div className="inline-block px-3 py-1 mb-4 text-xs font-bold text-white rounded-full uppercase tracking-wide" style={{ backgroundColor: 'var(--accent-primary)' }}>
                        Featured Story
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-lg">
                        {heroArticle.headline}
                    </h2>
                    <p className="text-slate-300 text-lg line-clamp-2 md:line-clamp-3 mb-6 max-w-2xl drop-shadow-md">
                        {heroArticle.summary}
                    </p>
                    <div className="flex items-center gap-4 text-sm font-medium text-white/80">
                        <span>{heroArticle.author_full_name}</span>
                        <span>•</span>
                        <span>{timeAgo(heroArticle.created_at)}</span>
                        
                        <div className="flex items-center gap-2 ml-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                            <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>{heroArticle.trust_score}%</span>
                            <span className="text-xs uppercase opacity-70">Trust Score</span>
                        </div>
                    </div>
                 </div>
               </Link>
            </div>

            {/* 2. TRENDING STACK */}
            <div className={styles.trendingStack}>
               <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs mb-1 px-1" style={{ color: 'var(--accent-primary)' }}>
                 <FiActivity /> Trending Now
               </div>
               {trendingArticles.map((article, index) => (
                 <Link 
                   href={`/article/${article.slug}`} 
                   key={article.id} 
                   className={`${styles.trendingCard} ${styles.animateTrending} ${staggerClasses[index + 1]} group`}
                 >
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{article.category}</span>
                        <h4 className="font-bold text-lg leading-snug transition-colors group-hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                            {article.headline}
                        </h4>
                        <div className="flex items-center justify-between mt-2">
                             <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(article.created_at)}</span>
                             <div className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--accent-primary-transparent)' }}>
                                {article.trust_score}%
                             </div>
                        </div>
                    </div>
                 </Link>
               ))}
            </div>

            {/* 3. MAIN FEED */}
            {feedArticles.map((article, index) => {
               const isLarge = index % 7 === 0; 
               const staggerIndex = (index % 6) + 1;
               return (
                 <ArticleCard 
                    key={article.id} 
                    article={article} 
                    className={isLarge ? styles.largeCard : ''}
                    animationClass={`${styles.animateCard} ${staggerClasses[staggerIndex]}`}
                    showImage={true}
                 />
               );
            })}

          </div>
        ) : (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>No articles found</h2>
                <Link href="/submit" className="hover:underline mt-4 inline-block" style={{ color: 'var(--accent-primary)' }}>Submit an article</Link>
            </div>
        )}

      </main>
    </div>
  );
}
