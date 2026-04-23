<script setup lang="ts">
import { computed } from "vue";
import { ClaimStatus } from "@fdcdf/shared";

const props = defineProps<{ status: ClaimStatus }>();

const style = computed(() => {
  switch (props.status) {
    case ClaimStatus.ACCEPTED:
      return "bg-blue-clinical-light text-blue-clinical";
    case ClaimStatus.ACCEPTED_WITH_WARNINGS:
      return "bg-amber-alert-light text-amber-alert";
    case ClaimStatus.REJECTED:
      return "bg-red-critical-light text-red-critical";
    default:
      return "bg-border-subtle text-navy-500";
  }
});

const label = computed(() => {
  switch (props.status) {
    case ClaimStatus.ACCEPTED:
      return "Accepted";
    case ClaimStatus.ACCEPTED_WITH_WARNINGS:
      return "Warnings";
    case ClaimStatus.REJECTED:
      return "Rejected";
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
