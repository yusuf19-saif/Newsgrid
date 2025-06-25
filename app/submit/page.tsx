"use client";

import { useState } from 'react';
import styles from './submit.module.css';
import TrustScoreMeter from '@/components/TrustScoreMeter';

// Define the Article type matching the fields we need
interface ArticleSubmission {
  headline: string;
  content: string;
  category: string;
  source?: string | null;
  article_type: 'Factual' | 'Reporting/Rumor' | '';
}

export default function SubmitPage() {
  // --- Restore states for all form data ---,
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [articleType, setArticleType] = useState<ArticleSubmission['article_type']>('');
  const [category, setCategory] = useState('');
  const [sources, setSources] = useState('');

  // --- Static list of categories ---
  const categories = ["Local", "Global", "Technology", "Sports", "Politics", "Other"];

  // --- States for AI verification ---
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // --- NEW: States for the final submission process ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Helper function to parse AI content into sections
  const parseAiContent = (contentStr: string) => {
    let trustScore = 0;
    let reportContent = contentStr;

    // Extract Trust Score and remove it from the main content
    const scoreMatch = contentStr.match(/Trust Score: (\d+)\/100/);
    if (scoreMatch) {
      trustScore = parseInt(scoreMatch[1], 10);
      reportContent = contentStr.replace(/Trust Score: \d+\/100/, '').trim();
    }

    const sections: { title: string, text: string }[] = [];
    const knownHeaders = ["Headline Relevance", "Source Analysis", "Factual Accuracy", "Suggestions for Improvement"];
    
    // Split content by the known headers
    const splitContent = reportContent.split(/###\s*(?=Headline Relevance|Source Analysis|Factual Accuracy|Suggestions for Improvement)/);

    for (const part of splitContent) {
      if (!part.trim()) continue;
      const firstLineEndIndex = part.indexOf('\n');
      const title = part.substring(0, firstLineEndIndex).trim();
      const text = part.substring(firstLineEndIndex + 1).trim();

      if (knownHeaders.includes(title)) {
        sections.push({ title, text });
      }
    }
    
    // Fallback if parsing fails
    if (sections.length === 0 && reportContent) {
      sections.push({ title: "AI Analysis", text: reportContent });
    }

    return { sections, trustScore };
  };

  // Function to handle AI article verification
  const handleVerifyArticle = async () => {
    setVerificationError(null);
    setVerificationResult(null);

    if (!content.trim() || !headline.trim() || !articleType || !category) {
      setVerificationError("Please fill out the headline, content, article type, and category before analyzing.");
      return;
    }
    if (articleType === 'Factual' && !sources.trim()) {
      setVerificationError("Sources are required for factual articles. Please provide at least one URL.");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/verify-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          headline: headline,
          articleContent: content,
          userSources: sources
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Error from verification API: ${response.statusText}`);
      }
      setVerificationResult(result);
    } catch (err: any) {
      setVerificationError(err.message || 'Failed to verify article.');
      console.error("Verification error:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  // --- NEW: Function to handle the final article submission ---
  const handleFinalSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!content.trim() || !headline.trim() || !articleType || !category) {
      setSubmitError("Please fill out all required fields before submitting.");
      return;
    }
    if (articleType === 'Factual' && !sources.trim()) {
      setSubmitError('Sources are required for factual articles.');
      return;
    }
    
    setIsSubmitting(true);
    const submissionData: ArticleSubmission = { headline, content, category, article_type: articleType, source: sources.trim() || null };

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Error: ${response.status}`);

      setSubmitSuccess('Article submitted successfully! It is now pending review.');
      // Clear the form
      setHeadline('');
      setContent('');
      setCategory('');
      setSources('');
      setArticleType('');
      setVerificationResult(null);
      setVerificationError(null);
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Process parsed data for rendering ---
  const aiResponse = verificationResult?.choices?.[0]?.message?.content;
  const { sections, trustScore } = aiResponse ? parseAiContent(aiResponse) : { sections: [], trustScore: 0 };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.submitCard}>
        <div className={styles.cardHeader}>
          <h1 className={styles.cardTitle}>Submit Article</h1>
          <button 
            onClick={handleVerifyArticle}
            className={styles.reviewButton}
            disabled={isVerifying || isSubmitting}
          >
            {isVerifying ? 'Analyzing...' : 'Review & Analyze'}
          </button>
        </div>

        <div className={styles.formContent}>
          <input
            type="text"
            className={styles.headlineInput}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Headline"
            required
          />
          <textarea
            className={styles.contentEditor}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            required
          />
          
          {/* --- NEW METADATA SECTION --- */}
          <div className={styles.metadataGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="articleType" className={styles.metadataLabel}>Article Type*</label>
              <select
                id="articleType"
                className={styles.metadataSelect}
                value={articleType}
                onChange={(e) => setArticleType(e.target.value as ArticleSubmission['article_type'])}
                required
              >
                <option value="" disabled>Select type...</option>
                <option value="Factual">Factual (Sources Required)</option>
                <option value="Reporting/Rumor">Reporting/Rumor</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="category" className={styles.metadataLabel}>Category*</label>
              <select
                id="category"
                className={styles.metadataSelect}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="" disabled>Select category...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* --- UPDATED LOGIC TO SHOW SOURCES FOR BOTH TYPES --- */}
            {articleType && (
              <div className={`${styles.formGroup} ${styles.sourcesGroup}`}>
                <label htmlFor="sources" className={styles.metadataLabel}>
                  {articleType === 'Factual' 
                    ? 'Sources* (Provide URLs)' 
                    : 'Sources (Optional)'}
                </label>
                <textarea
                  id="sources"
                  className={styles.sourcesTextarea}
                  value={sources}
                  onChange={(e) => setSources(e.target.value)}
                  placeholder="e.g. https://www.bbc.com/news/article-name, https://www.reuters.com/..."
                  rows={4}
                  required={articleType === 'Factual'}
                />
              </div>
            )}
          </div>
        </div>

        {/* --- NEW: Display Submission feedback inside the card --- */}
        {submitError && <p className={styles.error}>{submitError}</p>}
        {submitSuccess && <p className={styles.successMessage}>{submitSuccess}</p>}
        
        {/* --- NEW: Card Footer with Submit Button --- */}
        <div className={styles.cardFooter}>
            <button
                onClick={handleFinalSubmit}
                className={styles.submitButton}
                disabled={isSubmitting || !headline || !content || !category || !articleType}
            >
                {isSubmitting ? 'Submitting...' : 'Submit Article'}
            </button>
        </div>
      </div>

      {/* --- AI VERIFICATION RESULTS --- */}
      {verificationError && <p className={styles.error}>{verificationError}</p>}
      
      {aiResponse && (
        <div className={styles.resultsContainer}>
          <div className={styles.reportContent}>
            {sections.map((section, index) => (
              <div key={index} className={styles.reportCard}>
                <h3 className={styles.reportCardTitle}>{section.title}</h3>
                <div 
                  className={styles.reportCardBody}
                  dangerouslySetInnerHTML={{ __html: section.text.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} 
                />
              </div>
            ))}
          </div>
          <div className={styles.scoreContainer}>
            <TrustScoreMeter score={trustScore} />
          </div>
        </div>
      )}
    </div>
  );
}
