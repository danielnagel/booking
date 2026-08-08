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
  <footer class="md:hidden flex flex-col items-center gap-2 px-6 py-4 bg-secondary text-primary">
    <img
      src="/favicon.svg"
      alt="Logo"
      class="h-10 w-10"
    >
    <span class="text-sm">Booking</span>

    <LanguageSwitch />

    <button
      v-if="route.name === 'overview'"
      type="button"
      class="text-xs text-primary/60 hover:underline"
      @click="handleLogout"
    >
      {{ t('app.logout') }}
    </button>
  </footer>
</template>
