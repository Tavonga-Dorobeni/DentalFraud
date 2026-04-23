<script setup lang="ts">
import { computed } from "vue";
import { LineDecision } from "@fdcdf/shared";

const props = defineProps<{
  decision: LineDecision;
  size?: "sm" | "md";
}>();

const label = computed(() => {
  switch (props.decision) {
    case LineDecision.LEGITIMATE:
      return "LEGITIMATE";
    case LineDecision.EDUCATION_REQUIRED:
      return "EDUCATION";
    case LineDecision.CONFIRMED_FRAUD:
      return "FRAUD";
  }
});

const toneClasses = computed(() => {
  switch (props.decision) {
    case LineDecision.LEGITIMATE:
      return "bg-green-legitimate-light text-green-legitimate";
    case LineDecision.EDUCATION_REQUIRED:
      return "bg-amber-alert-light text-amber-alert";
    case LineDecision.CONFIRMED_FRAUD:
      return "bg-red-critical-light text-red-critical";
  }
});

const sizeClasses = computed(() =>
  props.size === "sm"
    ? "text-[10px] px-1.5 py-0.5"
    : "text-xs px-2 py-0.5"
);
</script>

<template>
  <span
    class="inline-flex items-center font-semibold rounded-full tracking-wider"
    :class="[toneClasses, sizeClasses]"
  >
    {{ label }}
  </span>
</template>
