import * as cheerio from 'cheerio';
import { selectors, captchaTextMarkers } from './selectors.js';
import { parseCount, parseRating, parseRussianDate } from './dates.js';
import { ScrapeError, type ScrapeResult, type ScrapedReview } from './types.js';

/**
 * Parse the rendered reviews HTML (from Crawlbase) into stats + reviews using
 * the same selectors as the browser path.
 */
export function parseReviewsHtml(html: string, maxReviews: number): ScrapeResult {
  const lower = html.toLowerCase();
  for (const sel of selectors.captchaMarkers) {
    // Class-based markers turned into rough substring checks on the raw HTML.
    const token = sel.replace(/[.#\[\]'"=\-]/g, '').toLowerCase();
    if (token && lower.includes(token)) {
      throw new ScrapeError('captcha');
    }
  }
  if (captchaTextMarkers.some((m) => m.length > 4 && lower.includes(m))) {
    throw new ScrapeError('captcha');
  }

  const $ = cheerio.load(html);

  const textOf = (sel: string): string | null => {
    const t = $(sel).first().text().trim();
    return t === '' ? null : t;
  };

  const cards = $(selectors.reviewCard);
  if (cards.length === 0) {
    // Page rendered but no review cards — either changed markup or empty org.
    throw new ScrapeError($(selectors.reviewsContainer).length ? 'empty' : 'markup_changed');
  }

  const reviews: ScrapedReview[] = [];
  cards.each((_, el) => {
    if (reviews.length >= maxReviews) return;
    const card = $(el);

    let rating: number | null = null;
    const aria = card.find(selectors.reviewRatingMeter).first().attr('aria-label') ?? '';
    const ariaMatch = aria.match(/(\d)/);
    if (ariaMatch) {
      rating = Number.parseInt(ariaMatch[1], 10);
    } else {
      const full = card.find(selectors.reviewRatingStarFull).length;
      rating = full > 0 ? full : null;
    }

    reviews.push({
      externalId: card.attr('data-review-id') ?? card.attr('data-key') ?? null,
      author: card.find(selectors.reviewAuthor).first().text().trim() || null,
      rating,
      text: card.find(selectors.reviewText).first().text().trim() || null,
      reviewedAt: parseRussianDate(card.find(selectors.reviewDate).first().text().trim()),
    });
  });

  return {
    name: textOf(selectors.orgName),
    rating: parseRating(textOf(selectors.ratingValue)),
    ratingsCount: parseCount(textOf(selectors.ratingsCount)),
    reviewsCount: parseCount(textOf(selectors.reviewsCountHeader)) ?? reviews.length,
    reviews,
  };
}
