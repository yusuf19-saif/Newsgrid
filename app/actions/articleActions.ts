'use server';

import { perplexity } from '@ai-sdk/perplexity';
import { generateText } from 'ai';
import { type Source } from '@/types'; // Import the new Source type

interface VerifyArticleParams {
  headline: string;
  content: string;
  sources: Source[]; // Source type now includes status and reason
  lastUpdated?: string; // Add lastUpdated to the params
}

type SearchResult = {
  title: string;
  url: string;
};

// Define the explicit return types for our function
type VerificationSuccess = {
  text: string;
  searchResults?: SearchResult[];
  error?: undefined;
  message?: undefined;
};

type VerificationError = {
  error: true;
  message: string;
};
type VerificationResult = VerificationSuccess | VerificationError;

export async function verifyArticle({ headline, content, sources, lastUpdated }: VerifyArticleParams): Promise<VerificationResult> {
  try {
    const systemPrompt = `You are an AI fact-checking assistant. Your task is to analyze a news article and output a credibility report using the exact structure below. Do not deviate.

---

⏰ **Article Freshness**
"This article is over X days old. Information may be outdated. Consider revising."
(Auto-calculate based on article date. If recent, omit this section.)

---

🔍 **1. Headline Analysis**
**Headline:** "{insert headline}"
**Assessment:** {Accurate / Somewhat Misleading / Misleading}
**Explanation:** Explain if the headline is sensational, vague, or accurate.

---

🧩 **2. Claim Extraction**
| # | Claim | Type |
|---|-------|------|
| 1 | {Claim 1} | {Factual / Statistical / Causal / etc.} |
(Extract 3-6 major, verifiable claims.)

---

🔗 **3. Source Verification**
**Validation Rules:**
- For each source, I will provide a 'Status'. You MUST use that status.
- Invalid sources MUST be excluded from claim support and scoring.
- List each source with its full URL and the provided status.

For each user-provided source:
**[#] {Full URL or File Name}**
**Status:** {Use the status I provide below}
**Relevance:** {Assess as Relevant, Irrelevant, or Partially Relevant}
**Supports:** {State which claim(s) it supports or "None"}

---

✅ **Claim-by-Claim Support**
(Reference only valid sources using [1], [2], etc.)
| Claim # | Supported? | Source(s) | Notes |
|---------|------------|-----------|-------|
| 1 | Yes / No / Partial | [1], [2] | Explain briefly |

---

📊 **4. Trust Score Breakdown**
(Only count valid and reachable sources when scoring.)
| Category | Score (out of) | Rationale |
|----------|-------|-----------|
| Headline Accuracy | 20 | ... |
| Source Quality | 20 | ... |
| Claim Support | 30 | ... |
| Tone & Bias | 10 | ... |
| Structure & Clarity | 10 | ... |
| Bonus | 10 | (Primary sources, data, etc.) |
**Total Trust Score** | **/100** |

---

💬 **5. Suggestions for Improvement**
• Add verifiable sources for unsupported claims.
• Replace broken or irrelevant sources.
• Include official quotes or citations.

---

🧾 **6. Final Summary**
Summarize credibility. Note if claims are unsupported.
**If sources were excluded due to being invalid, add this note:** "Note: One or more user-provided sources were excluded from verification because they were invalid or irrelevant."
End with:
**Trust Score: X/100**

---

📚 **References Used**
List all sources referenced in [bracket] format.
Label invalid sources clearly:
[X] URL - Invalid (Page not found)
[X] File - Private PDF – Not publicly verifiable
[X] URL - Irrelevant`;

    // Pass the status from our API check directly to the AI for its consideration
    const formattedSources = sources.map((source, index) => {
      const sourceNumber = index + 1;
      let sourceInfo = '';

      if (source.type === 'url') {
        // Use the status passed from the frontend. Default to 'Reachable' if for some reason it's not provided.
        const status = source.reason ? `Invalid (${source.reason})` : 'Reachable';
        sourceInfo = `[${sourceNumber}] Public URL: ${source.value}\nStatus provided: ${status}`;
      } else if (source.type === 'pdf') {
        const wordCount = source.value.trim().split(/\s+/).length;
        let statusInfo = "Private PDF – Not publicly verifiable";
        if (wordCount < 50) {
          statusInfo = "Unreadable or Empty";
        }
        sourceInfo = `[${sourceNumber}] Private File: ${source.name || 'Uploaded PDF'}\nStatus provided: ${statusInfo}\n\n--- PDF Content for Source [${sourceNumber}] ---\n${source.value}\n--- End PDF ---`;
      }
      return sourceInfo;
    }).join('\n\n');

    const daysOld = lastUpdated ? Math.floor((new Date().getTime() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const articleAgePreamble = daysOld > 30 ? `Article is ${daysOld} days old.` : 'Article is recent.';

    const result = await generateText({
        model: perplexity('sonar-pro'),
        system: systemPrompt,
        prompt: `Analyze the following article. ${articleAgePreamble}\n\n**Headline:** ${headline}\n\n**Content:**\n${content}\n\n**User-Provided Sources:**\n${formattedSources}`,
    });

    const searchResults = result.rawResponse?.choices[0]?.search_results;

    return {
      text: result.text,
      searchResults: searchResults,
    };

  } catch (error) {
    console.error('Error verifying article with Perplexity:', error);
    return {
      error: true,
      message: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}