import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const siteOrigin = 'https://helloredlight.com';
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules', 'output', 'tmp']);
const errors = [];
const warnings = [];
const productFiles = new Set([
  'product-detail.html',
  'mini-panel-300w.html',
  'luxor-360-bed.html',
  'silicone-led-mask.html',
  'laser-pen.html',
  'therapy-belt.html',
  'zh/product-detail.html',
  'zh/mini-panel-300w.html',
  'zh/luxor-360-bed.html',
  'zh/silicone-led-mask.html',
  'zh/laser-pen.html',
  'zh/therapy-belt.html',
]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : walk(absolute);
    }
    return entry.isFile() && entry.name.endsWith('.html') ? [absolute] : [];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function matches(content, expression) {
  return [...content.matchAll(expression)];
}

function firstCapture(content, expression) {
  return content.match(expression)?.[1]?.trim() ?? '';
}

function addError(file, message) {
  errors.push(`${file}: ${message}`);
}

function addWarning(file, message) {
  warnings.push(`${file}: ${message}`);
}

function normalizeSiteUrl(value, base = `${siteOrigin}/`) {
  try {
    const url = new URL(value, base);
    if (url.origin !== siteOrigin) return '';
    url.hash = '';
    url.search = '';
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.href;
  } catch {
    return '';
  }
}

function routeCandidates(sourceFile, href) {
  const clean = decodeURIComponent(href.split(/[?#]/, 1)[0]);
  if (!clean) return [];

  let target;
  if (clean.startsWith('/')) {
    target = clean.slice(1);
  } else {
    target = path.posix.normalize(path.posix.join(path.posix.dirname(sourceFile), clean));
  }

  if (!target) target = 'index.html';

  return [
    target,
    `${target}.html`,
    path.posix.join(target, 'index.html'),
    path.posix.join('public', target),
  ];
}

function localTargetExists(sourceFile, href) {
  return routeCandidates(sourceFile, href).some((candidate) =>
    fs.existsSync(path.join(root, candidate)),
  );
}

const htmlFiles = walk(root);
const pages = [];

for (const absolute of htmlFiles) {
  const file = relative(absolute);
  const content = fs.readFileSync(absolute, 'utf8');
  const noindex = /<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(content);
  const title = firstCapture(content, /<title>([\s\S]*?)<\/title>/i);
  const description = firstCapture(
    content,
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i,
  );
  const canonical = firstCapture(
    content,
    /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i,
  );
  const h1Count = matches(content, /<h1\b/gi).length;
  const lang = firstCapture(content, /<html\s+lang=["']([^"']+)["']/i);
  const jsonLdBlocks = matches(
    content,
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  const alternates = matches(content, /<link\b[^>]*rel=["']alternate["'][^>]*>/gi)
    .map((match) => {
      const tag = match[0];
      return {
        lang: firstCapture(tag, /\bhreflang=["']([^"']+)["']/i),
        href: normalizeSiteUrl(firstCapture(tag, /\bhref=["']([^"']+)["']/i)),
      };
    })
    .filter((alternate) => alternate.lang && alternate.href);
  const internalLinks = [];

  if (!title) addError(file, 'missing <title>');
  if (!description) addError(file, 'missing meta description');
  if (!lang) addError(file, 'missing html lang');
  if (h1Count !== 1) addError(file, `expected one H1, found ${h1Count}`);
  if ((file === 'index.html' || file === 'zh/index.html') && !/<main\b/i.test(content)) {
    addError(file, 'homepage is missing a main landmark');
  }
  if (
    (file === 'index.html' || file === 'zh/index.html') &&
    /"hasOfferCatalog"/i.test(content)
  ) {
    addError(file, 'homepage category catalog must use ItemList, not nested Product markup');
  }
  if (
    file === 'factory.html' &&
    /"itemOffered"\s*:\s*\{\s*"@type"\s*:\s*"Product"/i.test(content)
  ) {
    addError(file, 'manufacturing service must not be marked up as a Product');
  }

  if (!noindex) {
    if (!canonical) addError(file, 'indexable page is missing canonical');
    if (jsonLdBlocks.length === 0) addWarning(file, 'indexable page has no JSON-LD');
  }

  if (canonical) {
    if (!canonical.startsWith(siteOrigin)) {
      addError(file, `canonical is outside ${siteOrigin}`);
    }
    const canonicalPath = new URL(canonical).pathname;
    if (canonicalPath !== '/' && canonicalPath.endsWith('/')) {
      addError(file, `canonical has a trailing slash: ${canonical}`);
    }
    if (canonicalPath.endsWith('.html')) {
      addError(file, `canonical exposes .html: ${canonical}`);
    }
  }

  jsonLdBlocks.forEach((block, index) => {
    try {
      JSON.parse(block[1]);
    } catch (error) {
      addError(file, `invalid JSON-LD block ${index + 1}: ${error.message}`);
    }
  });

  for (const image of matches(content, /<img\b[^>]*>/gi)) {
    const tag = image[0];
    if (!/\balt=["'][^"']*["']/i.test(tag)) addError(file, 'image is missing alt');
    if (!/\bwidth=["'][^"']+["']/i.test(tag) || !/\bheight=["'][^"']+["']/i.test(tag)) {
      addError(file, 'image is missing explicit width/height');
    }
    if (/fetchpriority=["']high["']/i.test(tag) && /loading=["']lazy["']/i.test(tag)) {
      addError(file, 'high-priority image must not be lazy-loaded');
    }
  }

  for (const anchor of matches(content, /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const href = anchor[1];
    const normalized = normalizeSiteUrl(href, canonical || `${siteOrigin}/`);
    if (normalized) internalLinks.push(normalized);
    if (
      !href ||
      href.startsWith('#') ||
      /^(?:https?:\/\/|mailto:|tel:|javascript:|data:)/i.test(href)
    ) {
      continue;
    }
    if (href.split(/[?#]/, 1)[0].endsWith('.html')) {
      addError(file, `internal link exposes .html: ${href}`);
    }
    if (!localTargetExists(file, href)) {
      addError(file, `broken internal link: ${href}`);
    }
  }

  if (/3012XXXX|All products are FDA cleared|所有产品均通过FDA/.test(content)) {
    addError(file, 'contains placeholder or blanket regulatory claim');
  }
  if (
    !noindex &&
    /Mark Johnson|Sarah Chen|Dr\.\s*Robert Webb|Sophie Claire|Legend Fitness Chain|Lumina Skincare Group/i.test(
      content,
    )
  ) {
    addError(file, 'indexable page contains an unverified testimonial or customer identity');
  }

  if (productFiles.has(file)) {
    const requiredSignals = [
      ['SKU', /\bSKU\b/i],
      ['MOQ', /\bMOQ\b|最小订单量|最小起订量/i],
      ['lead time', /Lead Time|交期|交货期/i],
      ['shipping', /Shipping Port|Shipping Method|发货港|运输方式/i],
      ['payment terms', /Payment Terms|付款方式/i],
      ['warranty', /Warranty|保修|质保/i],
      ['customization', /Customization|定制能力|定制/i],
      ['packaging', /Packaging|Packout|包装/i],
      ['compliance verification', /Compliance|Certification|合规|认证/i],
    ];
    for (const [label, expression] of requiredSignals) {
      if (!expression.test(content)) addError(file, `product page is missing ${label}`);
    }
    if (!/"@type"\s*:\s*"Product"/i.test(content)) {
      addError(file, 'product page is missing Product JSON-LD');
    }
    if (!/href=["'][^"']+\.pdf["'][^>]*\bdownload\b/i.test(content)) {
      addError(file, 'product page has no direct downloadable technical PDF');
    }
    if (!/href=["'][^"']*\/(?:zh\/)?contact(?:[?"'])/i.test(content)) {
      addError(file, 'product page has no quotation/contact CTA');
    }
  }

  if (/^(?:blog|cases)\//.test(file)) {
    const hasCommercialLink = internalLinks.some((href) =>
      /\/(?:products|product-detail|mini-panel-300w|luxor-360-bed|silicone-led-mask|laser-pen|therapy-belt|contact)$/.test(
        new URL(href).pathname,
      ),
    );
    if (!hasCommercialLink) {
      addWarning(file, 'editorial/case page has no direct link to a product, catalog, or contact page');
    }
  }

  if (file === 'contact.html' || file === 'zh/contact.html') {
    const primaryForm = content.match(/<form\b[\s\S]*?<\/form>/i)?.[0] ?? '';
    const requiredFields = matches(
      primaryForm,
      /<(?:input|select|textarea)\b[^>]*\brequired\b[^>]*>/gi,
    ).length;
    if (requiredFields > 8) {
      addWarning(
        file,
        `primary inquiry form has ${requiredFields} required fields (target: 8 or fewer)`,
      );
    }
  }

  pages.push({ file, noindex, title, description, canonical, lang, alternates, internalLinks });
}

for (const [field, label] of [
  ['title', 'title'],
  ['description', 'meta description'],
  ['canonical', 'canonical'],
]) {
  const groups = new Map();
  for (const page of pages) {
    if (!page[field]) continue;
    const files = groups.get(page[field]) ?? [];
    files.push(page.file);
    groups.set(page[field], files);
  }
  for (const [value, files] of groups) {
    if (files.length > 1) {
      errors.push(`duplicate ${label} in ${files.join(', ')}: ${value}`);
    }
  }
}

const sitemapPath = path.join(root, 'public', 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const sitemapUrls = matches(sitemap, /<loc>([^<]+)<\/loc>/g).map((match) => match[1].trim());
const sitemapSet = new Set(sitemapUrls);

if (sitemapSet.size !== sitemapUrls.length) {
  errors.push('public/sitemap.xml: contains duplicate URLs');
}

for (const url of sitemapUrls) {
  const pathname = new URL(url).pathname;
  if (pathname !== '/' && pathname.endsWith('/')) {
    errors.push(`public/sitemap.xml: trailing-slash URL ${url}`);
  }
  if (pathname.endsWith('.html')) {
    errors.push(`public/sitemap.xml: .html URL ${url}`);
  }
  if (!pages.some((page) => page.canonical === url && !page.noindex)) {
    errors.push(`public/sitemap.xml: URL does not match an indexable canonical: ${url}`);
  }
}

for (const page of pages.filter((item) => !item.noindex && item.canonical)) {
  if (!sitemapSet.has(page.canonical)) {
    addError(page.file, `canonical missing from sitemap: ${page.canonical}`);
  }
}

const pageByCanonical = new Map(
  pages
    .filter((page) => page.canonical)
    .map((page) => [normalizeSiteUrl(page.canonical), page]),
);

for (const page of pages.filter((item) => !item.noindex && item.canonical)) {
  for (const alternate of page.alternates.filter((item) => item.lang !== 'x-default')) {
    const target = pageByCanonical.get(alternate.href);
    if (!target) {
      addError(page.file, `hreflang target does not map to a local canonical: ${alternate.href}`);
      continue;
    }
    const reciprocal = target.alternates.some(
      (item) => item.lang !== 'x-default' && item.href === normalizeSiteUrl(page.canonical),
    );
    if (!reciprocal) {
      addError(page.file, `hreflang is not reciprocal with ${target.file}`);
    }
  }
}

const incomingLinks = new Map(
  pages
    .filter((page) => !page.noindex && page.canonical)
    .map((page) => [normalizeSiteUrl(page.canonical), new Set()]),
);
for (const source of pages.filter((page) => !page.noindex && page.canonical)) {
  for (const href of source.internalLinks) {
    if (href !== normalizeSiteUrl(source.canonical) && incomingLinks.has(href)) {
      incomingLinks.get(href).add(source.file);
    }
  }
}
for (const page of pages.filter((item) => !item.noindex && item.canonical)) {
  const canonicalUrl = normalizeSiteUrl(page.canonical);
  if (canonicalUrl !== `${siteOrigin}/` && incomingLinks.get(canonicalUrl)?.size === 0) {
    addWarning(page.file, 'indexable page has no internal incoming link');
  }
}

const downloadableProductPages = pages.filter(
  (page) =>
    productFiles.has(page.file) &&
    page.internalLinks.some((href) => new URL(href).pathname.endsWith('.pdf')),
).length;
const technicalAssetCoverage = Math.round((downloadableProductPages / productFiles.size) * 100);
if (technicalAssetCoverage < 60) {
  errors.push(
    `product technical-asset coverage is ${technicalAssetCoverage}% (target: at least 60%)`,
  );
}

const querySetPath = path.join(root, 'data', 'geo-query-set.csv');
const queryLines = fs
  .readFileSync(querySetPath, 'utf8')
  .trim()
  .split(/\r?\n/)
  .slice(1);
const queryRows = queryLines.map((line) => {
  const [queryId, locale, family, intent, variantId, query, landingPage, priority] =
    line.split(',');
  return { queryId, locale, family, intent, variantId, query, landingPage, priority };
});
if (queryRows.length < 60) {
  errors.push(`data/geo-query-set.csv: expected at least 60 baseline queries, found ${queryRows.length}`);
}
const queryIds = new Set(queryRows.map((row) => row.queryId));
if (queryIds.size !== queryRows.length) {
  errors.push('data/geo-query-set.csv: query_id values must be unique');
}
for (const row of queryRows) {
  if (Object.values(row).some((value) => !value)) {
    errors.push(`data/geo-query-set.csv: incomplete row ${row.queryId || '(missing ID)'}`);
  }
  if (!localTargetExists('index.html', row.landingPage)) {
    errors.push(`data/geo-query-set.csv: ${row.queryId} has invalid landing page ${row.landingPage}`);
  }
}
for (const [family, minimum] of [
  ['panel', 10],
  ['bed', 10],
  ['mask', 10],
  ['oem', 10],
]) {
  const count = queryRows.filter((row) => row.family === family).length;
  if (count < minimum) {
    errors.push(`data/geo-query-set.csv: ${family} family has ${count} queries (target: ${minimum}+)`);
  }
}

const observationHeader = fs
  .readFileSync(path.join(root, 'data', 'geo-observation-log.csv'), 'utf8')
  .split(/\r?\n/, 1)[0];
if (!observationHeader.includes('observed_at_utc') || !observationHeader.includes('citation_present')) {
  errors.push('data/geo-observation-log.csv: required evidence-log fields are missing');
}

const claimRegister = fs.readFileSync(
  path.join(root, 'data', 'claim-evidence-register.csv'),
  'utf8',
);
if (
  !claimRegister.includes('evidence_status') ||
  !claimRegister.includes('owner_evidence_required') ||
  !claimRegister.includes('quarantined_unverified')
) {
  errors.push('data/claim-evidence-register.csv: claim status controls are incomplete');
}

const robots = fs.readFileSync(path.join(root, 'public', 'robots.txt'), 'utf8');
if (!/User-agent:\s*OAI-SearchBot[\s\S]*?Allow:\s*\//i.test(robots)) {
  errors.push('public/robots.txt: OAI-SearchBot is not explicitly allowed');
}
if (!robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`)) {
  errors.push('public/robots.txt: canonical sitemap declaration is missing');
}

const llms = fs.readFileSync(path.join(root, 'public', 'llms.txt'), 'utf8');
if (!llms.includes('OAI-SearchBot')) {
  warnings.push('public/llms.txt: OAI-SearchBot policy is not documented');
}
if (!/\[[^\]]+\]\(https:\/\/[^)]+\)/.test(llms)) {
  errors.push('public/llms.txt: must contain crawlable Markdown links');
}
if (/^-\s+[^[][^:\r\n]*:\s+https?:\/\//m.test(llms)) {
  errors.push('public/llms.txt: contains a bare URL instead of a Markdown link');
}

console.log(`SEO audit scanned ${pages.length} HTML files and ${sitemapUrls.length} sitemap URLs.`);
console.log(
  `Product procurement coverage: ${productFiles.size}/${productFiles.size} pages checked; direct technical PDF coverage: ${technicalAssetCoverage}%.`,
);
console.log(`GEO baseline: ${queryRows.length} fixed queries; observation log schema present.`);

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach((warning) => console.log(`- ${warning}`));
}

if (errors.length) {
  console.error(`\nErrors (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('\nSEO audit passed with no blocking errors.');
}
