<script setup lang="ts">
import { computed } from "vue";
import type { ClaimLineDecisionDto, ClaimLineDto, LineDecision } from "@fdcdf/shared";
import DecisionPill from "./DecisionPill.vue";

const props = withDefaults(
  defineProps<{
    lines: ClaimLineDto[];
    decisions?: ClaimLineDecisionDto[];
    interactive?: boolean;
  }>(),
  { interactive: true }
);

defineEmits<{
  "select-line": [line: ClaimLineDto];
}>();

const decisionByLineId = computed<Record<string, LineDecision>>(() => {
  const map: Record<string, LineDecision> = {};
  for (const d of props.decisions ?? []) {
    map[d.claimLineId] = d.decision;
  }
  return map;
});
</script>

<template>
  <div class="border border-border-subtle rounded-lg overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-border-subtle bg-surface-glass">
          <th class="px-4 py-2 text-left font-semibold text-navy-auth">Procedure</th>
          <th class="px-4 py-2 text-left font-semibold text-navy-auth">Tooth</th>
          <th class="px-4 py-2 text-right font-semibold text-navy-auth">Amount</th>
          <th class="px-4 py-2 text-left font-semibold text-navy-auth">Documented</th>
          <th class="px-4 py-2 text-left font-semibold text-navy-auth">Evidence</th>
          <th class="px-4 py-2 text-left font-semibold text-navy-auth">Decision</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="line in lines"
          :key="line.id"
          class="border-b border-border-subtle last:border-0 transition-colors"
          :class="props.interactive ? 'hover:bg-surface-glass cursor-pointer' : ''"
          @click="props.interactive && $emit('select-line', line)"
        >
          <td class="px-4 py-2 font-mono text-navy-500">{{ line.procedureCode }}</td>
          <td class="px-4 py-2 font-mono">
            <span v-if="line.toothNumber" class="text-navy-auth">{{ line.toothNumber }}</span>
            <span v-else class="text-navy-500">--</span>
          </td>
          <td class="px-4 py-2 text-right font-mono">${{ line.claimedAmount.toFixed(2) }}</td>
          <td class="px-4 py-2 font-mono text-navy-500">
            <span v-if="line.documentedProcedureCode">
              {{ line.documentedProcedureCode }}
              <span
                v-if="line.documentedProcedureCode !== line.procedureCode"
                class="ml-1 text-red-critical text-xs"
                title="Procedure mismatch"
              >
                !!
              </span>
            </span>
            <span v-else class="text-border-subtle">--</span>
          </td>
          <td class="px-4 py-2 text-xs text-navy-500 max-w-48 truncate">
            {{ line.evidenceSummary || "--" }}
          </td>
          <td class="px-4 py-2">
            <DecisionPill
              v-if="decisionByLineId[line.id]"
              :decision="decisionByLineId[line.id]"
              size="sm"
            />
            <span v-else class="text-border-subtle text-xs">--</span>
          </td>
        </tr>
        <tr v-if="!lines.length">
          <td colspan="6" class="px-4 py-6 text-center text-navy-500">No claim lines</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
