<script setup lang="ts">
import { computed } from "vue";
import { AlertStatus } from "@fdcdf/shared";

const props = defineProps<{ status: AlertStatus }>();

const style = computed(() => {
  switch (props.status) {
    case AlertStatus.OPEN:
      return "bg-red-critical-light text-red-critical";
    case AlertStatus.ACKNOWLEDGED:
      return "bg-amber-alert-light text-amber-alert";
    case AlertStatus.CLOSED:
      return "bg-green-legitimate-light text-green-legitimate";
    default:
      return "bg-border-subtle text-navy-500";
  }
});
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="style">
    {{ status }}
  </span>
</template>
