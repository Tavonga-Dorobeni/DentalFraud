<script setup lang="ts">
import type { ClaimAuditTrailEventDto } from "@fdcdf/shared";
import AuditTrailEventCard from "./AuditTrailEventCard.vue";

defineProps<{ events: ClaimAuditTrailEventDto[] }>();
</script>

<template>
  <div v-if="events.length" class="relative">
    <AuditTrailEventCard
      v-for="event in events"
      :key="event.id"
      :event="event"
    />
  </div>
  <div
    v-else
    class="text-sm text-navy-500 border border-dashed border-border-subtle rounded-lg px-4 py-8 text-center"
  >
    No audit events recorded for this claim yet.
  </div>
</template>
