<?php

namespace App\Http\Resources;

use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Organization
 */
class OrganizationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url,
            'name' => $this->name,
            'rating' => $this->rating !== null ? (float) $this->rating : null,
            'ratings_count' => $this->ratings_count,
            'reviews_count' => $this->reviews_count,
            'status' => $this->status,
            'error' => $this->error,
            'parsed_at' => $this->parsed_at?->toIso8601String(),
        ];
    }
}
