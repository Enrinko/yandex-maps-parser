<?php

namespace App\Services\Yandex;

use App\Services\Yandex\DTO\ParsedOrganization;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin HTTP client over the Node + Playwright scraper microservice.
 */
class ScraperClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly ?string $proxy = null,
        private readonly int $timeout = 240,
    ) {
    }

    /**
     * Scrape a single organization reviews page and map the response to a DTO.
     *
     * @throws ScraperException
     */
    public function scrape(string $url): ParsedOrganization
    {
        try {
            $payload = array_filter([
                'url' => $url,
                'proxy' => $this->proxy,
            ]);

            $response = Http::timeout($this->timeout)
                ->connectTimeout(15)
                ->acceptJson()
                ->post(rtrim($this->baseUrl, '/').'/scrape', $payload);
        } catch (ConnectionException $e) {
            Log::warning('Scraper connection failed', ['error' => $e->getMessage()]);
            throw ScraperException::forType(ScraperException::TYPE_UNAVAILABLE);
        }

        if ($response->failed()) {
            $error = (string) $response->json('error', '');

            // The scraper reports recoverable, classified errors with a 4xx/5xx
            // status and a known "error" code in the body.
            if (in_array($error, [
                ScraperException::TYPE_CAPTCHA,
                ScraperException::TYPE_MARKUP_CHANGED,
                ScraperException::TYPE_UNAVAILABLE,
                ScraperException::TYPE_EMPTY,
            ], true)) {
                throw ScraperException::forType($error);
            }

            Log::warning('Scraper returned an error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw ScraperException::forType(ScraperException::TYPE_UNAVAILABLE);
        }

        $data = $response->json();

        if (! is_array($data)) {
            throw ScraperException::forType(ScraperException::TYPE_UNAVAILABLE);
        }

        // A successful response can still carry a classified error code.
        if (! empty($data['error'])) {
            throw ScraperException::forType((string) $data['error']);
        }

        return ParsedOrganization::fromArray($data);
    }
}
