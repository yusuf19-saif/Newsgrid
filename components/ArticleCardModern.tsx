import Link from 'next/link';
import { Article } from '@/types';
import { FiMessageSquare, FiClock } from 'react-icons/fi';
import { TrustScoreMeter } from './TrustScoreMeter';

interface ArticleCardModernProps {
  article: Article;
}

export function ArticleCardModern({ article }: ArticleCardModernProps) {
  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link href={`/article/${article.slug}`} className="group block h-full">
      <div className="relative h-full overflow-hidden rounded-xl bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 transition-all duration-300 hover:-translate-y-1 hover:border-green-500/30 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm dark:shadow-none">
        
        {/* Card Header: Author & Trust Score */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
           <div className="flex items-center gap-2 bg-white/90 dark:bg-black/40 backdrop-blur-md px-2 py-1 rounded-full shadow-sm">
             <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
               {/* Placeholder for avatar if not present */}
               {article.author_avatar_url ? (
                 <img src={article.author_avatar_url} alt={article.author_name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 dark:text-white font-bold">
                   {article.author_name?.charAt(0) || 'A'}
                 </div>
               )}
             </div>
             <span className="text-xs text-slate-700 dark:text-slate-200 font-medium truncate max-w-[100px]">
               {article.author_name || 'Anonymous'}
             </span>
           </div>

           {article.trust_score !== null && (
             <div className="bg-white/90 dark:bg-black/40 backdrop-blur-md rounded-full p-1 shadow-sm">
               {/* Reuse existing TrustScoreMeter but maybe scaled down via CSS or props if needed */}
                <div className="scale-75 origin-center">
                  <TrustScoreMeter score={article.trust_score} size="small" /> 
                </div>
             </div>
           )}
        </div>

        {/* Image Section - Height fixed or aspect ratio */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
          {article.image_url ? (
            <img 
              src={article.image_url} 
              alt={article.headline}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
             <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                <span className="text-slate-400 dark:text-slate-600 text-4xl font-bold opacity-20">NewsGrid</span>
             </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 text-xs font-bold tracking-wide text-white uppercase bg-blue-600/90 backdrop-blur-sm rounded-md shadow-sm">
              {article.category || 'General'}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          <h3 className="mb-3 text-lg font-bold leading-snug text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2">
            {article.headline}
          </h3>
          
          {article.excerpt && (
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {article.excerpt}
            </p>
          )}

          {/* Footer Meta */}
          <div className="mt-auto flex items-center justify-between text-xs text-slate-500 border-t border-gray-100 dark:border-slate-700/50 pt-4">
            <div className="flex items-center gap-4">
               <span className="flex items-center gap-1">
                 <FiClock className="w-3 h-3" /> {formattedDate}
               </span>
               {/* Placeholder for read time or comments if available */}
               <span className="flex items-center gap-1">
                 <FiMessageSquare className="w-3 h-3" /> 0
               </span>
            </div>
            <span className="uppercase tracking-wider text-[10px] font-semibold text-green-600/80 dark:text-green-500/80">
              Read More &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
