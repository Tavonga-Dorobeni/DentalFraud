<script setup lang="ts">
import { computed } from "vue";
import { RuleSeverity } from "@fdcdf/shared";

const props = defineProps<{ severity: RuleSeverity }>();

const style = computed(() => {
  switch (props.severity) {
    case RuleSeverity.LOW:
      return "bg-blue-clinical-light text-blue-clinical";
    case RuleSeverity.MEDIUM:
      return "bg-amber-alert-light text-amber-alert";
    case RuleSeverity.HIGH:
      return "bg-amber-alert text-white";
    case RuleSeverity.CRITICAL:
      return "bg-red-critical text-white";
    default:
      return "bg-border-subtle text-navy-500";
  }
});
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" :class="style">
    {{ severity }}
  </span>
</template>
