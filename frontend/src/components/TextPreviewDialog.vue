<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  text: { type: String, default: '' },
});

defineEmits(['close']);

const { t } = useI18n();
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-secondary text-primary rounded-lg p-6 w-full max-w-lg max-h-[80vh] flex flex-col gap-4">
      <h2 class="text-lg font-semibold">
        {{ title }}
      </h2>
      <p class="text-sm whitespace-pre-wrap overflow-y-auto">
        {{ text }}
      </p>
      <div class="flex justify-end">
        <button
          type="button"
          class="px-4 py-2 rounded border border-primary/30"
          @click="$emit('close')"
        >
          {{ t('textPreviewDialog.close') }}
        </button>
      </div>
    </div>
  </div>
</template>
