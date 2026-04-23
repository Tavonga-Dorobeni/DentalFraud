<script setup lang="ts">
import { computed } from "vue";
import { RiskBand } from "@fdcdf/shared";

const props = defineProps<{
  score: number;
  band: RiskBand;
  confidence: number;
}>();

const bandColor = computed(() => {
  switch (props.band) {
    case RiskBand.CRITICAL: return "text-red-critical";
    case RiskBand.HIGH: return "text-amber-alert";
    case RiskBand.MEDIUM: return "text-amber-alert";
    case RiskBand.LOW: return "text-blue-clinical";
    default: return "text-navy-auth";
  }
});

const bandBg = computed(() => {
  switch (props.band) {
    case RiskBand.CRITICAL: return "bg-red-critical-light text-red-critical";
    case RiskBand.HIGH: return "bg-amber-alert-light text-amber-alert";
    case RiskBand.MEDIUM: return "bg-amber-alert-light text-amber-alert";
    case RiskBand.LOW: return "bg-blue-clinical-light text-blue-clinical";
    default: return "bg-border-subtle text-navy-500";
  }
});
</script>

<template>
  <div class="flex items-center gap-4">
    <div>
      <div class="text-3xl font-bold font-mono" :class="bandColor">{{ score }}</div>
      <div class="text-[10px] text-navy-500">/ 100</div>
    </div>
    <div class="flex flex-col items-start gap-1">
      <span class="px-3 py-1 rounded-full text-sm font-semibold" :class="bandBg">
        {{ band }}
      </span>
      <span class="text-[10px] text-navy-500">
        {{ Math.round(confidence * 100) }}% confidence
      </span>
    </div>
  </div>
</template>
