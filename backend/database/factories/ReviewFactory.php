<?php

namespace Database\Factories;

use App\Models\Organization;
use App\Models\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'external_id' => $this->faker->uuid(),
            'author' => $this->faker->name(),
            'rating' => $this->faker->numberBetween(1, 5),
            'text' => $this->faker->sentence(12),
            'reviewed_at' => $this->faker->dateTimeBetween('-2 years'),
        ];
    }
}
