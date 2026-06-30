<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useOrganizationStore } from '@/stores/organization';
import Spinner from '@/components/Spinner.vue';

const store = useOrganizationStore();
const router = useRouter();

const url = ref('');

onMounted(async () => {
  await store.load();
  if (store.organization) {
    url.value = store.organization.url;
  }
});

onUnmounted(() => store.stopPolling());

async function submit(): Promise<void> {
  const ok = await store.save(url.value);
  if (ok) {
    // Reviews appear once parsing finishes; nudge the user toward them.
  }
}

function goToReviews(): void {
  router.push({ name: 'reviews' });
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
    <header>
      <h1 class="text-2xl font-semibold text-slate-900">Настройки</h1>
      <p class="text-sm text-slate-500 mt-1">
        Вставьте ссылку на карточку организации в Яндекс.Картах, чтобы загрузить её отзывы.
      </p>
    </header>

    <form class="bg-white rounded-lg border border-slate-200 p-5 space-y-4" @submit.prevent="submit">
      <label class="block">
        <span class="text-sm font-medium text-slate-700">Ссылка на организацию</span>
        <input
          v-model="url"
          type="url"
          required
          placeholder="https://yandex.ru/maps/org/.../1234567890"
          class="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </label>

      <p v-if="store.validationError" class="text-sm text-red-600">
        {{ store.validationError }}
      </p>
      <p v-if="store.error" class="text-sm text-red-600">{{ store.error }}</p>

      <button
        type="submit"
        :disabled="store.saving"
        class="inline-flex items-center gap-2 rounded bg-red-600 text-white px-5 py-2 font-medium hover:bg-red-700 disabled:opacity-60"
      >
        <Spinner v-if="store.saving" :size="18" />
        <span>Сохранить и загрузить отзывы</span>
      </button>
    </form>

    <!-- Current parsing status -->
    <section v-if="store.organization" class="bg-white rounded-lg border border-slate-200 p-5">
      <h2 class="text-sm font-medium text-slate-700 mb-3">Статус загрузки</h2>

      <div v-if="store.isParsing" class="flex items-center gap-3 text-slate-600">
        <Spinner :size="20" />
        <span>Загружаем отзывы из Яндекс.Карт… Это может занять несколько минут.</span>
      </div>

      <div
        v-else-if="store.organization.status === 'failed'"
        class="rounded bg-red-50 text-red-700 text-sm px-3 py-2"
      >
        {{ store.organization.error ?? 'Не удалось загрузить отзывы.' }}
        <button class="ml-2 underline" @click="store.refresh()">Повторить</button>
      </div>

      <div v-else-if="store.isDone" class="space-y-3">
        <p class="text-sm text-green-700">
          Готово: загружено {{ store.organization.reviews_count ?? 0 }} отзывов,
          средний рейтинг {{ store.organization.rating?.toFixed(1) ?? '—' }}.
        </p>
        <div class="flex gap-3">
          <button
            class="rounded bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700"
            @click="goToReviews"
          >
            Посмотреть отзывы
          </button>
          <button
            class="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            @click="store.refresh()"
          >
            Обновить
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
