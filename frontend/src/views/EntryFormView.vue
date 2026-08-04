<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { apiClient } from '../api/client';
import BookingForm from '../components/BookingForm.vue';

const route = useRoute();
const router = useRouter();

const id = computed(() => route.params.id ?? null);
const isEditMode = computed(() => !!id.value);

const initialData = ref({});
const errorMessage = ref('');
const isLoading = ref(false);
const formRef = ref(null);

async function loadEntry() {
  if (!isEditMode.value) return;
  isLoading.value = true;
  try {
    const data = await apiClient.get(`/bookings/${id.value}`);
    initialData.value = data ?? {};
  } catch {
    errorMessage.value = 'Eintrag konnte nicht geladen werden.';
  } finally {
    isLoading.value = false;
  }
}

async function handleSubmit({ data, andContinue }) {
  errorMessage.value = '';
  try {
    if (isEditMode.value) {
      await apiClient.put(`/bookings/${id.value}`, data);
    } else {
      await apiClient.post('/bookings', data);
    }

    if (andContinue) {
      formRef.value?.resetForm();
    } else {
      router.push('/');
    }
  } catch {
    errorMessage.value = 'Eintrag konnte nicht gespeichert werden.';
  }
}

onMounted(loadEntry);
</script>

<template>
  <main class="flex flex-col gap-6 px-4 py-8 max-w-2xl mx-auto w-full">
    <h1 class="text-2xl font-semibold">
      {{ isEditMode ? 'Eintrag bearbeiten' : 'Neuer Eintrag' }}
    </h1>

    <p
      v-if="errorMessage"
      class="text-red-600 text-sm"
    >
      {{ errorMessage }}
    </p>
    <p
      v-if="isLoading"
      class="text-sm text-primary/60"
    >
      Lädt...
    </p>

    <BookingForm
      v-if="!isEditMode || !isLoading"
      ref="formRef"
      :initial-data="initialData"
      :is-edit-mode="isEditMode"
      @submit="handleSubmit"
    />
  </main>
</template>
