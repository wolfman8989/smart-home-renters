/**
 * Smart Home for Renters — static site build.
 *
 *   node build.js
 *
 * Reads content/*.md, renders each into articles/<slug>.html using the shared
 * shell, generates the home page, the hub pages (reviews / guides / starter
 * kits), 404.html, _headers, the sitemap, and then link-checks every internal
 * href so a broken link can never be deployed again.
 *
 * No client-side JavaScript is shipped: every page is complete HTML.
 */
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = __dirname;
const SITE = 'https://smarthomerent.casa';
const TODAY = new Date().toISOString().slice(0, 10);
const YEAR = new Date().getFullYear();
const LAUNCHED = '2026-10-30';

// ---------------------------------------------------------------- images ---
// Real manufacturer / CDN product photos. Anything not listed here is left
// without a photo on purpose: a wrong or stock photo is worse than none.
const PHOTOS = {
  'switchbot lock pro':
    'https://us.switch-bot.com/cdn/shop/files/LockProGlobal-us_1200x1200.png?v=1749117647',
  'ring battery doorbell':
    'https://images.ctfassets.net/a3peezndovsu/1pK35jNUJuwhUZC1VnLdBJ/d99cd43309a5e445da599dfd6618d141/ring_battery_doorbell_2nd_gen_34L_image_render_speckle_grey_1500x1500_01.jpg',
  'wyze lock':
    'https://www.wyze.com/cdn/shop/products/refurbished-wyze-lock-wyze-labs-inc-825881.jpg?v=1762439806',
  'tp-link tapo c120':
    'https://static.tp-link.com/upload/image-line/1_large_20260826064029r.png',
  'lifx color a19':
    'https://www.lifx.com/cdn/shop/files/A19_E26_Pack.png?v=1763026931',
  'switchbot curtain 3':
    'https://www.switch-bot.com/cdn/shop/files/1_pack_1200x1200.jpg?v=1780477951',
  'nest thermostat':
    'https://lh3.googleusercontent.com/M-CZHvnid8nvxhYyV0V7QPHbc03wlLwb48BCxN1dc6l7x3WqvoDj9paaCta3F5JWH0je8CxEHr8dqzXS8lpaTA=c0xffffff-rj-sc0xffffffff',
  'google nest doorbell':
    'https://lh3.googleusercontent.com/2jdmbaTprBaZWk8mUYNddud4UYO5NSLLqfScCV80fT66RSJ3hZRADIG_CiXbF_9hE72lTzbBYCn94r6sUk16feTuZOkmIilpfh9m=rj-sc0xffffffff',
  'ring peephole cam':
    'https://images.ctfassets.net/a3peezndovsu/6aCCIeWKY5M5nHiLIoy9ml/55d8c3db0a0755e0cb58268c76e321d7/20260609_softbundle_peepholecamgen2_contactsensor_2pc_motiondetector_rgb.jpg',
  'blink video doorbell':
    'https://static1.squarespace.com/static/5e21c06a08d2fc435f20e6c5/6a3d65dd5e50d1681d63f315/6ac7f4c02a12f250d1e2e1e6/1792082774854/DSC06146_Stills_COLORED_KC_V2_DP_v01.png?format=1500w',
  'arlo video doorbell':
    'https://au.arlo.com/cdn/shop/files/2k-doorbell-essential-outdoor-bundle.png?v=1752905759',
  'wyze home monitoring':
    'https://www.wyze.com/cdn/shop/files/wyze-home-monitoring-core-starter-kit-wyze-labs-inc-5808940.jpg?v=1758239148',
  'ring alarm':
    'https://images.ctfassets.net/a3peezndovsu/variant-28444503670873/2b3b11b7d7aea840c89faed9f067eec4/variant-28444503670873.jpg',
  'govee led strip':
    'https://cdn.shopify.com/s/files/1/0512/3489/8105/files/617F.png?v=1770881059',
  'govee smart table lamp':
    'https://cdn.shopify.com/s/files/1/0512/3489/8105/files/6022.png?v=1743407578',
  'sensibo sky':
    'https://sensibo.com/cdn/shop/files/Sensibo_Sky_Gray_497b5e7d-927a-41dc-b669-64c86cf4301a.jpg?v=1756384021',
  'switchbot hub 2':
    'https://www.switch-bot.com/cdn/shop/products/switchbot-hub-2-277836_1200x1200.jpg?v=1769653679',
  'selectblinds motorized':
    'https://www.selectblinds.com/cdn/shop/files/pid-1019_cid-13553_z.jpg?v=1792812992',
  'aqara hub m2':
    'https://www.aqara.com/wp-content/uploads/2023/04/Hub-M2-Zigbee-supported.jpg',
  'august wifi smart lock':
    'https://cdn.shopify.com/s/files/1/1354/7835/products/August_Wi-Fi_Smart_Lock_1.png?v=1578361895',
  'eufy solocam s340':
    'https://cdn.shopify.com/s/files/1/0504/7094/4954/files/eufy-solocam-s340_9ccfe235-98f3-47f1-a24a-59432be7e5e8.jpg',
  'tp-link kasa ep25':
    'https://images.prismic.io/kasasmart/d2863c52-5580-4322-9b6e-e7b8f32253f3_EP25P4-PRODUCT.jpg?auto=compress,format',
  'wyze plug':
    'https://www.wyze.com/cdn/shop/files/wyze-plug-wyze-labs-inc-2841977.webp?v=1770969250',
  'eve energy':
    'https://www.evehome.com/sites/default/files/social_media/sm-eve-energy-family.png',
  'ikea fyrtur':
    'https://www.ikea.com/ext/ingkadam/m/10c97f8b0838e4e6/original/PH207699-crop001.jpg',
  'aqara roller shade driver e1':
    'https://www.aqara.com/wp-content/uploads/2023/05/1222.524.png',
  // Aliases: the same product written the way a heading or a list entry names it.
  'govee rgbic led strip':
    'https://cdn.shopify.com/s/files/1/0512/3489/8105/files/617F.png?v=1770881059',
  'ring alarm 5-piece':
    'https://images.ctfassets.net/a3peezndovsu/variant-28444503670873/2b3b11b7d7aea840c89faed9f067eec4/variant-28444503670873.jpg',
  'simplisafe essentials':
    'https://images.ctfassets.net/v6awd0kabi65/2vbLh5TJjOjOMjR1VAKCyR/b20d8f8f911774d6c63c439ee572f8fe/Hero_tablet__1_.png'
};

const photoFor = (alt) => {
  const raw = String(alt || '').trim().toLowerCase();
  const norm = raw.replace(/-/g, '').replace(/\s+/g, ' ');
  for (const k of Object.keys(PHOTOS)) {
    const nk = k.replace(/-/g, '').replace(/\s+/g, ' ');
    if (nk === norm) return PHOTOS[k];
  }
  return null;
};

// Cache-busting version for the stylesheet, derived from its contents so the
// URL changes whenever the CSS changes (Cloudflare caches /css/* for 7 days).
const crypto = require('crypto');
const CSS_PATH = path.join(ROOT, 'css', 'style.css');
const cssVersion = crypto.createHash('md5').update(fs.readFileSync(CSS_PATH)).digest('hex').slice(0, 8);

// Cloudflare Pages strips the .html extension with a 308, so the served URL for
// articles/foo.html is /articles/foo. Emit that form everywhere (links, canonical,
// sitemap) and no page ever pays for a redirect hop.
const cleanUrl = (u) =>
  String(u)
    .replace(/\/index\.html$/, '/')
    .replace(/\.html(?=$|[?#])/, '');

// --------------------------------------------------------------- helpers ---
const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, 'utf8');
};

function frontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const data = {};
  let body = raw;
  if (m) {
    body = raw.slice(m[0].length);
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (!kv) continue;
      data[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
    }
  }
  return { data, body };
}

const words = (s) => s.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const minutes = (s) => Math.max(1, Math.round(words(s) / 220));

// Pull Q&A pairs out of a "Frequently Asked Questions" section so we can emit
// FAQPage structured data (rich results in Google).
function extractFaq(md) {
  const m = md.match(/##[^\n]*Frequent[^\n]*\n([\s\S]*?)(?=\n##|\n---\s*\n|$)/i);
  if (!m) return [];
  const section = m[1];
  const out = [];
  const re = /\*\*([^*]+\?)\*\*\s*\n([\s\S]*?)(?=\*\*[^*]+\?\*\*|\n##|\n---\s*\n|$)/g;
  let mm;
  while ((mm = re.exec(section))) {
    const q = mm[1].trim();
    const a = mm[2].trim().replace(/\s+/g, ' ');
    if (q && a) out.push({ q, a });
  }
  return out;
}

// First product photo in an article's rendered HTML, for Article.image.
function firstPhoto(html) {
  const m = html.match(/class="product-img"><img src="([^"]+)"/);
  return m ? m[1] : null;
}

// ------------------------------------------------------- markdown render ---
function renderMarkdown(md) {
  // The H1 lives in the shell, not in the body.
  let body = md.replace(/^\s*#\s+.*\r?\n/, '');

  // A photo marker must be its own paragraph. Without a blank line after it,
  // markdown folds it into the next paragraph ("![X](#photo)\n**Price:** ...")
  // and the swap below never matches - the raw "#photo" src would ship.
  body = body.replace(/^([ \t]*!\[[^\]]*\]\(#photo\)[ \t]*)$/gm, '$1\n');

  let html = marked.parse(body, { gfm: true, breaks: false, mangle: false, headerIds: true });

  // Product photos: swap ![Name](#photo) for a real photo when we have one,
  // otherwise drop the image entirely (an unrelated stock photo is worse).
  // Wrap the photo in the affiliate link so clicking the picture buys.
  html = html.replace(/<p>\s*<img[^>]*alt="([^"]*)"[^>]*>\s*<\/p>/g, (whole, alt) => {
    const src = photoFor(alt);
    if (!src) return '';
    const amazonUrl = 'https://www.amazon.com/s?k=' + encodeURIComponent(alt) + '&tag=smarthomerent-20';
    return (
      '<div class="product-img"><a href="' + amazonUrl + '" class="product-photo-link" target="_blank" rel="sponsored noopener">' +
      '<img src="' + src + '" alt="' + esc(alt) +
      '" loading="lazy" referrerpolicy="no-referrer"></a></div>'
    );
  });

  // Product names in headings become clickable (link to the Amazon search).
  // Only headings of the form "Product Name — descriptor" are touched.
  // (Content uses em-dash; accept hyphen/en-dash too.)
  html = html.replace(/<(h[23])>([^<]+?)\s+[\u2014\u2013-]\s+([^<]+)<\/\1>/g, (whole, tag, name, desc) => {
    const url = 'https://www.amazon.com/s?k=' + encodeURIComponent(name.trim()) + '&tag=smarthomerent-20';
    return '<' + tag + '><a class="product-name" href="' + url + '" target="_blank" rel="sponsored noopener">' +
      name.trim() + '</a> <span class="product-name-sep">\u2014</span> ' + desc.trim() + '</' + tag + '>';
  });
  html = html.replace(/<img([^>]*)>/g, (whole, attrs) => {
    if (/picsum\.photos/.test(attrs)) return '';
    if (!/loading=/.test(attrs)) attrs += ' loading="lazy"';
    return '<img' + attrs + '>';
  });

  // Affiliate links: mark them sponsored, open in a new tab.
  // (Skip links we already styled, e.g. the product photo link.)
  // Also split the inline "Affiliate: [Check price...]" into its own line
  // so the button stands alone and is impossible to miss.
  html = html.replace(/<p>([\s\S]*?)<strong>Affiliate:<\/strong>\s*<a\s+href="([^"]*amazon\.[^"]*)"([^>]*)>([^<]*)<\/a><\/p>/g,
    (whole, before, href, rest, text) => {
      const r = rest
        .replace(/\s*class="[^"]*"/g, '')
        .replace(/\s*target="[^"]*"/g, '')
        .replace(/\s*rel="[^"]*"/g, '');
      const beforeClean = before.trim().replace(/\|\s*$/, '').trim();
      return (beforeClean ? '<p>' + beforeClean + '</p>\n' : '') +
        '<p class="cta-row"><a href="' + href + '" class="affiliate" target="_blank" rel="sponsored noopener"' + r + '>' + text + '</a></p>';
    });
  // Mark any remaining amazon links (not already processed) as sponsored.
  html = html.replace(/<a\s+href="([^"]*amazon\.[^"]*)"([^>]*)>/g, (whole, href, rest) => {
    if (/class="product-photo-link"/.test(rest)) return whole;
    if (/class="affiliate"/.test(rest)) return whole;
    const r = rest
      .replace(/\s*class="[^"]*"/g, '')
      .replace(/\s*target="[^"]*"/g, '')
      .replace(/\s*rel="[^"]*"/g, '');
    return '<a href="' + href + '" class="affiliate" target="_blank" rel="sponsored noopener"' + r + '>';
  });

  // Wide tables scroll instead of blowing out the page on a phone.
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');

  return html;
}

// ------------------------------------------------------------- site shell ---
const NAV = [
  ['/reviews.html', 'Reviews'],
  ['/guides.html', 'Guides'],
  ['/starter-kits.html', 'Starter Kits'],
  ['/about.html', 'About']
];

function header() {
  return (
    '<header>\n  <nav>\n' +
    '    <a href="/" class="logo"><span class="logo-icon" aria-hidden="true">🏠</span>' +
    '<span class="logo-text">Smart Home <em>for</em> Renters</span></a>\n' +
    '    <div class="nav-links">\n' +
    NAV.map(([href, label]) => '      <a href="' + href + '">' + label + '</a>').join('\n') +
    '\n    </div>\n  </nav>\n</header>'
  );
}

function footer() {
  return (
    '<footer>\n' +
    '  <div class="foot-inner">\n' +
    '    <p class="foot-brand"><strong>Smart Home for Renters</strong></p>\n' +
    '    <p class="foot-desc">Independent reviews of lease-safe smart home tech. ' +
    'Everything we recommend installs without drilling and comes with you when you move.</p>\n' +
    '    <p class="foot-links"><a href="/about.html">About</a> · <a href="/contact.html">Contact</a> · ' +
    '<a href="/reviews.html">Reviews</a> · <a href="/guides.html">Guides</a> · ' +
    '<a href="/starter-kits.html">Starter Kits</a></p>\n' +
    '    <p class="foot-links"><a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a> · ' +
    '<a href="/disclosure.html">Affiliate Disclosure</a></p>\n' +
    '    <p class="foot-small">© ' + YEAR + ' Smart Home for Renters. As an Amazon Associate we earn from ' +
    'qualifying purchases. Prices and availability are accurate as of the date shown and are subject to change.</p>\n' +
    '  </div>\n' +
    '</footer>'
  );
}

const TRUST_BAR =
  '<div class="trust-bar">\n' +
  '    <span>✅ Installed in a real rental</span>\n' +
  '    <span>🔒 No landlord permission needed</span>\n' +
  '    <span>📦 Take it with you when you move</span>\n' +
  '    <span>🔄 Updated October 2026</span>\n' +
  '  </div>';

const AUTHOR_BIO =
  '<div class="author-bio">\n' +
  '      <div class="avatar">SHR</div>\n' +
  '      <div class="info">\n' +
  '        <div class="name">Smart Home for Renters</div>\n' +
  '        <div class="title">Written by renters, for renters. Every device is installed in an apartment where drilling is not an option.</div>\n' +
  '      </div>\n' +
  '    </div>';

const HOW_WE_TEST =
  '<div class="testing-method">\n' +
  '      <h2>How We Test</h2>\n' +
  '      <p>Every device is installed in a real apartment with no drilling allowed. We live with it for at least two weeks, ' +
  'then remove it and check the wall. We score install ease, removability, portability and whether a landlord would object — ' +
  'then we publish the score, good or bad.</p>\n' +
  '    </div>';

const DISCLOSURE =
  '<div class="disclosure">\n' +
  '      <h3>Affiliate Disclosure</h3>\n' +
  '      <p>We earn a commission from Amazon and other retailers when you buy through our links, at no extra cost to you. ' +
  'It never changes our rankings: we recommend the same devices whether or not a program pays us. ' +
  '<a href="/disclosure.html">Read the full policy</a>.</p>\n' +
  '    </div>';

function shell(opts) {
  const { title, description, canonical, keywords, body, jsonld, ogType, ogImage, verify } = opts;
  const page = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(title) + '</title>\n' +
    '<meta name="description" content="' + esc(description) + '">\n' +
    (keywords ? '<meta name="keywords" content="' + esc(keywords) + '">\n' : '') +
    '<link rel="canonical" href="' + cleanUrl(canonical) + '">\n' +
    (verify ? '<meta name="google-site-verification" content="' + verify + '">\n' : '') +
    '<meta name="theme-color" content="#ffffff">\n' +
    '<meta property="og:site_name" content="Smart Home for Renters">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n' +
    '<meta property="og:description" content="' + esc(description) + '">\n' +
    '<meta property="og:type" content="' + (ogType || 'website') + '">\n' +
    '<meta property="og:url" content="' + cleanUrl(canonical) + '">\n' +
    (ogImage ? '<meta property="og:image" content="' + ogImage + '">\n' : '') +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<link rel="stylesheet" href="/css/style.css' + (cssVersion ? '?v=' + cssVersion : '') + '">\n' +
    (jsonld ? (Array.isArray(jsonld) ? jsonld : [jsonld]).map((j) =>
      '<script type="application/ld+json">' + JSON.stringify(j) + '</script>').join('\n') + '\n' : '') +
    '</head>\n<body>\n' +
    header() + '\n' + body + '\n' + footer() + '\n' +
    '</body>\n</html>\n';
  // Cloudflare Pages serves /x.html at /x and 308-redirects the .html form,
  // so every internal link ships as the clean URL - no redirect hop, and the
  // canonical matches what the visitor actually lands on.
  return page.replace(/href="(\/[^"]*\.html)"/g, (m, href) => 'href="' + cleanUrl(href) + '"');
}

// ---------------------------------------------------------------- content ---
const CATEGORY_LABEL = { review: 'Review', guide: 'Guide', kit: 'Starter Kit' };
const HUB_PATH = { review: '/reviews.html', guide: '/guides.html', kit: '/starter-kits.html' };
const HUB_LABEL = { review: 'Reviews', guide: 'Guides', kit: 'Starter Kits' };

function loadArticles() {
  const dir = path.join(ROOT, 'content');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  return files.map((file) => {
    const raw = read(path.join(dir, file));
    const { data, body } = frontMatter(raw);
    const slug = file.replace(/\.md$/, '');
    return {
      slug,
      file,
      title: data.title || slug,
      description: data.description || '',
      keywords: data.keywords || '',
      category: data.category || 'review',
      priority: data.priority || '0.8',
      updated: data.updated || TODAY,
      order: Number(data.order || 100),
      html: renderMarkdown(body),
      body
    };
  });
}

function articleCard(a) {
  return '<a class="article-card" href="/articles/' + a.slug + '.html">\n' +
    '  <div class="card-top"><span class="tag tag-' + a.category + '">' + CATEGORY_LABEL[a.category] + '</span>' +
    '<span class="when">Updated ' + a.updated + '</span></div>\n' +
    '  <h3>' + esc(a.title) + '</h3>\n' +
    '  <p>' + esc(a.description) + '</p>\n' +
    '  <span class="read">Read it →</span>\n' +
    '</a>';
}

function hubPage({ title, description, heading, intro, items, path: p }) {
  const body =
    '<main>\n  ' + TRUST_BAR + '\n' +
    '  <section class="page-head">\n' +
    '    <nav class="crumbs"><a href="/">Home</a> › <span>' + esc(heading) + '</span></nav>\n' +
    '    <h1>' + esc(heading) + '</h1>\n' +
    '    <p>' + intro + '</p>\n' +
    '  </section>\n' +
    '  <section class="card-grid">\n' +
    items.map(articleCard).join('\n') +
    '\n  </section>\n</main>';

  return shell({
    title,
    description,
    canonical: cleanUrl(SITE + p),
    keywords: '',
    body,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: heading,
      description,
      url: SITE + p
    }
  });
}

function articlePage(a, all) {
  all = all || [];
  const canonical = cleanUrl(SITE + '/articles/' + a.slug + '.html');
  const related = all
    .filter((x) => x.slug !== a.slug)
    .sort((x, y) => (x.category === a.category ? -1 : 1) - (y.category === a.category ? -1 : 1))
    .slice(0, 3);
  const relatedHtml = related.length
    ? '<div class="related-reading"><h3>Related reading</h3><ul>' +
      related.map((r) => '<li><a href="/articles/' + r.slug + '.html">' + esc(r.title) + '</a></li>').join('') +
      '</ul></div>'
    : '';

  const body =
    '<main class="article">\n  ' + TRUST_BAR + '\n' +
    '  <nav class="crumbs"><a href="/">Home</a> › <a href="' + HUB_PATH[a.category] + '">' +
    HUB_LABEL[a.category] + '</a></nav>\n' +
    '  <article>\n' +
    '    <h1>' + esc(a.title) + '</h1>\n' +
    '    <div class="meta">Updated ' + a.updated + ' · ' + minutes(a.body) +
    ' min read · Affiliate links included</div>\n' +
    AUTHOR_BIO + '\n' + HOW_WE_TEST + '\n' +
    a.html + '\n' +
    relatedHtml + '\n' +
    DISCLOSURE + '\n' +
    '  </article>\n</main>';

  const faqs = extractFaq(a.body);
  const photo = firstPhoto(a.html);
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: a.description,
      image: photo ? [photo] : undefined,
      author: { '@type': 'Organization', name: 'Smart Home for Renters' },
      publisher: { '@type': 'Organization', name: 'Smart Home for Renters' },
      datePublished: LAUNCHED,
      dateModified: a.updated,
      mainEntityOfPage: canonical
    },
    ...(faqs.length ? [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    }] : []),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: cleanUrl(SITE + '/') },
        { '@type': 'ListItem', position: 2, name: HUB_LABEL[a.category], item: cleanUrl(SITE + HUB_PATH[a.category]) },
        { '@type': 'ListItem', position: 3, name: a.title, item: canonical }
      ]
    }
  ];

  return shell({
    title: a.title,
    description: a.description,
    canonical,
    keywords: a.keywords,
    ogType: 'article',
    body,
    ogImage: photo || undefined,
    jsonld
  });
}

// ------------------------------------------------------------------ home ---
const CATEGORIES = [
  ['Smart Locks', '/articles/no-drill-smart-locks.html', '🔒'],
  ['Doorbells', '/articles/no-drill-doorbell.html', '🔔'],
  ['Cameras', '/articles/renter-security-cameras.html', '📷'],
  ['Lighting', '/articles/smart-lighting-renters.html', '💡'],
  ['Blinds', '/articles/no-drill-blinds.html', '🪟'],
  ['Smart Plugs', '/articles/smart-plugs.html', '🔌'],
  ['Security', '/articles/renter-security-systems.html', '🛡️'],
  ['Thermostats', '/articles/smart-thermostats-renters.html', '🌡️']
];

const HERO_PHOTOS = [
  ['switchbot lock pro', 'SwitchBot Lock Pro'],
  ['ring battery doorbell', 'Ring Battery Doorbell'],
  ['tp-link tapo c120', 'TP-Link Tapo C120 camera'],
  ['lifx color a19', 'LIFX Color A19 bulb']
];

function homePage(reviews, kits) {
  const heroArt = HERO_PHOTOS.map(([key, alt]) =>
    '      <figure class="hero-photo"><img src="' + PHOTOS[key] + '" alt="' + esc(alt) +
    '" loading="lazy" referrerpolicy="no-referrer"></figure>'
  ).join('\n');

  const catGrid = CATEGORIES.map(([label, href, icon]) =>
    '      <a class="cat-card" href="' + href + '">' +
    '<span class="cat-icon" aria-hidden="true">' + icon + '</span>' +
    '<span class="cat-name">' + esc(label) + '</span></a>'
  ).join('\n');

  const kitGrid = kits.map((k) =>
    '      <a class="kit-card" href="/articles/' + k.slug + '.html">\n' +
    '        <span class="kit-price">' + esc(k.title.split(':')[0]) + '</span>\n' +
    '        <h3>' + esc(k.title.split(':')[1] ? k.title.split(':')[1].trim() : k.title) + '</h3>\n' +
    '        <p>' + esc(k.description) + '</p>\n' +
    '        <span class="read">See the kit →</span>\n' +
    '      </a>'
  ).join('\n');

  const featured = reviews.slice(0, 6).map(articleCard).join('\n');

  const body =
    '<main>\n' +
    '  <section class="hero">\n' +
    '    <div class="hero-copy">\n' +
    '      <p class="kicker">No drill · No wiring · No permission</p>\n' +
    '      <h1>Smart home devices a rental actually allows</h1>\n' +
    '      <p class="lede">Every pick here was installed in an apartment where drilling is not an option, ' +
    'lived with for at least two weeks, and then removed to check the wall. If it leaves a mark, it does not make the list.</p>\n' +
    '      <div class="hero-actions">\n' +
    '        <a class="cta" href="/articles/best-smart-home-devices-renters-2026.html">See the best picks</a>\n' +
    '        <a class="cta-quiet" href="/starter-kits.html">Or start with a kit →</a>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '    <div class="hero-art">\n' + heroArt + '\n    </div>\n' +
    '  </section>\n\n' +
    '  ' + TRUST_BAR + '\n\n' +
    '  <section class="section">\n' +
    '    <div class="section-head">\n' +
    '      <h2>Start here</h2>\n' +
    '      <p>The one page to read first: the best device in every category, and the ones we would not buy again.</p>\n' +
    '    </div>\n' +
    '    <a class="feature" href="/articles/best-smart-home-devices-renters-2026.html">\n' +
    '      <span class="tag tag-review">Flagship guide</span>\n' +
    '      <h3>The best smart home devices for renters in 2026</h3>\n' +
    '      <p>Eight categories, one pick each, scored on install ease, removability, portability and lease risk. ' +
    'Includes the categories where we tell you not to bother.</p>\n' +
    '      <span class="read">Read the guide →</span>\n' +
    '    </a>\n' +
    '  </section>\n\n' +
    '  <section class="section">\n' +
    '    <div class="section-head">\n' +
    '      <h2>Browse by category</h2>\n' +
    '    </div>\n' +
    '    <div class="cat-grid">\n' + catGrid + '\n    </div>\n' +
    '  </section>\n\n' +
    '  <section class="section">\n' +
    '    <div class="section-head">\n' +
    '      <h2>Latest reviews</h2>\n' +
    '      <a class="more" href="/reviews.html">All reviews →</a>\n' +
    '    </div>\n' +
    '    <div class="card-grid">\n' + featured + '\n    </div>\n' +
    '  </section>\n\n' +
    '  <section class="section">\n' +
    '    <div class="section-head">\n' +
    '      <h2>Starter kits</h2>\n' +
    '      <p>Pick a budget. Each kit lists exactly what to buy and in what order.</p>\n' +
    '    </div>\n' +
    '    <div class="kits-grid">\n' + kitGrid + '\n    </div>\n' +
    '  </section>\n\n' +
    '  ' + HOW_WE_TEST + '\n' +
    '  ' + DISCLOSURE + '\n' +
    '</main>';

  return shell({
    title: 'Smart Home for Renters — No-Drill, Lease-Safe Devices',
    description:
      'The best smart home devices for renters. No drilling, no wiring, no landlord permission needed. ' +
      'Reviews, comparisons and setup guides for apartment-friendly smart home tech.',
    canonical: cleanUrl(SITE + '/'),
    keywords: 'smart home for renters, no drill smart home, apartment smart home, renter friendly smart devices',
    body,
    verify: 'VvgbU90BUEynrhjgHe5UKCUOEhDsMTn8fTobAk8x8vk',
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Smart Home for Renters',
      url: SITE,
      description: 'No-drill smart home devices for renters'
    }
  });
}

// ----------------------------------------------------------- static pages ---
function staticPages() {
  return [
    {
      file: 'about.html',
      heading: 'About Smart Home for Renters',
      title: 'About — Smart Home for Renters',
      description:
        'Who we are, how we test smart home devices in real rental apartments, and why every ' +
        'recommendation on this site is no-drill and lease-safe.',
      meta: 'Updated October 2026',
      body:
        '<div class="author-bio"><div class="avatar">SHR</div><div class="info">' +
        '<div class="name">Smart Home for Renters</div>' +
        '<div class="title">Written by renters, for renters. Every device is installed in an apartment ' +
        'where drilling is not an option.</div></div></div>\n\n' +
        '<h2>Why this site exists</h2>\n' +
        '<p>Almost every smart home guide assumes you own your home. “Just replace the thermostat.” ' +
        '“Wire the smart switch into the junction box.” “Mount the camera with the included screws.” ' +
        'None of that works when the wall is not yours.</p>\n' +
        '<p>So we only cover devices that a lease actually allows: things that stick on, clip on, or ' +
        'plug in — and that come off again without a mark when you move.</p>\n\n' +
        '<h2>How we test</h2>\n' +
        '<div class="testing-method"><h3>Our method</h3><p>Every device is installed in a real ' +
        'apartment with no drilling allowed. We live with it for at least two weeks, then remove it ' +
        'and check the wall. We score install ease, removability, portability and whether a landlord ' +
        'would object — then we publish the score, good or bad.</p></div>\n' +
        '<p>Every device is scored on our <strong>Renter Readiness Score</strong>:</p>\n' +
        '<div class="table-wrap"><table>\n' +
        '<tr><th>Dimension</th><th>Points</th><th>What it measures</th></tr>\n' +
        '<tr><td>Install ease</td><td>0–3</td><td>3 = plug-in only, 0 = drilling or wiring</td></tr>\n' +
        '<tr><td>Removability</td><td>0–3</td><td>3 = zero trace, 0 = permanent damage</td></tr>\n' +
        '<tr><td>No-drill</td><td>0–2</td><td>2 = zero holes, 0 = requires holes</td></tr>\n' +
        '<tr><td>Portability</td><td>0–1</td><td>1 = fits in a moving box</td></tr>\n' +
        '<tr><td>Lease compliance</td><td>0–1</td><td>1 = no permission needed</td></tr>\n' +
        '</table></div>\n' +
        '<p><strong>Maximum score: 10/10.</strong> A device that scores below 6 does not get ' +
        'recommended, no matter how good it is for a homeowner.</p>\n\n' +
        '<h2>Our standards</h2>\n' +
        '<ul>\n' +
        '<li><strong>Cons are as prominent as pros.</strong> If something is bad, it says so.</li>\n' +
        '<li><strong>No paid reviews.</strong> We do not accept payment for coverage or placement.</li>\n' +
        '<li><strong>Real testing.</strong> Nothing is recommended from a spec sheet alone.</li>\n' +
        '<li><strong>Regular updates.</strong> Prices and availability change; pages carry a date.</li>\n' +
        '<li><strong>Clear disclosure.</strong> Affiliate links are marked and explained.</li>\n' +
        '</ul>\n\n' +
        '<h2>Contact</h2>\n' +
        '<p>Questions, corrections or a product we should test? Email ' +
        '<a href="mailto:hello@smarthomerent.casa">hello@smarthomerent.casa</a> — we read everything ' +
        'and reply within a couple of days.</p>\n\n' +
        '<h2>Affiliate disclosure</h2>\n' +
        '<p>This site earns a commission from Amazon and other retailers when you buy through our ' +
        'links, at no extra cost to you. It never changes a ranking. Read the ' +
        '<a href="/disclosure.html">full affiliate policy</a>.</p>'
    },
    {
      file: 'contact.html',
      heading: 'Contact',
      title: 'Contact — Smart Home for Renters',
      description:
        'Contact Smart Home for Renters with questions, corrections, or a product we should test.',
      meta: 'We reply within 24–48 hours',
      body:
        '<h2>Email</h2>\n' +
        '<p>The fastest way to reach us is email.</p>\n' +
        '<ul>\n' +
        '<li><strong>General questions:</strong> <a href="mailto:hello@smarthomerent.casa">hello@smarthomerent.casa</a></li>\n' +
        '<li><strong>Product tips:</strong> <a href="mailto:tips@smarthomerent.casa">tips@smarthomerent.casa</a></li>\n' +
        '<li><strong>Corrections:</strong> <a href="mailto:corrections@smarthomerent.casa">corrections@smarthomerent.casa</a></li>\n' +
        '<li><strong>Press and partnerships:</strong> <a href="mailto:partners@smarthomerent.casa">partners@smarthomerent.casa</a></li>\n' +
        '</ul>\n\n' +
        '<h2>Found a price that is out of date?</h2>\n' +
        '<p>Tell us the page and the price you saw. Prices on Amazon move constantly and we would ' +
        'rather fix a page than leave it wrong.</p>\n\n' +
        '<h2>Know a device we should test?</h2>\n' +
        '<p>Send it to <a href="mailto:tips@smarthomerent.casa">tips@smarthomerent.casa</a>. The bar ' +
        'is simple: it has to install without drilling or wiring and come off without a mark. ' +
        'If it does, we will test it in a real apartment.</p>\n\n' +
        '<h2>What we cannot help with</h2>\n' +
        '<p>We are not a landlord, a lawyer, or an installer. For lease questions, read your lease and ' +
        'ask your landlord in writing — our <a href="/articles/ask-landlord-about-smart-home.html">' +
        'landlord guide</a> has scripts you can copy.</p>'
    },
    {
      file: 'privacy.html',
      heading: 'Privacy Policy',
      title: 'Privacy Policy — Smart Home for Renters',
      description:
        'How Smart Home for Renters handles data: what is collected, what is not, and how affiliate ' +
        'links and analytics work.',
      meta: 'Last updated: October 31, 2026',
      body:
        '<h2>The short version</h2>\n' +
        '<p>This is a static website. There is no account, no login, and no newsletter. We do not sell ' +
        'personal information, and we do not build profiles of individual readers.</p>\n\n' +
        '<h2>What is collected</h2>\n' +
        '<h3>Server and CDN logs</h3>\n' +
        '<p>The site is served by Cloudflare, which processes standard request data (IP address, ' +
        'user agent, requested URL, timestamp) to deliver pages and block abuse. Those logs are ' +
        'retained by Cloudflare under their own policy.</p>\n' +
        '<h3>Analytics</h3>\n' +
        '<p>If analytics are enabled, they are configured to record aggregate page views only — no ' +
        'cross-site tracking and no advertising identifiers. Analytics is used to decide which ' +
        'articles are worth updating.</p>\n' +
        '<h3>Information you send us</h3>\n' +
        '<p>If you email us, we receive your address and whatever you write. That is kept only long ' +
        'enough to answer you.</p>\n\n' +
        '<h2>Cookies</h2>\n' +
        '<p>We do not set cookies for advertising. Third parties you reach by clicking an outbound ' +
        'link — Amazon, for example — may set their own cookies on their own domain. That is outside ' +
        'our control and covered by their policies.</p>\n\n' +
        '<h2>Affiliate links</h2>\n' +
        '<p>Outbound product links carry an affiliate tag. When you click one, the retailer is told ' +
        'that the visit came from this site. They are not told who you are by us, because we do not ' +
        'know. See the <a href="/disclosure.html">affiliate disclosure</a> for the full list of ' +
        'programs.</p>\n\n' +
        '<h2>Third parties</h2>\n' +
        '<ul>\n' +
        '<li><strong>Cloudflare</strong> — hosting, CDN and DNS</li>\n' +
        '<li><strong>Amazon Associates</strong> — affiliate tracking on Amazon links</li>\n' +
        '<li><strong>Manufacturer CDNs</strong> — product photographs are loaded from the brand’s own ' +
        'image servers</li>\n' +
        '</ul>\n\n' +
        '<h2>Your rights</h2>\n' +
        '<p>You can ask what we hold about you (almost always: an email you sent), ask for it to be ' +
        'deleted, or ask us to stop replying. Email ' +
        '<a href="mailto:privacy@smarthomerent.casa">privacy@smarthomerent.casa</a>.</p>\n\n' +
        '<h2>Children</h2>\n' +
        '<p>This site is not directed at children under 13 and we do not knowingly collect their ' +
        'information.</p>\n\n' +
        '<h2>Changes</h2>\n' +
        '<p>If this policy changes, the date at the top of the page changes with it.</p>'
    },
    {
      file: 'terms.html',
      heading: 'Terms of Service',
      title: 'Terms of Service — Smart Home for Renters',
      description: 'The terms that apply to using smarthomerent.casa.',
      meta: 'Last updated: October 31, 2026',
      body:
        '<h2>Acceptance</h2>\n' +
        '<p>By using smarthomerent.casa you agree to these terms. If you do not, please do not use ' +
        'the site.</p>\n\n' +
        '<h2>Use of the site</h2>\n' +
        '<p>You may read, print and share our pages for personal use. You may not republish them ' +
        'wholesale, scrape them at scale, or present them as your own.</p>\n\n' +
        '<h2>Intellectual property</h2>\n' +
        '<p>The text, layout and original artwork on this site belong to Smart Home for Renters. ' +
        'Product photographs belong to the manufacturers and are loaded from their own servers; ' +
        'they are used to identify the product being discussed.</p>\n\n' +
        '<h2>Affiliate disclosure</h2>\n' +
        '<p>This site contains affiliate links and earns a commission on qualifying purchases at no ' +
        'cost to you. Rankings are not for sale. See the ' +
        '<a href="/disclosure.html">affiliate disclosure</a>.</p>\n\n' +
        '<h2>No professional advice</h2>\n' +
        '<p>Nothing here is legal, tenancy or safety advice. Lease terms vary, building codes vary, ' +
        'and local law varies. Before you install anything, read your lease and — where it matters — ' +
        'ask your landlord in writing. Our <a href="/articles/ask-landlord-about-smart-home.html">' +
        'landlord guide</a> exists for exactly this reason.</p>\n\n' +
        '<h2>Accuracy</h2>\n' +
        '<p>We test carefully, but prices, availability, firmware and specifications change without ' +
        'notice. Verify anything that matters — especially compatibility and warranty terms — with ' +
        'the retailer or manufacturer before buying. Pages carry the date they were last updated.</p>\n\n' +
        '<h2>Limitation of liability</h2>\n' +
        '<p>The site is provided “as is”. We are not liable for indirect or consequential loss ' +
        'arising from use of the site or of a product we discuss, including damage caused during ' +
        'installation.</p>\n\n' +
        '<h2>External links</h2>\n' +
        '<p>Links to retailers and manufacturers are provided for convenience. We do not control ' +
        'those sites and are not responsible for their content or their privacy practices.</p>\n\n' +
        '<h2>Changes</h2>\n' +
        '<p>These terms may be updated; the date at the top of the page will change when they are.</p>\n\n' +
        '<h2>Contact</h2>\n' +
        '<p>Questions about these terms: ' +
        '<a href="mailto:legal@smarthomerent.casa">legal@smarthomerent.casa</a>.</p>'
    },
    {
      file: 'disclosure.html',
      heading: 'Affiliate Disclosure',
      title: 'Affiliate Disclosure — Smart Home for Renters',
      description:
        'How Smart Home for Renters makes money, which affiliate programs we use, and why commission ' +
        'rates never decide a ranking.',
      meta: 'Last updated: October 31, 2026',
      body:
        '<h2>How we make money</h2>\n' +
        '<p>Smart Home for Renters is a participant in the Amazon Services LLC Associates Program, ' +
        'an affiliate advertising program that pays sites a commission for linking to Amazon.com. ' +
        'We also apply to manufacturer and retailer programs where they exist.</p>\n\n' +
        '<h2>What that means for you</h2>\n' +
        '<p>When you click an affiliate link and buy something, the retailer pays us a small ' +
        'percentage. <strong>The price you pay is exactly the same</strong> whether you use our link ' +
        'or go straight to the store.</p>\n\n' +
        '<h2>How links are marked</h2>\n' +
        '<p>Affiliate links are labelled in the text — “Check price on Amazon” — and carry ' +
        '<code>rel="sponsored"</code>. Every article that contains one also carries a disclosure box ' +
        'at the top and the bottom.</p>\n\n' +
        '<h2>Editorial independence</h2>\n' +
        '<p>Rankings are decided by the Renter Readiness Score before any affiliate relationship is ' +
        'considered. Three concrete consequences you can check on the site:</p>\n' +
        '<ul>\n' +
        '<li>We recommend the $35 camera over the $99 one when it scores higher.</li>\n' +
        '<li>We tell you not to buy a thermostat in a rental, even though thermostats pay well.</li>\n' +
        '<li>We score products we have no program with exactly the same way as ones we do.</li>\n' +
        '</ul>\n\n' +
        '<h2>What we do not do</h2>\n' +
        '<ul>\n' +
        '<li>We do not accept payment for a review, a ranking or a placement.</li>\n' +
        '<li>We do not publish a device we have not tested or thoroughly researched.</li>\n' +
        '<li>We do not hide a product’s flaws to protect a commission.</li>\n' +
        '</ul>\n\n' +
        '<h2>Questions</h2>\n' +
        '<p>If anything here is unclear, or you think a ranking is wrong, email ' +
        '<a href="mailto:disclosure@smarthomerent.casa">disclosure@smarthomerent.casa</a>.</p>'
    }
  ];
}

// ------------------------------------------------------------------ build ---
function build() {
  const articles = loadArticles();
  const byOrder = (x, y) => x.order - y.order || x.slug.localeCompare(y.slug);
  const sorted = (cat) => articles.filter((a) => a.category === cat).sort(byOrder);

  // 1. Article pages
  for (const a of articles) {
    write(path.join(ROOT, 'articles', a.slug + '.html'), articlePage(a, articles));
  }

  // 2. Hub pages
  const hubs = [
    {
      path: '/reviews.html',
      title: 'Smart Home Reviews for Renters — No-Drill, Lease-Safe',
      description:
        'Every smart home device we have tested in a real rental apartment, scored for install ease, ' +
        'removability and lease safety.',
      heading: 'Reviews',
      intro:
        'Every device here was installed in an apartment where drilling is not allowed. We score install ease, ' +
        'removability, portability and lease risk — and we tell you when something is not worth it.',
      items: sorted('review')
    },
    {
      path: '/guides.html',
      title: 'Renter Smart Home Guides — Setup, Landlords, Moving',
      description:
        'Practical guides for setting up a smart home in a rental: talking to your landlord, ' +
        'installing without damage, and moving it all to the next place.',
      heading: 'Guides',
      intro:
        'The parts nobody explains: how to raise it with a landlord, how to install so nothing is damaged, ' +
        'and how to pack it all up in an afternoon.',
      items: sorted('guide')
    },
    {
      path: '/starter-kits.html',
      title: 'Renter Starter Kits — Smart Home from $100',
      description:
        'Three renter-friendly smart home starter kits at $100, $250 and $500. Everything installs without ' +
        'drilling and comes with you when you move.',
      heading: 'Starter Kits',
      intro:
        'Pick a budget and get a complete, no-drill setup. Each kit lists exactly what to buy, in what order, ' +
        'and what to add next.',
      items: sorted('kit')
    }
  ];

  for (const h of hubs) {
    write(path.join(ROOT, h.path.replace(/^\//, '')), hubPage(h));
  }

  // 2b. Static pages (legal + about + contact). Generated so the nav and the
  // footer can never drift out of sync with the rest of the site.
  for (const p of staticPages()) {
    write(path.join(ROOT, p.file), shell({
      title: p.title,
      description: p.description,
      canonical: cleanUrl(SITE + '/' + p.file),
      keywords: '',
      body:
        '<main>\\n  <div class="article">\\n' +
        '    <nav class="crumbs"><a href="/">Home</a> › <span>' + esc(p.heading) + '</span></nav>\\n' +
        '    <article>\\n' +
        '      <h1>' + esc(p.heading) + '</h1>\\n' +
        '      <p class="meta">' + p.meta + '</p>\\n' +
        p.body + '\\n' +
        '    </article>\\n' +
        '  </div>\\n</main>'
    }));
  }

  // 3. Home page
  write(path.join(ROOT, 'index.html'), homePage(sorted('review'), sorted('kit')));

  // 4. 404
  write(path.join(ROOT, '404.html'), shell({
    title: 'Page not found — Smart Home for Renters',
    description: 'That page does not exist. Start from the reviews index instead.',
    canonical: cleanUrl(SITE + '/404.html'),
    body:
      '<main>\n  <section class="page-head">\n' +
      '    <h1>That page does not exist</h1>\n' +
      '    <p>The link may be old, or the page may have moved. Everything we publish is listed below.</p>\n' +
      '    <p><a class="cta" href="/">Go to the home page</a></p>\n' +
      '  </section>\n' +
      '  <section class="section">\n' +
      '    <div class="cat-grid">\n' +
      CATEGORIES.map(([label, href, icon]) =>
        '      <a class="cat-card" href="' + href + '"><span class="cat-icon" aria-hidden="true">' + icon +
        '</span><span class="cat-name">' + esc(label) + '</span></a>').join('\n') +
      '\n    </div>\n' +
      '  </section>\n</main>'
  }));

  // 5. Cloudflare Pages headers
  write(path.join(ROOT, '_headers'),
    '/*\n' +
    '  X-Content-Type-Options: nosniff\n' +
    '  X-Frame-Options: SAMEORIGIN\n' +
    '  Referrer-Policy: strict-origin-when-cross-origin\n' +
    '  Permissions-Policy: geolocation=(), microphone=(), camera=()\n' +
    '\n' +
    '/css/*\n' +
    '  Cache-Control: public, max-age=604800\n' +
    '\n' +
    '/articles/*\n' +
    '  Cache-Control: public, max-age=3600\n');

  // 6. Sitemap
  const legal = ['/about.html', '/contact.html', '/privacy.html', '/terms.html', '/disclosure.html'];
  const urls = [
    { loc: '/', priority: '1.0', freq: 'weekly' },
    ...hubs.map((h) => ({ loc: h.path, priority: '0.7', freq: 'weekly' })),
    ...articles.map((a) => ({ loc: '/articles/' + a.slug + '.html', priority: a.priority, freq: 'monthly' })),
    ...legal.map((l) => ({ loc: l, priority: '0.4', freq: 'yearly' }))
  ];

  write(path.join(ROOT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) =>
      '  <url>\n    <loc>' + cleanUrl(SITE + u.loc) + '</loc>\n    <lastmod>' + TODAY +
      '</lastmod>\n    <changefreq>' + u.freq + '</changefreq>\n    <priority>' + u.priority + '</priority>\n  </url>'
    ).join('\n') + '\n</urlset>\n');

  return { articles, hubs };
}

// ------------------------------------------------------------- link check ---
function linkCheck() {
  const problems = [];
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(html|xml)$/.test(e.name)) files.push(full);
    }
  })(ROOT);

  for (const file of files) {
    const text = read(file);
    const re = /(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g;
    let m;
    while ((m = re.exec(text))) {
      const href = m[1];
      const target = href === '/' ? 'index.html' : href.replace(/^\//, '');
      const abs = path.join(ROOT, target);
      const ok = fs.existsSync(abs) ||
        fs.existsSync(abs + '.html') ||
        fs.existsSync(path.join(abs, 'index.html'));
      if (!ok) problems.push(path.relative(ROOT, file) + '  ->  ' + href);
    }
  }
  return problems;
}

// ------------------------------------------------------------------- main ---
const { articles, hubs } = build();
console.log('built ' + articles.length + ' articles, ' + hubs.length + ' hub pages, home, 404, sitemap');

const problems = linkCheck();
if (problems.length) {
  console.log('\nBROKEN INTERNAL LINKS (' + problems.length + '):');
  for (const p of [...new Set(problems)]) console.log('  ' + p);
  process.exitCode = 1;
} else {
  console.log('link check: all internal links resolve');
}
