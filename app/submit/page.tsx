"use client";

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useFormState, useFormStatus } from 'react-dom';
import { verifyArticle } from '../actions/articleActions';
import styles from './submit.module.css';
import CitationItem from '@/components/CitationItem';
import { TrustScoreMeter } from '@/components/TrustScoreMeter';

// Define the Article type matching the fields we need
interface ArticleSubmission {
  headline: string;
  content: string;
  category: string;
  source?: string | null;
  article_type: 'Factual' | 'Reporting/Rumor' | '';
}

const parseAiContent = (content: string | undefined | null): { sections: { title: string; content: string }[], trustScore: number | null } => {
  if (!content) {
    return { sections: [], trustScore: null };
  }

  // Split content by the markdown headers (###)
  const rawSections = content.split('### ').slice(1); // slice(1) to remove anything before the first header

  const sections = rawSections.map(sectionText => {
    const [title, ...contentParts] = sectionText.split('\n');
    return {
      title: title.trim(),
      content: contentParts.join('\n').trim(),
    };
  });

  const trustScoreMatch = content.match(/Trust Score: (\d+)\/100/);
  const trustScore = trustScoreMatch ? parseInt(trustScoreMatch[1], 10) : null;

  return { sections, trustScore };
};

const SubmitPage = () => {
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [sources, setSources] = useState('');

  // --- Process parsed data for rendering ---
  const aiResponse = verificationResult?.choices?.[0]?.message?.content;
  const { sections, trustScore } = parseAiContent(aiResponse);

  // Separate the citations section from the rest of the report
  const citationSection = sections.find(s => s.title.includes('Citations Used by AI'));
  const regularSections = sections.filter(s => !s.title.includes('Citations Used by AI') && !s.title.includes('Final Trust Score'));

  // Extract URLs from the citation section content
  const citationUrls = citationSection?.content
    ? citationSection.content.match(/https?:\/\/\S+/g) || []
    : [];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setVerificationResult(null); // Clear previous results
    try {
      const result = await verifyArticle({ headline, content, sources });
      setVerificationResult(result);
    } catch (error) {
      console.error('Error verifying article:', error);
      // You might want to set an error state here
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

      {verificationResult && (
        <div className={styles.resultsContainer}>
          <h2 className={styles.resultsTitle}>AI Analysis</h2>
          <div className={styles.resultsWrapper}>
          <div className={styles.reportContainer}>
            {regularSections.map((section, index) => (
              <div key={index} className={styles.reportCard}>
                <h4 className={styles.reportCardTitle}>{section.title.replace(/^\d+\.\s*/, '')}</h4>
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p style={{ margin: 0, padding: 0 }} {...props} />,
                  }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            ))}

            {/* Custom rendering for the citations section */}
            {citationUrls.length > 0 && (
              <div className={styles.reportCard}>
                <h4 className={styles.reportCardTitle}>Citations Used by AI</h4>
                <ol className={styles.citationsList}>
                  {citationUrls.map((url, index) => (
                    <CitationItem key={index} url={url} />
                  ))}
                </ol>
              </div>
            )}
          </div>
            <div className={styles.trustScoreContainer}>
              {trustScore !== null && <TrustScoreMeter score={trustScore} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitPage;
