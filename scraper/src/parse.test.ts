import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReviewsHtml } from './parse.js';
import { ScrapeError } from './types.js';

const FIXTURE = `
<html><body>
  <h1 class="orgpage-header-view__header">Тестовое кафе</h1>
  <div class="business-summary-rating-badge-view__rating-text">4,7</div>
  <div class="business-summary-rating-badge-view__rating-count">1 234 оценки</div>
  <div class="card-section-header__title">567 отзывов</div>
  <div class="scroll__container">
    <div class="business-review-view" data-review-id="r1">
      <span class="business-review-view__author-name">Иван</span>
      <span class="business-review-view__date">10 января 2025</span>
      <div class="business-rating-badge-view__stars" aria-label="Оценка 5"></div>
      <span class="business-review-view__body-text">Отлично, рекомендую</span>
    </div>
    <div class="business-review-view" data-review-id="r2">
      <span class="business-review-view__author-name">Мария</span>
      <span class="business-review-view__date">5 марта 2024</span>
      <div class="business-rating-badge-view__stars" aria-label="Оценка 4"></div>
      <span class="business-review-view__body-text">Неплохо</span>
    </div>
  </div>
</body></html>`;

test('parses stats and reviews from rendered HTML', () => {
  const result = parseReviewsHtml(FIXTURE, 1000);

  assert.equal(result.name, 'Тестовое кафе');
  assert.equal(result.rating, 4.7);
  assert.equal(result.ratingsCount, 1234);
  assert.equal(result.reviewsCount, 567);
  assert.equal(result.reviews.length, 2);

  assert.deepEqual(result.reviews[0], {
    externalId: 'r1',
    author: 'Иван',
    rating: 5,
    text: 'Отлично, рекомендую',
    reviewedAt: '2025-01-10',
  });
  assert.equal(result.reviews[1].author, 'Мария');
  assert.equal(result.reviews[1].rating, 4);
});

test('respects the maxReviews cap', () => {
  const result = parseReviewsHtml(FIXTURE, 1);
  assert.equal(result.reviews.length, 1);
});

test('throws captcha when a captcha marker is present', () => {
  const html = '<html><body><form id="checkbox-captcha-form"></form></body></html>';
  assert.throws(() => parseReviewsHtml(html, 10), (e: unknown) => e instanceof ScrapeError && e.code === 'captcha');
});

test('throws markup_changed when no cards and no container', () => {
  const html = '<html><body><div>nothing here</div></body></html>';
  assert.throws(() => parseReviewsHtml(html, 10), (e: unknown) => e instanceof ScrapeError && e.code === 'markup_changed');
});
