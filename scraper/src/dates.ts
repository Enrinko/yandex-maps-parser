/**
 * Parses Russian-language Yandex review dates into ISO-8601 strings.
 *
 * Yandex renders dates like:
 *   "10 января 2025"
 *   "5 марта"          (current year implied)
 *   "вчера" / "сегодня"
 */

const MONTHS: Record<string, number> = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
};

export function parseRussianDate(
  raw: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!raw) return null;

  const text = raw.trim().toLowerCase();
  if (text === '') return null;

  if (text.includes('сегодня')) {
    return toIsoDate(now);
  }
  if (text.includes('вчера')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return toIsoDate(d);
  }

  // "10 января 2025" or "5 марта"
  const match = text.match(/(\d{1,2})\s+([а-яё]+)(?:\s+(\d{4}))?/i);
  if (!match) return null;

  const day = Number.parseInt(match[1], 10);
  const month = MONTHS[match[2]];
  if (month === undefined || Number.isNaN(day)) return null;

  const year = match[3] ? Number.parseInt(match[3], 10) : now.getFullYear();

  return toIsoDate(new Date(Date.UTC(year, month, day)));
}

function toIsoDate(d: Date): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
}

/** Extract the first integer from a string like "1 234 оценки" -> 1234. */
export function parseCount(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, '');
  return digits === '' ? null : Number.parseInt(digits, 10);
}

/** Parse a rating like "4,7" or "4.7" -> 4.7. */
export function parseRating(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const normalized = raw.replace(',', '.').match(/[\d.]+/);
  if (!normalized) return null;
  const value = Number.parseFloat(normalized[0]);
  return Number.isFinite(value) ? value : null;
}
