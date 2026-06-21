<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useOrganizationStore } from '@/stores/organization';
import StatsHeader from '@/components/StatsHeader.vue';
import ReviewCard from '@/components/ReviewCard.vue';
import Pagination from '@/components/Pagination.vue';
import Spinner from '@/components/Spinner.vue';

const store = useOrganizationStore();

onMounted(async () => {
  if (!store.organization) {
    await store.load();
  } else if (store.isDone && store.reviews.length === 0) {
    await store.loadReviews(1);
  }
});

onUnmounted(() => store.stopPolling());

function changePage(page: number): void {
  store.loadReviews(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8 space-y-5">
    <div v-if="store.loading" class="flex justify-center py-16 text-slate-400">
      <Spinner :size="28" />
    </div>

    <template v-else-if="!store.organization">
      <p class="text-center text-slate-500 py-16">
        Организация ещё не настроена. Перейдите в «Настройки».
      </p>
    </template>

    <template v-else-if="store.isParsing">
      <div class="flex flex-col items-center gap-3 py-16 text-slate-500">
        <Spinner :size="28" />
        <p>Отзывы загружаются…</p>
      </div>
    </template>

    <template v-else-if="store.organization.status === 'failed'">
      <div class="rounded bg-red-50 text-red-700 text-sm px-4 py-3">
        {{ store.organization.error ?? 'Не удалось загрузить отзывы.' }}
      </div>
    </template>

    <template v-else>
      <StatsHeader :organization="store.organization" />

      <div v-if="store.error" class="rounded bg-red-50 text-red-700 text-sm px-4 py-2">
        {{ store.error }}
      </div>

      <div class="relative space-y-3">
        <div
          v-if="store.reviewsLoading"
          class="absolute inset-0 bg-white/60 flex justify-center pt-10 z-10"
        >
          <Spinner :size="24" />
        </div>

        <p v-if="!store.reviewsLoading && store.reviews.length === 0" class="text-center text-slate-500 py-10">
          Отзывов нет.
        </p>

        <ReviewCard v-for="review in store.reviews" :key="review.id" :review="review" />
      </div>

      <Pagination
        v-if="store.meta"
        :current-page="store.meta.current_page"
        :last-page="store.meta.last_page"
        @change="changePage"
      />
    </template>
  </div>
</template>
