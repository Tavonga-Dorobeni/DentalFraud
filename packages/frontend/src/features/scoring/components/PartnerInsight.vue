<script setup lang="ts">
import type { ScoreFactorDto } from "@fdcdf/shared";
import { computed } from "vue";

const props = defineProps<{
  factors: ScoreFactorDto[];
}>();

// Generate a natural-language insight from contributing factors
const insightText = computed(() => {
  if (!props.factors.length) return "No suspicious patterns detected.";

  const topFactors = props.factors
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
    .map((f) => f.explanation);

  if (topFactors.length === 1) return topFactors[0];
  if (topFactors.length === 2) return `${topFactors[0]} and ${topFactors[1]}`;

  return `${topFactors.slice(0, -1).join(", ")}, and ${topFactors[topFactors.length - 1]}`;
});
</script>

<template>
  <div class="glass rounded-lg px-4 py-3">
    <div class="text-[10px] uppercase tracking-wider text-navy-500 mb-1">Partner Insight</div>
    <p class="text-sm text-navy-auth leading-relaxed">{{ insightText }}</p>
  </div>
</template>
