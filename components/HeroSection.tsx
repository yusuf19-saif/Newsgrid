import Link from 'next/link';
import { Article } from '@/types';
import { FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { TrustScoreMeter } from './TrustScoreMeter';

interface HeroSectionProps {
  featuredArticle: Article;
  trendingArticles: Article[];
}

export function HeroSection({ featuredArticle, trendingArticles }: HeroSectionProps) {
  if (!featuredArticle) return null;

  const featuredDate = new Date(featuredArticle.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
      {/* Hero Card (Left) - Spans 8 columns on Large screens */}
      <div className="lg:col-span-8 relative group rounded-2xl overflow-hidden aspect-video lg:aspect-auto lg:min-h-[500px] shadow-2xl">
         <Link href={`/article/${featuredArticle.slug}`} className="block w-full h-full">
           <div className="absolute inset-0 bg-slate-200 dark:bg-slate-900">
             {featuredArticle.image_url ? (
               <img 
                 src={featuredArticle.image_url} 
                 alt={featuredArticle.headline} 
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
               />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
                   <span className="text-6xl font-black text-slate-400 dark:text-slate-700 tracking-tighter">NewsGrid</span>
                </div>
             )}
           </div>
           
           {/* Gradient Overlay */}
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent dark:from-black/90 dark:via-black/40 dark:to-transparent" />

           {/* Content */}
           <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20">
             <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 text-xs font-bold text-white uppercase bg-green-600 rounded-full shadow-[0_0_15px_rgba(22,163,74,0.5)] border border-green-400/30 backdrop-blur-md flex items-center gap-1">
                   <FiCheckCircle /> Verified
                </span>
                {featuredArticle.category && (
                    <span className="px-3 py-1 text-xs font-bold text-slate-200 uppercase bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                        {featuredArticle.category}
                    </span>
                )}
             </div>

             <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 max-w-3xl drop-shadow-lg">
               {featuredArticle.headline}
             </h1>
             
             <p className="text-slate-300 text-lg max-w-2xl line-clamp-2 md:line-clamp-3 mb-6 hidden md:block">
               {featuredArticle.excerpt}
             </p>

             <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="font-medium text-white">{featuredArticle.author_name || 'Editorial Team'}</span>
                <span className="w-1 h-1 bg-slate-500 rounded-full" />
                <span>{featuredDate}</span>
             </div>
           </div>
         </Link>
      </div>

      {/* Trending Sidebar (Right) - Spans 4 columns */}
      <div className="lg:col-span-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 px-2">
           <h2 className="text-sm font-bold text-green-600 dark:text-green-400 tracking-wider uppercase flex items-center gap-2">
             <FiTrendingUp /> Trending Now
           </h2>
           <Link href="/search?sort=trending" className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
             View All
           </Link>
        </div>
        
        <div className="flex-1 flex flex-col gap-3">
           {trendingArticles.slice(0, 4).map((article, idx) => (
             <Link key={article.id} href={`/article/${article.slug}`} className="group block flex-1">
               <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600 transition-all h-full shadow-sm dark:shadow-none">
                  <div className="flex-shrink-0">
                     <TrustScoreMeter score={article.trust_score || 0} size="small" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                       {article.category || 'News'}
                     </span>
                     <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2 leading-snug">
                       {article.headline}
                     </h3>
                  </div>
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden hidden sm:block">
                     {article.image_url && (
                        <img src={article.image_url} alt="" className="w-full h-full object-cover opacity-90 dark:opacity-80 group-hover:opacity-100 transition-opacity" />
                     )}
                  </div>
               </div>
             </Link>
           ))}
        </div>
      </div>
    </div>
  );
}








