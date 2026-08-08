<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { apiClient } from '../api/client';
import BookingForm from '../components/BookingForm.vue';

const { t } = useI18n();
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
    errorMessage.value = t('entryForm.loadError');
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
    errorMessage.value = t('entryForm.saveError');
  }
}

onMounted(loadEntry);
</script>

<template>
  <main class="flex flex-col gap-6 px-4 py-8 max-w-2xl mx-auto w-full">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">
        {{ isEditMode ? t('entryForm.editTitle') : t('entryForm.newTitle') }}
      </h1>
      <button
        type="button"
        class="flex items-center justify-center h-9 w-9 rounded-full border border-primary/30 text-lg leading-none hover:bg-primary/10"
        :aria-label="t('entryForm.cancel')"
        @click="router.push('/')"
      >
        &times;
      </button>
    </div>

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
      {{ t('entryForm.loading') }}
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
