<script setup lang="ts">
import type { Organization } from '@/api/types';
import StarRating from './StarRating.vue';

defineProps<{ organization: Organization }>();
</script>

<template>
  <div class="bg-white rounded-lg border border-slate-200 p-5">
    <h1 class="text-xl font-semibold text-slate-900">
      {{ organization.name ?? 'Организация' }}
    </h1>
    <div class="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2">
      <div class="flex items-center gap-2">
        <span class="text-3xl font-bold text-slate-900">
          {{ organization.rating?.toFixed(1) ?? '—' }}
        </span>
        <StarRating :rating="organization.rating" />
      </div>
      <div class="text-sm text-slate-500">
        <span class="font-medium text-slate-700">{{ organization.ratings_count ?? '—' }}</span>
        оценок
      </div>
      <div class="text-sm text-slate-500">
        <span class="font-medium text-slate-700">{{ organization.reviews_count ?? '—' }}</span>
        отзывов
      </div>
    </div>
  </div>
</template>
