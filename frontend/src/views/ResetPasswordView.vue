<script setup>
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth';
import { translateError } from '../i18n/errors';
import FormField from '../components/FormField.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  resetCode: '',
  newPassword: '',
});

const errorMessage = ref('');
const isSubmitting = ref(false);

async function handleSubmit() {
  errorMessage.value = '';
  isSubmitting.value = true;
  try {
    await authStore.resetPassword(form.resetCode, form.newPassword);
    router.push('/login');
  } catch (err) {
    errorMessage.value = translateError(err.message);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="flex flex-col items-center px-4 py-10">
    <h1 class="text-2xl font-semibold mb-6">
      {{ t('resetPassword.title') }}
    </h1>

    <form
      class="w-full max-w-sm flex flex-col gap-4"
      @submit.prevent="handleSubmit"
    >
      <FormField
        id="reset-code"
        v-model="form.resetCode"
        :label="t('resetPassword.resetCode')"
        type="text"
        required
      />
      <FormField
        id="new-password"
        v-model="form.newPassword"
        :label="t('resetPassword.newPassword')"
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
        {{ t('resetPassword.submit') }}
      </button>
    </form>

    <div class="mt-6 text-sm">
      <router-link
        to="/login"
        class="underline"
      >
        {{ t('resetPassword.backToLogin') }}
      </router-link>
    </div>
  </main>
</template>
