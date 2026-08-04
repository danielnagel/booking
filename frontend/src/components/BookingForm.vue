<script setup>
import { reactive, watch } from 'vue';

import FormField from './FormField.vue';

const props = defineProps({
  initialData: { type: Object, default: () => ({}) },
  isEditMode: { type: Boolean, default: false },
});

const emit = defineEmits(['submit']);

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
  };
}

const form = reactive({ ...emptyForm(), ...props.initialData });

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
      label="Veranstaltungsname"
      required
    />
    <FormField
      id="event_date"
      v-model="form.event_date"
      label="Datum"
      type="date"
    />
    <FormField
      id="organizer"
      v-model="form.organizer"
      label="Veranstalter"
    />
    <FormField
      id="organizer_website"
      v-model="form.organizer_website"
      label="Veranstalter-Website"
      type="url"
    />
    <FormField
      id="organizer_email"
      v-model="form.organizer_email"
      label="Veranstalter-E-Mail"
      type="email"
    />
    <FormField
      id="application_text"
      v-model="form.application_text"
      label="Bewerbungstext"
      type="textarea"
    />
    <FormField
      id="venue_street"
      v-model="form.venue_street"
      label="Straße"
    />
    <FormField
      id="venue_zip"
      v-model="form.venue_zip"
      label="PLZ"
    />
    <FormField
      id="venue_city"
      v-model="form.venue_city"
      label="Ort"
    />
    <FormField
      id="fee"
      v-model="form.fee"
      label="Gage (€)"
      type="number"
      step="0.01"
    />

    <div class="flex flex-col sm:flex-row gap-3 mt-4">
      <button
        type="button"
        class="bg-primary text-secondary rounded px-4 py-2"
        @click="handleSubmit(true)"
      >
        {{ isEditMode ? 'Speichern und nächster Eintrag' : 'Hinzufügen und nächster Eintrag' }}
      </button>
      <button
        type="button"
        class="bg-accent text-secondary rounded px-4 py-2"
        @click="handleSubmit(false)"
      >
        {{ isEditMode ? 'Speichern und zurück zur Übersicht' : 'Hinzufügen und zurück zur Übersicht' }}
      </button>
    </div>
  </form>
</template>
