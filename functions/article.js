/**
 * Cloudflare Pages Function: GET /article?url=ENCODED_URL
 *
 * Server-side proxy — fetches an article from an allowed domain,
 * strips boilerplate and returns clean JSON:
 * { title, date, source, sourceUrl, summary, bodyHtml, bodyText }
 *
 * Allowed domains:
 *   English: timesofisrael.com, jpost.com, haaretz.com, en.globes.co.il
 *   Hebrew:  calcalist.co.il, ynet.co.il, haaretz.co.il, globes.co.il, walla.co.il
 *   Russian: vesty.co.il, cursorinfo.co.il, israeltoday.co.il
 *   Gov:     boi.org.il, gov.il, data.gov.il, cbs.gov.il
 */

const ALLOWED_DOMAINS = [
  // Google News (redirect source — resolved before fetching)
  'news.google.com',
  // English press
  'timesofisrael.com', 'www.timesofisrael.com',
  'jpost.com', 'www.jpost.com',
  'haaretz.com', 'www.haaretz.com',
  'en.globes.co.il',
  // Hebrew press
  'calcalist.co.il', 'www.calcalist.co.il',
  'ynet.co.il', 'www.ynet.co.il',
  'haaretz.co.il', 'www.haaretz.co.il',
  'globes.co.il', 'www.globes.co.il',
  'walla.co.il', 'news.walla.co.il',
  // Russian-language Israeli press
  'vesty.co.il', 'www.vesty.co.il',
  'cursorinfo.co.il', 'www.cursorinfo.co.il',
  'israeltoday.co.il', 'www.israeltoday.co.il',
  // Government
  'boi.org.il', 'www.boi.org.il',
  'gov.il', 'www.gov.il',
  'data.gov.il',
  'cbs.gov.il', 'www.cbs.gov.il',
];

function isDomainAllowed(urlStr) {
  try {
    const { hostname } = new URL(urlStr);
    return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch { return false; }
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/&#(\d+);/g, (_,n) => String.fromCharCode(Number(n)));
}

function removeBoilerplate(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(?:iframe|form|button|input|select|textarea)[^>]*>[\s\S]*?<\/(?:iframe|form|button|input|select|textarea)>/gi, '');
}

function extractMetaDesc(html) {
  const m = html.match(/<meta[^>]+(?:property="og:description"|name="description")[^>]+content="([^"]{20,500})"/) ||
            html.match(/<meta[^>]+content="([^"]{20,500})"[^>]+(?:property="og:description"|name="description")/);
  return m ? decodeEntities(m[1]) : '';
}

function extractTitle(html) {
  const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/) ||
             html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/);
  if (og) return decodeEntities(og[1]);
  const h1 = html.match(/<h1[^>]*>([^<]{8,200})<\/h1>/);
  if (h1) return stripTags(h1[1]);
  const titleEl = html.match(/<title>([^<]{8,200})<\/title>/);
  if (titleEl) return decodeEntities(titleEl[1]).split('|')[0].split('-')[0].trim();
  return '';
}

function extractDate(html) {
  const candidates = [
    html.match(/<meta[^>]+(?:property="article:published_time"|name="publish_date")[^>]+content="([^"]+)"/),
    html.match(/datetime="(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2})/),
    html.match(/(\d{1,2})[\/\-\.](\d{2})[\/\-\.](\d{4})/),
  ];
  for (const m of candidates) {
    if (!m) continue;
    try {
      if (m[1]?.includes('-')) {
        const d = new Date(m[1]);
        const y = d.getFullYear();
        if (y >= 2000 && y <= 2050) return d.toISOString().slice(0, 10);
      }
      if (m[3]) {
        const year = Number(m[3]);
        if (year >= 2000 && year <= 2050)
          return new Date(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`).toISOString().slice(0, 10);
      }
    } catch {}
  }
  return new Date().toISOString().slice(0, 10);
}

function extractBody(html) {
  const clean = removeBoilerplate(html);
  const containers = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]+class="[^"]*(?:article-content|entry-content|post-content|article-body|field-items|the-content|td-post-content|story-body|article__body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+id="[^"]*(?:article-body|content|main-content|post-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];
  let bodyHtml = '';
  for (const re of containers) {
    const m = clean.match(re);
    if (m && m[1] && m[1].length > 200) { bodyHtml = m[1]; break; }
  }
  if (!bodyHtml) bodyHtml = clean;

  const paras = [];
  const pRe = /<(?:p|h2|h3|h4|blockquote)[^>]*>([\s\S]*?)<\/(?:p|h2|h3|h4|blockquote)>/gi;
  let pm;
  while ((pm = pRe.exec(bodyHtml)) !== null) {
    const text = decodeEntities(stripTags(pm[1])).trim();
    if (text.length > 30) paras.push(text);
  }
  const safeHtml = paras.slice(0, 25).map(p => `<p>${p}</p>`).join('\n');
  return { safeHtml, bodyText: paras.join('\n\n').substring(0, 5000) };
}

function getSourceLabel(hostname) {
  if (hostname.includes('boi.org.il'))         return 'Bank of Israel (בנק ישראל)';
  if (hostname.includes('timesofisrael.com'))  return 'Times of Israel';
  if (hostname.includes('jpost.com'))          return 'The Jerusalem Post';
  if (hostname.includes('calcalist.co.il'))    return 'Calcalist (כלכליסט)';
  if (hostname.includes('ynet.co.il'))         return 'Ynet (ינט)';
  if (hostname.includes('haaretz'))            return 'Haaretz (הארץ)';
  if (hostname.includes('globes.co.il'))       return 'Globes (גלובס)';
  if (hostname.includes('walla.co.il'))        return 'Walla (וואלה)';
  if (hostname.includes('vesty.co.il'))        return 'Вести (Vesty)';
  if (hostname.includes('cursorinfo.co.il'))   return 'Cursorinfo';
  if (hostname.includes('israeltoday.co.il'))  return 'Israel Today';
  if (hostname.includes('gov.il'))             return 'Israeli Government (gov.il)';
  if (hostname.includes('cbs.gov.il'))         return 'Central Bureau of Statistics (CBS)';
  return hostname;
}

const CORS = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' };

// Resolve Google News redirect URL to the actual article URL
async function resolveGoogleNews(url) {
  try {
    const r = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FlatFinderIL/2.0)' },
    });
    // r.url is the final URL after redirects
    if (r.url && r.url !== url && !r.url.includes('news.google.com')) return r.url;
    // HEAD didn't redirect away — try GET
    const r2 = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FlatFinderIL/2.0)', 'Accept': 'text/html' },
    });
    if (r2.url && r2.url !== url) return r2.url;
  } catch {}
  return null;
}

export async function onRequest(context) {
  const reqUrl = new URL(context.request.url);
  const articleUrl = reqUrl.searchParams.get('url');

  if (!articleUrl)
    return new Response(JSON.stringify({ error: 'Missing ?url= parameter' }),
      { status: 400, headers: CORS });

  // Resolve Google News redirect → actual article URL
  let finalUrl = articleUrl;
  try {
    const { hostname } = new URL(articleUrl);
    if (hostname === 'news.google.com') {
      const resolved = await resolveGoogleNews(articleUrl);
      if (resolved) finalUrl = resolved;
    }
  } catch {}

  if (!isDomainAllowed(finalUrl))
    return new Response(JSON.stringify({ error: 'Domain not in allowlist', resolvedUrl: finalUrl }),
      { status: 403, headers: CORS });

  try {
    const resp = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlatFinderIL/2.0; +https://flatfinderil.com)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,he;q=0.8,ru;q=0.7',
      },
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    // If upstream blocks us, still return the resolved URL so the client can open it directly
    if (!resp.ok)
      return new Response(JSON.stringify({ error: `Upstream ${resp.status}`, resolvedUrl: finalUrl }),
        { status: 200, headers: CORS });

    const html = await resp.text();
    const { hostname } = new URL(finalUrl);
    const { safeHtml, bodyText } = extractBody(html);
    const title    = extractTitle(html);
    const date     = extractDate(html);
    const metaDesc = extractMetaDesc(html);

    return new Response(JSON.stringify({
      title:     title || '',
      date,
      source:    getSourceLabel(hostname),
      sourceUrl: finalUrl,
      summary:   metaDesc,
      bodyHtml:  safeHtml || (metaDesc ? `<p>${metaDesc}</p>` : ''),
      bodyText:  bodyText || metaDesc,
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: CORS });
  }
}
