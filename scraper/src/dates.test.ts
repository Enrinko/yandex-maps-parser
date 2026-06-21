import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRussianDate, parseCount, parseRating } from './dates.js';

const NOW = new Date(Date.UTC(2026, 5, 21)); // 2026-06-21

test('parses full Russian date with year', () => {
  assert.equal(parseRussianDate('10 января 2025', NOW), '2025-01-10');
  assert.equal(parseRussianDate('5 марта 2024', NOW), '2024-03-05');
});

test('parses Russian date without year (implies current year)', () => {
  assert.equal(parseRussianDate('5 марта', NOW), '2026-03-05');
});

test('handles сегодня / вчера', () => {
  assert.equal(parseRussianDate('сегодня', NOW), '2026-06-21');
  assert.equal(parseRussianDate('вчера', NOW), '2026-06-20');
});

test('returns null for unparseable input', () => {
  assert.equal(parseRussianDate('', NOW), null);
  assert.equal(parseRussianDate(null, NOW), null);
  assert.equal(parseRussianDate('какой-то текст', NOW), null);
});

test('parseCount strips non-digits', () => {
  assert.equal(parseCount('1 234 оценки'), 1234);
  assert.equal(parseCount('567 отзывов'), 567);
  assert.equal(parseCount('нет'), null);
});

test('parseRating handles comma and dot', () => {
  assert.equal(parseRating('4,7'), 4.7);
  assert.equal(parseRating('4.5'), 4.5);
  assert.equal(parseRating('—'), null);
});
