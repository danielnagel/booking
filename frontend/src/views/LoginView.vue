<script setup>
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth';
import FormField from '../components/FormField.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({
  username: '',
  password: '',
});

const errorMessage = ref('');
const isSubmitting = ref(false);

async function handleSubmit() {
  errorMessage.value = '';
  isSubmitting.value = true;
  try {
    await authStore.login(form.username, form.password);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    router.push(redirect);
  } catch {
    errorMessage.value = t('login.error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="flex flex-col items-center px-4 py-10">
    <h1 class="text-2xl font-semibold mb-6">
      {{ t('login.title') }}
    </h1>

    <form
      class="w-full max-w-sm flex flex-col gap-4"
      @submit.prevent="handleSubmit"
    >
      <FormField
        id="username"
        v-model="form.username"
        :label="t('login.username')"
        type="text"
        required
      />
      <FormField
        id="password"
        v-model="form.password"
        :label="t('login.password')"
        type="password"
        required
      />

      <p
        v-if="errorMessage"
        class="text-red-600 text-sm"
      >
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="bg-primary text-secondary rounded px-4 py-2 disabled:opacity-50"
        :disabled="isSubmitting"
      >
        {{ t('login.submit') }}
      </button>
    </form>

    <div class="mt-6 flex flex-col items-center gap-2 text-sm">
      <router-link
        to="/registrieren"
        class="underline"
      >
        {{ t('login.noAccount') }}
      </router-link>
      <router-link
        to="/passwort-zuruecksetzen"
        class="underline"
      >
        {{ t('login.forgotPassword') }}
      </router-link>
    </div>
  </main>
</template>
