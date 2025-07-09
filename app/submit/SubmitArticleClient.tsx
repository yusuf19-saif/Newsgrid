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

  // State to hold the status of each source link
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
      };

      fetchDraft();
    }
  }, [searchParams, supabase]);

  const checkLinkStatus = async (url: string) => {
    // Prevent re-checking
    if (linkStatuses[url] && linkStatuses[url].status !== 'checking') return;

    setLinkStatuses(prev => ({ ...prev, [url]: { status: 'checking' } }));

    try {
      const proxyUrl = `/api/check-url?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        const data = await response.json();
        setLinkStatuses(prev => ({ ...prev, [url]: { status: data.status, reason: data.reason } }));
      } else {
        setLinkStatuses(prev => ({ ...prev, [url]: { status: 'invalid', reason: 'Checker API failed' } }));
      }
    } catch (error) {
      setLinkStatuses(prev => ({ ...prev, [url]: { status: 'invalid', reason: 'Failed to connect' } }));
    }
  };

  const handleAddUrl = () => {
    if (newUrl && sources.every(s => s.value !== newUrl)) {
      const urlToAdd = newUrl;
      setSources([...sources, { type: 'url', value: urlToAdd }]);
      setNewUrl('');
      // Trigger check for the new URL
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
        return styles.validPill;
      case 'invalid':
        return styles.invalidPill;
      case 'broken':
        return styles.brokenPill;
      case 'checking':
        return styles.checkingPill;
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

  const parseAIResponse = (text: string) => {
    const sections: { [key: string]: string } = {};
    const sectionHeaders = [
      '⏰ Article Freshness',
      '🔍 1. Headline Analysis',
      '🧩 2. Claim Extraction',
      '🔗 3. Source Verification',
      '✅ Claim-by-Claim Support',
      '📊 4. Trust Score Breakdown',
      '💬 5. Suggestions for Improvement',
      '🧾 6. Final Summary',
      '📚 References',
    ];

    let remainingText = text;
    for (let i = 0; i < sectionHeaders.length; i++) {
      const currentHeader = sectionHeaders[i];
      const nextHeader = i + 1 < sectionHeaders.length ? sectionHeaders[i+1] : null;

      const regex = nextHeader 
        ? new RegExp(`${currentHeader}([\\s\\S]*?)(?=${nextHeader})`)
        : new RegExp(`${currentHeader}([\\s\\S]*)`);
      
      const match = remainingText.match(regex);

      if (match && match[1]) {
        sections[currentHeader] = match[1].trim();
      }
    }
    return sections;
  };

  const parsedResponse = verificationResult ? parseAIResponse(processedAIResponse) : null;

  const handleAnalyze = async () => {
    if (!headline || !content) {
      setError('Headline and content are required to run analysis.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setVerificationResult(null);
    setAnalysisKey(prevKey => prevKey + 1);

    try {
      // --- NEW: Add status to each source before sending to the backend ---
      const sourcesWithStatus = sources.map(source => ({
        ...source,
        status: linkStatuses[source.value]?.status,
        reason: linkStatuses[source.value]?.reason,
      }));
      
      // Pass the new sources array directly to the action
      const result = await verifyArticle({ headline, content, sources: sourcesWithStatus, lastUpdated: new Date().toISOString() });
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

  const handleSubmit = async (status: 'draft' | 'pending_review') => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

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
      
      const slug = generateSlug(finalHeadline);

      // THE FIX: The 'source' column was removed, but now we have a 'sources' column.
      const articleData = {
        headline: finalHeadline,
        content,
        category: category || 'Uncategorized',
        author_id: user.id,
        status: status,
        slug: slug,
        // Add the new fields to be saved to the database
        trust_score: parseTrustScore(verificationResult?.text),
        sources: sources, // The sources array from state
      };

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      let response;

      if (editingArticle) {
        response = await fetch(`${supabaseUrl}/rest/v1/articles?id=eq.${editingArticle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify(articleData)
        });
      } else {
        response = await fetch(`${supabaseUrl}/rest/v1/articles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${session.access_token}`, 'Prefer': 'return=representation' },
          body: JSON.stringify(articleData)
        });
      }

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || `Request failed: ${response.statusText}`);
      }

      const savedData = await response.json();
      const savedArticle = Array.isArray(savedData) ? savedData[0] : savedData;
      
      if (!savedArticle) {
        throw new Error('Failed to retrieve saved article data from the server.');
      }
      
      if (status === 'draft') {
        if (editingArticle) {
          setSuccessMessage('Draft updated successfully!');
        } else {
          setSuccessMessage('Draft saved successfully! The page will now track this draft.');
          router.replace(`/submit?draftId=${savedArticle.id}`);
        }
      } else {
        setSuccessMessage('Article submitted! You will be redirected.');
        router.push('/profile');
      }

      // Clear the success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (e: any) {
      setError(`Error: ${e.message}`);
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
              {/* Restoring the clean onClick handler */}
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
                <span className={styles.sourceIcon}>🔗</span>
                <span className={styles.sourceValue}>{source.name || source.value}</span>
                {source.type === 'url' && linkStatuses[source.value] && (
                  <div className={styles.sourceItemPills}>
                    <span className={`${styles.statusPill} ${getStatusClass(linkStatuses[source.value].status)}`}>
                      {linkStatuses[source.value].status}
                    </span>
                    {(linkStatuses[source.value].status === 'invalid' || linkStatuses[source.value].status === 'broken') && linkStatuses[source.value].reason && (
                      <span className={styles.reasonPill}>
                        {linkStatuses[source.value].reason}
                      </span>
                    )}
                  </div>
                )}
                <button type="button" onClick={() => handleRemoveSource(index)} className={styles.removeButton}>×</button>
              </div>
            ))}
          </div>
        </fieldset>

        <div className={styles.aiVerificationSection}>
          <button type="button" onClick={handleAnalyze} disabled={isAnalyzing || !headline} className={`${styles.button} ${styles.analyzeButton}`}>
            {isAnalyzing ? 'Analyzing...' : 'Analyze Article Credibility'}
          </button>
          
          {isAnalyzing && (
            <div className={styles.analysisContainer}>
              <div className={styles.loader}></div>
              <p>Analyzing... this may take up to 30 seconds.</p>
            </div>
          )}

          {parsedResponse && Object.values(parsedResponse).some(v => v) && !isAnalyzing && (
            <div className={`${styles.analysisContainer} ${styles.structuredAnalysis}`}>
              <h3 className={styles.analysisTitle}>AI Analysis Result</h3>
              
              {Object.entries(parsedResponse).map(([key, value]) => (
                <div key={key} className={styles.analysisSection}>
                  <h4 className={styles.analysisSectionTitle}>{key}</h4>
                  <div className={styles.analysisSectionContent}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {value}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
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