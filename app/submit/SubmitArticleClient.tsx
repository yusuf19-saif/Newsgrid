'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { verifyArticle } from '@/app/actions/articleActions';
import styles from './submit.module.css';
import { TrustScoreMeter } from '@/components/TrustScoreMeter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Source } from '@/types'; // Import our new Source type

type Category = {
  category: string;
};

type SubmitArticleClientProps = {
  categories: Category[];
};

const SubmitArticleClient = ({ categories }: SubmitArticleClientProps) => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  
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

  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisKey, setAnalysisKey] = useState(0);

  // State to hold the status of each source link
  const [linkStatuses, setLinkStatuses] = useState<{ [url: string]: { status: 'valid' | 'invalid' | 'broken' | 'checking', reason?: string } }>({});

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
  const trustScore = parseTrustScore(aiResponseText);

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

    if (!category) {
        setError('Please select a category.');
        setIsSubmitting(false);
        return;
    }

    const generateSlug = (text: string) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-'); // Replace multiple - with single -
    };

    let slug = generateSlug(headline);
    let isSlugUnique = false;
    let counter = 2;

    while (!isSlugUnique) {
      const { data: existingArticle, error: slugError } = await supabase
        .from('articles')
        .select('slug')
        .eq('slug', slug)
        .single();

      // We expect an error when no row is found, which is what we want.
      // PostgREST error code PGRST116 means "No rows found".
      if (slugError && slugError.code !== 'PGRST116') {
        setError(`Error checking for existing slug: ${slugError.message}`);
        setIsSubmitting(false);
        return;
      }

      if (existingArticle) {
        // If a slug was found, generate a new one and loop again.
        slug = `${generateSlug(headline)}-${counter}`;
        counter++;
      } else {
        // If no slug was found (or we got the expected "No rows found" error), the slug is unique.
        isSlugUnique = true;
      }
    }

    const { data, error: submissionError } = await supabase
      .from('articles')
      .insert({
        headline,
        slug: slug,
        content,
        author_id: user.id,
        category: category,
        article_type: articleType,
        status: 'Pending',
        sources: sources,
        trust_score: trustScore,
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
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="headline" className={styles.label}>Headline*</label>
            <input
              type="text"
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

          <div className={styles.row}>
            <div className={`${styles.formGroup} ${styles.flexItem}`}>
              <label htmlFor="articleType" className={styles.label}>Article Type</label>
              <select id="articleType" value={articleType} onChange={e => setArticleType(e.target.value)} className={styles.select}>
                <option value="Factual">Factual News</option>
                <option value="Opinion">Opinion</option>
                <option value="Analysis">Analysis</option>
              </select>
            </div>
            <div className={`${styles.formGroup} ${styles.flexItem}`}>
              <label htmlFor="category" className={styles.label}>Category*</label>
              <select id="category" value={category} onChange={e => setCategory(e.target.value)} className={styles.select} required>
                <option value="" disabled>Select a category</option>
                {categories.map((c) => (
                  <option key={c.category} value={c.category}>{c.category}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* --- NEW SOURCES UI --- */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Sources</label>
            <div className={styles.sourceList}>
              {sources.map((source, index) => (
                <div key={index} className={styles.sourceItem}>
                  <span className={styles.sourceIcon}>{source.type === 'url' ? '🔗' : '📄'}</span>
                  <span className={styles.sourceValue}>{source.type === 'url' ? source.value : source.name}</span>
                  
                  {/* New status display for URLs */}
                  {source.type === 'url' && linkStatuses[source.value] && (
                    <span className={`${styles.statusIndicator} ${styles[linkStatuses[source.value].status]}`} title={linkStatuses[source.value].reason}>
                      {linkStatuses[source.value].status === 'broken' ? 'Invalid' : linkStatuses[source.value].status}
                    </span>
                  )}

                  <button type="button" onClick={() => handleRemoveSource(index)} className={styles.removeButton}>&times;</button>
                </div>
              ))}
            </div>

            <div className={styles.addSourceContainer}>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/source-url"
                className={styles.input}
              />
              <button type="button" onClick={handleAddUrl} className={styles.buttonSecondary}>Add URL</button>
            </div>
            
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className={styles.hiddenFileInput}
              ref={fileInputRef}
              id="pdf-upload"
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className={`${styles.buttonSecondary} ${styles.fullWidthButton}`} disabled={isParsing}>
              {isParsing ? 'Parsing PDF...' : 'Upload PDF Source'}
            </button>
          </div>
          
          <div className={styles.buttonGroup}>
            <button type="button" onClick={handleAnalyze} disabled={isAnalyzing || !headline || !content} className={styles.buttonSecondary}>
              {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
            </button>
            <button type="submit" disabled={isSubmitting} className={styles.button}>
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>

        {error && <p className={styles.error}>{error}</p>}
        
        {isAnalyzing && <div className={styles.loader}>Analyzing with AI, please wait...</div>}

        {verificationResult && (
          <div className={styles.analysisResult} key={analysisKey}>
            <h2 className={styles.resultTitle}>AI Analysis Report</h2>
            {trustScore !== null && (
              <div className={styles.trustScoreContainer}>
                <TrustScoreMeter score={trustScore} />
              </div>
            )}
            <div className={styles.markdownContent}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {processedAIResponse}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SubmitArticleClient;
