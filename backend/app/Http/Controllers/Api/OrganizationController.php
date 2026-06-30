<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveOrganizationRequest;
use App\Http\Resources\OrganizationResource;
use App\Http\Resources\ReviewResource;
use App\Models\Organization;
use App\Services\OrganizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrganizationController extends Controller
{
    public function __construct(private readonly OrganizationService $service)
    {
    }

    /** Current organization with stats + status, or null. */
    public function show(Request $request): JsonResponse
    {
        $organization = $request->user()->organization;

        return response()->json([
            'organization' => $organization
                ? new OrganizationResource($organization)
                : null,
        ]);
    }

    /** Save (create/replace) the URL and kick off parsing. */
    public function store(SaveOrganizationRequest $request): JsonResponse
    {
        $organization = $this->service->saveUrl(
            $request->user(),
            $request->validated('url'),
        );

        return response()->json([
            'organization' => new OrganizationResource($organization),
        ], 201);
    }

    /** Re-run parsing for the current organization. */
    public function refresh(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        $this->service->refresh($organization);

        return response()->json([
            'organization' => new OrganizationResource($organization->fresh()),
        ]);
    }

    /** Lightweight polling endpoint. */
    public function status(Request $request): JsonResponse
    {
        $organization = $request->user()->organization;

        if ($organization === null) {
            return response()->json(['status' => null]);
        }

        return response()->json([
            'status' => $organization->status,
            'error' => $organization->error,
            'counts' => [
                'rating' => $organization->rating !== null ? (float) $organization->rating : null,
                'ratings_count' => $organization->ratings_count,
                'reviews_count' => $organization->reviews_count,
            ],
        ]);
    }

    /** Paginated reviews from the database. */
    public function reviews(Request $request): AnonymousResourceCollection
    {
        $organization = $this->resolveOrganization($request);

        $perPage = (int) $request->integer('per_page', 50);
        $perPage = max(1, min($perPage, 100));

        $reviews = $organization->reviews()
            ->orderByDesc('reviewed_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        return ReviewResource::collection($reviews);
    }

    private function resolveOrganization(Request $request): Organization
    {
        return $request->user()->organization
            ?? abort(404, 'Организация не настроена.');
    }
}
