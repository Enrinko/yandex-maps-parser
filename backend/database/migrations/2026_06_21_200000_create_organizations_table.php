<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('url', 2048);
            $table->string('yandex_id')->index();
            $table->string('name')->nullable();
            $table->decimal('rating', 2, 1)->nullable();        // average rating
            $table->unsignedInteger('ratings_count')->nullable(); // number of ratings
            $table->unsignedInteger('reviews_count')->nullable(); // number of reviews
            $table->enum('status', ['pending', 'parsing', 'done', 'failed'])->default('pending');
            $table->text('error')->nullable();
            $table->timestamp('parsed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
