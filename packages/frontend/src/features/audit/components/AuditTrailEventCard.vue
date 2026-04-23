<script setup lang="ts">
import { computed, ref } from "vue";
import type { ClaimAuditTrailEventDto } from "@fdcdf/shared";
import { formatDate, humanizeDatesInText } from "@/utils/date";

const props = defineProps<{ event: ClaimAuditTrailEventDto }>();

const expanded = ref(false);

const actionLabel = computed(() =>
  props.event.action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()),
);

const accentClass = computed(() => {
  const a = props.event.action;
  if (a.startsWith("ALERT_CREATED")) return "bg-red-critical";
  if (a.startsWith("ALERT_")) return "bg-blue-clinical";
  if (a.startsWith("CLAIM_SCORED") || a.startsWith("CLAIM_ANALYZED")) return "bg-amber-alert";
  if (a.startsWith("CLAIM_LINE_DECISION")) return "bg-navy-auth";
  if (a.startsWith("CLAIM_INGESTED")) return "bg-blue-clinical";
  return "bg-navy-500";
});

const actor = computed(() => {
  if (props.event.actorEmail) return props.event.actorEmail;
  if (props.event.actorUserId) return props.event.actorUserId;
  return "System";
});

const hasMetadata = computed(() => Object.keys(props.event.metadata ?? {}).length > 0);

const metadataJson = computed(() => JSON.stringify(props.event.metadata, null, 2));
</script>

<template>
  <div class="relative flex gap-4 pl-2">
    <!-- Timeline dot + rail -->
    <div class="flex-shrink-0 flex flex-col items-center" aria-hidden="true">
      <span
        class="block w-2.5 h-2.5 rounded-full ring-4 ring-clinical-bg mt-1.5"
        :class="accentClass"
      />
      <span class="flex-1 w-px bg-border-subtle mt-1" />
    </div>

    <!-- Card body -->
    <div class="flex-1 pb-6">
      <div class="border border-border-subtle rounded-lg px-4 py-3 bg-white">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="min-w-0">
            <div class="text-sm font-medium text-navy-auth">
              {{ humanizeDatesInText(event.summary) }}
            </div>
            <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-500">
              <span class="font-mono">{{ actionLabel }}</span>
              <span>·</span>
              <span>
                Actor:
                <span class="text-navy-auth">{{ actor }}</span>
                <span v-if="event.actorRole" class="ml-1 px-1.5 py-0.5 bg-surface-glass border border-border-subtle rounded text-[10px] font-medium">
                  {{ event.actorRole }}
                </span>
              </span>
              <span v-if="event.targetEntity">·</span>
              <span v-if="event.targetEntity">
                Target: <span class="font-mono text-navy-auth">{{ event.targetEntity }}</span>
                <span v-if="event.targetEntityId" class="font-mono text-navy-500">:{{ event.targetEntityId }}</span>
              </span>
            </div>
          </div>
          <div class="text-xs text-navy-500 whitespace-nowrap">
            {{ formatDate(event.createdAt, { includeTime: true }) }}
          </div>
        </div>

        <button
          v-if="hasMetadata"
          class="mt-2 text-xs font-medium text-blue-clinical hover:underline"
          @click="expanded = !expanded"
        >
          {{ expanded ? "Hide details" : "Show details" }}
        </button>
        <pre
          v-if="expanded && hasMetadata"
          class="mt-2 text-[11px] font-mono text-navy-auth bg-surface-glass border border-border-subtle rounded px-3 py-2 overflow-x-auto"
        >{{ metadataJson }}</pre>
      </div>
    </div>
  </div>
</template>
