<?php

namespace Database\Factories;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Organization>
 */
class OrganizationFactory extends Factory
{
    protected $model = Organization::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'url' => 'https://yandex.ru/maps/org/'.$this->faker->numerify('##########'),
            'yandex_id' => $this->faker->numerify('##########'),
            'name' => $this->faker->company(),
            'rating' => $this->faker->randomFloat(1, 1, 5),
            'ratings_count' => $this->faker->numberBetween(0, 1000),
            'reviews_count' => $this->faker->numberBetween(0, 600),
            'status' => Organization::STATUS_DONE,
            'error' => null,
            'parsed_at' => now(),
        ];
    }
}
