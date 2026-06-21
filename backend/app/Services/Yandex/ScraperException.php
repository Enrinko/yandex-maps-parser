<?php

namespace App\Services\Yandex;

use RuntimeException;

/**
 * Raised when the scraper service cannot return usable review data. The {@see $type}
 * maps to a human-readable status surfaced in the UI.
 */
class ScraperException extends RuntimeException
{
    public const TYPE_CAPTCHA = 'captcha';
    public const TYPE_MARKUP_CHANGED = 'markup_changed';
    public const TYPE_UNAVAILABLE = 'unavailable';
    public const TYPE_EMPTY = 'empty';

    public function __construct(
        public readonly string $type,
        string $message,
    ) {
        parent::__construct($message);
    }

    public static function forType(string $type): self
    {
        return new self($type, match ($type) {
            self::TYPE_CAPTCHA => 'Яндекс показал капчу. Попробуйте позже или настройте прокси (SCRAPER_PROXY).',
            self::TYPE_MARKUP_CHANGED => 'Не удалось разобрать страницу: вероятно, изменилась вёрстка Яндекс.Карт.',
            self::TYPE_EMPTY => 'Отзывы не найдены для этой организации.',
            default => 'Сервис парсинга временно недоступен. Попробуйте позже.',
        });
    }
}
