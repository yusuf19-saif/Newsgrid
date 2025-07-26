import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// This function constructs the prompt for the AI, filling in the article data.
const createExternalEvidencePrompt = (headline: string, lastUpdated: string, content: string) => `
You are an AI fact-checking assistant.

Your task is to verify the factual accuracy of a news article using publicly available online sources. The goal is to identify which claims in the article are supported by credible evidence on the internet, and which are not.

## Instructions:
- Search the web for each significant factual claim in the article.
- For each claim, indicate whether it is **SUPPORTED**, **DISPUTED**, or **NO EVIDENCE FOUND**, based on your findings.
- Provide at least one source link (if available) to support your judgment.
- Only use credible sources (e.g., reputable news outlets, government websites, academic journals).
- Be objective and concise.

## Output format (in Markdown):

### Headline
${headline}

### Last Updated
${lastUpdated}

### Claim-by-Claim Verification

1. **Claim:** [quote the claim]
   - **Status:** SUPPORTED / DISPUTED / NO EVIDENCE FOUND
   - **Evidence:** [brief explanation]
   - **Source:** [URL]

2. **Claim:** ...

### Overall Summary

Provide a short summary of your findings. Was the article mostly accurate, or were there multiple unsupported claims?

---

### Article Content:

${content}
`;

export async function POST(req: NextRequest) {
  try {
    const { article_id } = await req.json();
    if (!article_id) {
      return NextResponse.json({ error: 'Missing article_id' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch the article data, including any existing analysis results
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('headline, content, last_updated, analysis_result')
      .eq('id', article_id)
      .single();

    if (articleError) {
      console.error('Error fetching article:', articleError);
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    // 2. Construct the prompt
    const lastUpdated = article.last_updated ? new Date(article.last_updated).toLocaleDateString() : 'Not specified';
    const finalPrompt = createExternalEvidencePrompt(article.headline, lastUpdated, article.content);

    // 3. Call the Perplexity API with an online model from their documentation examples
    const perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    });

    const response = await perplexity.chat.completions.create({
      // Using a model name from the official API documentation examples
      model: "sonar-medium-online",
      messages: [{ role: "user", content: finalPrompt }],
      max_tokens: 4096,
    });

    const report = response.choices[0].message.content;

    // 4. Merge the new report with any existing analysis data
    const existingAnalysis = (article.analysis_result as object) || {};
    const newAnalysis = {
      ...existingAnalysis,
      external_evidence_report: report,
      external_evidence_report_at: new Date().toISOString()
    };

    // 5. Update the article in the database
    const { error: updateError } = await supabaseAdmin
      .from('articles')
      .update({ analysis_result: newAnalysis })
      .eq('id', article_id);

    if (updateError) {
      console.error('Error updating article with new report:', updateError);
      throw updateError;
    }

    return NextResponse.json({ message: `External evidence check for article ${article_id} complete.` });

  } catch (error: any) {
    console.error("External Evidence Check API Error:", error);
    const errorMessage = error.error?.message || 'An internal server error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 