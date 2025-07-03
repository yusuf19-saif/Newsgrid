import { NextResponse } from 'next/server';

// Function to extract the title from an HTML string
const getTitle = (html: string): string => {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  return titleMatch ? titleMatch[1].toLowerCase() : '';
};

// Enhanced URL validation to detect dead, misleading, or empty pages
async function getUrlStatus(url: string): Promise<{ status: 'valid' | 'invalid' | 'broken'; reason?: string }> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) }); 
    
    if (response.status !== 200) {
      return { status: 'invalid', reason: `Server returned HTTP ${response.status}` };
    }

    const text = await response.text();
    const lowerCaseBody = text.toLowerCase();
    const pageTitle = getTitle(text);
    
    // List of common "not found" phrases to check in both title and body
    const notFoundPhrases = [
      "page not found", 
      "404", 
      "this page does not exist", 
      "we couldn't find the page",
      "we can't find",
      "page doesn't exist"
    ];

    if (notFoundPhrases.some(phrase => lowerCaseBody.includes(phrase) || pageTitle.includes(phrase))) {
      return { status: 'broken', reason: "Invalid (Page not found)" };
    }
    
    // A simple word counter to check for meaningful content
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 100) {
      return { status: 'broken', reason: `Page content is too short (${wordCount} words)` };
    }

    return { status: 'valid' };
  } catch (e: any) {
    if (e.name === 'TimeoutError') {
      return { status: 'invalid', reason: "Request timed out" };
    }
    return { status: 'invalid', reason: "Failed to fetch or resolve URL" };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const result = await getUrlStatus(url);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ status: 'invalid', reason: 'An unexpected error occurred during check' }, { status: 500 });
  }
}
