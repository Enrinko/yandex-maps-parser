<?php

namespace App\Jobs;

use App\Models\Organization;
use App\Services\OrganizationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class ParseOrganizationReviewsJob implements ShouldQueue
{
    use Queueable;

    /** Number of attempts before the job is marked failed. */
    public int $tries = 3;

    /** Max execution time (seconds) — scrolling ~600 reviews is slow. */
    public int $timeout = 300;

    public function __construct(public int $organizationId)
    {
    }

    /**
     * Exponential-ish backoff between retries (seconds).
     *
     * @return list<int>
     */
    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function handle(OrganizationService $service): void
    {
        $organization = Organization::find($this->organizationId);

        if ($organization === null) {
            return;
        }

        $service->runParse($organization);
    }

    /**
     * Called when all attempts are exhausted: record the failure on the model.
     */
    public function failed(?Throwable $exception): void
    {
        $organization = Organization::find($this->organizationId);

        if ($organization === null) {
            return;
        }

        app(OrganizationService::class)->markFailed(
            $organization,
            $exception?->getMessage() ?? 'Не удалось получить отзывы.',
        );
    }
}
