<?php

namespace App\Services;

use App\Jobs\ParseOrganizationReviewsJob;
use App\Models\Organization;
use App\Models\User;
use App\Services\Yandex\ScraperClient;
use App\Services\Yandex\ScraperException;
use App\Services\Yandex\YandexUrlParser;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Orchestrates saving an organization URL and (asynchronously) parsing its
 * reviews. All scraping/business logic lives here, keeping controllers thin.
 */
class OrganizationService
{
    public function __construct(
        private readonly YandexUrlParser $urlParser,
        private readonly ScraperClient $scraper,
    ) {
    }

    /**
     * Persist the URL for a user (one active organization per user), reset its
     * parsing state and dispatch the background parse job.
     */
    public function saveUrl(User $user, string $url): Organization
    {
        $organization = Organization::updateOrCreate(
            ['user_id' => $user->id],
            [
                'url' => $url,
                'yandex_id' => $this->urlParser->extractId($url),
                'status' => Organization::STATUS_PENDING,
                'error' => null,
            ],
        );

        $this->dispatchParse($organization);

        return $organization;
    }

    /**
     * Re-run parsing for an existing organization.
     */
    public function refresh(Organization $organization): Organization
    {
        $organization->update([
            'status' => Organization::STATUS_PENDING,
            'error' => null,
        ]);

        $this->dispatchParse($organization);

        return $organization;
    }

    public function dispatchParse(Organization $organization): void
    {
        ParseOrganizationReviewsJob::dispatch($organization->id);
    }

    /**
     * Executed from the queue job: scrape, then replace stats + reviews inside a
     * transaction. Updates status to done/failed accordingly.
     */
    public function runParse(Organization $organization): void
    {
        $organization->update(['status' => Organization::STATUS_PARSING, 'error' => null]);

        try {
            $parsed = $this->scraper->scrape($this->urlParser->reviewsUrl($organization->url));
        } catch (ScraperException $e) {
            $this->markFailed($organization, $e->getMessage());
            throw $e;
        }

        DB::transaction(function () use ($organization, $parsed) {
            $organization->reviews()->delete();

            $rows = [];
            $now = now();
            foreach ($parsed->reviews as $review) {
                $rows[] = [
                    'organization_id' => $organization->id,
                    'external_id' => $review->externalId,
                    'author' => $review->author,
                    'rating' => $review->rating,
                    'text' => $review->text,
                    'reviewed_at' => $review->reviewedAt,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (array_chunk($rows, 500) as $chunk) {
                $organization->reviews()->insert($chunk);
            }

            $organization->update([
                'name' => $parsed->name,
                'rating' => $parsed->rating,
                'ratings_count' => $parsed->ratingsCount,
                'reviews_count' => $parsed->reviewsCount ?? count($parsed->reviews),
                'status' => Organization::STATUS_DONE,
                'error' => null,
                'parsed_at' => now(),
            ]);
        });
    }

    public function markFailed(Organization $organization, string $error): void
    {
        try {
            $organization->update([
                'status' => Organization::STATUS_FAILED,
                'error' => $error,
            ]);
        } catch (Throwable) {
            // Swallow secondary failures while recording the primary error.
        }
    }
}
