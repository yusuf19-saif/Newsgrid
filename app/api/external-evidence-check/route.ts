import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define the type for user-provided sources stored in the database
interface UserSource {
  value: string;
  // Note: status is not used in this route but is part of the type
  status: 'valid' | 'invalid' | 'unchecked';
}

// Zod schema for request body validation
const requestBodySchema = z.object({
  articleId: z.string().uuid(),
});

// Supabase Admin Client to bypass RLS for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Composes the credibility report prompt for the Perplexity API.
 * This prompt is dynamic and changes based on whether user sources are provided.
 *
 * @param headline - The headline of the article.
 * @param last_updated - The date the article was last updated.
 * @param content - The full content of the article.
 * @param userSources - An array of sources provided by the user.
 * @returns The formatted prompt string.
 */
const getCredibilityReportPrompt = (headline: string, last_updated: string, content: string, userSources: UserSource[] | null): string => {
  const hasUserSources = userSources && userSources.length > 0;

  const userSourcesSection = hasUserSources
    ? `
**User-Provided Sources:**
${userSources.map((source, index) => `- Source ${index + 1}: ${source.value}`).join('\n')}

Base the "trust_score" fields in the JSON response **exclusively** on how well these user-provided sources support the article's claims.
`
    : `
**No user-provided sources were submitted.**
Therefore, set the \`trust_score.score\` in the JSON response to \`"Incomplete"\` and provide a rationale explaining that a score cannot be calculated without user-provided evidence. Still, proceed to verify claims using your own external research.
`;

  return `
You are an AI fact-checking assistant. Your task is to produce a credibility report for the news article provided below.

Your response **MUST** be a single, valid JSON object that follows the structure provided.

---
**Core Instructions:**

1.  **Analyze User-Provided Sources:** I will provide a list of sources from the user. You must evaluate them to score the article's claims for the "trust_score".
    ${userSourcesSection}

2.  **Conduct External Research:** Use your web search capabilities to find additional, independent external evidence. Use these external sources for context and to verify claims, but **they must not influence the Trust Score categories**.

3.  **Generate Report:** Fill out the JSON structure below. In the "claim_analysis", clearly distinguish between evidence from user sources and evidence you found externally.

---
**Article to Analyze:**

- **Headline:** ${headline}
- **Last Updated:** ${last_updated}
- **Content:**
  ${content}

---
**JSON STRUCTURE TO RETURN:**

{
  "trust_score": {
    "score": "Calculated score (number) or 'Incomplete' if no user sources",
    "rationale": "Brief summary of the score. Explain why it's incomplete if applicable.",
    "breakdown": [
      { "category": "Source Quality", "score": "number or N/A", "rationale": "Rationale here." },
      { "category": "Claim Support", "score": "number or N/A", "rationale": "Rationale here." },
      { "category": "Headline Accuracy", "score": "number or N/A", "rationale": "Rationale here." },
      { "category": "Tone & Bias", "score": "number or N/A", "rationale": "Rationale here." },
      { "category": "Structure & Clarity", "score": "number or N/A", "rationale": "Rationale here." }
    ]
  },
  "claim_analysis": [
    {
      "claim": "Quote the exact factual claim from the article.",
      "verdict": "Supported by User Source" | "Supported by External Source" | "Refuted" | "Unverified",
      "evidence": {
        "user_provided": [
          { "url": "https://...", "title": "Source Title", "snippet": "..." }
        ],
        "externally_found": [
          { "url": "https://...", "title": "Source Title", "snippet": "..." }
        ]
      }
    }
  ],
  "suggestions_for_improvement": [
    "Suggestion 1...",
    "Suggestion 2..."
  ]
}
`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = requestBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { articleId } = validation.data;

    // 1. Fetch the article and its user-provided sources from the database
    const { data: articleData, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('headline, content, last_updated, sources')
      .eq('id', articleId)
      .single();

    if (fetchError || !articleData) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json({ error: `Article with ID ${articleId} not found.` }, { status: 404 });
    }

    // 2. Prepare data for the prompt
    const userSources = articleData.sources as UserSource[] | null;
    const lastUpdated = articleData.last_updated ? new Date(articleData.last_updated).toLocaleDateString() : 'Not specified';
    const finalPrompt = getCredibilityReportPrompt(articleData.headline, lastUpdated, articleData.content || '', userSources);

    // 3. Call Perplexity API
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3-sonar-large-32k-online',
        messages: [{ role: 'user', content: finalPrompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!perplexityResponse.ok) {
      const errorBody = await perplexityResponse.text();
      console.error('Perplexity API Error:', errorBody);
      return NextResponse.json({ error: 'Failed to get response from Perplexity API.', details: errorBody }, { status: perplexityResponse.status });
    }

    const perplexityData = await perplexityResponse.json();
    const responseContent = perplexityData.choices[0]?.message?.content;

    if (!responseContent) {
      return NextResponse.json({ error: 'Received an empty response from Perplexity.' }, { status: 500 });
    }

    // 4. Parse the JSON response, save it, and return it
    try {
      const structuredResponse = JSON.parse(responseContent);

      // Save the report to the database under a specific key
      const { error: updateError } = await supabaseAdmin
        .from('articles')
        .update({
          analysis_result: {
            // This structure prevents overwriting other potential analysis results
            external_evidence_report: structuredResponse 
          }
        })
        .eq('id', articleId);

      if (updateError) {
        console.error('Supabase Update Error:', updateError);
        // We still return the data to the user even if saving fails
        return NextResponse.json({ 
            warning: 'Failed to save analysis to the database.', 
            data: structuredResponse 
        });
      }

      return NextResponse.json(structuredResponse);
    } catch (parseError) {
      console.error("Failed to parse Perplexity's JSON response:", parseError);
      return NextResponse.json({ error: "Failed to parse Perplexity's JSON response.", rawResponse: responseContent }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'An unexpected internal server error occurred.', details: error.message }, { status: 500 });
  }
} 