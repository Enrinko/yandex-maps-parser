<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);
    }

    /**
     * Simulate a request coming from the SPA frontend (so Sanctum applies the
     * stateful session middleware).
     */
    private function fromFrontend(): self
    {
        return $this->withHeader('Origin', 'http://localhost');
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $this->makeUser();

        $response = $this->fromFrontend()->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $response->assertOk()->assertJsonPath('user.email', 'admin@example.com');
        $this->assertAuthenticated();
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $this->makeUser();

        $this->fromFrontend()->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong',
        ])->assertStatus(422);

        $this->assertGuest();
    }

    public function test_login_validation_errors(): void
    {
        $this->postJson('/api/login', ['email' => 'not-an-email'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_protected_route_requires_authentication(): void
    {
        $this->getJson('/api/organization')->assertStatus(401);
    }

    public function test_authenticated_user_can_access_protected_route(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->getJson('/api/organization')
            ->assertOk()
            ->assertJsonPath('organization', null);
    }

    public function test_user_can_logout(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->fromFrontend()
            ->postJson('/api/logout')
            ->assertOk();
    }
}
