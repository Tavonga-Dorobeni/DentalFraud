<script setup lang="ts">
import { ref } from "vue";
import type { ScoreFactorDto } from "@fdcdf/shared";

defineProps<{
  factors: ScoreFactorDto[];
}>();

const expanded = ref(false);

function severityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL": return "text-red-critical";
    case "HIGH": return "text-amber-alert";
    case "MEDIUM": return "text-amber-alert";
    default: return "text-blue-clinical";
  }
}
</script>

<template>
  <div>
    <button
      class="text-xs text-navy-500 hover:text-navy-auth flex items-center gap-1"
      @click="expanded = !expanded"
    >
      <span>{{ expanded ? "Hide" : "Show" }} contributing factors ({{ factors.length }})</span>
      <svg
        class="w-3 h-3 transition-transform"
        :class="{ 'rotate-180': expanded }"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>

    <div v-if="expanded" class="mt-2 space-y-1.5">
      <div
        v-for="factor in factors"
        :key="factor.ruleId"
        class="flex items-center justify-between text-xs bg-surface-glass rounded px-3 py-2"
      >
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span :class="severityColor(factor.severity)" class="font-semibold text-[10px] w-14 flex-shrink-0">
            {{ factor.severity }}
          </span>
          <span class="text-navy-auth truncate">{{ factor.explanation }}</span>
        </div>
        <div class="flex items-center gap-3 ml-2 flex-shrink-0">
          <span class="text-navy-500 font-mono">w={{ factor.weight.toFixed(2) }}</span>
          <span class="font-mono font-semibold text-navy-auth">+{{ factor.contribution.toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
