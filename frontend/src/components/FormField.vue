<script setup>
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  required: { type: Boolean, default: false },
  step: { type: String, default: undefined },
  options: { type: Array, default: () => [] },
  suggestions: { type: Array, default: () => [] },
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
    <textarea
      v-if="type === 'textarea'"
      :id="id"
      :required="required"
      :value="modelValue"
      rows="4"
      class="bg-secondary text-primary border border-primary rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <select
      v-else-if="type === 'select'"
      :id="id"
      :required="required"
      :value="modelValue"
      class="bg-secondary text-primary border border-primary rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option
        v-for="option in options"
        :key="option"
        :value="option"
      >
        {{ option }}
      </option>
    </select>
    <template v-else>
      <input
        :id="id"
        :type="type"
        :step="step"
        :required="required"
        :value="modelValue"
        :list="suggestions.length > 0 ? `${id}-list` : undefined"
        class="bg-secondary text-primary border border-primary rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
        @input="$emit('update:modelValue', $event.target.value)"
      >
      <datalist
        v-if="suggestions.length > 0"
        :id="`${id}-list`"
      >
        <option
          v-for="suggestion in suggestions"
          :key="suggestion"
          :value="suggestion"
        />
      </datalist>
    </template>
  </div>
</template>
