<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth';
import FormField from '../components/FormField.vue';

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  inviteCode: '',
  username: '',
  password: '',
});

const errorMessage = ref('');
const isSubmitting = ref(false);

async function handleSubmit() {
  errorMessage.value = '';
  isSubmitting.value = true;
  try {
    await authStore.register(form.inviteCode, form.username, form.password);
    router.push('/login');
  } catch (err) {
    errorMessage.value = err.message || 'Registrierung fehlgeschlagen. Invite-Code oder Benutzername prüfen.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="flex flex-col items-center px-4 py-10">
    <h1 class="text-2xl font-semibold mb-6">
      Registrieren
    </h1>

    <form
      class="w-full max-w-sm flex flex-col gap-4"
      @submit.prevent="handleSubmit"
    >
      <FormField
        id="invite-code"
        v-model="form.inviteCode"
        label="Invite-Code"
        type="text"
        required
      />
      <FormField
        id="username"
        v-model="form.username"
        label="Benutzername"
        type="text"
        required
      />
      <FormField
        id="password"
        v-model="form.password"
        label="Passwort"
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
        Registrieren
      </button>
    </form>

    <div class="mt-6 text-sm">
      <router-link
        to="/login"
        class="underline"
      >
        Zurück zum Login
      </router-link>
    </div>
  </main>
</template>
