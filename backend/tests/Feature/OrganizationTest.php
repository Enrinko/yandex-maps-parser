<?php

namespace Tests\Feature;

use App\Jobs\ParseOrganizationReviewsJob;
use App\Models\Organization;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class OrganizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_saving_invalid_url_returns_422(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/organization', ['url' => 'https://google.com/foo'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    public function test_saving_valid_url_dispatches_job_and_creates_organization(): void
    {
        Queue::fake();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/organization', [
                'url' => 'https://yandex.ru/maps/org/cafe/1234567890',
            ])
            ->assertStatus(201)
            ->assertJsonPath('organization.status', Organization::STATUS_PENDING);

        $this->assertDatabaseHas('organizations', [
            'user_id' => $user->id,
            'yandex_id' => '1234567890',
            'status' => Organization::STATUS_PENDING,
        ]);

        Queue::assertPushed(ParseOrganizationReviewsJob::class);
    }

    public function test_saving_url_again_replaces_the_single_organization(): void
    {
        Queue::fake();
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/organization', [
            'url' => 'https://yandex.ru/maps/org/a/111',
        ])->assertStatus(201);

        $this->actingAs($user)->postJson('/api/organization', [
            'url' => 'https://yandex.ru/maps/org/b/222',
        ])->assertStatus(201);

        $this->assertSame(1, Organization::where('user_id', $user->id)->count());
        $this->assertDatabaseHas('organizations', ['user_id' => $user->id, 'yandex_id' => '222']);
    }

    public function test_reviews_are_paginated(): void
    {
        $user = User::factory()->create();
        $organization = Organization::factory()->for($user)->create();
        Review::factory()->count(120)->for($organization)->create();

        $response = $this->actingAs($user)
            ->getJson('/api/organization/reviews?per_page=50')
            ->assertOk();

        $response->assertJsonCount(50, 'data');
        $response->assertJsonPath('meta.total', 120);
        $response->assertJsonPath('meta.per_page', 50);
    }

    public function test_status_endpoint_returns_counts(): void
    {
        $user = User::factory()->create();
        Organization::factory()->for($user)->create([
            'status' => Organization::STATUS_DONE,
            'rating' => 4.5,
            'ratings_count' => 800,
            'reviews_count' => 600,
        ]);

        $this->actingAs($user)
            ->getJson('/api/organization/status')
            ->assertOk()
            ->assertJsonPath('status', Organization::STATUS_DONE)
            ->assertJsonPath('counts.reviews_count', 600);
    }
}
