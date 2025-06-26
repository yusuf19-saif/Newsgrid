import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body.url;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the external page content
    const response = await fetch(url, {
        headers: {
            // Act like a browser to avoid getting blocked
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!response.ok) {
      // Don't treat this as a server error; just return the URL itself as the title
      return NextResponse.json({ title: url });
    }

    const html = await response.text();

    // Find the title tag using a regular expression
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : url; // Fallback to URL if no title

    return NextResponse.json({ title });

  } catch (error) {
    // If fetching fails, just return the original URL as the title
    const urlFromBody = (await request.json().catch(() => ({}))).url || '';
    return NextResponse.json({ title: urlFromBody });
  }
}
