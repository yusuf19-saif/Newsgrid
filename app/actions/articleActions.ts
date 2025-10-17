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
**CRITICAL INSTRUCTIONS:**
1.  Your response **MUST** be ONLY the markdown report text.
2.  Your response **MUST** begin **EXACTLY** with "## NewsGrid AI Article Review" and nothing before it.
3.  You **MUST NOT** include any commentary, greetings, or \`<think>\` blocks.
4.  Follow the template below precisely.

**TEMPLATE:**
## NewsGrid AI Article Review

### 1. Overall Summary
[Brief summary of credibility based on user sources.]

### 2. Claim-by-Claim Support
[For each factual claim, use this format, separated by \`---\`:]
**Claim:** "Exact claim text."
- **Verdict:** Supported ✅ | Partially Supported ⚠️ | Unsupported ❌ | Needs Context ℹ️
- **User-Provided Evidence:** [Reference user sources like [U1], [U2], or "None found."]
- **Notes:** [Brief reasoning.]

### 3. Missing Evidence or Unverified Claims
[List claims not verifiable with user sources.]

### 4. Source Quality Assessment
[Assess each user-provided source's credibility.]

### 5. Fact-Check Confidence Score
[A percentage score based ONLY on user-provided sources.]

### 6. Suggested Improvements
[Provide actionable advice. If you found external evidence, mention it ONLY here and list it in References as [E1], [E2], etc.]

### 7. References
[List user sources as [U1], [U2]... then external sources as [E1], [E2]...]

---
**YOUR ROLE:**
You are NewsGrid’s Article Verification AI. Your task is to analyze the user's article against the user-provided sources and generate the fact-check report using the template above.

**RULES:**
- **External Evidence:** External sources you find MUST NOT influence the "Claim-by-Claim Support" or "Fact-Check Confidence Score". They are ONLY for the "Suggested Improvements" section.
- **Input Validity:** If the user's article content is nonsensical, a question, or too short, do not analyze it. Your ONLY output should be a report with the "Overall Summary" stating the input was not a valid article, and all other sections left empty.
    `.trim();

    // before: const messages: any[] = [ { role: 'user', content: [ ... ] } ];

const messages: any[] = [
  {
    role: 'system',
    content: systemPrompt,
  },
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
`.trim()
      }
    ]
  }
];

// keep the image blocks push the same way
if (imageSources.length > 0) {
  imageSources.forEach(imgSource => {
    (messages[1].content as any[]).push({
      type: 'image_url',
      image_url: { url: imgSource.value }
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

    // Since the prompt now handles bad input, we just return the text.
    return { text, searchResults };
  } catch (error) {
    console.error('Error in verifyArticle:', error);
    return {
      error: true,
      message: 'Failed to get a response from the AI. Please try again.'
    };
  }
}