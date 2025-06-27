"use client";

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { verifyArticle } from '@/app/actions/articleActions';
import styles from './submit.module.css';
import { TrustScoreMeter } from '@/components/TrustScoreMeter';

const parseTrustScore = (content: string | undefined | null): number | null => {
    if (!content) return null;
    const trustScoreMatch = content.match(/Trust Score: (\d+)\/100/);
    return trustScoreMatch ? parseInt(trustScoreMatch[1], 10) : null;
};

const SubmitPage = () => {
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [sources, setSources] = useState('');

  const aiResponse = verificationResult?.choices?.[0]?.message?.content;
  const trustScore = parseTrustScore(aiResponse);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setVerificationResult(null);
    try {
      const result = await verifyArticle({ headline, content, sources });
      setVerificationResult(result);
    } catch (error) {
      console.error('Error verifying article:', error);
      setVerificationResult({ error: true, message: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Submit an Article for Analysis</h1>
      <p className={styles.description}>
        Enter your article details below. Our AI will analyze it for factual accuracy, bias, and overall trustworthiness.
      </p>

      <form onSubmit={handleAnalyze} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="headline" className={styles.label}>Headline</label>
          <input
            type="text"
            id="headline"
            name="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={styles.input}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="content" className={styles.label}>Article Content</label>
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.textarea}
            rows={15}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="sources" className={styles.label}>Sources</label>
          <textarea
            id="sources"
            name="sources"
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            className={styles.textarea}
            rows={5}
            placeholder="Enter URLs, one per line"
            required
          />
        </div>
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Analyze Article'}
        </button>
      </form>

      {isLoading && (
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

      {verificationResult?.error && (
         <div className={styles.errorContainer}>
            <h3 className={styles.errorTitle}>An Error Occurred</h3>
            <p>{verificationResult.message}</p>
         </div>
      )}
    </div>
  );
};

export default SubmitPage;
