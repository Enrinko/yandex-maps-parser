<script setup lang="ts">
import { computed } from 'vue';
import type { Review } from '@/api/types';
import StarRating from './StarRating.vue';

const props = defineProps<{ review: Review }>();

const formattedDate = computed(() => {
  if (!props.review.reviewed_at) return '';
  return new Date(props.review.reviewed_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});
</script>

<template>
  <article class="bg-white rounded-lg border border-slate-200 p-4">
    <header class="flex items-start justify-between gap-4">
      <div>
        <p class="font-medium text-slate-900">{{ review.author ?? 'Аноним' }}</p>
        <p v-if="formattedDate" class="text-xs text-slate-400">{{ formattedDate }}</p>
      </div>
      <StarRating :rating="review.rating" />
    </header>
    <p v-if="review.text" class="mt-3 text-sm text-slate-700 whitespace-pre-line">
      {{ review.text }}
    </p>
  </article>
</template>
