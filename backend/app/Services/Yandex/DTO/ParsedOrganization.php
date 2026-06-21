<?php

namespace App\Services\Yandex\DTO;

/**
 * Aggregated parse result for an organization: stats + all reviews.
 */
final readonly class ParsedOrganization
{
    /**
     * @param list<ParsedReview> $reviews
     */
    public function __construct(
        public ?string $name,
        public ?float $rating,
        public ?int $ratingsCount,
        public ?int $reviewsCount,
        public array $reviews,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $reviews = [];
        foreach ($data['reviews'] ?? [] as $review) {
            $reviews[] = ParsedReview::fromArray($review);
        }

        return new self(
            name: isset($data['name']) ? (string) $data['name'] : null,
            rating: isset($data['rating']) ? (float) $data['rating'] : null,
            ratingsCount: isset($data['ratingsCount']) ? (int) $data['ratingsCount'] : null,
            reviewsCount: isset($data['reviewsCount']) ? (int) $data['reviewsCount'] : null,
            reviews: $reviews,
        );
    }
}
