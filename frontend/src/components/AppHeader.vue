<script setup>
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth';
import LanguageSwitch from './LanguageSwitch.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>

<template>
  <header class="hidden md:flex items-center px-6 py-4 bg-secondary text-primary">
    <router-link
      to="/"
      class="flex items-center gap-3"
    >
      <img
        src="/logo.svg"
        alt="Logo"
        class="h-10 w-10"
      >
      <span class="text-lg font-semibold">Booking</span>
    </router-link>

    <LanguageSwitch class="ml-4" />

    <button
      v-if="route.name === 'overview'"
      type="button"
      class="ml-4 text-xs text-primary/60 hover:underline"
      @click="handleLogout"
    >
      {{ t('app.logout') }}
    </button>
  </header>
</template>
