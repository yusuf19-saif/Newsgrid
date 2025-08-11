'use server';

import { type Source } from '@/types';

interface VerifyArticleInput {
  headline: string;
  content: string;
  sources: Source[];
  lastUpdated: string;
}

// Helper function to check if a source value is a base64 string
function isBase64(str: string) {
  if (!str || typeof str !== 'string') return false;
  const base64Regex = /^data:image\/[a-zA-Z]+;base64,/;
  return base64Regex.test(str);
}

export async function verifyArticle({ headline, content, sources, lastUpdated }: VerifyArticleInput) {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  if (!perplexityApiKey) {
    return { error: true, message: 'The Perplexity API key is not configured on the server.' };
  }

  try {
    const textSources = sources.filter(s => s.type === 'url' || s.type === 'pdf');
    const imageSources = sources.filter(s => s.type === 'image' && isBase64(s.value));

    const userSourcesText = textSources.map((s, i) => `- Text/URL Source ${i + 1}: ${s.value}`).join('\n');
    
    const systemPrompt = `
You are NewsGrid’s Article Verification AI.
Read the user’s article, break it into individual factual claims, verify each claim using the user-provided sources, and produce a structured fact-check report in markdown.
External sources must NOT be included in the Claim-by-Claim Support section. Instead, any external evidence or suggestions for additional sourcing should be mentioned ONLY in the Suggested Improvements section.

Output ONLY the report in the exact format below—no extra commentary.

## NewsGrid AI Article Review

### 1. Overall Summary
[One concise paragraph summarising the article’s overall credibility, highlighting its main strengths, weaknesses, and any major issues.]

### 2. Claim-by-Claim Support
Extract each distinct factual claim and present it in the following format, separated by a markdown horizontal rule (\`---\`):

**Claim:** "Exact claim text from the article, in quotes."
- **Verdict:** Supported ✅ | Partially Supported ⚠️ | Unsupported ❌ | Needs Context ℹ️
- **User-Provided Evidence:** [List user source references as [U1], [U2], etc., or "None found."]
- **Notes:** [Brief explanation of the verdict and reasoning.]

### 3. Missing Evidence or Unverified Claims
[List any claims that could not be verified with user sources, and specify what evidence is needed.]

### 4. Source Quality Assessment
[List each user-provided source in a table with credibility rating: High Credibility | Moderate Credibility | Low Credibility | Satirical/Unreliable, plus a short note.]

### 5. Fact-Check Confidence Score
[Give a percentage score representing your confidence in the article’s overall factual accuracy based on user sources.]

### 6. Suggested Improvements
[Provide clear, actionable recommendations to improve the article’s credibility, sourcing, and clarity.
Include any relevant EXTERNAL EVIDENCE references here that the AI found independently to strengthen or challenge claims.
List these external sources as [E1], [E2], etc.]

### 7. References
List **user-provided sources first**, numbered as [U1], [U2], etc., followed by **external sources from the improvements section**, numbered as [E1], [E2], etc.
Each reference must be on its own line.

---
Rules:
- In Claim-by-Claim Support, include ONLY user-provided evidence.
- Mention external evidence ONLY in the Suggested Improvements section.
- Never fabricate sources.
- Output ONLY the markdown report—no extra commentary or code fences.
`.trim();

    const messages: any[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
Article Metadata
- Headline: "${headline}"
- Last Updated: ${lastUpdated}

User-Provided Text/URL Sources:
${userSourcesText || 'None'}

Article Content:
${content}
`
          }
        ]
      }
    ];

    if (imageSources.length > 0) {
      imageSources.forEach(imgSource => {
        messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: imgSource.value
          }
        });
      });
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro',
        messages: messages,
        return_sources: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`Perplexity API error: ${response.status} ${response.statusText}`, errorBody);
      return { error: true, message: 'AI request failed. Please try again shortly.' };
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    const searchResults = data?.choices?.[0]?.sources ?? [];

    if (!text || typeof text !== 'string') {
      return { error: true, message: 'AI returned an empty response. Please try again.' };
    }

    return { text, searchResults };
  } catch (error) {
    console.error('Error in verifyArticle:', error);
    return {
      error: true,
      message: 'Failed to get a response from the AI. Please try again.'
    };
  }
}