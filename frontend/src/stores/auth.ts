import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authApi } from '@/api';
import type { User } from '@/api/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);

  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      user.value = await authApi.login(email, password);
      return true;
    } catch (e: unknown) {
      error.value = extractError(e, 'Не удалось войти. Проверьте данные.');
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      user.value = null;
    }
  }

  /** Restore session on app start (cookie may already be valid). */
  async function fetchUser(): Promise<void> {
    try {
      user.value = await authApi.me();
    } catch {
      user.value = null;
    } finally {
      initialized.value = true;
    }
  }

  return { user, loading, error, initialized, login, logout, fetchUser };
});

function extractError(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
  const data = err?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (first?.[0]) return first[0];
  }
  return data?.message ?? fallback;
}
