<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasFactory;

    /** Parsing lifecycle statuses. */
    public const STATUS_PENDING = 'pending';
    public const STATUS_PARSING = 'parsing';
    public const STATUS_DONE = 'done';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'user_id',
        'url',
        'yandex_id',
        'name',
        'rating',
        'ratings_count',
        'reviews_count',
        'status',
        'error',
        'parsed_at',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'decimal:1',
            'ratings_count' => 'integer',
            'reviews_count' => 'integer',
            'parsed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
