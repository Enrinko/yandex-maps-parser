<?php

namespace App\Services\Yandex\DTO;

use Carbon\CarbonImmutable;

/**
 * A single review as returned by the scraper service.
 */
final readonly class ParsedReview
{
    public function __construct(
        public ?string $externalId,
        public ?string $author,
        public ?int $rating,
        public ?string $text,
        public ?CarbonImmutable $reviewedAt,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $rating = isset($data['rating']) ? (int) $data['rating'] : null;

        return new self(
            externalId: isset($data['externalId']) ? (string) $data['externalId'] : null,
            author: isset($data['author']) ? (string) $data['author'] : null,
            rating: $rating !== null && $rating > 0 ? $rating : null,
            text: isset($data['text']) ? (string) $data['text'] : null,
            reviewedAt: ! empty($data['reviewedAt'])
                ? CarbonImmutable::parse($data['reviewedAt'])
                : null,
        );
    }
}
