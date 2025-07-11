import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { scrapeUrl } from '../../../lib/scrapflyService';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Initialize the Google Generative AI client with a SERVER-SIDE variable
const googleApiKey = process.env.GOOGLE_API_KEY;
if (!googleApiKey) {
  throw new Error('GOOGLE_API_KEY is not set in server environment variables.');
}
const genAI = new GoogleGenerativeAI(googleApiKey);

// --- NEW: Reusable Gemini function with retry logic ---
async function callGeminiWithRetry(prompt: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  let result;
  let attempts = 0;
  const maxAttempts = 3; // Try a total of 3 times

  while (attempts < maxAttempts) {
    try {
      result = await model.generateContent(prompt);
      // If successful, break the loop
      break; 
    } catch (error: any) {
      attempts++;
      // If it's a 503 error and we have attempts left, wait and retry
      if (error.status === 503 && attempts < maxAttempts) {
        console.warn(`Gemini API overloaded (503). Retrying attempt ${attempts + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 1500 * attempts)); // Wait longer each time
      } else {
        // If it's another error or we're out of attempts, re-throw it to be caught by the calling function
        console.error("Gemini API call failed after multiple attempts.", error);
        throw error;
      }
    }
  }

  if (!result) {
    throw new Error("Failed to get response from Gemini after multiple attempts.");
  }
  
  const responseText = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(responseText);
}

// --- Placeholder for calling Perplexity API ---
async function askPerplexity(question: string) {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is not set in environment variables.');
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar', // Correct model name from official documentation
        messages: [{ role: 'user', content: question }],
        response_format: { 
          type: 'json_schema',
          json_schema: {
            schema: {
              type: 'object',
              properties: {
                assessment: { type: 'string' },
                summary: { type: 'string' },
                verified_claims: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      claim: { type: 'string' },
                      is_supported: { type: 'boolean' },
                      supporting_evidence: { type: 'string' }
                    },
                    required: ['claim', 'is_supported', 'supporting_evidence']
                  }
                },
                unverified_claims: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      claim: { type: 'string' },
                      is_supported: { type: 'boolean' },
                      reason: { type: 'string' }
                    },
                    required: ['claim', 'is_supported', 'reason']
                  }
                }
              },
              required: ['assessment', 'summary', 'verified_claims', 'unverified_claims']
            }
          }
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Perplexity API Error Body:', errorBody);
      throw new Error(`Perplexity API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data; // This will contain the AI's answer and sources

  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw error; // Re-throw to be handled by the main endpoint handler
  }
}

// All individual analysis functions (analyzeHeadline, analyzeSourceRelevance, etc.) are now removed.

// --- The new, all-in-one comprehensive report generator ---
async function generateFullReport(headline: string, content: string, sources: any[]) {
  try {
    // --- Source Scraping (same as before) ---
    const urls = sources.filter(s => s.type === 'url').map(s => s.value);
    let sourcesForPrompt = "No URL sources provided.";
    if (urls.length > 0) {
      const scrapePromises = urls.map(url => 
        scrapeUrl(url)
          .then(result => ({ 
            url, 
            content: result.result.content,
            is_broken: result.result.response_headers.status !== 200
          }))
          .catch(err => ({ url, content: `Failed to scrape: ${err.message}`, is_broken: true }))
      );
      const scrapedSources = await Promise.all(scrapePromises);
      sourcesForPrompt = scrapedSources.map((source, index) => {
        return `Source [${index + 1}]:\nURL: ${source.url}\nBROKEN: ${source.is_broken}\nCONTENT: ${source.content.substring(0, 2000)}...`;
      }).join('\n\n---\n\n');
    }

    const prompt = `
      You are an AI article verifier. Your task is to generate a comprehensive credibility report based on the provided main article and its sources.
      Your response must be a single, valid JSON object.

      Here are the steps and the required JSON structure for your response:

      ### Main Article Data ###
      Headline: "${headline}"
      Content: "${content.substring(0, 15000)}"

      ### Source Article Data ###
      ${sourcesForPrompt}

      ### Your Task ###
      Generate a JSON object with the following top-level keys: "headlineCheck", "claimAnalysisTable", "trustScore", "finalSummary", "suggestions", "references".

      1.  **headlineCheck**:
          - "assessment": "Accurate", "Misleading", "Clickbait", or "Partially True".
          - "explanation": "Briefly explain your reasoning."

      2.  **claimAnalysisTable**: An array of objects, where each object represents a single factual claim from the main article.
          - "claim": "The extracted factual claim."
          - "claim_type": "Factual", "Statistical", "Expert Opinion", "Causal", etc.
          - "is_supported": A boolean (true/false).
          - "sources": "The numbered source(s) that support/contradict this claim, e.g., '[1]', '[2], [X]' if broken."
          - "notes": "Brief notes on the verification, why it's supported, or why it could not be verified."

      3.  **trustScore**: An object with the trust score breakdown.
          - "headlineAccuracy": 0-20
          - "sourceQualityAndRelevance": 0-20 (Deduct points for broken or irrelevant sources)
          - "claimSupport": 0-30
          - "toneAndBias": 0-10
          - "structureAndClarity": 0-10
          - "bonus": 0-10 (For primary data, direct quotes, transparency)
          - "total": 0-100 (The sum of all scores)

      4.  **finalSummary**: A brief paragraph stating the article's overall credibility.

      5.  **suggestions**: An array of 3-5 strings, each being a bullet point for improvement.

      6.  **references**: An array of objects, linking the source number to its URL.
          - "id": The number (e.g., 1).
          - "url": The full URL of the source.

      ### Important Rules ###
      - Base your analysis ONLY on the provided data.
      - If a source is marked as BROKEN, mark its reference with [X] and do not award it points in the trust score.
      - Be impartial and objective.
    `;

    return await callGeminiWithRetry(prompt);

  } catch (error) {
    console.error('Error in comprehensive Gemini analysis:', error);
    return { error: 'Comprehensive analysis failed to complete.' };
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { headline, content, sources, draftId } = body;

  if (!headline || !content) {
    return new Response(JSON.stringify({ error: 'Headline and content are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const fullReport = await generateFullReport(headline, content, sources);
        controller.enqueue(`data: ${JSON.stringify(fullReport)}\n\n`);

        if (draftId && !fullReport.error) {
          const supabase = await createSupabaseServerClient();
          await supabase.from('articles').update({ analysis_result: fullReport as any }).eq('id', draftId);
        }
        
        controller.close();
      } catch (error) {
        console.error("Error during streaming analysis:", error);
        controller.enqueue(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 