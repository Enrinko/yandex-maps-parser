<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useOrganizationStore } from '@/stores/organization';

const auth = useAuthStore();
const orgStore = useOrganizationStore();
const router = useRouter();

const isAuthed = computed(() => !!auth.user);

async function handleLogout(): Promise<void> {
  await auth.logout();
  orgStore.reset();
  await router.push({ name: 'login' });
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header
      v-if="isAuthed"
      class="bg-white border-b border-slate-200 sticky top-0 z-10"
    >
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <nav class="flex items-center gap-6 text-sm font-medium">
          <RouterLink
            :to="{ name: 'settings' }"
            class="text-slate-600 hover:text-slate-900"
            active-class="text-red-600"
          >
            Настройки
          </RouterLink>
          <RouterLink
            :to="{ name: 'reviews' }"
            class="text-slate-600 hover:text-slate-900"
            active-class="text-red-600"
          >
            Отзывы
          </RouterLink>
        </nav>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-slate-500">{{ auth.user?.email }}</span>
          <button
            class="text-slate-600 hover:text-red-600"
            @click="handleLogout"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
