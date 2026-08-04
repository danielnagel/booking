<script setup>
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  required: { type: Boolean, default: false },
  step: { type: String, default: undefined },
});

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="flex flex-col gap-1">
    <label
      :for="id"
      class="text-sm font-medium"
    >
      {{ label }}<span
        v-if="required"
        class="text-accent"
      > *</span>
    </label>
    <input
      :id="id"
      :type="type"
      :step="step"
      :required="required"
      :value="modelValue"
      class="border border-primary/30 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
      @input="$emit('update:modelValue', $event.target.value)"
    >
  </div>
</template>
