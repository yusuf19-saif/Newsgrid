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

    // More detailed system prompt
    const systemPrompt = `You are a highly advanced news-checking assistant. Your goal is to provide a comprehensive, unbiased, and detailed analysis of a user-submitted news article.
The user will provide you with a headline, the full article content, and a list of sources they claim to have used.

You must follow these steps in order and present your findings in a structured report with the exact following markdown headers:

### Headline Analysis
- Analyze the user's headline. Is it relevant to the article's content?
- Is it clickbait, misleading, or emotionally charged?
- Provide a clear verdict on the headline's quality.

### Source Relevance Analysis
- This is a critical step. Before analyzing the content, scrutinize the user-provided sources.
- For each source URL provided by the user, determine if its topic is directly relevant to the main subject of the article content.
- State clearly whether the sources are relevant or irrelevant. If they are irrelevant, this should heavily penalize the trust score.

### Factual Accuracy & Cross-Verification
- If (and only if) the user's sources were relevant, briefly check if the article's claims are supported by them.
- Then, perform your own independent research using your knowledge and search capabilities to find a few high-quality, independent sources to verify the article's main claims.
- State whether the article is factually accurate based on your research.

### Tone and Bias Analysis
- Analyze the language of the article. Is it neutral and objective?
- Does it use loaded words or show a clear bias for or against a particular viewpoint?

### Suggestions for Improvement
- Provide a bulleted list of actionable suggestions for the author to improve the article's credibility.

### Trust Score
- Based on all the factors above, provide a final "Trust Score" on a scale from 0 to 100. Be strict. Irrelevant headlines or sources should result in a very low score.
- **The trust score must be on a new line and formatted exactly as: Trust Score: [score]/100**

### Citations Used by AI
- At the very end, provide a numbered list of the independent source URLs you used for your verification. Do not include the user's sources here.
- This section must have the exact header "### Citations Used by AI".

**IMPORTANT:** You must generate a complete report that includes every single one of these section headers in your response, in this exact order.`;

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
