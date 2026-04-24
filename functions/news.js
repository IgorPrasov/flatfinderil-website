/**
 * Cloudflare Pages Function: /news
 * Israeli real estate news — curated Israeli sources only.
 * Sources: Jerusalem Post, Calcalist, Globes, Ynet, Haaretz, Times of Israel,
 *          Walla, Vesty (RU), Cursorinfo (RU), IsraelToday (RU) + CBS/Bank of Israel data
 */

const FEEDS = [
  // ── Hebrew feeds (always Israeli) ────────────────────────────────────────
  {
    id: 'calcalist',
    url: 'https://news.google.com/rss/search?q=%D7%A0%D7%93%D7%9C%D7%9F+%D7%93%D7%99%D7%A8%D7%94+%D7%9E%D7%97%D7%99%D7%A8%D7%99%D7%9D+site:calcalist.co.il&hl=iw&gl=IL&ceid=IL:iw',
    lang: 'he', src: 'Calcalist',
  },
  {
    id: 'ynet',
    url: 'https://news.google.com/rss/search?q=%D7%A0%D7%93%D7%9C%D7%9F+%D7%93%D7%99%D7%A8%D7%94+%D7%A9%D7%9B%D7%99%D7%A8%D7%95%D7%AA+site:ynet.co.il&hl=iw&gl=IL&ceid=IL:iw',
    lang: 'he', src: 'Ynet',
  },
  {
    id: 'globes',
    url: 'https://news.google.com/rss/search?q=%D7%A0%D7%93%D7%9C%D7%9F+%D7%91%D7%A0%D7%99%D7%99%D7%94+%D7%A7%D7%91%D7%9C%D7%9F+%D7%9E%D7%97%D7%99%D7%A8%D7%99%D7%9D+site:globes.co.il&hl=iw&gl=IL&ceid=IL:iw',
    lang: 'he', src: 'Globes',
  },
  {
    id: 'haaretz',
    url: 'https://news.google.com/rss/search?q=%D7%A0%D7%93%D7%9C%D7%9F+%D7%93%D7%99%D7%95%D7%A8+%D7%9E%D7%97%D7%99%D7%A8%D7%99%D7%9D+site:haaretz.co.il&hl=iw&gl=IL&ceid=IL:iw',
    lang: 'he', src: 'Haaretz',
  },
  {
    id: 'walla',
    url: 'https://news.google.com/rss/search?q=%D7%A0%D7%93%D7%9C%D7%9F+%D7%93%D7%99%D7%A8%D7%94+%D7%9E%D7%9B%D7%99%D7%A8%D7%94+site:walla.co.il&hl=iw&gl=IL&ceid=IL:iw',
    lang: 'he', src: 'Walla',
  },
  // CBS Israel + Bank of Israel stats (Hebrew)
  {
    id: 'cbs',
    url: 'https://news.google.com/rss/search?q=%D7%A2%D7%A1%D7%A7%D7%90%D7%95%D7%AA+%D7%93%D7%99%D7%A8%D7%95%D7%AA+%D7%9E%D7%93%D7%93+%D7%9E%D7%97%D7%99%D7%A8%D7%99+%D7%93%D7%99%D7%A8%D7%95%D7%AA+%D7%99%D7%A9%D7%A8%D7%90%D7%9C&hl=iw&gl=IL&ceid=IL:iw',
    lang: 'he', src: 'נתוני שוק',
  },
  // ── English feeds (Israeli press) ────────────────────────────────────────
  {
    id: 'jpost',
    url: 'https://news.google.com/rss/search?q=Israel+real+estate+housing+apartment+property+site:jpost.com&hl=en-IL&gl=IL&ceid=IL:en',
    lang: 'en', src: 'Jerusalem Post',
  },
  {
    id: 'timesofisrael',
    url: 'https://news.google.com/rss/search?q=Israel+real+estate+housing+apartments+prices+site:timesofisrael.com&hl=en-IL&gl=IL&ceid=IL:en',
    lang: 'en', src: 'Times of Israel',
  },
  {
    id: 'globes_en',
    url: 'https://news.google.com/rss/search?q=Israel+real+estate+housing+developer+site:en.globes.co.il&hl=en-IL&gl=IL&ceid=IL:en',
    lang: 'en', src: 'Globes EN',
  },
  {
    id: 'haaretz_en',
    url: 'https://news.google.com/rss/search?q=Israel+real+estate+housing+mortgage+site:haaretz.com&hl=en-IL&gl=IL&ceid=IL:en',
    lang: 'en', src: 'Haaretz EN',
  },
  // ── Russian-language Israeli media (no MigNews, no 9tv) ──────────────────
  {
    id: 'vesty',
    url: 'https://news.google.com/rss/search?q=%D0%BD%D0%B5%D0%B4%D0%B2%D0%B8%D0%B6%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C+%D0%98%D0%B7%D1%80%D0%B0%D0%B8%D0%BB%D1%8C+site:vesty.co.il&hl=ru&gl=RU&ceid=RU:ru',
    lang: 'ru', src: 'Вести',
  },
  {
    id: 'cursorinfo',
    url: 'https://news.google.com/rss/search?q=%D0%BD%D0%B5%D0%B4%D0%B2%D0%B8%D0%B6%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C+%D0%98%D0%B7%D1%80%D0%B0%D0%B8%D0%BB%D1%8C+site:cursorinfo.co.il&hl=ru&gl=RU&ceid=RU:ru',
    lang: 'ru', src: 'Cursorinfo',
  },
  {
    id: 'israeltoday',
    url: 'https://news.google.com/rss/search?q=%D0%BD%D0%B5%D0%B4%D0%B2%D0%B8%D0%B6%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C+%D0%98%D0%B7%D1%80%D0%B0%D0%B8%D0%BB%D1%8C+site:israeltoday.co.il&hl=ru&gl=RU&ceid=RU:ru',
    lang: 'ru', src: 'IsraelToday',
  },
  // ── Regional feeds (Hebrew, Israel geo) ──────────────────────────────────
  {
    id: 'north',
    url: 'https://news.google.com/rss/search?q=%D7%A0%D7%93%D7%9C%D7%9F+%D7%97%D7%99%D7%A4%D7%94+%D7%A0%D7%AA%D7%A0%D7%99%D7%94+%D7%A2%D7%9B%D7%95+%D7%98%D7%91%D7%A8%D7%99%D7%94+%D7%A0%D7%94%D7%A8%D7%99%D7%94&hl=iw&gl=IL&ceid=IL:iw',
    lang: 'he', src: 'Google News IL', region: 'north',
  },
  {
    id: 'center',
    url: 'https://news.google.com/rss/search?q=%D7%A0%D7%93%D7%9C%D7%9F+%D7%AA%D7%9C+%D7%90%D7%91%D7%99%D7%91+%D7%A4%D7%AA%D7%97+%D7%AA%D7%A7%D7%95%D7%95%D7%94+%D7%A8%D7%A2%D7%A0%D7%A0%D7%94+%D7%A8%D7%97%D7%95%D7%91%D7%95%D7%AA&hl=iw&gl=IL&ceid=IL:iw',
    lang: 'he', src: 'Google News IL', region: 'center',
  },
  {
    id: 'south',
    url: 'https://news.google.com/rss/search?q=%D7%A0%D7%93%D7%9C%D7%9F+%D7%91%D7%90%D7%A8+%D7%A9%D7%91%D7%A2+%D7%90%D7%A9%D7%93%D7%95%D7%93+%D7%90%D7%A9%D7%A7%D7%9C%D7%95%D7%9F&hl=iw&gl=IL&ceid=IL:iw',
    lang: 'he', src: 'Google News IL', region: 'south',
  },
];

// ── Category classifier ───────────────────────────────────────────────────────
const CAT_KW = {
  mortgage: ['mortgage','interest rate','prime','rate cut','rate hike','loan','bank of israel','boi','lending',
             'ипотека','процент','банк израиля','кредит','ставка',
             'משכנתה','ריבית','בנק ישראל','הלוואה','פריים'],
  program:  ['affordable','lottery','subsidy','government','ministry of housing','mechir',
             'субсидия','льготн','программ','лотерея','министерство',
             'מחיר למשתכן','סבסוד','משרד השיכון','תוכנית','מכרז'],
  project:  ['construction','developer','urban renewal','building permit','pinui','new project','tower',
             'новостройк','застройщик','строительств','реновац','котлован',
             'פינוי בינוי','התחדשות','קבלן','פרויקט','בנייה','היתר'],
  market:   ['market','prices','sale','buy','rent','purchase','statistics','sold','transactions','index',
             'рынок','цены','аренд','покупк','статистик','продано','сделок','индекс',
             'שוק','מחירים','שכירות','מכירה','עסקאות','נתונים','מדד','סטטיסטיקה'],
};

// ── Region classifier ─────────────────────────────────────────────────────────
const REGION_CITIES = {
  north: ['haifa','netanya','hadera','akko','acre','tiberias','nahariya','karmiel','afula','nazareth',
          'хайфа','нетания','хадера','акко','тверия','нагария','кармиэль','афула','назарет',
          'חיפה','נתניה','חדרה','עכו','טבריה','נהריה','כרמיאל','עפולה','נצרת'],
  center: ['tel aviv','tel-aviv','petah tikva','herzliya','raanana','rehovot','modiin','holon','bat yam',
           'rishon','givatayim','ramat gan','bnei brak','lod','ramla','kfar saba',
           'тель-авив','тель авив','петах-тиква','герцлия','раанана','реховот','модиин',
           'холон','бат-ям','ришон','рамат-ган','бней-брак','лод','кфар-саба',
           'תל אביב','פתח תקווה','הרצליה','רעננה','רחובות','מודיעין','חולון','בת ים','ראשון לציון',
           'גבעתיים','רמת גן','בני ברק','לוד','כפר סבא'],
  south:  ['beer sheva','beer-sheva','ashdod','ashkelon','eilat','netivot','kiryat gat','dimona','sderot','arad',
           'беэр-шева','ашдод','ашкелон','эйлат','нетивот','кирьят-гат','димона','сдерот','арад',
           'באר שבע','אשדוד','אשקלון','אילת','נתיבות','קריית גת','דימונה','שדרות','ערד'],
};

// ── Real-estate relevance ─────────────────────────────────────────────────────
const RE_KW = [
  'недвижимость','квартир','аренд','ипотек','жиль','застройщик','новостройк',
  'строительств','жилья','рынок недвижимости','цены на жилье',
  'apartment','housing','real estate','mortgage','property','rent','home price',
  'דירה','נדל','שכירות','משכנתה','דיור','בנייה','נכס','פרויקט','קבלן','מחיר',
  'עסקאות דירות','שוק הנדלן',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function stripHtml(s) {
  // Decode entities first, then strip tags (handles entity-encoded HTML like &lt;a href=...&gt;)
  let t = (s || '')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    .replace(/&#039;/g,"'").replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
  t = t.replace(/<[^>]*>/g, '');
  return t.replace(/&amp;/g,'&').replace(/\s{2,}/g,' ').trim();
}

function cleanBody(raw, title) {
  if (!raw) return '';
  let t = raw;
  // Strip repeated title at start (Google News pattern)
  const ts = (title || '').slice(0, 40).toLowerCase();
  if (ts && t.toLowerCase().startsWith(ts)) t = t.slice(title.length).replace(/^[\s\-–•·]+/,'');
  // Cut at noise markers (related articles section)
  const cut = t.search(/\n|\r|•|·|\s{3,}/);
  if (cut > 20) t = t.slice(0, cut);
  if (/^https?:\/\//i.test(t.trim())) return '';
  return t.trim().slice(0, 280);
}

function classify(text) {
  const t = text.toLowerCase();
  for (const [cat, kws] of Object.entries(CAT_KW))
    if (kws.some(k => t.includes(k))) return cat;
  return 'news';
}

function classifyRegion(text, feedRegion) {
  if (feedRegion) return feedRegion;
  const t = text.toLowerCase();
  for (const [r, cities] of Object.entries(REGION_CITIES))
    if (cities.some(c => t.includes(c))) return r;
  return null;
}

function isRelevant(text) {
  return RE_KW.some(k => text.toLowerCase().includes(k));
}

// ── RSS parser ────────────────────────────────────────────────────────────────
function parseRSS(xml, feed) {
  const items = [];
  const re = /<item[\s>]([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];

    const titleM = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)
                || block.match(/<title>([\s\S]*?)<\/title>/);
    const title = stripHtml(titleM?.[1] || '');
    if (!title || title === 'Google News') continue;

    const descM = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)
               || block.match(/<description>([\s\S]*?)<\/description>/);
    const rawBody = stripHtml(descM?.[1] || '');

    const linkM = block.match(/<link>(https?:\/\/[^\s<]+)<\/link>/)
               || block.match(/<link><!\[CDATA\[(https?:\/\/.*?)\]\]><\/link>/)
               || block.match(/href="(https?:\/\/[^"]+)"/);
    const url = linkM?.[1]?.trim() || '';
    if (!url) continue;

    const dateM = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    let date = new Date().toISOString().slice(0, 10);
    if (dateM?.[1]) { try { date = new Date(dateM[1].trim()).toISOString().slice(0,10); } catch {} }

    // Source: prefer feed's src over extracted "Title - Source" pattern
    const parts = title.split(' - ');
    const cleanTitle = parts.length > 1 ? parts.slice(0,-1).join(' - ').trim() : title;
    const source = feed.src || (parts.length > 1 ? parts[parts.length-1].trim() : 'Israel News');

    const combined = cleanTitle + ' ' + rawBody;
    if (!isRelevant(combined)) continue;

    items.push({
      title: cleanTitle,
      body: cleanBody(rawBody, cleanTitle),
      url,
      date,
      source,
      lang: feed.lang,
      category: classify(combined),
      region: classifyRegion(combined, feed.region || null),
    });
  }
  return items;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchFeed(feed) {
  try {
    const r = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 FlatFinderIL/1.0' },
      cf: { cacheTtl: 1800, cacheEverything: true },
    });
    if (!r.ok) return [];
    return parseRSS(await r.text(), feed);
  } catch { return []; }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function onRequest(context) {
  if (context.request.method === 'OPTIONS')
    return new Response(null, { headers: {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET'} });

  const lang = new URL(context.request.url).searchParams.get('lang') || 'ru';

  // Feed index selection by language
  const MAIN = {
    ru: [10, 11, 12, 0, 1, 2, 5],     // RU Israeli sites + HE + JPost
    he: [0, 1, 2, 3, 4, 5],           // All Hebrew feeds
    en: [6, 7, 8, 9, 0, 1],           // EN + Hebrew
    fr: [10, 11, 12, 5, 6, 0, 1],     // Same as RU (no FR Israeli sources)
  }[lang] || [10, 11, 12, 0, 1, 5];

  const REGIONAL = [13, 14, 15]; // north, center, south

  const idxs = [...new Set([...MAIN, ...REGIONAL])];
  const results = await Promise.all(idxs.map(i => fetchFeed(FEEDS[i])));
  let items = results.flat();

  // Sort by date, deduplicate
  items.sort((a, b) => b.date.localeCompare(a.date));
  const seen = new Set();
  items = items.filter(i => {
    const k = i.title.slice(0, 50).toLowerCase().replace(/\s+/g,'');
    if (seen.has(k)) return false;
    seen.add(k); return true;
  }).slice(0, 40);

  // Group by region
  const regions = { north: [], center: [], south: [] };
  for (const item of items)
    if (item.region && regions[item.region]?.length < 3) regions[item.region].push(item);

  return new Response(JSON.stringify({
    updated: new Date().toISOString(),
    total: items.length,
    ticker: items.slice(0, 10).map(i => i.title),
    items: items.slice(0, 30),
    regions,
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}
