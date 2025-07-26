'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { verifyArticle } from '@/app/actions/articleActions'; // Use the single, direct action
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

const SubmitArticleClient = ({ categories }: SubmitArticleClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  
  // State for which article is being edited, if any
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [articleType, setArticleType] = useState('Factual');
  const [category, setCategory] = useState<string>('');
  
  // --- NEW STATE FOR MULTIPLE SOURCES ---
  const [sources, setSources] = useState<Source[]>([]);
  const [newUrl, setNewUrl] = useState('');
  
  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use a state to hold the dynamically imported library
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);

  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisKey, setAnalysisKey] = useState(0);

  const [linkStatuses, setLinkStatuses] = useState<{ [url: string]: { status: 'valid' | 'invalid' | 'broken' | 'checking', reason?: string } }>({});

  useEffect(() => {
    const draftId = searchParams.get('draftId');
    if (draftId) {
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
        
        // --- NEW: Load saved analysis result ---
        if (draft.analysis_result) {
          setVerificationResult(draft.analysis_result);
          // Increment key to ensure re-render of the analysis component
          setAnalysisKey(prev => prev + 1); 
        }
        // --- END NEW ---
      };

      fetchDraft();
    }
  }, [searchParams, supabase]);

  const checkLinkStatus = async (url: string) => {
    if (!url || linkStatuses[url]?.status === 'valid') return;

    setLinkStatuses(prev => ({ ...prev, [url]: { status: 'checking' } }));

    try {
      const response = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('API request failed');
      }
      const data = await response.json();
      setLinkStatuses(prev => ({ ...prev, [url]: { status: data.status, reason: data.reason } }));
    } catch (error) {
      console.error(`Error checking URL ${url}:`, error);
      setLinkStatuses(prev => ({ ...prev, [url]: { status: 'invalid', reason: 'Failed to check URL.' } }));
    }
  };

  const handleAddUrl = () => {
    if (newUrl && sources.every(s => s.value !== newUrl)) {
      const urlToAdd = newUrl;
      setSources([...sources, { type: 'url', value: urlToAdd }]);
      setNewUrl('');
      checkLinkStatus(urlToAdd);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024) {
      setError('Please upload a PDF file under 5MB.');
      return;
    }
    
    setIsParsing(true);
    setError(null);

    try {
      // --- DYNAMIC IMPORT ---
      // Dynamically import the library only when needed
      const pdfjs = await import('pdfjs-dist');
      // Set the worker source for the dynamically imported library
      pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n';
      }
      setSources([...sources, { type: 'pdf', value: fullText, name: file.name }]);
    } catch (err) {
      console.error("Error parsing PDF:", err);
      setError('Failed to parse the PDF file.');
    } finally {
      setIsParsing(false);
      // Reset file input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'valid':
        return styles.statusValid;
      case 'invalid':
      case 'broken':
        return styles.statusInvalid;
      case 'checking':
        return styles.statusChecking;
      default:
        return '';
    }
  };

  const parseTrustScore = (content: string | undefined | null): number | null => {
    if (!content) return null;
    const trustScoreMatch = content.match(/Trust Score: (\d+)\/100/);
    return trustScoreMatch ? parseInt(trustScoreMatch[1], 10) : null;
  };

  const formatAIResponseWithLinks = (
    text: string,
    searchResults: { url: string }[] | undefined
  ) => {
    if (!searchResults || searchResults.length === 0) {
      return text;
    }
    return text.replace(/\[(\d+)\]/g, (match, numberStr) => {
      const index = parseInt(numberStr, 10) - 1;
      if (searchResults[index] && searchResults[index].url) {
        return `[${numberStr}](${searchResults[index].url})`;
      }
      return match;
    });
  };
  
  const aiResponseText = verificationResult?.text;
  const aiSearchResults = verificationResult?.searchResults;
  const processedAIResponse = aiResponseText 
    ? formatAIResponseWithLinks(aiResponseText, aiSearchResults) 
    : '';

  const parseAiResponse = (text: string) => {
    if (!text) return null;
  
    const parsed: any = {
      articleFreshness: { lastUpdated: 'N/A', assessment: 'N/A' },
      headlineCheck: { assessment: 'N/A', explanation: 'N/A' },
      claimSourceAnalysisTable: '',
      externalEvidenceAnalysis: '', // New field
      trustScoreTable: '',
      suggestions: [],
      finalSummary: '',
      references: '',
      trustScore: null,
    };

    const cleanText = (str: string) => str.replace(/\*\*|`|^- /g, '').trim();
    
    const sections = text.split(/\n?(?=⏰|🔍|🔗|🌎|📊|💡|🧾|📚)/);

    sections.forEach(section => {
        const trimmedSection = section.trim();
        if (!trimmedSection) return;

        const header = trimmedSection.split('\n')[0];

        if (header.includes('Article Freshness')) {
            const lastUpdatedMatch = trimmedSection.match(/Last Updated:\s*([\s\S]*?)(?=\n- Assessment:|$)/i);
            const assessmentMatch = trimmedSection.match(/Assessment:\s*([\s\S]+)/i);
            parsed.articleFreshness = {
                lastUpdated: lastUpdatedMatch && lastUpdatedMatch[1] ? cleanText(lastUpdatedMatch[1]) : 'N/A',
                assessment: assessmentMatch && assessmentMatch[1] ? cleanText(assessmentMatch[1]) : 'N/A',
            };
        } else if (header.includes('Headline Analysis')) {
            const assessmentMatch = trimmedSection.match(/Assessment:\s*([\s\S]*?)(?=\n- Explanation:|$)/i);
            const explanationMatch = trimmedSection.match(/Explanation:\s*([\s\S]+)/i);
            parsed.headlineCheck = {
                assessment: assessmentMatch && assessmentMatch[1] ? cleanText(assessmentMatch[1]) : 'N/A',
                explanation: explanationMatch && explanationMatch[1] ? cleanText(explanationMatch[1]) : 'N/A',
            };
        } else if (header.includes('Claim & Source Analysis')) {
            parsed.claimSourceAnalysisTable = trimmedSection.substring(header.length).trim();
        } else if (header.includes('External Evidence Analysis')) {
            parsed.externalEvidenceAnalysis = trimmedSection.substring(header.length).trim();
        } else if (header.includes('Trust Score Breakdown')) {
            const tableContent = trimmedSection.substring(header.length).trim();
            parsed.trustScoreTable = tableContent;
            const totalScoreMatch = tableContent.match(/\*\*Total\*\*.*?(\d+)\/100/);
            if (totalScoreMatch && totalScoreMatch[1]) {
                parsed.trustScore = parseInt(totalScoreMatch[1], 10);
            }
        } else if (header.includes('Suggestions for Improvement')) {
            const suggestionsContent = trimmedSection.substring(header.length).trim();
            parsed.suggestions = suggestionsContent.split('\n').map(line => cleanText(line.replace(/^- Suggestion \d+:|^-\s*/, ''))).filter(Boolean);
        } else if (header.includes('Final Summary')) {
            parsed.finalSummary = trimmedSection.substring(header.length).trim();
        } else if (header.includes('References')) {
            parsed.references = trimmedSection.substring(header.length).trim();
        }
    });

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

      if (result.error) {
        setError(result.message);
      } else if (result.text) {
        const parsedData = parseAiResponse(result.text);
        
        if (parsedData && result.searchResults) {
          const formatWithLinks = (text: string) => formatAIResponseWithLinks(text, result.searchResults);
          
          if (parsedData.claimSourceAnalysisTable) {
            parsedData.claimSourceAnalysisTable = formatWithLinks(parsedData.claimSourceAnalysisTable);
          }
          if (parsedData.trustScoreTable) {
            parsedData.trustScoreTable = formatWithLinks(parsedData.trustScoreTable);
          }
          if (parsedData.finalSummary) {
            parsedData.finalSummary = formatWithLinks(parsedData.finalSummary);
          }
          if (parsedData.externalEvidenceAnalysis) {
            parsedData.externalEvidenceAnalysis = formatWithLinks(parsedData.externalEvidenceAnalysis);
          }
        }
        
        setVerificationResult(parsedData);
      } else {
        setError("Analysis did not return any content.");
      }
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
    console.log(`[Submit] Attempting to ${status}...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to save an article.');
      }
      const user = session.user;

      if (status === 'pending_review' && (!category || !content.trim() || !headline.trim())) {
        throw new Error('Headline, content, and category are required to submit for review.');
      }

      const finalHeadline = headline.trim() || 'Untitled Draft';
      
      const generateSlug = (text: string) => text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

      let slugToSave;

      if (status === 'pending_review') {
        slugToSave = generateSlug(finalHeadline);
        if (!slugToSave) {
          throw new Error("Invalid headline. Please provide a more descriptive headline to submit for review.");
        }
      } else { // status === 'draft'
        slugToSave = editingArticle?.slug || generateSlug(finalHeadline);
        if (!slugToSave) {
          const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
          slugToSave = `draft-${uniqueSuffix}`;
        }
      }

      const articleData: Partial<Article> & { author_id: string } = {
        headline: finalHeadline,
        content,
        category,
        article_type: articleType,
        sources,
        status,
        author_id: user.id,
        analysis_result: verificationResult,
        slug: slugToSave,
      };

      if (editingArticle?.id) {
        articleData.id = editingArticle.id;
      }
      
      const { data, error: upsertError } = await supabase
        .from('articles')
        .upsert(articleData)
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

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
    } catch (error: any) {
      console.error('[Submit] An error occurred during submission:', error);
      if (error.code === '23505') { 
          setError('An article with this headline already exists. Please choose a unique headline.');
      } else {
          setError(`An error occurred: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const scoreCategories: { [key: string]: number } = {
    headlineAccuracy: 20,
    sourceQuality: 20,
    claimSupport: 30,
    toneAndBias: 10,
    structureAndClarity: 10,
    bonus: 10,
  };

  return (
    <div className={styles.submitContainer}>
      <h1 className={styles.title}>{editingArticle ? 'Edit Your Article' : 'Submit an Article'}</h1>
      
      {error && <p className={styles.errorBanner}>{error}</p>}
      {successMessage && <p className={styles.successBanner}>{successMessage}</p>}
      
      <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="headline" className={styles.label}>Headline</label>
          <input
            type="text"
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={styles.input}
            placeholder="e.g., New Study Reveals Surprising Health Benefits"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content" className={styles.label}>Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.textarea}
            placeholder="Write your article here. You can use Markdown for formatting."
            rows={15}
            required
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
            <option value="">Select a category...</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>{c.category}</option>
            ))}
          </select>
        </div>

        <fieldset className={styles.sourcesFieldset}>
          <legend className={styles.label}>Sources</legend>
          <div className={styles.sourceInputContainer}>
            <label htmlFor="new-url" className={styles.label}>Add URL Source</label>
            <div className={styles.urlInputGroup}>
              <input
                type="url"
                id="new-url"
                name="new-url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/article"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
              />
              <button 
                type="button" 
                onClick={handleAddUrl} 
                className={styles.button}
              >
                Add URL
              </button>
            </div>
          </div>
          
          <button type="button" onClick={() => fileInputRef.current?.click()} className={`${styles.button} ${styles.uploadPdfButton}`}>
            Upload PDF Source
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className={styles.hiddenInput}
            accept="application/pdf"
          />

          <div className={styles.sourcesList}>
            {sources.map((source, index) => (
              <div key={index} className={styles.sourceItem}>
                <span className={styles.sourceIcon}>
                  {source.type === 'url' ? '🔗' : '📄'}
                </span>
                <span className={styles.sourceValue}>{source.name || source.value}</span>
                {source.type === 'url' && linkStatuses[source.value] && (
                  <span className={`${styles.statusPill} ${getStatusClass(linkStatuses[source.value].status)}`}>
                    {linkStatuses[source.value].status}
                  </span>
                )}
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
              <h2 className={styles.reportTitle}>AI Credibility Report</h2>
              
              {verificationResult.trustScore !== null && (
                <div className={styles.trustScoreSection}>
                    <TrustScoreMeter score={verificationResult.trustScore} />
                </div>
              )}

              {verificationResult.articleFreshness && (
                <div className={styles.reportSection}>
                  <h3>⏰ Article Freshness</h3>
                  <p><strong>Last Updated:</strong> {verificationResult.articleFreshness.lastUpdated}</p>
                  <p><strong>Assessment:</strong> {verificationResult.articleFreshness.assessment}</p>
                </div>
              )}

              {verificationResult.headlineCheck && (
                <div className={styles.reportSection}>
                  <h3>🔍 1. Headline Analysis</h3>
                  <p><strong>Assessment:</strong> {verificationResult.headlineCheck.assessment}</p>
                  <p><strong>Explanation:</strong> {verificationResult.headlineCheck.explanation}</p>
                </div>
              )}

              {verificationResult.claimSourceAnalysisTable && (
                <div className={styles.reportSection}>
                  <h3>🔗 2. Claim & Source Analysis (User-Provided Sources)</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {verificationResult.claimSourceAnalysisTable}
                  </ReactMarkdown>
                </div>
              )}

              {verificationResult.externalEvidenceAnalysis && (
                <div className={styles.reportSection}>
                  <h3>🌎 3. External Evidence Analysis</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {verificationResult.externalEvidenceAnalysis}
                  </ReactMarkdown>
                </div>
              )}

              {verificationResult.trustScoreTable && (
                <div className={styles.reportSection}>
                  <h3>📊 4. Trust Score Breakdown</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {verificationResult.trustScoreTable}
                  </ReactMarkdown>
                </div>
              )}
              
              {verificationResult.suggestions && verificationResult.suggestions.length > 0 && (
                <div className={styles.reportSection}>
                  <h3>💡 5. Suggestions for Improvement</h3>
                  <ul>
                    {verificationResult.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {verificationResult.finalSummary && (
                <div className={styles.reportSection}>
                  <h3>🧾 6. Final Summary</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {verificationResult.finalSummary}
                  </ReactMarkdown>
                </div>
              )}

              {verificationResult.references && (
                <div className={styles.reportSection}>
                  <h3>📚 7. References</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {verificationResult.references}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className={`${styles.button} ${styles.saveDraftButton}`}
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="submit"
            onClick={() => handleSubmit('pending_review')}
            disabled={isSubmitting || !headline || !content || !category}
            className={`${styles.button} ${styles.submitButton}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitArticleClient;