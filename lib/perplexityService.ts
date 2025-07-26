const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

if (!perplexityApiKey) {
  throw new Error('PERPLEXITY_API_KEY is not set in environment variables.');
}

interface PerplexitySearchResult {
  summary: string;
  sources: { name: string; url: string }[];
}

/**
 * Searches for evidence related to a claim using the Perplexity API.
 * @param claim The claim string to verify.
 * @returns A summary of the findings and the sources used.
 */
export async function searchClaim(claim: string): Promise<PerplexitySearchResult> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a precise fact-checker. Summarize the web search results for the following claim in 2-3 sentences. The response should be a plain summary.',
          },
          {
            role: 'user',
            content: claim,
          },
        ],
        return_sources: true, // Request that Perplexity returns the sources it used.
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Perplexity API error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Perplexity API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Extract both the summary content and the sources from the response.
    const summary = data.choices[0].message.content;
    const sources = data.choices[0].sources || [];

    return { summary, sources };
  } catch (error) {
    console.error(`Perplexity error while searching for claim "${claim}":`, error);
    return {
      summary: 'Could not retrieve external evidence for this claim.',
      sources: [],
    };
  }
}
