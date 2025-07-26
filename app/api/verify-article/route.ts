import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// This is the prompt you provided.
const userPrompt = (headline: string, lastUpdated: string, userSourcesText: string) => `
You are a specialized AI assistant that completes a credibility report.
Your entire response MUST be the markdown content for the report. Nothing else.
- Do NOT write any introduction, conclusion, or conversational text.
- Do NOT include your reasoning or thought process.
- Fill out every section of the report template below using evidence from both user-provided and externally retrieved sources.
- You must conduct a live web search to verify the article’s claims using trusted, authoritative news or institutional sources.

--- CREDIBILITY REPORT (Fill this out) ---
⏰ **Article Freshness**
- Last Updated: ${lastUpdated}
- Assessment: [Is the article recent, dated, or outdated for its topic? Example: "This article, updated today, is highly current." or "This information from 2019 is likely outdated."]

🔍 **1. Headline Analysis**
- Headline: "${headline}"
- Assessment: [Is the headline neutral, biased, sensationalized, or clickbait?]
- Explanation: [Briefly explain why.]

🔗 **2. Claim & Source Analysis (User-Provided Sources)**
- User Sources: ${userSourcesText || 'None'}
- Instructions: ONLY use the user-provided sources below to complete this table.
| Claim # | Supported by User Sources? | Notes (with citations to user sources) |
|--------|-----------------------------|----------------------------------------|
| 1      |                             |                                        |
| 2      |                             |                                        |
| 3      |                             |                                        |
| 4      |                             |                                        |

🌎 **3. External Evidence Analysis**
- Instructions: Find and list external sources to verify the article’s claims. Use only credible outlets (news orgs, gov agencies, universities, etc).
- For each, include a short relevance explanation.
- Example:
  - **URL:** https://www.noaa.gov/news-release/noaa-predicts-above-normal-2024-atlantic-hurricane-season  
    **Relevance:** NOAA provides official forecasts, relevant to the claim about an active hurricane season.
- [List external URLs and relevance statements here.]

📊 **4. Trust Score Breakdown**
| Category                       | Score | Rationale                                  |
|-------------------------------|-------|--------------------------------------------|
| Headline Accuracy             | /20   |                                            |
| Source Quality (User & External) | /20   |                                            |
| Claim Support (User & External) | /30   |                                            |
| Tone & Bias                   | /10   |                                            |
| Structure & Clarity           | /10   |                                            |
| Bonus                         | /10   |                                            |
| **Total**                     | **/100** |                                          |

💡 **5. Suggestions for Improvement**
- Suggestion 1:
- Suggestion 2:
- Suggestion 3:

🧾 **6. Final Summary**
[Summarize the article’s overall credibility, strengths, weaknesses, and level of support — with citations.]

📚 **7. References**
[List all sources used. Separate into two groups: User-provided and external. Add “[User provided]” after user sources. If irrelevant, add “(Note: This source was found to be irrelevant to the article’s core claims)” next to it.]
`;

export async function POST(req: NextRequest) {
  try {
    const { article_id } = await req.json();
    if (!article_id) {
      return NextResponse.json({ error: 'Missing article_id' }, { status: 400 });
    }

    console.log(`API Route: Received request for article_id: ${article_id}`);

    // Create a Supabase client with the SERVICE ROLE KEY to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch article details from Supabase
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('headline, content, sources, last_updated')
      .eq('id', article_id)
      .single();

    if (articleError) throw articleError;

    // 2. Format data and construct the final prompt
    const userSourcesText = article.sources ? (article.sources as string[]).join('\n') : 'None';
    const lastUpdated = article.last_updated ? new Date(article.last_updated).toLocaleDateString() : 'N/A';
    const finalPrompt = userPrompt(article.headline, lastUpdated, userSourcesText);

    // 3. Call the Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3-sonar-large-32k-online",
        max_tokens: 4096,
        messages: [{ role: "user", content: finalPrompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    const credibilityReport = responseData.choices[0].message.content;
    let newStatus: 'Published' | 'Rejected - AI' = 'Published';
    if (!credibilityReport.includes('/100')) {
        newStatus = 'Rejected - AI';
    }

    // 4. Update the article with the report and new status
    const { error: updateError } = await supabaseAdmin
      .from('articles')
      .update({
        status: newStatus,
        analysis_result: { markdown_report: credibilityReport }
      })
      .eq('id', article_id);

    if (updateError) throw updateError;

    return NextResponse.json({ message: `Verification for ${article_id} processed. New status: ${newStatus}` });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
