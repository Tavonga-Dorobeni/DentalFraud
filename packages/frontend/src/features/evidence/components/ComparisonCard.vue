<script setup lang="ts">
defineProps<{
  title: string;
  variant: "claimed" | "verified";
  procedureCode?: string;
  amount?: number;
  notes?: string;
}>();
</script>

<template>
  <div
    class="flex-1 border rounded-lg p-3"
    :class="{
      'border-amber-alert/30 bg-amber-alert-light/30': variant === 'claimed',
      'border-blue-clinical/30 bg-blue-clinical-light/30': variant === 'verified',
    }"
  >
    <div class="text-[10px] uppercase tracking-wider mb-2" :class="{
      'text-amber-alert': variant === 'claimed',
      'text-blue-clinical': variant === 'verified',
    }">
      {{ title }}
    </div>

    <div v-if="procedureCode" class="mb-2">
      <div class="text-[10px] text-navy-500">Procedure</div>
      <div class="text-sm font-mono font-medium text-navy-auth">{{ procedureCode }}</div>
    </div>

    <div v-if="amount != null" class="mb-2">
      <div class="text-[10px] text-navy-500">Amount</div>
      <div class="text-sm font-mono text-navy-auth">${{ amount.toFixed(2) }}</div>
    </div>

    <div v-if="notes" class="mb-2">
      <div class="text-[10px] text-navy-500">Notes</div>
      <div class="text-xs text-navy-auth">{{ notes }}</div>
    </div>

    <div v-if="!procedureCode && !notes" class="text-xs text-navy-500 italic">
      No data available
    </div>
  </div>
</template>
