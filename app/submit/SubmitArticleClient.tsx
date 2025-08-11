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

type Category = { category: string };
type SubmitArticleClientProps = { categories: Category[] };

const SubmitArticleClient = ({ categories }: SubmitArticleClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [articleType, setArticleType] = useState('Factual');
  const [category, setCategory] = useState<string>('');
  const [sources, setSources] = useState<Source[]>([]);
  const [newUrl, setNewUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisKey, setAnalysisKey] = useState(0);

  const [linkStatuses, setLinkStatuses] = useState<{
    [url: string]: { status: 'valid' | 'invalid' | 'broken' | 'checking'; reason?: string };
  }>({});

  useEffect(() => {
    const draftId = searchParams.get('draftId');
    if (!draftId) return;

    const fetchDraft = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: draft, error: draftError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', draftId)
        .eq('author_id', user.id)
        .single();

      if (draftError || !draft) {
        setError('Could not load the specified draft.');
        return;
      }

      setEditingArticle(draft);
      setHeadline(draft.headline || '');
      setContent(draft.content || '');
      setCategory(draft.category || '');
      setArticleType(draft.article_type || 'Factual');
      setSources(draft.sources || []);

      if (draft.analysis_result) {
        setVerificationResult(draft.analysis_result);
        setAnalysisKey(prev => prev + 1);
      }
    };

    fetchDraft();
  }, [searchParams, supabase]);

  const checkLinkStatus = async (url: string) => {
    if (!url || linkStatuses[url]?.status === 'valid') return;
    setLinkStatuses(prev => ({ ...prev, [url]: { status: 'checking' } }));
    try {
      const response = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setLinkStatuses(prev => ({ ...prev, [url]: { status: data.status, reason: data.reason } }));
    } catch (err) {
      console.error(`Error checking URL ${url}:`, err);
      setLinkStatuses(prev => ({ ...prev, [url]: { status: 'invalid', reason: 'Failed to check URL.' } }));
    }
  };

  const handleAddUrl = () => {
    if (newUrl && sources.every(s => s.value !== newUrl)) {
      setSources(prev => [...prev, { type: 'url', value: newUrl }]);
      setNewUrl('');
      checkLinkStatus(newUrl);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Please upload a PDF or image file under 5MB.');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      if (file.type === 'application/pdf') {
        const pdfjs: any = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => ('str' in item ? item.str : '')).join(' ') + '\n';
        }
        setSources(prev => [...prev, { type: 'pdf', value: fullText, name: file.name }]);
      } else {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const base64String = loadEvent.target?.result as string;
            setSources(prev => [...prev, { type: 'image', value: base64String, name: file.name }]);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Error parsing file:', err);
      setError('Failed to process the file.');
    } finally {
      setIsParsing(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'valid': return styles.statusValid;
      case 'invalid':
      case 'broken': return styles.statusInvalid;
      case 'checking': return styles.statusChecking;
      default: return '';
    }
  };

  const formatAIResponseWithLinks = (text: string, searchResults: { url: string }[] | undefined) => {
    if (!searchResults || searchResults.length === 0) return text;
    return text.replace(/\[([UE]\d+)\]/g, (match, citation) => {
      const isExternal = citation.startsWith('E');
      const index = parseInt(citation.substring(1), 10) - 1;
      
      if (isExternal && searchResults[index] && searchResults[index].url) {
        return `[${citation}](${searchResults[index].url})`;
      }
      return match;
    });
  };

  const parseAiResponse = (text: string) => {
    if (!text) return null;

    let cleanText = text.trim();
    if (cleanText.startsWith('<think>')) {
      const endIndex = cleanText.indexOf('</think>');
      if (endIndex !== -1) {
        cleanText = cleanText.substring(endIndex + '</think>'.length).trim();
      }
    }

    const parsed: any = {
      overallSummary: '',
      claimByClaimSupport: '',
      missingEvidence: '',
      sourceQualityAssessment: '',
      confidenceScore: null as number | null,
      suggestedImprovements: '',
      references: '',
      raw: null as string | null,
    };

    if (!cleanText.startsWith('## NewsGrid AI Article Review')) {
      parsed.raw = text;
      return parsed;
    }

    const sections = cleanText.split(/\n###\s+\d+\.\s+/);
    if (sections.length < 7) {
      parsed.raw = text;
      return parsed;
    }

    const extractContent = (sectionText: string) => {
      if (!sectionText) return '';
      const newlineIndex = sectionText.indexOf('\n');
      return newlineIndex !== -1 ? sectionText.substring(newlineIndex + 1).trim() : sectionText.trim();
    };

    parsed.overallSummary = extractContent(sections[1]);
    parsed.claimByClaimSupport = extractContent(sections[2]);
    parsed.missingEvidence = extractContent(sections[3]);
    parsed.sourceQualityAssessment = extractContent(sections[4]);

    const confidence = extractContent(sections[5] || '');
    const scoreMatch = confidence.match(/(\d+)\s*%/);
    if (scoreMatch?.[1]) {
      parsed.confidenceScore = parseInt(scoreMatch[1], 10);
    }

    parsed.suggestedImprovements = extractContent(sections[6] || '');
    parsed.references = extractContent((sections[7] || '').split('---')[0]);

    return parsed;
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setVerificationResult(null);
    setError(null);

    try {
      const result = await verifyArticle({
        headline,
        content,
        sources,
        lastUpdated: new Date().toISOString(),
      });

      if (!result || typeof result !== 'object') {
        setError('Analysis failed: empty response from server.');
        return;
      }

      if ((result as any).error) {
        setError((result as any).message || 'The AI reported an error.');
        return;
      }

      const rawText: string | undefined = (result as any).text;
      const searchResults: { url: string }[] | undefined = (result as any).searchResults;

      if (!rawText || typeof rawText !== 'string') {
        setError('Analysis returned no content.');
        return;
      }

      const responseText = formatAIResponseWithLinks(rawText, searchResults);
      const parsedData = parseAiResponse(responseText);
      setVerificationResult(parsedData);
      setAnalysisKey(k => k + 1);
    } catch (e) {
      console.error(e);
      setError('An unexpected error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (status: 'draft' | 'pending_review') => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in to save an article.');
      const user = session.user;

      if (status === 'pending_review' && (!category || !content.trim() || !headline.trim())) {
        throw new Error('Headline, content, and category are required to submit for review.');
      }

      const finalHeadline = headline.trim() || 'Untitled Draft';
      const generateSlug = (text: string) =>
        text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

      let slugToSave: string;
      if (status === 'pending_review') {
        slugToSave = generateSlug(finalHeadline);
        if (!slugToSave) throw new Error('Invalid headline.');
      } else {
        slugToSave = editingArticle?.slug || generateSlug(finalHeadline) || `draft-${Date.now().toString(36)}`;
      }

      const articleData: Partial<Article> & { author_id: string } = {
        headline: finalHeadline, content, category, article_type: articleType, sources, status,
        author_id: user.id, analysis_result: verificationResult, slug: slugToSave,
      };

      if (editingArticle?.id) articleData.id = editingArticle.id;

      const { data, error: upsertError } = await supabase.from('articles').upsert(articleData).select().single();

      if (upsertError) throw upsertError;

      if (data) {
        if (status === 'draft') {
          if (!editingArticle) {
            setEditingArticle(data);
            router.replace(`/submit?draftId=${data.id}`);
          }
          setSuccessMessage('Draft saved successfully!');
        } else {
          setSuccessMessage('Article submitted successfully for review!');
          router.push(`/article/${data.slug}`);
        }
      }
    } catch (err: any) {
      console.error('[Submit] Error:', err);
      if (err.code === '23505') setError('An article with this headline already exists.');
      else setError(`An error occurred: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.submitContainer}>
      <h1 className={styles.title}>{editingArticle ? 'Edit Your Article' : 'Submit an Article'}</h1>

      {error && <p className={styles.errorBanner}>{error}</p>}
      {successMessage && <p className={styles.successBanner}>{successMessage}</p>}

      <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="headline" className={styles.label}>Headline</label>
          <input type="text" id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} className={styles.input} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="content" className={styles.label}>Content</label>
          <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} className={styles.textarea} rows={15} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="category" className={styles.label}>Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={styles.select}>
            <option value="">Select a category...</option>
            {categories.map((c) => (<option key={c.category} value={c.category}>{c.category}</option>))}
          </select>
        </div>
        <fieldset className={styles.sourcesFieldset}>
          <legend className={styles.label}>Sources</legend>
          <div className={styles.sourceInputContainer}>
            <label htmlFor="new-url" className={styles.label}>Add URL Source</label>
            <div className={styles.urlInputGroup}>
              <input type="url" id="new-url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); }}} />
              <button type="button" onClick={handleAddUrl} className={styles.button}>Add URL</button>
            </div>
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className={`${styles.button} ${styles.uploadPdfButton}`}>Upload Document</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className={styles.hiddenInput} accept="application/pdf,image/*" />
          <div className={styles.sourcesList}>
            {sources.map((source, index) => (
              <div key={index} className={styles.sourceItem}>
                <span className={styles.sourceIcon}>{source.type === 'url' ? '🔗' : '📄'}</span>
                <span className={styles.sourceValue}>{source.name || source.value}</span>
                {source.type === 'url' && linkStatuses[source.value] && (<span className={`${styles.statusPill} ${getStatusClass(linkStatuses[source.value].status)}`}>{linkStatuses[source.value].status}</span>)}
                <button type="button" onClick={() => handleRemoveSource(index)} className={styles.removeButton}>×</button>
              </div>
            ))}
          </div>
        </fieldset>

        <div className={styles.aiVerificationSection}>
          <button type="button" onClick={handleAnalyze} disabled={isAnalyzing || !headline || !content} className={styles.analyzeButton}>
            {isAnalyzing ? 'Analyzing...' : 'Analyze Article Credibility'}
          </button>

          {isAnalyzing && (
            <div className={styles.analysisContainer}>
              <div className={styles.loader}></div>
              <p>Analyzing... this may take a moment.</p>
            </div>
          )}

          {verificationResult && !isAnalyzing && (
            <div key={analysisKey} className={styles.aiReport}>
              <h2 className={styles.reportTitle}>NewsGrid AI Article Review</h2>
              {verificationResult.raw ? (
                <div className={styles.reportSection}>
                  <h3>Raw AI Response</h3>
                  <pre style={{ whiteSpace: 'pre-wrap', background: '#222', padding: '1rem', borderRadius: 8 }}>{verificationResult.raw}</pre>
                </div>
              ) : (
                <>
                  {verificationResult.confidenceScore !== null && <div className={styles.trustScoreSection}><TrustScoreMeter score={verificationResult.confidenceScore} /></div>}
                  {verificationResult.overallSummary && <div className={styles.reportSection}><h3>1. Overall Summary</h3><ReactMarkdown remarkPlugins={[remarkGfm]}>{verificationResult.overallSummary}</ReactMarkdown></div>}
                  {verificationResult.claimByClaimSupport && <div className={styles.reportSection}><h3>2. Claim-by-Claim Support</h3><ReactMarkdown remarkPlugins={[remarkGfm]}>{verificationResult.claimByClaimSupport}</ReactMarkdown></div>}
                  {verificationResult.missingEvidence && <div className={styles.reportSection}><h3>3. Missing Evidence or Unverified Claims</h3><ReactMarkdown remarkPlugins={[remarkGfm]}>{verificationResult.missingEvidence}</ReactMarkdown></div>}
                  {verificationResult.sourceQualityAssessment && <div className={styles.reportSection}><h3>4. Source Quality Assessment</h3><ReactMarkdown remarkPlugins={[remarkGfm]}>{verificationResult.sourceQualityAssessment}</ReactMarkdown></div>}
                  {verificationResult.confidenceScore !== null && <div className={styles.reportSection}><h3>5. Fact-Check Confidence Score</h3><p>{verificationResult.confidenceScore}%</p></div>}
                  {verificationResult.suggestedImprovements && <div className={styles.reportSection}><h3>6. Suggested Improvements</h3><ReactMarkdown remarkPlugins={[remarkGfm]}>{verificationResult.suggestedImprovements}</ReactMarkdown></div>}
                  {verificationResult.references && <div className={styles.reportSection}><h3>7. References</h3><ReactMarkdown remarkPlugins={[remarkGfm]}>{verificationResult.references}</ReactMarkdown></div>}
                </>
              )}
            </div>
          )}
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={() => handleSubmit('draft')} disabled={isSubmitting} className={`${styles.button} ${styles.saveDraftButton}`}>
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button type="button" onClick={() => handleSubmit('pending_review')} disabled={isSubmitting || !headline || !content || !category} className={`${styles.button} ${styles.submitButton}`}>
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitArticleClient;