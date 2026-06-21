<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Spinner from '@/components/Spinner.vue';

const auth = useAuthStore();
const router = useRouter();

const email = ref('admin@example.com');
const password = ref('password');

async function submit(): Promise<void> {
  const ok = await auth.login(email.value, password.value);
  if (ok) {
    await router.push({ name: 'settings' });
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <form
      class="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-6 space-y-4"
      @submit.prevent="submit"
    >
      <h1 class="text-lg font-semibold text-slate-900">Вход</h1>

      <div
        v-if="auth.error"
        class="rounded bg-red-50 text-red-700 text-sm px-3 py-2"
      >
        {{ auth.error }}
      </div>

      <label class="block">
        <span class="text-sm text-slate-600">Email</span>
        <input
          v-model="email"
          type="email"
          required
          autocomplete="username"
          class="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </label>

      <label class="block">
        <span class="text-sm text-slate-600">Пароль</span>
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </label>

      <button
        type="submit"
        :disabled="auth.loading"
        class="w-full flex items-center justify-center gap-2 rounded bg-red-600 text-white py-2 font-medium hover:bg-red-700 disabled:opacity-60"
      >
        <Spinner v-if="auth.loading" :size="18" />
        <span>Войти</span>
      </button>
    </form>
  </div>
</template>
