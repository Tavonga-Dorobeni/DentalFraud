<script setup lang="ts">
import { computed } from "vue";
import { RiskBand } from "@fdcdf/shared";

interface Props {
  band?: RiskBand;
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  band: RiskBand.LOW,
  size: "md",
});

const fillColor = computed(() => {
  switch (props.band) {
    case RiskBand.CRITICAL:
      return "var(--color-red-critical)";
    case RiskBand.HIGH:
      return "var(--color-amber-alert)";
    case RiskBand.MEDIUM:
      return "var(--color-amber-alert)";
    case RiskBand.LOW:
      return "var(--color-blue-clinical)";
    default:
      return "var(--color-navy-auth)";
  }
});

const sizeClass = computed(() => ({
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
}[props.size]));
</script>

<template>
  <svg
    :class="sizeClass"
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Integrity Shield"
  >
    <!-- Shield shape -->
    <path
      d="M32 4 L56 16 L56 32 C56 48 44 58 32 62 C20 58 8 48 8 32 L8 16 Z"
      :fill="fillColor"
      stroke="none"
      opacity="0.15"
    />
    <path
      d="M32 4 L56 16 L56 32 C56 48 44 58 32 62 C20 58 8 48 8 32 L8 16 Z"
      fill="none"
      :stroke="fillColor"
      stroke-width="2"
    />
    <!-- Tooth silhouette in negative space -->
    <path
      d="M26 22 C26 18 30 16 32 16 C34 16 38 18 38 22 C38 26 36 30 35 34 C34 38 34 40 33 44 L31 44 C30 40 30 38 29 34 C28 30 26 26 26 22 Z"
      :fill="fillColor"
      opacity="0.6"
    />
  </svg>
</template>
