import { NextRequest, NextResponse } from 'next/server';

// Increase the maximum duration for this function (e.g., to 30 seconds)
export const maxDuration = 30; 

export async function POST(request: NextRequest) {
  try {
    // 1. Get the article content from the request body
    //    Assuming the client will send a JSON body with an "articleContent" field.
    const body = await request.json();
    const headline = body.headline; // Get headline
    const articleContent = body.articleContent;
    const userSources = body.userSources; // Get user-provided sources

    if (!headline || !articleContent) { // Check for headline too
      return NextResponse.json({ error: 'headline and articleContent are required' }, { status: 400 });
    }

    // 2. Get the Perplexity API Key from environment variables
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY is not set in environment variables.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 2. Construct the new, more detailed system prompt
    const systemPrompt = `You are an advanced AI news-checking assistant for a platform called NewsGrid. Your role is to analyze a user-submitted article and provide a structured report.

Here is your process, follow it exactly:
1.  **Headline-Content Relevance:** Analyze the provided headline against the article's content. In a section called "### Headline-Content Relevance", state whether the headline accurately reflects the content or if it appears to be misleading or clickbait. Provide a clear assessment.
2.  **Source-Content Relevance:** This is a crucial step. Analyze the user-provided sources in relation to the article's content. In a section called "### Source-Content Relevance", you must:
    a. Briefly summarize the topic of the article content.
    b. Briefly summarize the topics of the user-provided URLs.
    c. Provide a clear verdict on whether the sources are relevant to the article's subject matter. If they are not relevant, state this directly and explain the mismatch (e.g., "The article is about finance, but the provided sources are about sports.").
    d. If the sources ARE relevant, then proceed to state which claims from the article are supported by those sources.
3.  **Independent Verification:** Conduct your own real-time web search for independent corroboration of the article's main claims. In a section called "### Independent Verification", detail your findings. Note any claims that are well-supported or contradicted by a consensus of reliable, independent sources.
4.  **Actionable Suggestions:** Based on your complete analysis, provide a short, bulleted list of 2-3 clear, actionable suggestions for the author. Call this section "### Suggestions for Improvement".
5.  **Trust Score:** Finally, conclude your entire analysis with a numerical score. On a new line, write "Trust Score: [number]/100", where the number is heavily weighted by the relevance and accuracy of the headline, sources, and content. A major mismatch in any area should result in a very low score.
6.  **Citations:** At the very end of your response, create a section called "### Citations Used by AI". In this section, provide a numbered list of the URLs for the independent sources you used to verify the article's claims.`;

    // 3. Call the Perplexity API with the new prompt
    const perplexityApiUrl = 'https://api.perplexity.ai/chat/completions';
    const response = await fetch(perplexityApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`,
      },
      body: JSON.stringify({
        model: "sonar-pro", // Or another model like "sonar-small"
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Headline: "${headline}"\n\nArticle Content:\n"""\n${articleContent}\n"""\n\nUser-Provided Sources:\n"""\n${userSources}\n"""`
          }
        ]
        // You might be able to add other parameters here like temperature, max_tokens, etc.,
        // depending on what the API supports for the /chat/completions endpoint.
        // Refer to the Perplexity API Reference for full details on available parameters.
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Perplexity API error:', response.status, errorData);
      return NextResponse.json({ error: `Error from Perplexity API: ${response.statusText}`, details: errorData }, { status: response.status });
    }

    const verificationResult = await response.json();

    // 4. Return the result from Perplexity
    return NextResponse.json(verificationResult);

  } catch (error) {
    console.error('Error in verify-article API route:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Optional: You can also add a GET handler or other HTTP methods if needed
// export async function GET(request: NextRequest) {
//   return NextResponse.json({ message: 'This is the verify-article endpoint. Use POST to submit an article.' });
// }
