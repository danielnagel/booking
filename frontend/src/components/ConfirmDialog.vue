<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: null },
  message: { type: String, default: null },
});

defineEmits(['confirm', 'cancel']);

const { t } = useI18n();
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="$emit('cancel')"
  >
    <div class="bg-secondary text-primary rounded-lg p-6 w-full max-w-sm flex flex-col gap-4">
      <h2 class="text-lg font-semibold">
        {{ title ?? t('confirmDialog.title') }}
      </h2>
      <p class="text-sm">
        {{ message ?? t('confirmDialog.message') }}
      </p>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 rounded border border-primary/30"
          @click="$emit('cancel')"
        >
          {{ t('confirmDialog.cancel') }}
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded bg-red-600 text-white"
          @click="$emit('confirm')"
        >
          {{ t('confirmDialog.delete') }}
        </button>
      </div>
    </div>
  </div>
</template>
