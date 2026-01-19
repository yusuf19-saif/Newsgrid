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

    const userSourcesText = textSources.map((s, i) => `[U${i + 1}] ${s.value}`).join('\n');
    const sourceCount = textSources.length;
    
    const systemPrompt = `
**CRITICAL INSTRUCTIONS:**
1. Your response **MUST** be ONLY the markdown report text.
2. Your response **MUST** begin **EXACTLY** with "### 1. Overall Summary" and nothing before it.
3. You **MUST NOT** include any commentary, greetings, preamble, or \`<think>\` blocks.
4. Follow the template below precisely.

---

**TEMPLATE:**

### 1. Overall Summary
[2-3 sentence summary: Is the article factually accurate? How well is it sourced? Any major concerns?]

### 2. Claim-by-Claim Analysis
[For EACH factual claim in the article, provide:]

**Claim:** "[Exact quote from article]"
- **Factual Accuracy:** Verified ✅ | Partially Accurate ⚠️ | Inaccurate ❌ | Unverifiable ℹ️
- **Source Support:** [Reference user sources [U1], [U2], etc. or "No user source provided"]
- **External Check:** [What external evidence says - use for accuracy judgment]
- **Notes:** [Brief explanation]

---

[Repeat for each claim, separated by horizontal rules]

### 3. Missing Evidence
[List any claims that lack supporting sources from the author]

### 4. Source Quality Assessment
**User-Provided Sources:**
[For each source [U1], [U2], etc., assess:]
- Credibility tier (Official/Major News/Trade/Blog/Unknown)
- Relevance to the article's claims
- Any issues (broken link, paywall, etc.)

### 5. TrustScore Breakdown

**Factual Accuracy Score: [X/100]**
- What percentage of claims are factually correct based on external verification?
- Scoring: 90-100% accurate = 90-100, 70-89% = 70-89, 50-69% = 50-69, <50% = 0-49

**Source Coverage Score: [X/100]**
- What percentage of factual claims have citations from the author?
- Scoring: 80%+ cited = 85-100, 60-79% = 65-84, 40-59% = 45-64, <40% = 0-44
- If NO sources provided: Score 0-15

**Source Quality Score: [X/100]**
- How credible are the author's sources?
- Scoring: Official/Gov/Academic = 90-100, Major News = 75-90, Trade = 60-75, Blogs = 40-60, Unknown/None = 0-40

**Source-Claim Alignment Score: [X/100]**
- Do the provided sources actually support the specific claims made?
- Scoring: Direct support = 90-100, Contextual = 60-89, Weak = 30-59, No alignment = 0-29
- If sources cannot be accessed: Score 50 (neutral)

**Context Modifier: [+X or -X or 0]**
- Breaking news (<48hrs): +10 to +20
- Developing story (<1 week): +5 to +10
- Well-documented topic with missing sources: -5 to -10
- Standard: 0

---

**Overall TrustScore: [FINAL_SCORE/100]**

Formula: (Accuracy × 0.45) + (Coverage × 0.25) + (Quality × 0.15) + (Alignment × 0.10) + Context Modifier

**Credibility Rating:** [Highly Credible | Credible | Mixed | Low Credibility | Unreliable]
- 85-100: Highly Credible
- 70-84: Credible
- 55-69: Mixed
- 40-54: Low Credibility
- 0-39: Unreliable

**Why This Score:**
[2-3 sentences explaining the key factors that influenced the final score]

### 6. Suggested Improvements
[Actionable advice for the author to improve credibility. Reference any external evidence found as [E1], [E2], etc.]

### 7. References
**User-Provided Sources:**
[U1] URL - Brief description
[U2] URL - Brief description
...

**External Sources Used for Verification:**
[E1] URL - What it verified
[E2] URL - What it verified
...

---

**YOUR ROLE:**
You are NewsGrid's Article Verification AI. Your job is to:
1. VERIFY if the article's claims are FACTUALLY ACCURATE using external web search
2. EVALUATE how well the author has SOURCED their claims
3. Generate a comprehensive credibility report

**SCORING PHILOSOPHY:**
- An article must be BOTH accurate AND well-sourced to score highly
- A true article with no sources = medium score (45-55) - can't be verified by readers
- A false article with great sources = low score (35-50) - sources don't matter if claims are wrong
- Breaking news gets a bonus for limited sourcing if facts are accurate

**RULES:**
- ALWAYS use external search to verify factual accuracy - this is critical
- Be specific about which claims are verified vs. unverified
- If user provides no sources, Source Coverage = 0-15, Source Quality = 0
- Always output numerical scores, never NaN or placeholder text
- Use exact format "Label: [X/100]" for all scores
    `.trim();

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
**Article to Verify**

Headline: "${headline}"
Last Updated: ${lastUpdated}
Number of Sources Provided: ${sourceCount}

**User-Provided Sources:**
${userSourcesText || 'None provided'}

**Article Content:**
${content}

---
Please verify this article's accuracy and source quality. Generate the full credibility report.
`.trim()
          }
        ]
      }
    ];

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
        max_tokens: 5000,
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
