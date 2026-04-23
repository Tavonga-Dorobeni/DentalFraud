<script setup lang="ts">
defineProps<{
  claimedCode: string;
  documentedCode?: string;
}>();
</script>

<template>
  <div
    v-if="documentedCode && claimedCode !== documentedCode"
    class="flex items-center gap-2 bg-red-critical-light rounded-lg px-3 py-2 text-xs"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-critical flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
    <span class="text-red-critical font-medium">Procedure Mismatch</span>
    <span class="text-navy-500">
      Claimed: <span class="font-mono font-medium text-navy-auth">{{ claimedCode }}</span>
      vs Documented: <span class="font-mono font-medium text-navy-auth">{{ documentedCode }}</span>
    </span>
  </div>
</template>
