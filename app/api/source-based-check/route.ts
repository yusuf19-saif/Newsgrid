import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// This function constructs the prompt for the AI.
const createSourceBasedPrompt = (lastUpdated: string, headline: string, userSourcesText: string, articleContent: string) => `
Here is the article content you need to analyze:
---
${articleContent}
---

Now, using the article content above and the user-provided sources below, complete the following credibility report.

You are a specialized AI assistant that completes a credibility report.
Your entire response MUST be the markdown content for the report. Nothing else.

- Do NOT write any introduction, conclusion, or conversational text.
- Do NOT include your reasoning or thought process.
- Fill out every section of the report template below.

--- CREDIBILITY REPORT (Fill this out) ---
⏰ **Article Freshness**
- Last Updated: ${lastUpdated}
- Assessment: [Analyze the provided "Last Updated" date. State whether the article is recent, dated, or out-of-date for its topic.]

🔍 **1. Headline Analysis**
- Headline: "${headline}"
- Assessment: [Is the headline neutral, sensationalized, biased, or clickbait?]
- Explanation: [Briefly explain your reasoning.]

🔗 **2. Claim & Source Analysis (User-Provided Sources Only)**
- User Sources: ${userSourcesText || 'None'}
- Instructions: Analyze ONLY the user-provided sources. Do not use external evidence.
| Claim # | Supported by User Sources? | Notes (with citations to user sources) |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |

📊 **4. Trust Score Breakdown**
| Category | Score | Rationale |
|---|---|---|
| Headline Accuracy | /20 | |
| Source Quality (User Only) | /20 | |
| Claim Support (User Sources) | /30 | |
| Tone & Bias | /10 | |
| Structure & Clarity | /10 | |
| Bonus | /10 | |
| **Total** | **/100** | |

💡 **5. Suggestions for Improvement**
- Suggestion 1:
- Suggestion 2:
- Suggestion 3:

🧾 **6. Final Summary**
[Your final summary here, based only on the article and user sources.]

📚 **7. References**
[List every user-provided source and mark them as "[User provided]". If any are irrelevant, still include them and add "(Note: This source was found to be irrelevant)"]
`;

export async function POST(req: NextRequest) {
  try {
    const { article_id } = await req.json();
    if (!article_id) {
      return NextResponse.json({ error: 'Missing article_id' }, { status: 400 });
    }

    // Use a service role client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch article data
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('headline, content, sources, last_updated')
      .eq('id', article_id)
      .single();

    if (articleError) throw articleError;

    // 2. Format data and construct the final prompt
    const userSourcesText = article.sources ? (article.sources as string[]).join('\n---\n') : 'No sources provided.';
    const lastUpdated = article.last_updated ? new Date(article.last_updated).toLocaleDateString() : 'Not specified';
    const finalPrompt = createSourceBasedPrompt(lastUpdated, article.headline, userSourcesText, article.content);

    // 3. Call the Perplexity API with the correct offline model name
    const perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    });
    
    const response = await perplexity.chat.completions.create({
      model: "llama-3.1-sonar-small-128k", // Corrected offline model name
      messages: [{ role: "user", content: finalPrompt }],
      max_tokens: 4096,
    });

    const report = response.choices[0].message.content;

    // 4. Update the article with the source-based report
    const { error: updateError } = await supabaseAdmin
      .from('articles')
      .update({
        analysis_result: {
          source_based_report: report,
          source_based_report_at: new Date().toISOString()
        }
      })
      .eq('id', article_id);

    if (updateError) throw updateError;

    return NextResponse.json({ message: `Source-based check for article ${article_id} complete.` });

  } catch (error: any) {
    console.error("Source-Based Check API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 