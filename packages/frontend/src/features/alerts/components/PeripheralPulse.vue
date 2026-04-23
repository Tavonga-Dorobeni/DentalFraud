<script setup lang="ts">
import { useAlertsStore } from "@/stores/alerts.store";

const alertsStore = useAlertsStore();
</script>

<template>
  <div
    class="fixed left-0 top-0 h-full w-1 z-50 transition-opacity duration-300"
    :class="alertsStore.hasUnseenCriticalAlerts ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    role="alert"
    :aria-label="alertsStore.hasUnseenCriticalAlerts ? 'Critical alerts require attention' : undefined"
  >
    <div
      class="w-full h-full bg-red-critical animate-peripheral-glow"
    />
  </div>
</template>
