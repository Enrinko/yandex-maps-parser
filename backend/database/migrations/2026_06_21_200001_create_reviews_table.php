<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('external_id')->nullable(); // for de-duplication
            $table->string('author')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->text('text')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'reviewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
