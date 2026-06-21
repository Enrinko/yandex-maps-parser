<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ currentPage: number; lastPage: number }>();
const emit = defineEmits<{ (e: 'change', page: number): void }>();

const canPrev = computed(() => props.currentPage > 1);
const canNext = computed(() => props.currentPage < props.lastPage);

function go(page: number): void {
  if (page >= 1 && page <= props.lastPage && page !== props.currentPage) {
    emit('change', page);
  }
}
</script>

<template>
  <nav v-if="lastPage > 1" class="flex items-center justify-center gap-2 text-sm">
    <button
      class="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
      :disabled="!canPrev"
      @click="go(currentPage - 1)"
    >
      Назад
    </button>
    <span class="px-3 text-slate-600">Страница {{ currentPage }} из {{ lastPage }}</span>
    <button
      class="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
      :disabled="!canNext"
      @click="go(currentPage + 1)"
    >
      Вперёд
    </button>
  </nav>
</template>
