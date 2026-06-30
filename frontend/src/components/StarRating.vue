<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ rating: number | null; max?: number }>(), {
  max: 5,
});

const filled = computed(() => Math.round(props.rating ?? 0));
</script>

<template>
  <div class="inline-flex items-center gap-0.5" :aria-label="`Оценка ${rating ?? 0}`">
    <span
      v-for="i in max"
      :key="i"
      :class="i <= filled ? 'text-amber-400' : 'text-slate-300'"
      aria-hidden="true"
    >★</span>
  </div>
</template>
