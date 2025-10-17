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
    const headers = [
      'Overall Summary',
      'Claim-by-Claim Support',
      'Missing Evidence or Unverified Claims',
      'Source Quality Assessment',
      'Fact-Check Confidence Score',
      'Suggested Improvements',
      'References',
    ];

    // Find all the headers that are present in the text
    const headerRegex = new RegExp(`###?\\s*(?:\\d+\\.\\s*)?(${headers.join('|')})`, 'gi');
    const headerMatches = [...cleanText.matchAll(headerRegex)];

    if (headerMatches.length === 0) {
      return null;
    }

    headerMatches.forEach((match, index) => {
      const headerText = match[1].trim();
      const startIndex = match.index! + match[0].length;
      const nextMatch = headerMatches[index + 1];
      const endIndex = nextMatch ? nextMatch.index! : cleanText.length;
      const content = cleanText.substring(startIndex, endIndex).trim();
      
      const officialHeader = headers.find(h => h.toLowerCase() === headerText.toLowerCase());
      if (officialHeader) {
        sections[officialHeader] = content;
      }
    });

    return {
      overallSummary: sections['Overall Summary'] || '',
      claimByClaim: sections['Claim-by-Claim Support'] || '',
      missingEvidence: sections['Missing Evidence or Unverified Claims'] || '',
      sourceQuality: sections['Source Quality Assessment'] || '',
      confidenceScore: sections['Fact-Check Confidence Score'] || '',
      suggestions: sections['Suggested Improvements'] || '',
      references: sections['References'] || '',
    };
  };

  const parsed = verificationResult ? parseAiResponse(verificationResult) : null;
  const score = parsed?.confidenceScore ? parseInt(parsed.confidenceScore.replace('%', ''), 10) : null;
  const hasContent = parsed && Object.values(parsed).some(section => section.length > 0);

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
              onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
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
          <p>Analyzing... this may take a moment.</p>
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
                    <h4 className={styles.analysisSectionTitle}>2. Claim-by-Claim Support</h4>
                    <div className={`${styles.analysisSectionContent} ${styles.markdownContent}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.claimByClaim}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {parsed.missingEvidence && (
                  <div className={styles.analysisSection}>
                    <h4 className={styles.analysisSectionTitle}>3. Missing Evidence or Unverified Claims</h4>
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
                    <TrustScoreMeter score={score} />
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