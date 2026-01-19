import { Article } from '@/types';
import { ArticleCardModern } from './ArticleCardModern';

interface BentoGridProps {
  articles: Article[];
}

export function BentoGrid({ articles }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <div key={article.id} className="h-full">
          <ArticleCardModern article={article} />
        </div>
      ))}
    </div>
  );
}
