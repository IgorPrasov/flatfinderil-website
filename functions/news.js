/**
 * Cloudflare Pages Function: /news
 * Fetches RSS feeds server-side (no CORS issues), returns JSON.
 * Cached at Cloudflare edge for 1 hour.
 */

const FEEDS = [
  { url: 'https://www.timesofisrael.com/topic/real-estate/feed/',  name: 'Times of Israel', lang: 'en' },
  { url: 'https://www.timesofisrael.com/topic/mortgages/feed/',    name: 'Times of Israel', lang: 'en' },
  { url: 'https://www.jpost.com/rss/rssfeedsrealestate.aspx',      name: 'Jerusalem Post',  lang: 'en' },
];

const CAT_KW = {
  mortgage: ['mortgage','interest rate','prime rate','rate cut','rate hike','loan','bank of israel','refinanc','monthly payment','boi'],
  program:  ['affordable','lottery','subsidy','government program','ministry of housing','social housing','first-time buyer','mechir'],
  project:  ['construction','developer','urban renewal','new tower','new neighborhood','building permit','pinui','new development','housing unit'],
};

function classify(text) {
  const t = text.toLowerCase();
  for (const [cat, kws] of Object.entries(CAT_KW))
    if (kws.some(k => t.includes(k))) return cat;
  return 'news';
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'").trim();
}

function parseRSS(xml, sourceName, sourceLang) {
  const items = [];
  // Match each <item>...</item> block
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];

    // Title — handle CDATA
    const titleM = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                   block.match(/<title>([\s\S]*?)<\/title>/);
    const title = stripHtml(titleM?.[1] || '');
    if (!title) continue;

    // Description
    const descM = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
                  block.match(/<description>([\s\S]*?)<\/description>/);
    const body = stripHtml(descM?.[1] || '').substring(0, 300);

    // Link — try <link>, then <guid isPermaLink="true">, then any guid with http
    const linkM = block.match(/<link>(https?:\/\/[^\s<]+)<\/link>/) ||
                  block.match(/<link><!\[CDATA\[(https?:\/\/.*?)\]\]><\/link>/) ||
                  block.match(/<guid[^>]*isPermaLink="true"[^>]*>(https?:\/\/[^\s<]+)<\/guid>/) ||
                  block.match(/<guid[^>]*>(https?:\/\/[^\s<]+)<\/guid>/);
    const url = linkM?.[1]?.trim() || '';
    if (!url) continue;

    // Date
    const dateM = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    let date = new Date().toISOString().slice(0, 10);
    if (dateM?.[1]) {
      try { date = new Date(dateM[1].trim()).toISOString().slice(0, 10); } catch {}
    }

    items.push({ title, body, url, date, source: sourceName, lang: sourceLang, category: classify(title + ' ' + body) });
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
    return parseRSS(text, feed.name, feed.lang);
  } catch {
    return [];
  }
}

export async function onRequest(context) {
  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' } });
  }

  const results = await Promise.all(FEEDS.map(fetchFeed));
  let items = results.flat();

  // Sort by date desc, deduplicate
  items.sort((a, b) => b.date.localeCompare(a.date));
  const seen = new Set();
  items = items.filter(i => {
    const k = i.title.slice(0, 50).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  }).slice(0, 30);

  const payload = JSON.stringify({ updated: new Date().toISOString(), total: items.length, ticker: items.slice(0, 10).map(i => i.title), items });

  return new Response(payload, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
