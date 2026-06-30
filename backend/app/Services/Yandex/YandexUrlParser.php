<?php

namespace App\Services\Yandex;

/**
 * Validates and normalises Yandex.Maps organization-card URLs and extracts the
 * numeric organization id from them.
 *
 * Recognised shape: https://yandex.<tld>/maps/org/<slug>/<id>[/...]
 * (the <slug> segment is optional in some short links).
 */
class YandexUrlParser
{
    /**
     * Matches the org id inside a Yandex.Maps URL. Allows yandex.ru / .com /
     * .com.tr / .by / .kz etc., optional "maps.yandex" sub-host and an
     * optional path prefix before /org/.
     */
    private const PATTERN = '#^https?://(?:[a-z0-9-]+\.)*yandex\.[a-z.]{2,6}/(?:maps|maps/[\d.]+)?/?.*?org/(?:[^/]+/)?(\d+)#i';

    public function isValid(string $url): bool
    {
        return $this->extractId($url) !== null;
    }

    /**
     * Extract the organization id, or null when the URL is not a valid
     * Yandex.Maps organization card.
     */
    public function extractId(string $url): ?string
    {
        $url = trim($url);

        if ($url === '' || ! preg_match(self::PATTERN, $url, $matches)) {
            return null;
        }

        return $matches[1];
    }

    /**
     * Build the canonical reviews URL for a given org card URL. The scraper
     * navigates here directly.
     */
    public function reviewsUrl(string $url): string
    {
        $id = $this->extractId($url);

        return "https://yandex.ru/maps/org/{$id}/reviews/";
    }
}
