'use server';

import { type Source } from '@/types';

interface VerifyArticleInput {
  headline: string;
  content: string;
  sources: Source[];
  lastUpdated: string;
}

export async function verifyArticle({ headline, content, sources, lastUpdated }: VerifyArticleInput) {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  if (!perplexityApiKey) {
    console.error('PERPLEXITY_API_KEY is not set in environment variables.');
    return {
      error: true,
      message: 'The Perplexity API key is not configured on the server.'
    };
  }

  try {
    const userSourcesText = sources.map((s, i) => `- User Source ${i + 1}: ${s.value}`).join('\n');

    const prompt = `
      You are a specialized AI assistant that completes a credibility report.
      Your entire response MUST be the markdown content for the report. Nothing else.
      - Do NOT write any introduction, conclusion, or conversational text.
      - Do NOT include your reasoning or thought process.
      - Fill out every section of the report template below.

      --- CREDIBILITY REPORT (Fill this out) ---
      ⏰ **Article Freshness**
      - Last Updated: ${lastUpdated}
      - Assessment: [Analyze the provided "Last Updated" date. State whether the article is recent, dated, or out-of-date for its topic. For example: "This article, updated today, is highly current." or "This information from 2019 is likely outdated."]

      🔍 **1. Headline Analysis**
      - Headline: "${headline}"
      - Assessment: [Provide a one-sentence assessment of the headline. Is it neutral, sensationalized, biased, or clickbait?]
      - Explanation: [Provide a brief explanation for your assessment of the headline.]

      🔗 **2. Claim & Source Analysis (User-Provided Sources)**
      - User Sources: ${userSourcesText || 'None'}
      - Instructions: Analyze the user-provided sources ONLY. Do not use external evidence here.
      | Claim # | Supported by User Sources? | Notes (with citations to user sources) |
      |---|---|---|
      | 1 | | |
      | 2 | | |
      | 3 | | |
      | 4 | | |

      🌎 **3. External Evidence Analysis**
      - Instructions: List the external URLs you found during your web search to verify the article's claims. For each source, provide a brief (1-2 sentence) explanation of why it is relevant.
      - Example Source:
        - **URL:** https://www.noaa.gov/news-release/noaa-predicts-above-normal-2024-atlantic-hurricane-season
        - **Relevance:** This official forecast from the National Oceanic and Atmospheric Administration provides context for hurricane season predictions, which is relevant to the article's subject.
      - [List your found sources and their relevance here.]

      📊 **4. Trust Score Breakdown**
      | Category | Score | Rationale |
      |---|---|---|
      | Headline Accuracy | /20 | |
      | Source Quality (User & External) | /20 | |
      | Claim Support (User & External) | /30 | |
      | Tone & Bias | /10 | |
      | Structure & Clarity | /10 | |
      | Bonus | /10 | |
      | **Total** | **/100** | |

      💡 **5. Suggestions for Improvement**
      - Suggestion 1:
      - Suggestion 2:
      - Suggestion 3:

      🧾 **6. Final Summary**
      [Your summary here, with citations]

      📚 **7. References**
      [List all sources here as a numbered list. First, list every user-provided source and add "[User provided]" after each. Then, list any new, relevant sources you found during your web search. If a user-provided source is irrelevant, you must still list it, but add the note "(Note: This source was found to be irrelevant to the article's core claims)" next to it.]
    `;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro',
        messages: [{ role: 'user', content: prompt }],
        return_sources: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Perplexity API error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Perplexity API request failed`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    const searchResults = data.choices[0].sources;

    return { text, searchResults };

  } catch (error) {
    console.error('Error in verifyArticle:', error);
    return {
      error: true,
      message: 'Failed to get a response from the AI. This may be due to a temporary issue or high demand. Please try again in a moment.'
    };
  }
}