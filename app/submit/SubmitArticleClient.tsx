'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabaseClient';
import { verifyArticle } from '@/app/actions/articleActions';
import styles from './submit.module.css';
import { TrustScoreMeter } from '@/components/TrustScoreMeter';
import ReactMarkdown from 'react-markdown';

type Category = {
  id: number;
  name: string;
  created_at: string;
};

type SubmitArticleClientProps = {
  categories: Category[];
};

const SubmitArticleClient = ({ categories }: SubmitArticleClientProps) => {
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [articleType, setArticleType] = useState('Factual');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [sources, setSources] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const parseTrustScore = (content: string | undefined | null): number | null => {
    if (!content) return null;
    const trustScoreMatch = content.match(/Trust Score: (\d+)\/100/);
    return trustScoreMatch ? parseInt(trustScoreMatch[1], 10) : null;
  };
  
  const aiResponse = verificationResult?.choices?.[0]?.message?.content;
  const trustScore = parseTrustScore(aiResponse);

  const handleAnalyze = async () => {
    if (!headline || !content) {
      setError('Headline and content are required to run analysis.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setVerificationResult(null);
    try {
      const result = await verifyArticle({ headline, content, sources });
      if (result.error) {
        throw new Error(result.message);
      }
      setVerificationResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during analysis.';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to submit an article.');
      setIsSubmitting(false);
      return;
    }

    if (!categoryId) {
        setError('Please select a category.');
        setIsSubmitting(false);
        return;
    }

    const { data, error: submissionError } = await supabase
      .from('articles')
      .insert({
        headline,
        content,
        author_id: user.id,
        category_id: categoryId,
        article_type: articleType,
        status: 'Pending',
        source: sources,
        trust_score: trustScore
      })
      .select()
      .single();

    if (submissionError) {
      setError(submissionError.message);
      setIsSubmitting(false);
    } else {
      router.push(`/profile/${user.id}`);
      router.refresh();
    }
  };

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Submit an Article</h1>
        <p className={styles.description}>
          Complete the form below to submit your article for review. You can use the AI analysis tool to check your work before submitting.
        </p>
      </div>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="headline" className={styles.label}>Headline*</label>
            <input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="content" className={styles.label}>Article Content*</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.textarea}
              rows={15}
              required
            />
          </div>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label htmlFor="articleType" className={styles.label}>Article Type*</label>
              <select
                id="articleType"
                value={articleType}
                onChange={(e) => setArticleType(e.target.value)}
                className={styles.select}
              >
                <option value="Factual">Factual (Sources Required)</option>
                <option value="Opinion">Opinion</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="category" className={styles.label}>Category*</label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className={styles.select}
                required
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="sources" className={styles.label}>Sources (Provide URLs, one per line)</label>
            <textarea
              id="sources"
              value={sources}
              onChange={(e) => setSources(e.target.value)}
              className={styles.textarea}
              rows={5}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleAnalyze}
              className={`${styles.button} ${styles.secondaryButton}`}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
            </button>
            <button
              type="submit"
              className={styles.button}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Article'}
            </button>
          </div>
          {error && <div className={styles.errorBox}>{error}</div>}
        </form>
      </div>

      {isAnalyzing && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>AI is analyzing your article. This may take a moment...</p>
        </div>
      )}

      {verificationResult && !verificationResult.error && (
        <div className={styles.resultsContainer}>
           <h2 className={styles.resultsTitle}>AI Analysis</h2>
           <div className={styles.resultsWrapper}>
             <div className={styles.reportContainer}>
               <ReactMarkdown className={styles.markdownContent}>
                 {aiResponse}
               </ReactMarkdown>
             </div>
             <div className={styles.trustScoreContainer}>
               {trustScore !== null && <TrustScoreMeter score={trustScore} />}
             </div>
           </div>
        </div>
      )}
    </>
  );
};

export default SubmitArticleClient;
