/** Shared types and the ScrapeError class, in their own module to avoid import
 * cycles between scraper.ts (browser), crawlbase.ts (API) and parse.ts. */

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
  /** Crawlbase token: when set, fetch rendered HTML via the Crawling API instead
   * of driving a local browser. */
  crawlbaseToken?: string;
  /** Hard cap on the number of reviews collected. */
  maxReviews?: number;
  /** Overall scrolling time budget (ms). */
  scrollTimeoutMs?: number;
}
