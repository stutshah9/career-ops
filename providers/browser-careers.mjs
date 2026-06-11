// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

// Browser-backed provider for official careers pages that do not expose one of
// the simple public ATS APIs covered by the HTTP providers. Use explicitly with
// `provider: browser-careers` and one or more `search_urls`.

const DEFAULT_TIMEOUT_MS = 20_000;
const SETTLE_MS = 1_500;
const MAX_LINKS_PER_PAGE = 250;
const MAX_TITLE_LENGTH = 180;

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function isLikelyJobUrl(url, patterns = []) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;

  const haystack = `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase();
  if (patterns.some((p) => haystack.includes(String(p).toLowerCase()))) return true;

  return [
    '/job/',
    '/jobs/',
    '/careers/',
    '/career/',
    '/positions/',
    '/position/',
    '/requisitions',
    'jobid=',
    'job_id=',
    'gh_jid=',
    'jid=',
    'jr',
  ].some((token) => haystack.includes(token));
}

function isGenericTitle(title) {
  const lower = title.toLowerCase();
  if (title.length < 4 || title.length > MAX_TITLE_LENGTH) return true;
  return [
    'search jobs',
    'view all jobs',
    'apply now',
    'learn more',
    'see more',
    'read more',
    'careers',
    'privacy',
    'terms',
    'home',
  ].some((token) => lower === token || lower.includes(`${token} at `));
}

async function scrapePage(page, url, entry) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: entry.timeout_ms || DEFAULT_TIMEOUT_MS });
  await page.waitForTimeout(entry.settle_ms || SETTLE_MS);

  const patterns = Array.isArray(entry.url_patterns) ? entry.url_patterns : [];
  const company = entry.name;

  return page.$$eval('a[href]', (anchors, args) => {
    const { patterns, company, maxLinks } = args;
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const results = [];

    for (const anchor of anchors.slice(0, maxLinks)) {
      const href = anchor.href;
      const title = normalize(anchor.textContent || anchor.getAttribute('aria-label') || anchor.getAttribute('title'));
      if (!href || !title) continue;
      results.push({ title, url: href, company, location: '', patterns });
    }
    return results;
  }, { patterns, company, maxLinks: entry.max_links_per_page || MAX_LINKS_PER_PAGE });
}

/** @type {Provider} */
export default {
  id: 'browser-careers',

  detect(entry) {
    if (entry.provider === 'browser-careers') return { url: entry.careers_url || '' };
    return null;
  },

  async fetch(entry) {
    const urls = Array.isArray(entry.search_urls) && entry.search_urls.length
      ? entry.search_urls
      : [entry.careers_url].filter(Boolean);

    if (urls.length === 0) return [];

    let chromium;
    try {
      ({ chromium } = await import('playwright'));
    } catch (err) {
      throw new Error(`browser-careers: Playwright unavailable: ${err.message}`);
    }

    const browser = await chromium.launch({ headless: true });
    const seen = new Set();
    const jobs = [];

    try {
      const page = await browser.newPage();
      for (const url of urls) {
        let links = [];
        try {
          links = await scrapePage(page, url, entry);
        } catch (err) {
          throw new Error(`browser-careers: failed ${url}: ${err.message}`);
        }

        for (const item of links) {
          const title = normalizeText(item.title);
          const href = item.url;
          if (isGenericTitle(title)) continue;
          if (!isLikelyJobUrl(href, item.patterns)) continue;
          const key = `${title.toLowerCase()}|${href}`;
          if (seen.has(key)) continue;
          seen.add(key);
          jobs.push({ title, url: href, company: entry.name, location: '' });
        }
      }
    } finally {
      await browser.close();
    }

    return jobs;
  },
};
