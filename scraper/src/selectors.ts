/**
 * All Yandex.Maps DOM selectors are isolated here so they can be updated in one
 * place when the markup changes. Yandex uses BEM-style class names that are
 * relatively stable; where possible we prefer aria-/data- attributes.
 */
export const selectors = {
  // The scrollable list that holds review cards.
  reviewsContainer: '.scroll__container',

  // A single review card.
  reviewCard: '.business-review-view',

  // Fields inside a review card.
  reviewAuthor: '.business-review-view__author-name',
  reviewText: '.business-review-view__body-text',
  reviewDate: '.business-review-view__date',
  // Star rating lives in an aria-label, e.g. "Оценка 5".
  reviewRatingMeter: '.business-rating-badge-view__stars',
  reviewRatingStarFull: '.business-rating-badge-view__star._full',

  // Organization-level stats (header of the reviews tab).
  orgName: 'h1.orgpage-header-view__header',
  ratingValue: '.business-summary-rating-badge-view__rating-text',
  // Counts text, e.g. "1 234 оценки" / "567 отзывов".
  ratingsCount: '.business-summary-rating-badge-view__rating-count',
  reviewsCountHeader: '.card-section-header__title',

  // SmartCaptcha / "are you a robot" markers.
  captchaMarkers: [
    '.CheckboxCaptcha',
    '.AdvancedCaptcha',
    'form#checkbox-captcha-form',
    '[data-testid="captcha"]',
  ],
} as const;

/** Substrings that indicate a captcha / robot-check interstitial in the page text. */
export const captchaTextMarkers = [
  'подтвердите, что запросы отправляли вы',
  'ой!',
  'captcha',
  'robot',
];
