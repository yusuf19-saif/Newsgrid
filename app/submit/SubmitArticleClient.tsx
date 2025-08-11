'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { verifyArticle } from '@/app/actions/articleActions';
import styles from './submit.module.css';
import { TrustScoreMeter } from '@/components/TrustScoreMeter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Source, Article } from '@/types';

type Category = {
  category: string;
};

type SubmitArticleClientProps = {
  categories: Category[];
};

// Helper function to convert a file to a base64 string
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

const SubmitArticleClient = ({ categories }: SubmitArticleClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [newSource, setNewSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [analysisKey, setAnalysisKey] = useState(0); // Key to force re-render

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = searchParams.get('url');
    if (url) {
      setSources(prev => [...prev, { type: 'url', value: url, name: url }]);
    }
  }, [searchParams]);

  const handleAddSource = () => {
    if (newSource.trim()) {
      setSources(prev => [...prev, { type: 'url', value: newSource.trim(), name: newSource.trim() }]);
      setNewSource('');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await toBase64(file);
        setSources(prev => [...prev, { type: 'image', value: base64, name: file.name }]);
      } catch (err) {
        console.error('Error converting file to base64:', err);
        setError('Failed to process file. Please try again.');
      }
    }
  };

  const removeSource = (index: number) => {
    setSources(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (status: 'draft' | 'pending_review') => {
    setIsSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to submit an article.');
      setIsSubmitting(false);
      return;
    }

    const articleData = {
      headline,
      content,
      category,
      sources,
      author_id: user.id,
      status,
      analysis_result: verificationResult,
      last_updated: new Date().toISOString(),
    };

    const { data: insertedArticle, error: insertError } = await supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting article:', insertError);
      setError(`Failed to submit article: ${insertError.message}`);
    } else if (insertedArticle) {
      console.log('Article submitted successfully:', insertedArticle);
      router.push(`/article/${insertedArticle.slug}`);
    }

    setIsSubmitting(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setVerificationResult(null);

    const result = await verifyArticle({
      headline,
      content,
      sources,
      lastUpdated: new Date().toISOString(),
    });

    if (result && result.error) {
      setError(result.error);
    } else if (result && result.analysis) {
      setVerificationResult(result.analysis);
      setAnalysisKey(prev => prev + 1); // Force re-render of report
    } else {
      setError('An unexpected error occurred during analysis.');
    }
    setIsAnalyzing(false);
  };

  const parseAiResponse = (text: string) => {
    if (!text) return null;

    // Strip out the <think> block
    const cleanText = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();

    const sections: { [key: string]: string } = {};
    const sectionHeaders = [
      'Overall Summary',
      'Claim-by-Claim Support',
      'Missing Evidence or Unverified Claims',
      'Source Quality Assessment',
      'Fact-Check Confidence Score',
      'Suggested Improvements',
      'References'
    ];

    let remainingText = cleanText;
    sectionHeaders.forEach((header, index) => {
      const nextHeader = sectionHeaders[index + 1];
      const headerRegex = new RegExp(`###?\\s*\\d*\\.\\s*${header.replace(/ /g, '\\s*')}`, 'i');
      const match = remainingText.match(headerRegex);

      if (match) {
        let contentStartIndex = match.index! + match[0].length;
        let contentEndIndex;

        if (nextHeader) {
          const nextHeaderRegex = new RegExp(`###?\\s*\\d*\\.\\s*${nextHeader.replace(/ /g, '\\s*')}`, 'i');
          const nextMatch = remainingText.match(nextHeaderRegex);
          contentEndIndex = nextMatch ? nextMatch.index : remainingText.length;
        } else {
          contentEndIndex = remainingText.length;
        }

        const sectionContent = remainingText.substring(contentStartIndex, contentEndIndex).trim();
        const key = header.toLowerCase().replace(/ /g, '_');
        sections[key] = sectionContent;
      }
    });

    return {
      overallSummary: sections.overall_summary || '',
      claimByClaim: sections['claim-by-claim_support'] || '',
      missingEvidence: sections['missing_evidence_or_unverified_claims'] || '',
      sourceQuality: sections.source_quality_assessment || '',
      confidenceScore: sections['fact-check_confidence_score'] || '',
      suggestions: sections.suggested_improvements || '',
      references: sections.references || '',
    };
  };

  const parsedResponse = verificationResult ? parseAiResponse(verificationResult) : null;
  const confidenceScoreValue = parsedResponse?.confidenceScore ? parseInt(parsedResponse.confidenceScore.replace('%', ''), 10) : null;


  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Submit an Article for Verification</h1>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="headline" className={styles.label}>Headline</label>
          <input
            type="text"
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={styles.input}
            placeholder="Enter the article headline"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content" className={styles.label}>Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.textarea}
            placeholder="Paste the full article content here"
            rows={15}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="category" className={styles.label}>Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={styles.select}
          >
            <option value="" disabled>Select a category</option>
            {categories.map((cat) => (
              <option key={cat.category} value={cat.category}>{cat.category}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Sources</label>
          <div className={styles.sourceList}>
            {sources.map((source, index) => (
              <div key={index} className={styles.sourceTag}>
                <span>{source.name || source.value}</span>
                <button onClick={() => removeSource(index)} className={styles.removeButton}>&times;</button>
              </div>
            ))}
          </div>
          <div className={styles.sourceInputContainer}>
            <input
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              className={styles.input}
              placeholder="Add a URL source"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
            />
            <button onClick={handleAddSource} className={styles.addButton}>Add URL</button>
            <button onClick={() => fileInputRef.current?.click()} className={styles.addButton}>
              Add File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept="image/*,.pdf"
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !headline || !content}
            className={`${styles.button} ${styles.analyzeButton}`}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Article Credibility'}
          </button>
        </div>
      </div>

      {isAnalyzing && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Analyzing... this may take a moment.</p>
        </div>
      )}

      {verificationResult && !isAnalyzing && (
        <div key={analysisKey} className={`${styles.aiReport} ${styles.fadeIn}`}>
          <h2 className={styles.reportTitle}>AI Credibility Report</h2>
          {parsedResponse ? (
            <div>
              {parsedResponse.overallSummary && (
                <div className={styles.reportSection}>
                  <h3>1. Overall Summary</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsedResponse.overallSummary}</ReactMarkdown>
                </div>
              )}
              {parsedResponse.claimByClaim && (
                <div className={styles.reportSection}>
                  <h3>2. Claim-by-Claim Support</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} className={styles.claimByClaim}>{parsedResponse.claimByClaim}</ReactMarkdown>
                </div>
              )}
              {parsedResponse.missingEvidence && (
                <div className={styles.reportSection}>
                  <h3>3. Missing Evidence or Unverified Claims</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsedResponse.missingEvidence}</ReactMarkdown>
                </div>
              )}
              {parsedResponse.sourceQuality && (
                <div className={styles.reportSection}>
                  <h3>4. Source Quality Assessment</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsedResponse.sourceQuality}</ReactMarkdown>
                </div>
              )}
              {confidenceScoreValue !== null && (
                <div className={`${styles.reportSection} ${styles.trustScoreSection}`}>
                  <h3>5. Fact-Check Confidence Score</h3>
                  <TrustScoreMeter score={confidenceScoreValue} />
                </div>
              )}
              {parsedResponse.suggestions && (
                <div className={styles.reportSection}>
                  <h3>6. Suggested Improvements</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsedResponse.suggestions}</ReactMarkdown>
                </div>
              )}
              {parsedResponse.references && (
                <div className={styles.reportSection}>
                  <h3>7. References</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} className={styles.references}>{parsedResponse.references}</ReactMarkdown>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h4>Raw AI Response</h4>
              <p className={styles.error}>The AI response did not match the expected format. Displaying the raw output:</p>
              <pre className={styles.rawOutput}>{verificationResult}</pre>
            </div>
          )}
        </div>
      )}

      <div className={styles.submissionActions}>
        <button
          onClick={() => handleSubmit('draft')}
          disabled={isSubmitting || !headline || !content || !category}
          className={`${styles.button} ${styles.draftButton}`}
        >
          {isSubmitting ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('pending_review')}
          disabled={isSubmitting || !headline || !content || !category}
          className={`${styles.button} ${styles.submitButton}`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </div>
  );
};

export default SubmitArticleClient;