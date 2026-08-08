<script setup>
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { apiClient } from '../api/client';
import { useStatusOptions } from '../constants/bookingStatus';
import FormField from './FormField.vue';

const props = defineProps({
  initialData: { type: Object, default: () => ({}) },
  isEditMode: { type: Boolean, default: false },
});

const emit = defineEmits(['submit']);

const { t } = useI18n();
const statusOptions = useStatusOptions();

function emptyForm() {
  return {
    event_name: '',
    event_date: '',
    organizer: '',
    organizer_website: '',
    organizer_email: '',
    application_text: '',
    venue_street: '',
    venue_zip: '',
    venue_city: '',
    fee: '',
    status: 'offen',
  };
}

const form = reactive({ ...emptyForm(), ...props.initialData });

const suggestions = reactive({
  organizer: [],
  venue_street: [],
  venue_zip: [],
  venue_city: [],
  organizer_email: [],
});

const suggestionDebounceHandles = {};
function fetchSuggestions(field, value) {
  clearTimeout(suggestionDebounceHandles[field]);
  suggestionDebounceHandles[field] = setTimeout(async () => {
    try {
      suggestions[field] = await apiClient.get(`/bookings/suggestions/${field}`, { q: value });
    } catch {
      suggestions[field] = [];
    }
  }, 300);
}

for (const field of Object.keys(suggestions)) {
  watch(
    () => form[field],
    (value) => fetchSuggestions(field, value),
  );
}

watch(
  () => props.initialData,
  (newData) => {
    Object.assign(form, emptyForm(), newData);
  },
);

function resetForm() {
  Object.assign(form, emptyForm());
}

defineExpose({ resetForm });

function handleSubmit(andContinue) {
  emit('submit', { data: { ...form }, andContinue });
}
</script>

<template>
  <form
    class="flex flex-col gap-4"
    @submit.prevent="handleSubmit(false)"
  >
    <FormField
      id="event_name"
      v-model="form.event_name"
      :label="t('bookingForm.eventName')"
      required
    />
    <FormField
      id="event_date"
      v-model="form.event_date"
      :label="t('bookingForm.eventDate')"
      type="date"
    />
    <FormField
      id="status"
      v-model="form.status"
      :label="t('bookingForm.status')"
      type="select"
      :options="statusOptions"
    />
    <FormField
      id="organizer"
      v-model="form.organizer"
      :label="t('bookingForm.organizer')"
      :suggestions="suggestions.organizer"
    />
    <FormField
      id="organizer_website"
      v-model="form.organizer_website"
      :label="t('bookingForm.organizerWebsite')"
      type="url"
    />
    <FormField
      id="organizer_email"
      v-model="form.organizer_email"
      :label="t('bookingForm.organizerEmail')"
      type="email"
      :suggestions="suggestions.organizer_email"
    />
    <FormField
      id="application_text"
      v-model="form.application_text"
      :label="t('bookingForm.applicationText')"
      type="textarea"
    />
    <FormField
      id="venue_street"
      v-model="form.venue_street"
      :label="t('bookingForm.venueStreet')"
      :suggestions="suggestions.venue_street"
    />
    <FormField
      id="venue_zip"
      v-model="form.venue_zip"
      :label="t('bookingForm.venueZip')"
      :suggestions="suggestions.venue_zip"
    />
    <FormField
      id="venue_city"
      v-model="form.venue_city"
      :label="t('bookingForm.venueCity')"
      :suggestions="suggestions.venue_city"
    />
    <FormField
      id="fee"
      v-model="form.fee"
      :label="t('bookingForm.fee')"
      type="number"
      step="0.01"
    />

    <div class="flex flex-col sm:flex-row gap-3 mt-4">
      <button
        type="button"
        class="bg-primary text-secondary rounded px-4 py-2"
        @click="handleSubmit(true)"
      >
        {{ isEditMode ? t('bookingForm.saveAndNext') : t('bookingForm.addAndNext') }}
      </button>
      <button
        type="button"
        class="bg-accent text-secondary rounded px-4 py-2"
        @click="handleSubmit(false)"
      >
        {{ isEditMode ? t('bookingForm.saveAndBack') : t('bookingForm.addAndBack') }}
      </button>
    </div>
  </form>
</template>
