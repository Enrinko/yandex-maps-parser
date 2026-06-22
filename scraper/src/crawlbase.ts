import { ScrapeError } from './types.js';

const API = 'https://api.crawlbase.com/';

interface CrawlbaseJson {
  pc_status?: number;
  original_status?: number;
  body?: string;
}

/**
 * Fetch a fully rendered page via the Crawlbase Crawling API. Crawlbase renders
 * JavaScript, scrolls and handles anti-bot on their infrastructure, returning
 * HTML we can parse — far more reliable for Yandex.Maps than tunnelling a local
 * browser through a smart proxy.
 *
 * Requires a JavaScript-enabled token (scroll/ajax_wait need JS rendering).
 */
export async function fetchViaCrawlbase(targetUrl: string, token: string): Promise<string> {
  const params = new URLSearchParams({
    token,
    url: targetUrl,
    country: 'RU',
    ajax_wait: 'true',
    page_wait: '5000',
    scroll: 'true',
    scroll_interval: '60', // seconds (max); scrolls to load lazy reviews
    format: 'json',
  });

  let res: Response;
  try {
    res = await fetch(`${API}?${params.toString()}`, {
      // Rendering + up to 60s of scrolling: allow a generous budget.
      signal: AbortSignal.timeout(150_000),
    });
  } catch (e) {
    // Node's fetch wraps the real network error in `cause` — surface it so the
    // actual reason (DNS, refused, TLS, blocked) is visible instead of "fetch failed".
    const cause = (e as { cause?: { code?: string; message?: string } }).cause;
    const detail = cause?.code ?? cause?.message ?? (e as Error).message;
    throw new ScrapeError('unavailable', `Crawlbase request failed: ${detail}`);
  }

  const raw = await res.text();

  let payload: CrawlbaseJson;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new ScrapeError('unavailable', `Crawlbase returned non-JSON (HTTP ${res.status})`);
  }

  const pc = payload.pc_status ?? res.status;
  if (pc === 401 || pc === 403) {
    throw new ScrapeError('unavailable', 'Crawlbase authentication failed — check the token.');
  }
  if (pc >= 500 || !payload.body) {
    throw new ScrapeError('unavailable', `Crawlbase could not fetch the page (pc_status ${pc}).`);
  }

  return payload.body;
}
