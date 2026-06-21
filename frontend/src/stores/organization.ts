import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { organizationApi } from '@/api';
import type { Organization, PaginationMeta, Review } from '@/api/types';

const POLL_INTERVAL_MS = 3000;

export const useOrganizationStore = defineStore('organization', () => {
  const organization = ref<Organization | null>(null);
  const reviews = ref<Review[]>([]);
  const meta = ref<PaginationMeta | null>(null);

  const loading = ref(false);
  const reviewsLoading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);
  const validationError = ref<string | null>(null);

  let pollTimer: ReturnType<typeof setTimeout> | null = null;

  const isParsing = computed(
    () => organization.value?.status === 'pending' || organization.value?.status === 'parsing',
  );
  const isDone = computed(() => organization.value?.status === 'done');

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      organization.value = await organizationApi.get();
      if (isParsing.value) {
        startPolling();
      } else if (isDone.value) {
        await loadReviews(1);
      }
    } catch (e) {
      error.value = extractError(e, 'Не удалось загрузить данные.');
    } finally {
      loading.value = false;
    }
  }

  async function save(url: string): Promise<boolean> {
    saving.value = true;
    error.value = null;
    validationError.value = null;
    try {
      organization.value = await organizationApi.save(url);
      reviews.value = [];
      meta.value = null;
      startPolling();
      return true;
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
      if (err?.response?.status === 422) {
        validationError.value = err.response.data?.errors?.url?.[0] ?? 'Некорректная ссылка.';
      } else {
        error.value = extractError(e, 'Не удалось сохранить ссылку.');
      }
      return false;
    } finally {
      saving.value = false;
    }
  }

  async function refresh(): Promise<void> {
    error.value = null;
    try {
      organization.value = await organizationApi.refresh();
      startPolling();
    } catch (e) {
      error.value = extractError(e, 'Не удалось обновить отзывы.');
    }
  }

  async function loadReviews(page: number): Promise<void> {
    reviewsLoading.value = true;
    try {
      const res = await organizationApi.reviews(page);
      reviews.value = res.data;
      meta.value = res.meta;
    } catch (e) {
      error.value = extractError(e, 'Не удалось загрузить отзывы.');
    } finally {
      reviewsLoading.value = false;
    }
  }

  function startPolling(): void {
    stopPolling();
    const tick = async (): Promise<void> => {
      try {
        const status = await organizationApi.status();
        if (organization.value && status.status) {
          organization.value = {
            ...organization.value,
            status: status.status,
            error: status.error ?? null,
            rating: status.counts?.rating ?? organization.value.rating,
            ratings_count: status.counts?.ratings_count ?? organization.value.ratings_count,
            reviews_count: status.counts?.reviews_count ?? organization.value.reviews_count,
          };
        }
        if (status.status === 'done') {
          stopPolling();
          await loadReviews(1);
        } else if (status.status === 'failed') {
          stopPolling();
        } else {
          pollTimer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      } catch {
        pollTimer = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };
    pollTimer = setTimeout(tick, POLL_INTERVAL_MS);
  }

  function stopPolling(): void {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  }

  function reset(): void {
    stopPolling();
    organization.value = null;
    reviews.value = [];
    meta.value = null;
    error.value = null;
    validationError.value = null;
  }

  return {
    organization,
    reviews,
    meta,
    loading,
    reviewsLoading,
    saving,
    error,
    validationError,
    isParsing,
    isDone,
    load,
    save,
    refresh,
    loadReviews,
    stopPolling,
    reset,
  };
});

function extractError(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message ?? fallback;
}
