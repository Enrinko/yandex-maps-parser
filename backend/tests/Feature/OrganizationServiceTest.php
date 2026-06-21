<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use App\Services\OrganizationService;
use App\Services\Yandex\DTO\ParsedOrganization;
use App\Services\Yandex\ScraperClient;
use App\Services\Yandex\ScraperException;
use App\Services\Yandex\YandexUrlParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_run_parse_stores_stats_and_reviews_on_success(): void
    {
        $organization = Organization::factory()
            ->for(User::factory())
            ->create(['status' => Organization::STATUS_PENDING]);

        $parsed = ParsedOrganization::fromArray([
            'name' => 'Тестовое кафе',
            'rating' => 4.7,
            'ratingsCount' => 900,
            'reviewsCount' => 2,
            'reviews' => [
                ['author' => 'Иван', 'rating' => 5, 'text' => 'Отлично', 'reviewedAt' => '2025-01-10'],
                ['author' => 'Мария', 'rating' => 4, 'text' => 'Хорошо', 'reviewedAt' => '2025-02-15'],
            ],
        ]);

        $scraper = $this->createMock(ScraperClient::class);
        $scraper->method('scrape')->willReturn($parsed);

        $service = new OrganizationService(new YandexUrlParser(), $scraper);
        $service->runParse($organization);

        $organization->refresh();
        $this->assertSame(Organization::STATUS_DONE, $organization->status);
        $this->assertSame('Тестовое кафе', $organization->name);
        $this->assertEquals(4.7, (float) $organization->rating);
        $this->assertSame(900, $organization->ratings_count);
        $this->assertSame(2, $organization->reviews()->count());
        $this->assertNotNull($organization->parsed_at);
    }

    public function test_run_parse_marks_failed_on_scraper_exception(): void
    {
        $organization = Organization::factory()
            ->for(User::factory())
            ->create(['status' => Organization::STATUS_PENDING]);

        $scraper = $this->createMock(ScraperClient::class);
        $scraper->method('scrape')->willThrowException(
            ScraperException::forType(ScraperException::TYPE_CAPTCHA)
        );

        $service = new OrganizationService(new YandexUrlParser(), $scraper);

        $this->expectException(ScraperException::class);

        try {
            $service->runParse($organization);
        } finally {
            $organization->refresh();
            $this->assertSame(Organization::STATUS_FAILED, $organization->status);
            $this->assertStringContainsString('капч', mb_strtolower((string) $organization->error));
        }
    }
}
