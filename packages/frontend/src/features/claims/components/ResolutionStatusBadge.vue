<script setup lang="ts">
import { computed } from "vue";
import { ResolutionStatus } from "@fdcdf/shared";

const props = defineProps<{ status: ResolutionStatus }>();

const style = computed(() => {
  switch (props.status) {
    case ResolutionStatus.PENDING_REVIEW:
      return "bg-border-subtle text-navy-500";
    case ResolutionStatus.IN_REVIEW:
    case ResolutionStatus.CLEARED:
      return "bg-blue-clinical-light text-blue-clinical";
    case ResolutionStatus.EDUCATION_FLAGGED:
      return "bg-amber-alert-light text-amber-alert";
    case ResolutionStatus.CONFIRMED_FRAUD:
      return "bg-red-critical-light text-red-critical";
    default:
      return "bg-border-subtle text-navy-500";
  }
});

const label = computed(() => {
  switch (props.status) {
    case ResolutionStatus.PENDING_REVIEW:
      return "Pending Review";
    case ResolutionStatus.IN_REVIEW:
      return "In Review";
    case ResolutionStatus.CLEARED:
      return "Cleared";
    case ResolutionStatus.EDUCATION_FLAGGED:
      return "Education Flagged";
    case ResolutionStatus.CONFIRMED_FRAUD:
      return "Confirmed Fraud";
    default:
      return props.status;
  }
});
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="style">
    {{ label }}
  </span>
</template>
