import { NextResponse } from 'next/server';
import { scrapeUrl } from '../../../lib/scrapflyService';
// No longer importing a type that doesn't exist

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // 1. Scrape the URL to get the full result object.
    const scrapeResult: any = await scrapeUrl(url);
    const statusCode = scrapeResult.result.response_headers.status;

    // 2. Use the status code for reliable checking.
    if (statusCode === '404') {
      return NextResponse.json({ status: 'broken', reason: 'The page was not found (404 Error).' });
    }
    
    if (statusCode >= 400) {
        return NextResponse.json({ status: 'broken', reason: `The page returned an error (Status: ${statusCode}).` });
    }

    // 3. Perform a minimal content check only on successful scrapes.
    const wordCount = scrapeResult.result.content.trim().split(/\s+/).length;
    if (wordCount < 50) { // Reduced word count threshold
      return NextResponse.json({ status: 'broken', reason: `Page content is too short (${wordCount} words). Might be a captcha or empty page.` });
    }

    return NextResponse.json({ status: 'valid' });

  } catch (error: unknown) {
    let reason = "An unknown error occurred during scraping.";
    if (error instanceof Error) {
      reason = error.message;
    }
    console.error(`Scraping failed for ${url}. Reason: ${reason}`);
    return NextResponse.json({ status: 'invalid', reason: reason });
  }
}
