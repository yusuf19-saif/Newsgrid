'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { verifyArticle } from '@/app/actions/articleActions';
import styles from './submit.module.css';
import { TrustScoreMeter } from '@/components/TrustScoreMeter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Source } from '@/types';

type Category = { category: string };
type SubmitArticleClientProps = { categories: Category[] };

// File → base64
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const createSlug = (title: string) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// Get credibility rating label and color based on score
const getCredibilityRating = (score: number): { label: string; color: string; bgColor: string } => {
  if (score >= 85) return { label: 'Highly Credible', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)' };
  if (score >= 70) return { label: 'Credible', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' };
  if (score >= 55) return { label: 'Mixed', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' };
  if (score >= 40) return { label: 'Low Credibility', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' };
  return { label: 'Unreliable', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
};

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
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [analysisKey, setAnalysisKey] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = searchParams.get('url');
    if (url) setSources(prev => [...prev, { type: 'url', value: url, name: url }]);
  }, [searchParams]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleAddSource = () => {
    if (!newSource.trim()) return;
    setSources(prev => [...prev, { type: 'url', value: newSource.trim(), name: newSource.trim() }]);
    setNewSource('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await toBase64(file);
      setSources(prev => [...prev, { type: 'image', value: base64, name: file.name }]);
    } catch {
      setError('Failed to process file. Please try again.');
    }
  };

  const removeSource = (i: number) => setSources(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (status: 'draft' | 'pending_review') => {
    setIsSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to submit an article.');
      setIsSubmitting(false);
      return;
    }

    const baseSlug = createSlug(headline);

    let imageUrlToSave: string | null = null;

    if (imageFile) {
      const fileName = `${user.id}/${Date.now()}_${imageFile.name}`;
    
      const { error: uploadError } = await supabase
        .storage
        .from('article-images')
        .upload(fileName, imageFile, { contentType: imageFile.type });
    
      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`);
        setIsSubmitting(false);
        return;
      }
    
      const { data: publicData } = supabase
        .storage
        .from('article-images')
        .getPublicUrl(fileName);
    
      imageUrlToSave = publicData.publicUrl;
    }

    // Parse verification result to extract scores for saving
    const parsedVerification = verificationResult ? parseAiResponse(verificationResult) : null;
    const calculatedScore = parsedVerification?.calculatedScore ?? null;
    const rating = calculatedScore !== null ? getCredibilityRating(calculatedScore) : null;

    // Build verification report object to save
    const verificationReport = parsedVerification ? {
      overallSummary: parsedVerification.overallSummary,
      claimByClaim: parsedVerification.claimByClaim,
      missingEvidence: parsedVerification.missingEvidence,
      sourceQuality: parsedVerification.sourceQuality,
      trustScoreBreakdown: parsedVerification.trustScoreBreakdown,
      suggestions: parsedVerification.suggestions,
      references: parsedVerification.references,
      individualScores: parsedVerification.individualScores,
      whyThisScore: parsedVerification.whyThisScore,
    } : null;

    const { data: insertedArticle, error: insertError } = await supabase
      .from('articles')
      .insert({
        headline,
        content,
        category,
        sources,
        author_id: user.id,
        status,
        analysis_result: verificationResult,
        image_url: imageUrlToSave,
        last_updated: new Date().toISOString(),
        slug: baseSlug,
        trust_score: calculatedScore,
        verification_report: verificationReport,
        credibility_rating: rating?.label ?? null,
      })
      .select()
      .single();

    if (insertError) setError(`Failed to submit article: ${insertError.message}`);
    else if (insertedArticle) router.push(`/article/${insertedArticle.slug}`);

    setIsSubmitting(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setVerificationResult(null);

    try {
      const result = await verifyArticle({
        headline,
        content,
        sources,
        lastUpdated: new Date().toISOString(),
      });

      if (result?.error) {
        setError(result.message || 'AI request failed. Please try again shortly.');
      } else if (result?.text) {
        setVerificationResult(result.text);
        setAnalysisKey(prev => prev + 1);
      } else {
        setError('An unexpected error occurred during analysis.');
      }
    } catch (e) {
      console.error('Failed to analyze article:', e);
      setError('A critical error occurred. Please check the console for details and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseAiResponse = (text: string) => {
    if (!text) return null;
    const cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    const sections: { [key: string]: string } = {};
    
    // Updated headers to match new template
    const headers = [
      'Overall Summary',
      'Claim-by-Claim Analysis',
      'Claim-by-Claim Support', // Keep old header for backwards compatibility
      'Missing Evidence',
      'Missing Evidence or Unverified Claims', // Old header
      'Source Quality Assessment',
      'TrustScore Breakdown',
      'Fact-Check Confidence Score', // Old header
      'Suggested Improvements',
      'References',
    ];

    const headerRegex = new RegExp(`###?\\s*(?:\\d+\\.\\s*)?(${headers.join('|')})`, 'gi');
    const headerMatches = Array.from(cleanText.matchAll(headerRegex));

    if (headerMatches.length === 0) {
      return null;
    }

    headerMatches.forEach((match, index) => {
      const headerText = match[1].trim();
      const startIndex = match.index! + match[0].length;
      const nextMatch = headerMatches[index + 1];
      const endIndex = nextMatch ? nextMatch.index! : cleanText.length;
      const sectionContent = cleanText.substring(startIndex, endIndex).trim();
      
      // Normalize header names
      let normalizedHeader = headerText;
      if (headerText.toLowerCase().includes('claim-by-claim')) {
        normalizedHeader = 'Claim-by-Claim Analysis';
      } else if (headerText.toLowerCase().includes('missing evidence')) {
        normalizedHeader = 'Missing Evidence';
      } else if (headerText.toLowerCase().includes('trustscore') || headerText.toLowerCase().includes('confidence score')) {
        normalizedHeader = 'TrustScore Breakdown';
      }
      
      sections[normalizedHeader] = sectionContent;
    });

    // Parse scores from Section 5 (TrustScore Breakdown)
    const scoreSection = sections['TrustScore Breakdown'] || '';
    const scores: { [key: string]: number } = {};
    let overallScore: number | null = null;

    // Match various score formats
    // "**Factual Accuracy Score: [85/100]**" or "Factual Accuracy Score: [85/100]"
    const scoreRegex = /\*?\*?([A-Za-z\s\-&]+(?:Score|Modifier))[\*\s]*:\s*\[?([+-]?\d+)(?:\/100)?\]?/gi;
    const scoreMatches = Array.from(scoreSection.matchAll(scoreRegex));

    scoreMatches.forEach(match => {
      const label = match[1].trim().replace(/\*+/g, '');
      const val = parseInt(match[2], 10);
      
      if (label.toLowerCase().includes('overall trustscore') || label.toLowerCase() === 'overall trustscore') {
        overallScore = val;
      } else {
        scores[label] = val;
      }
    });

    // Extract "Why This Score" explanation
    const whyScoreMatch = scoreSection.match(/Why This Score:\s*([\s\S]+?)(?=\n###|\n\*\*|$)/i);
    const whyThisScore = whyScoreMatch ? whyScoreMatch[1].trim() : '';

    // Calculate score using new formula if not provided: (Accuracy × 0.45) + (Coverage × 0.25) + (Quality × 0.15) + (Alignment × 0.10) + Context
    if (overallScore === null && Object.keys(scores).length > 0) {
      const getScore = (namePart: string, defaultVal: number = 50) => {
        const key = Object.keys(scores).find(k => k.toLowerCase().includes(namePart.toLowerCase()));
        return key ? scores[key] : defaultVal;
      };

      const accuracy = getScore('Accuracy', 50);
      const coverage = getScore('Coverage', 50);
      const quality = getScore('Quality', 50);
      const alignment = getScore('Alignment', 50);
      const contextMod = getScore('Context', 0); // Context modifier can be negative

      overallScore = Math.round(
        (accuracy * 0.45) + 
        (coverage * 0.25) + 
        (quality * 0.15) + 
        (alignment * 0.10) +
        contextMod
      );
      
      // Clamp between 0 and 100
      overallScore = Math.max(0, Math.min(100, overallScore));
    }

    return {
      overallSummary: sections['Overall Summary'] || '',
      claimByClaim: sections['Claim-by-Claim Analysis'] || '',
      missingEvidence: sections['Missing Evidence'] || '',
      sourceQuality: sections['Source Quality Assessment'] || '',
      trustScoreBreakdown: sections['TrustScore Breakdown'] || '',
      suggestions: sections['Suggested Improvements'] || '',
      references: sections['References'] || '',
      calculatedScore: overallScore,
      individualScores: scores,
      whyThisScore: whyThisScore
    };
  };

  const parsed = verificationResult ? parseAiResponse(verificationResult) : null;
  const score = parsed?.calculatedScore ?? null;
  const credibilityRating = score !== null ? getCredibilityRating(score) : null;
  const hasContent = parsed && (parsed.overallSummary.length > 0 || parsed.claimByClaim.length > 0);

  return (
    <div className={styles.submitContainer}>
      <h1 className={styles.title}>Submit an Article for Verification</h1>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.submitForm}>
        <div className={styles.formGroup}>
          <label htmlFor="headline" className={styles.label}>Headline</label>
          <input
            id="headline"
            className={styles.input}
            placeholder="Enter the article headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content" className={styles.label}>Content</label>
          <textarea
            id="content"
            className={styles.textarea}
            placeholder="Paste the full article content here"
            rows={15}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="category" className={styles.label}>Category</label>
          <select
            id="category"
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="" disabled>Select a category</option>
            {categories.map(({ category }) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="imageUpload">Featured Image (Optional)</label>
          <div className={styles.imageUploadContainer}>
            <input
              type="file"
              id="imageUpload"
              ref={imageInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            {imagePreviewUrl ? (
              <div className={styles.imagePreview}>
                <img src={imagePreviewUrl} alt="Featured image preview" />
                <button type="button" onClick={handleRemoveImage} className={styles.removeImageButton}>
                  &times;
                </button>
              </div>
            ) : (
              <button type="button" onClick={handleImageUploadClick} className={styles.uploadImageButton}>
                Click to Upload Image
              </button>
            )}
          </div>
        </div>

        <fieldset className={styles.sourcesGroup}>
          <legend className={styles.subheading}>Sources</legend>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Add URLs or documents that support your article&apos;s claims. More quality sources = higher TrustScore.
          </p>

          <div className={styles.sourcesList}>
            {sources.map((s, i) => (
              <div key={`${s.name || s.value}-${i}`} className={styles.sourceItem}>
                <span className={styles.sourceValue}>{s.name || s.value}</span>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeSource(i)}
                  aria-label="Remove source"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className={styles.addSourceForm}>
            <input
              className={styles.input}
              placeholder="Add a URL source"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSource())}
            />
            <button type="button" className={styles.button} onClick={handleAddSource}>
              Add URL
            </button>
            <button type="button" className={styles.button} onClick={() => fileInputRef.current?.click()}>
              Add File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className={styles.hiddenInput}
              onChange={handleFileChange}
              accept="image/*,.pdf"
            />
          </div>
        </fieldset>

        <div className={styles.aiVerificationSection}>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !headline || !content}
            className={`${styles.button} ${styles.analyzeButton}`}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Article Credibility'}
          </button>
        </div>
      </div>

      {isAnalyzing && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Verifying facts and analyzing sources... this may take a moment.</p>
        </div>
      )}

      {verificationResult && !isAnalyzing && (
        <section key={analysisKey} className={styles.aiResultContainer}>
          <h3>AI Credibility Report</h3>
          
          {hasContent ? (
            <div className={styles.resultsWrapper}>
              <div className={styles.reportContainer}>
                {parsed.overallSummary && (
                  <div className={styles.analysisSection}>
                    <h4 className={styles.analysisSectionTitle}>1. Overall Summary</h4>
                    <div className={styles.analysisSectionContent}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.overallSummary}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {parsed.claimByClaim && (
                  <div className={styles.analysisSection}>
                    <h4 className={styles.analysisSectionTitle}>2. Claim-by-Claim Analysis</h4>
                    <div className={`${styles.analysisSectionContent} ${styles.markdownContent}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.claimByClaim}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {parsed.missingEvidence && (
                  <div className={styles.analysisSection}>
                    <h4 className={styles.analysisSectionTitle}>3. Missing Evidence</h4>
                    <div className={styles.analysisSectionContent}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.missingEvidence}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {parsed.sourceQuality && (
                  <div className={styles.analysisSection}>
                    <h4 className={styles.analysisSectionTitle}>4. Source Quality Assessment</h4>
                    <div className={styles.analysisSectionContent}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.sourceQuality}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {parsed.trustScoreBreakdown && (
                  <div className={styles.analysisSection}>
                    <h4 className={styles.analysisSectionTitle}>5. TrustScore Breakdown</h4>
                    <div className={`${styles.analysisSectionContent} ${styles.markdownContent}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.trustScoreBreakdown}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {parsed.suggestions && (
                  <div className={styles.analysisSection}>
                    <h4 className={styles.analysisSectionTitle}>6. Suggested Improvements</h4>
                    <div className={styles.analysisSectionContent}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.suggestions}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {parsed.references && (
                  <div className={styles.analysisSection}>
                    <h4 className={styles.analysisSectionTitle}>7. References</h4>
                    <div className={`${styles.analysisSectionContent} ${styles.markdownContent}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.references}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
              <aside className={styles.trustScoreContainer}>
                {score !== null && (
                  <div className={styles.trustScoreDisplay}>
                    <TrustScoreMeter score={score} size="large" />
                    
                    {credibilityRating && (
                      <div 
                        className={styles.credibilityBadge}
                        style={{ 
                          color: credibilityRating.color, 
                          backgroundColor: credibilityRating.bgColor,
                          border: `1px solid ${credibilityRating.color}`,
                        }}
                      >
                        {credibilityRating.label}
                      </div>
                    )}

                    {/* Score Breakdown */}
                    {parsed?.individualScores && Object.keys(parsed.individualScores).length > 0 && (
                      <div className={styles.scoreBreakdownMini}>
                        <h5>Score Breakdown</h5>
                        {Object.entries(parsed.individualScores).map(([label, value]) => (
                          <div key={label} className={styles.scoreItem}>
                            <span className={styles.scoreItemLabel}>
                              {label.replace(/\s*Score\s*$/i, '')}
                            </span>
                            <span className={styles.scoreItemValue}>
                              {label.toLowerCase().includes('modifier') ? (
                                value >= 0 ? `+${value}` : value
                              ) : (
                                `${value}/100`
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Why This Score */}
                    {parsed?.whyThisScore && (
                      <div className={styles.whyThisScore}>
                        <strong>Why This Score</strong>
                        {parsed.whyThisScore}
                      </div>
                    )}

                    <p className={styles.scoreExplanation}>
                      Based on factual accuracy, source quality, and citation coverage.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          ) : (
            <div>
              <h4 style={{ marginTop: '1.5rem', color: 'var(--error-text)' }}>Raw AI Response</h4>
              <p>The AI response could not be automatically formatted. Displaying the raw output:</p>
              <pre className={styles.rawOutput}>{verificationResult}</pre>
            </div>
          )}
        </section>
      )}

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={isSubmitting || !headline || !content || !category}
          className={`${styles.button} ${styles.saveDraftButton}`}
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
