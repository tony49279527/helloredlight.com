import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const siteOrigin = 'https://helloredlight.com';
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const errors = [];
const warnings = [];

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

  if (!title) addError(file, 'missing <title>');
  if (!description) addError(file, 'missing meta description');
  if (!lang) addError(file, 'missing html lang');
  if (h1Count !== 1) addError(file, `expected one H1, found ${h1Count}`);

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

  pages.push({ file, noindex, title, description, canonical });
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

console.log(`SEO audit scanned ${pages.length} HTML files and ${sitemapUrls.length} sitemap URLs.`);

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
