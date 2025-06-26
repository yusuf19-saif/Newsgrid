import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body.url;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000), // 5-second timeout
    });

    if (!response.ok) {
      // Don't throw error, just return URL as title
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      return NextResponse.json({ title: url, hostname });
    }

    const html = await response.text();
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : url; // Fallback to URL
    const hostname = new URL(url).hostname.replace(/^www\./, '');

    return NextResponse.json({ title, hostname });
  } catch (error) {
    // In case of any error (e.g., timeout, invalid URL), we'll gracefully fallback
    try {
      const { url } = await request.json();
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      return NextResponse.json({ title: url, hostname });
    } catch {
      return NextResponse.json({ title: 'Invalid URL', hostname: 'error' }, { status: 400 });
    }
  }
}
