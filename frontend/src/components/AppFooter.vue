<script setup>
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth';

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

    <button
      v-if="route.name === 'overview'"
      type="button"
      class="text-xs text-primary/60 hover:underline"
      @click="handleLogout"
    >
      Logout
    </button>
  </footer>
</template>
