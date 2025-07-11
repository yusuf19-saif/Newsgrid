'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { type Source } from '@/types';

// This interface defines the expected structure of the input to our action.
interface VerifyArticleInput {
  headline: string;
  content: string;
  sources: Source[];
  lastUpdated: string;
}

// Get the API key from a SERVER-SIDE environment variable.
const googleApiKey = process.env.GOOGLE_API_KEY;

// Throw an error if the API key is not found.
if (!googleApiKey) {
  throw new Error('GOOGLE_API_KEY is not set in server environment variables.');
}

// Initialize the Google Generative AI client.
const genAI = new GoogleGenerativeAI(googleApiKey);

export async function verifyArticle(
  { headline, content, sources }: VerifyArticleInput
) {
  try {
    // Select the Gemini model.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Construct a new, detailed prompt optimized for Gemini.
    const prompt = `
You are an AI fact-checking assistant designed to analyze a user-submitted news article and assess its credibility. Always return your response using the exact structure and headings outlined below. Do not deviate from this structure. Do not reorder, remove, or rename sections.

Use consistent tone, bullet formatting, and scoring logic in every response. Ensure dates, file types, and references are clearly labeled.

--- BEGIN STRUCTURE ---

⏰ Article Freshness
_This article is over X days old. Information may be outdated. Consider revising._

---

🔍 1. Headline Analysis
**Headline:** "..."
**Assessment:** (Accurate / Somewhat Misleading / Misleading)
**Explanation:** One or two concise sentences assessing how well the headline reflects the article content and tone. Flag emotionally charged or vague language.

---

🧩 2. Claim Extraction
Extract 3–6 key claims from the article. Use this exact table format:

| # | Claim | Type |
|---|-------|------|
| 1 | "..." | (Factual / Statistical / Expert Opinion / Causal / Official Action) |
| 2 | "..." | ... |
| 3 | "..." | ... |

---

🔗 3. Source Verification

List and verify each user-provided source (URLs or PDFs) individually using this format:

#### Source 1
**URL or File:** ...
**Status:** (Reachable / Broken / Inaccessible)
**Relevance:** (Clearly supports claims / Weakly relevant / Irrelevant)
**Supports:** (Claim #1, Claim #3) or "None"

Repeat for all sources. Flag PDFs as **Private – Not publicly verifiable** if they can't be independently accessed.

---

✅ Claim-by-Claim Support
Cross-check each claim with sources. Use this table format:

| Claim # | Supported? | Source(s) | Notes |
|---------|------------|-----------|-------|
| 1 | Yes / Partially / No | [1][3] | Concise explanation |
| 2 | ... | ... | ... |

---

📊 4. Trust Score Breakdown

Use this exact scoring breakdown:

| Category | Score | Rationale |
|----------|-------|-----------|
| Headline Accuracy | /20 | ... |
| Source Quality | /20 | ... |
| Claim Support | /30 | ... |
| Tone & Bias | /10 | ... |
| Structure & Clarity | /10 | ... |
| Bonus | /10 | (Primary sources, transparency, etc.) |

**Total Trust Score: X/100**

---

💬 5. Suggestions for Improvement
• Provide direct data for unsupported claims
• Replace inaccessible or irrelevant sources
• Add specific attribution quotes, temperature ranges, etc.
(List 3–6 concrete ways to improve)

---

🧾 6. Final Summary
1–2 sentence summary of credibility and trust level.

**Trust Score:** X/100

---

📚 References
List all public sources in reference format, including full URLs.

---

DO NOT add extra commentary. DO NOT invent sources. DO NOT deviate from this structure under any circumstances. Maintain identical formatting and tone across all uses.

--- END STRUCTURE ---

---
**Article to Analyze:**
**Headline:** "${headline}"
**Content:** "${content}"
---
**Provided Sources for Verification:**
      ${sources.map((s, i) => `
        **Source ${i + 1}:**
        - URL: ${s.value}
        - Initial Status: ${s.status || 'Not Checked'}
        - Initial Reason: ${s.reason || 'N/A'}
      `).join('')}
    `;

    // Generate the content using the Gemini model.
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Return the response in the expected format.
    return {
      text: text,
      searchResults: [] // The Gemini SDK doesn't have built-in search tools like the other one.
    };
  } catch (error) {
    console.error('Error calling Google Gemini API:', error);
    // Return a structured error that the client can display.
    return {
      error: true,
      message: 'Failed to get a response from the AI. Please try again later.'
    };
  }
}