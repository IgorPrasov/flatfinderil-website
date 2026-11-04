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
  const result = t.trim().slice(0, 280);
  // Discard useless Google News bodies that are just the source name (< 25 chars)
  if (result.length < 25) return '';
  return result;
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

// ── data.gov.il: Mechir LaMishtaken lottery ───────────────────────────────────
const DATAGOV_BASE  = 'https://data.gov.il/api/3/action/datastore_search';
const MECHIR_RES    = '7c8255d0-49ef-49db-8904-4cf917586031';
const SALE_RES      = 'ea93b3c9-15e2-4b74-a632-097ee53737e4';

// Localisation strings for gov data items
const L = {
  mechirTitle: {
    ru: (p,c,u) => `Мехир ла-Миштакен: ${p} — ${c}${u ? ', ' + u + ' кв.' : ''}`,
    he: (p,c,u) => `מחיר למשתכן: ${p} — ${c}${u ? ', ' + u + ' יח"ד' : ''}`,
    en: (p,c,u) => `Mechir LaMishtaken: ${p} — ${c}${u ? ', ' + u + ' units' : ''}`,
    fr: (p,c,u) => `Mechir LaMishtaken: ${p} — ${c}${u ? ', ' + u + ' logements' : ''}`,
  },
  mechirBody: {
    ru: (u,pr,s,w,st) => [u?`${u} квартир`:'', pr?`Цена: ${pr}`:'', s?`Заявок: ${Number(s).toLocaleString()}`:'', w?`Победителей: ${Number(w).toLocaleString()}`:'', st?`Статус: ${st}`:''].filter(Boolean).join(' · '),
    he: (u,pr,s,w,st) => [u?`${u} יח"ד`:'', pr?`מחיר: ${pr}`:'', s?`${Number(s).toLocaleString()} מועמדים`:'', w?`${Number(w).toLocaleString()} זוכים`:'', st?`סטטוס: ${st}`:''].filter(Boolean).join(' · '),
    en: (u,pr,s,w,st) => [u?`${u} apartments`:'', pr?`Price: ${pr}`:'', s?`${Number(s).toLocaleString()} applicants`:'', w?`${Number(w).toLocaleString()} winners`:'', st?`Status: ${st}`:''].filter(Boolean).join(' · '),
    fr: (u,pr,s,w,st) => [u?`${u} appartements`:'', pr?`Prix: ${pr}`:'', s?`${Number(s).toLocaleString()} candidats`:'', w?`${Number(w).toLocaleString()} gagnants`:'', st?`Statut: ${st}`:''].filter(Boolean).join(' · '),
  },
  saleTitle: {
    ru: (p,c,u) => `Новостройки в продаже: ${p} — ${c}${u ? ', ' + u + ' кв.' : ''}`,
    he: (p,c,u) => `דירות חדשות למכירה: ${p} — ${c}${u ? ', ' + u + ' יח"ד' : ''}`,
    en: (p,c,u) => `New apartments for sale: ${p} — ${c}${u ? ', ' + u + ' units' : ''}`,
    fr: (p,c,u) => `Nouveaux logements: ${p} — ${c}${u ? ', ' + u + ' logements' : ''}`,
  },
  saleBody: {
    ru: (u,pr,n) => [u?`${u} квартир`:'', pr?`Ср. ₪${Number(pr).toLocaleString()}/м²`:'', n?`Район: ${n}`:''].filter(Boolean).join(' · '),
    he: (u,pr,n) => [u?`${u} יח"ד`:'', pr?`ממוצע ₪${Number(pr).toLocaleString()}/מ"ר`:'', n?`שכונה: ${n}`:''].filter(Boolean).join(' · '),
    en: (u,pr,n) => [u?`${u} apartments`:'', pr?`Avg. ₪${Number(pr).toLocaleString()}/m²`:'', n?`Neighborhood: ${n}`:''].filter(Boolean).join(' · '),
    fr: (u,pr,n) => [u?`${u} appartements`:'', pr?`Moy. ₪${Number(pr).toLocaleString()}/m²`:'', n?`Quartier: ${n}`:''].filter(Boolean).join(' · '),
  },
  mechirSrc: { ru: 'data.gov.il — Министерство строительства', he: 'data.gov.il — משרד הבינוי', en: 'data.gov.il — Ministry of Housing', fr: 'data.gov.il — Ministère du Logement' },
};

async function fetchMechir(lang = 'ru') {
  try {
    const r = await fetch(`${DATAGOV_BASE}?resource_id=${MECHIR_RES}&limit=10&sort=LotteryExecutionDate+desc`, {
      headers: { 'Accept': 'application/json' }, cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!r.ok) return [];
    const { result } = await r.json();
    const tFn  = L.mechirTitle[lang]  || L.mechirTitle.ru;
    const bFn  = L.mechirBody[lang]   || L.mechirBody.ru;
    const src  = L.mechirSrc[lang]    || L.mechirSrc.ru;
    return (result?.records || []).map(rec => {
      const city    = rec.LamasName || rec.Neighborhood || 'ישראל';
      const project = rec.ProjectName || 'Mechir LaMishtaken';
      const units   = rec.LotteryHousingUnits || '';
      const price   = rec.PriceForMeter ? `₪${Number(rec.PriceForMeter).toLocaleString()}/m²` : '';
      const subs    = rec.LotterySubscriberTotal || '';
      const winners = rec.LotteryWinnersTotal || '';
      let date = new Date().toISOString().slice(0, 10);
      if (rec.LotteryExecutionDate) { try { date = new Date(rec.LotteryExecutionDate).toISOString().slice(0,10); } catch {} }
      const title = tFn(project, city, units);
      const body  = bFn(units, price, subs, winners, rec.LotteryStatusValue) || title;
      return { title, body, url: 'https://data.gov.il/dataset/mechir-lamishtaken',
        date, source: src, lang, category: 'program', region: null,
        govData: { ...rec, _type: 'mechir' } };
    });
  } catch { return []; }
}

async function fetchApartments(lang = 'ru') {
  try {
    const r = await fetch(`${DATAGOV_BASE}?resource_id=${SALE_RES}&limit=6&sort=_id+desc`, {
      headers: { 'Accept': 'application/json' }, cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!r.ok) return [];
    const { result } = await r.json();
    const tFn  = L.saleTitle[lang] || L.saleTitle.ru;
    const bFn  = L.saleBody[lang]  || L.saleBody.ru;
    const src  = L.mechirSrc[lang] || L.mechirSrc.ru;
    return (result?.records || []).slice(0, 4).map(rec => {
      const city    = rec.LamasName || rec.CityName || 'ישראל';
      const project = rec.ProjectName || (lang === 'ru' ? 'Новый проект' : lang === 'he' ? 'פרויקט חדש' : 'New Project');
      const units   = rec.NumberOfApartments || rec.ApartmentsForSale || '';
      const price   = rec.PricePerMeter || rec.AveragePrice || '';
      const title   = tFn(project, city, units);
      const body    = bFn(units, price, rec.NeighborhoodName) || title;
      return { title, body, url: 'https://data.gov.il/dataset/mechir-lamishtaken',
        date: new Date().toISOString().slice(0,10), source: src,
        lang, category: 'project', region: null, govData: { ...rec, _type: 'sale' } };
    });
  } catch { return []; }
}

// ── Bank of Israel press releases ─────────────────────────────────────────────
const BOI_SRC = { ru: 'Банк Израиля', he: 'בנק ישראל', en: 'Bank of Israel', fr: 'Banque d\'Israël' };

async function fetchBOI(lang = 'ru') {
  try {
    const r = await fetch('https://www.boi.org.il/en/communication-and-publications/press-releases/', {
      headers: { 'User-Agent': 'Mozilla/5.0 FlatFinderIL/1.0', 'Accept-Language': 'en-US,en;q=0.9' },
      cf: { cacheTtl: 1800, cacheEverything: true },
    });
    if (!r.ok) return [];
    const html = await r.text();
    const items = [];
    const re = /href="(\/en\/communication-and-publications\/press-releases\/[^"]+)"[^>]*>\s*<[^>]+>([^<]{10,})<\//g;
    let m;
    while ((m = re.exec(html)) !== null && items.length < 8) {
      const title = (m[2] || '').replace(/<[^>]+>/g,'').trim();
      if (!title || title.length < 8) continue;
      const nearby = html.substring(Math.max(0, m.index - 300), m.index + 400);
      const dm = nearby.match(/(\d{1,2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
      let date = new Date().toISOString().slice(0, 10);
      if (dm) { try { date = new Date(`${dm[3]}-${dm[2].padStart(2,'0')}-${dm[1].padStart(2,'0')}`).toISOString().slice(0,10); } catch {} }
      items.push({ title, body: title, url: 'https://www.boi.org.il' + m[1],
        date, source: BOI_SRC[lang] || BOI_SRC.en, lang: 'en', category: classify(title), region: null });
    }
    return items;
  } catch { return []; }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function onRequest(context) {
  if (context.request.method === 'OPTIONS')
    return new Response(null, { headers: {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET'} });

  const lang = new URL(context.request.url).searchParams.get('lang') || 'ru';

  // FEEDS indices after removing Russian sources:
  // 0=calcalist, 1=ynet, 2=globes, 3=haaretz, 4=walla, 5=cbs
  // 6=jpost, 7=timesofisrael, 8=globes_en, 9=haaretz_en
  // 10=north, 11=center, 12=south
  const MAIN = {
    ru: [6, 7, 8, 9],        // RU UI → English Israeli press (no Russian sources available)
    he: [0, 1, 2, 3, 4, 5], // Hebrew: Calcalist, Ynet, Globes, Haaretz, Walla, CBS
    en: [6, 7, 8, 9],        // English: JPost, Times of Israel, Globes EN, Haaretz EN
    fr: [6, 7, 8, 9],        // FR: fall back to English
  }[lang] || [6, 7, 8, 9];

  const REGIONAL = [10, 11, 12]; // north, center, south

  const idxs = [...new Set([...MAIN, ...REGIONAL])];
  const [rssResults, mechirItems, saleItems, boiItems] = await Promise.all([
    Promise.all(idxs.map(i => fetchFeed(FEEDS[i]))),
    fetchMechir(lang),
    fetchApartments(lang),
    fetchBOI(lang),
  ]);
  let items = [...rssResults.flat(), ...boiItems, ...mechirItems, ...saleItems];

  // Sort by date, deduplicate
  items.sort((a, b) => b.date.localeCompare(a.date));
  const seen = new Set();
  items = items.filter(i => {
    const k = i.title.slice(0, 50).toLowerCase().replace(/\s+/g,'');
    if (seen.has(k)) return false;
    seen.add(k); return true;
  }).slice(0, 50);

  // Group by region
  const regions = { north: [], center: [], south: [] };
  for (const item of items)
    if (item.region && regions[item.region]?.length < 3) regions[item.region].push(item);

  return new Response(JSON.stringify({
    updated: new Date().toISOString(),
    total: items.length,
    ticker: items.slice(0, 10).map(i => i.title),
    items: items.slice(0, 40),
    regions,
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=1800, stale-while-revalidate=300',
    },
  });
}
