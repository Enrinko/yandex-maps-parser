import { chromium, type Browser, type Page } from 'playwright';
import { selectors, captchaTextMarkers } from './selectors.js';
import { parseCount, parseRating, parseRussianDate } from './dates.js';

export type ScrapeErrorCode =
  | 'captcha'
  | 'markup_changed'
  | 'unavailable'
  | 'empty';

export class ScrapeError extends Error {
  constructor(public code: ScrapeErrorCode, message?: string) {
    super(message ?? code);
  }
}

export interface ScrapedReview {
  externalId: string | null;
  author: string | null;
  rating: number | null;
  text: string | null;
  reviewedAt: string | null;
}

export interface ScrapeResult {
  name: string | null;
  rating: number | null;
  ratingsCount: number | null;
  reviewsCount: number | null;
  reviews: ScrapedReview[];
}

export interface ScrapeOptions {
  url: string;
  proxy?: string;
  /** Hard cap on the number of reviews collected. */
  maxReviews?: number;
  /** Overall scrolling time budget (ms). */
  scrollTimeoutMs?: number;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

interface ProxySettings {
  server: string;
  username?: string;
  password?: string;
}

/**
 * Parse a proxy URL into Playwright's {server, username, password} form.
 * Credentials embedded in the URL (e.g. Crawlbase "TOKEN@host:port", empty
 * password) are extracted, since Playwright requires them passed separately.
 */
export function parseProxy(raw?: string): ProxySettings | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    const settings: ProxySettings = { server: `${u.protocol}//${u.host}` };
    if (u.username) settings.username = decodeURIComponent(u.username);
    if (u.password) settings.password = decodeURIComponent(u.password);
    // Crawlbase uses the token as username with an empty password.
    if (u.username && !u.password) settings.password = '';
    return settings;
  } catch {
    return { server: raw };
  }
}

export async function scrape(options: ScrapeOptions): Promise<ScrapeResult> {
  const maxReviews = options.maxReviews ?? 1000;
  const scrollTimeoutMs = options.scrollTimeoutMs ?? 180_000;

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      // Headful is required: Yandex withholds reviews from headless windows.
      headless: false,
      proxy: parseProxy(options.proxy),
      args: [
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });

    const context = await browser.newContext({
      userAgent: USER_AGENT,
      locale: 'ru-RU',
      timezoneId: 'Europe/Moscow',
      viewport: { width: 1366, height: 900 },
      // Smart proxies (e.g. Crawlbase) intercept TLS with their own certificate,
      // so certificate validation must be relaxed when a proxy is in use.
      ignoreHTTPSErrors: Boolean(options.proxy),
    });

    // Light stealth: hide webdriver flag.
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // Skip heavy assets to speed up rendering.
    await context.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (type === 'image' || type === 'media' || type === 'font') {
        return route.abort();
      }
      return route.continue();
    });

    const page = await context.newPage();
    await page.goto(options.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    await assertNoCaptcha(page);

    // Wait for the reviews list; if it never appears the markup likely changed.
    try {
      await page.waitForSelector(selectors.reviewCard, { timeout: 30_000 });
    } catch {
      await assertNoCaptcha(page);
      // No cards could mean a genuinely empty org or changed markup.
      const hasContainer = await page.$(selectors.reviewsContainer);
      throw new ScrapeError(hasContainer ? 'empty' : 'markup_changed');
    }

    const stats = await extractStats(page);
    const reviews = await collectReviews(page, maxReviews, scrollTimeoutMs);

    return {
      name: stats.name,
      rating: stats.rating,
      ratingsCount: stats.ratingsCount,
      reviewsCount: stats.reviewsCount ?? reviews.length,
      reviews,
    };
  } catch (err) {
    if (err instanceof ScrapeError) throw err;
    throw new ScrapeError('unavailable', (err as Error)?.message);
  } finally {
    await browser?.close();
  }
}

async function assertNoCaptcha(page: Page): Promise<void> {
  for (const sel of selectors.captchaMarkers) {
    if (await page.$(sel)) {
      throw new ScrapeError('captcha');
    }
  }
  const bodyText = ((await page.textContent('body')) ?? '').toLowerCase();
  const title = (await page.title()).toLowerCase();
  for (const marker of captchaTextMarkers) {
    if (title.includes(marker) || (marker.length > 4 && bodyText.includes(marker))) {
      throw new ScrapeError('captcha');
    }
  }
}

async function extractStats(page: Page): Promise<{
  name: string | null;
  rating: number | null;
  ratingsCount: number | null;
  reviewsCount: number | null;
}> {
  const text = async (sel: string): Promise<string | null> => {
    const el = await page.$(sel);
    return el ? (await el.textContent())?.trim() ?? null : null;
  };

  return {
    name: await text(selectors.orgName),
    rating: parseRating(await text(selectors.ratingValue)),
    ratingsCount: parseCount(await text(selectors.ratingsCount)),
    reviewsCount: parseCount(await text(selectors.reviewsCountHeader)),
  };
}

/**
 * Scroll the reviews container until no new cards load (or we hit the cap /
 * time budget), then extract every card.
 */
async function collectReviews(
  page: Page,
  maxReviews: number,
  scrollTimeoutMs: number,
): Promise<ScrapedReview[]> {
  const deadline = Date.now() + scrollTimeoutMs;
  let previousCount = 0;
  let stableRounds = 0;

  while (Date.now() < deadline) {
    const count = await page.locator(selectors.reviewCard).count();

    if (count >= maxReviews) break;

    if (count === previousCount) {
      stableRounds += 1;
      // Allow a few empty rounds for lazy loading before giving up.
      if (stableRounds >= 3) break;
    } else {
      stableRounds = 0;
    }
    previousCount = count;

    // Scroll the last card into view to trigger lazy loading of the next page.
    await page
      .locator(selectors.reviewCard)
      .last()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await page.waitForTimeout(800 + Math.floor(Math.random() * 600));
  }

  return extractCards(page, maxReviews);
}

async function extractCards(page: Page, maxReviews: number): Promise<ScrapedReview[]> {
  const raw = await page.$$eval(
    selectors.reviewCard,
    (cards, sel) =>
      cards.map((card) => {
        const get = (s: string): string | null =>
          card.querySelector(s)?.textContent?.trim() ?? null;

        // Rating: count filled stars, or read an aria-label like "Оценка 5".
        let rating: number | null = null;
        const meter = card.querySelector(sel.reviewRatingMeter);
        const aria = meter?.getAttribute('aria-label') ?? '';
        const ariaMatch = aria.match(/(\d)/);
        if (ariaMatch) {
          rating = Number.parseInt(ariaMatch[1], 10);
        } else {
          const full = card.querySelectorAll(sel.reviewRatingStarFull).length;
          rating = full > 0 ? full : null;
        }

        return {
          externalId:
            card.getAttribute('data-review-id') ??
            card.getAttribute('data-key') ??
            null,
          author: get(sel.reviewAuthor),
          ratingRaw: rating,
          text: get(sel.reviewText),
          dateRaw: get(sel.reviewDate),
        };
      }),
    selectors,
  );

  return raw.slice(0, maxReviews).map((r) => ({
    externalId: r.externalId,
    author: r.author,
    rating: r.ratingRaw,
    text: r.text,
    reviewedAt: parseRussianDate(r.dateRaw),
  }));
}
