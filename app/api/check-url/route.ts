import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // 1) HEAD first
    const headRes = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (headRes.status === 404) {
      return NextResponse.json({ status: 'broken', reason: 'The page was not found (404 Error).' });
    }
    if (headRes.status >= 400) {
      return NextResponse.json({ status: 'broken', reason: `The page returned an error (Status: ${headRes.status}).` });
    }

    // 2) Minimal GET content check
    const getRes = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (getRes.status === 404) {
      return NextResponse.json({ status: 'broken', reason: 'The page was not found (404 Error).' });
    }
    if (getRes.status >= 400) {
      return NextResponse.json({ status: 'broken', reason: `The page returned an error (Status: ${getRes.status}).` });
    }

    const text = await getRes.text();
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 50) {
      return NextResponse.json({ status: 'broken', reason: `Page content is too short (${wordCount} words). Might be a captcha or empty page.` });
    }

    return NextResponse.json({ status: 'valid' });
  } catch (err: any) {
    const reason = err?.message || 'Network error while fetching URL.';
    console.error(`URL check failed for ${url}. Reason: ${reason}`);
    return NextResponse.json({ status: 'invalid', reason });
  }
}
