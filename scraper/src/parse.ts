import * as cheerio from 'cheerio';
import { selectors } from './selectors.js';
import { parseCount, parseRating, parseRussianDate } from './dates.js';
import { ScrapeError, type ScrapeResult, type ScrapedReview } from './types.js';

/**
 * Parse the rendered reviews HTML (from Crawlbase) into stats + reviews using
 * the same selectors as the browser path.
 */
export function parseReviewsHtml(html: string, maxReviews: number): ScrapeResult {
  const $ = cheerio.load(html);
  const cards = $(selectors.reviewCard);

  // If review cards are present, the page rendered fine — never a captcha.
  // (Yandex always ships the SmartCaptcha SDK, so the word "captcha" appears in
  // the HTML even with no challenge — we must not scan the raw markup for it.)
  if (cards.length === 0) {
    const captchaEl = selectors.captchaMarkers.some((sel) => $(sel).length > 0);
    // Specific challenge phrase, unlikely to appear outside a real captcha page.
    const bodyText = $('body').text().toLowerCase();
    const captchaText = bodyText.includes('подтвердите, что запросы отправляли');

    if (captchaEl || captchaText) {
      throw new ScrapeError('captcha');
    }
    // Rendered but no cards: empty org if the container exists, else changed markup.
    throw new ScrapeError($(selectors.reviewsContainer).length ? 'empty' : 'markup_changed');
  }

  const textOf = (sel: string): string | null => {
    const t = $(sel).first().text().trim();
    return t === '' ? null : t;
  };

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

