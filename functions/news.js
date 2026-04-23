/**
 * Cloudflare Pages Function: /news
 * Fetches Israeli real estate news via Google News RSS (no CORS/blocking issues).
 * Cached at Cloudflare edge for 1 hour.
 */

const FEEDS = [
  {
    url: 'https://news.google.com/rss/search?q=real+estate+Israel+apartment&hl=en-IL&gl=IL&ceid=IL:en',
    lang: 'en',
  },
  {
    url: 'https://news.google.com/rss/search?q=Israel+mortgage+housing&hl=en-IL&gl=IL&ceid=IL:en',
    lang: 'en',
  },
  {
    url: 'https://news.google.com/rss/search?q=%D0%BD%D0%B5%D0%B4%D0%B2%D0%B8%D0%B6%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C+%D0%98%D0%B7%D1%80%D0%B0%D0%B8%D0%BB%D1%8C+%D0%B0%D1%80%D0%B5%D0%BD%D0%B4%D0%B0&hl=ru&gl=IL&ceid=IL:ru',
    lang: 'ru',
  },
];

const CAT_KW = {
  mortgage: ['mortgage','interest rate','prime rate','rate cut','rate hike','loan','bank of israel','refinanc','monthly payment','boi','ипотека','процентн','банк израиля'],
  program:  ['affordable','lottery','subsidy','government program','ministry of housing','mechir','субсидия','льготн','программ'],
  project:  ['construction','developer','urban renewal','new tower','building permit','pinui','новостройк','застройщик','строительств'],
  market:   ['market','prices','sale','buy','rent','purchase','рынок','цены','аренд','покупк'],
};

function classify(text) {
  const t = text.toLowerCase();
  for (const [cat, kws] of Object.entries(CAT_KW))
    if (kws.some(k => t.includes(k))) return cat;
  return 'news';
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&nbsp;/g,' ').trim();
}

function parseRSS(xml, sourceLang) {
  const items = [];
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];

    const titleM = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                   block.match(/<title>([\s\S]*?)<\/title>/);
    const title = stripHtml(titleM?.[1] || '');
    if (!title || title === 'Google News') continue;

    const descM = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
                  block.match(/<description>([\s\S]*?)<\/description>/);
    const body = stripHtml(descM?.[1] || '').substring(0, 300);

    // Google News wraps real URL in <a> inside description or uses <link>
    const linkM = block.match(/<link>(https?:\/\/[^\s<]+)<\/link>/) ||
                  block.match(/<link><!\[CDATA\[(https?:\/\/.*?)\]\]><\/link>/) ||
                  block.match(/href="(https?:\/\/[^"]+)"/);
    const url = linkM?.[1]?.trim() || '';
    if (!url || url.includes('news.google.com')) {
      // Try to extract source URL from Google redirect
      const redirectM = block.match(/url=(https?[^&"]+)/);
      if (!redirectM) continue;
    }

    const dateM = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    let date = new Date().toISOString().slice(0, 10);
    if (dateM?.[1]) {
      try { date = new Date(dateM[1].trim()).toISOString().slice(0, 10); } catch {}
    }

    // Extract source name from title (Google News format: "Title - Source")
    const parts = title.split(' - ');
    const source = parts.length > 1 ? parts[parts.length - 1] : 'Google News';
    const cleanTitle = parts.length > 1 ? parts.slice(0, -1).join(' - ') : title;

    items.push({
      title: cleanTitle,
      body,
      url: url || `https://news.google.com/search?q=${encodeURIComponent(cleanTitle)}`,
      date,
      source,
      lang: sourceLang,
      category: classify(cleanTitle + ' ' + body),
    });
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const resp = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 FlatFinderIL/1.0 (+https://flatfinderil.com)' },
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!resp.ok) return [];
    const text = await resp.text();
    return parseRSS(text, feed.lang);
  } catch {
    return [];
  }
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' },
    });
  }

  const url = new URL(context.request.url);
  const lang = url.searchParams.get('lang') || 'en';

  // Pick feeds relevant to requested language
  const feedsToFetch = lang === 'ru'
    ? [FEEDS[2], FEEDS[0]]   // ru first, then en
    : [FEEDS[0], FEEDS[1]];  // en feeds

  const results = await Promise.all(feedsToFetch.map(fetchFeed));
  let items = results.flat();

  // Sort by date desc, deduplicate by title
  items.sort((a, b) => b.date.localeCompare(a.date));
  const seen = new Set();
  items = items.filter(i => {
    const k = i.title.slice(0, 60).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  }).slice(0, 30);

  const payload = JSON.stringify({
    updated: new Date().toISOString(),
    total: items.length,
    ticker: items.slice(0, 10).map(i => i.title),
    items,
  });

  return new Response(payload, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
