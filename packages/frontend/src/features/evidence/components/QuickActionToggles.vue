<script setup lang="ts">
import { computed } from "vue";
import { LineDecision } from "@fdcdf/shared";

const props = defineProps<{
  current: LineDecision | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  set: [decision: LineDecision];
}>();

type ButtonConfig = {
  value: LineDecision;
  label: string;
  activeClass: string;
  inactiveClass: string;
  fontWeight: string;
};

const buttons: ButtonConfig[] = [
  {
    value: LineDecision.LEGITIMATE,
    label: "LEGITIMATE",
    activeClass: "bg-green-legitimate border-green-legitimate text-white",
    inactiveClass:
      "border-border-subtle text-navy-auth hover:text-green-legitimate hover:border-green-legitimate",
    fontWeight: "font-medium",
  },
  {
    value: LineDecision.EDUCATION_REQUIRED,
    label: "EDUCATION REQ",
    activeClass: "bg-amber-alert border-amber-alert text-white",
    inactiveClass:
      "border-border-subtle text-navy-auth hover:text-amber-alert hover:border-amber-alert",
    fontWeight: "font-medium",
  },
  {
    value: LineDecision.CONFIRMED_FRAUD,
    label: "CONFIRM FRAUD",
    activeClass: "bg-red-critical border-red-critical text-white",
    inactiveClass:
      "bg-navy-auth border-navy-auth text-white hover:bg-red-critical hover:border-red-critical",
    fontWeight: "font-semibold",
  },
];

const buttonStates = computed(() =>
  buttons.map((b) => ({
    ...b,
    isActive: props.current === b.value,
  }))
);

function handleClick(value: LineDecision) {
  emit("set", value);
}
</script>

<template>
  <div class="flex gap-3 pt-4 border-t border-border-subtle">
    <button
      v-for="b in buttonStates"
      :key="b.value"
      type="button"
      :disabled="disabled"
      :aria-pressed="b.isActive"
      class="flex-1 px-3 py-2 text-xs rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      :class="[b.fontWeight, b.isActive ? b.activeClass : b.inactiveClass]"
      @click="handleClick(b.value)"
    >
      {{ b.label }}
    </button>
  </div>
</template>
