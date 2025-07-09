import { NextResponse } from 'next/server';
import { scrapeUrl } from '../../../lib/scrapflyService';

const getTitle = (html: string): string => {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  return titleMatch ? titleMatch[1].toLowerCase() : '';
};

// This function now ONLY analyzes successful HTML content.
// It no longer needs its own try/catch for scraping errors.
function analyzeHtmlContent(htmlContent: string): { status: 'valid' | 'broken'; reason?: string } {
  const lowerCaseBody = htmlContent.toLowerCase();
  const pageTitle = getTitle(htmlContent);
  
  const notFoundPhrases = [
    "page not found", "404", "this page does not exist", 
    "we couldn't find the page", "we can't find", "page doesn't exist"
  ];

  if (notFoundPhrases.some(phrase => lowerCaseBody.includes(phrase) || pageTitle.includes(phrase))) {
    return { status: 'broken', reason: "Content indicates the page was not found." };
  }
  
  const wordCount = htmlContent.trim().split(/\s+/).length;
  if (wordCount < 100) {
    return { status: 'broken', reason: `Page content is too short (${wordCount} words).` };
  }

  return { status: 'valid' };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // 1. Attempt to scrape the URL. This is the only part that can throw.
    const htmlContent = await scrapeUrl(url);

    // 2. If scraping is successful, analyze the content.
    const result = analyzeHtmlContent(htmlContent);
    return NextResponse.json(result);

  } catch (error: unknown) {
    // 3. If ANY error occurs (scraping or otherwise), catch it here.
    let reason = "An unknown error occurred.";
    if (error instanceof Error) {
      // We take the clear error message from scrapeUrl's failure.
      reason = error.message;
    }
    console.error(`Scraping or analysis failed for ${url}. Reason: ${reason}`);
    // Return a clean, properly formatted invalid status.
    return NextResponse.json({ status: 'invalid', reason: reason });
  }
}
