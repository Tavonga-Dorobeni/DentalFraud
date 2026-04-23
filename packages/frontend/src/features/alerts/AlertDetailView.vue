<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AlertStatus } from "@fdcdf/shared";
import { useAlertsStore } from "@/stores/alerts.store";
import { useToast } from "@/composables/useToast";
import GlassPanel from "@/ui/GlassPanel.vue";
import AppButton from "@/ui/AppButton.vue";
import AppSkeletonLoader from "@/ui/AppSkeletonLoader.vue";
import AlertSeverityBadge from "./components/AlertSeverityBadge.vue";
import AlertStatusBadge from "./components/AlertStatusBadge.vue";
import { formatDate } from "@/utils/date";

const route = useRoute();
const router = useRouter();
const alertsStore = useAlertsStore();
const toast = useToast();

const alertId = computed(() => String(route.params.alertId));
const alert = computed(() => alertsStore.currentAlert);

const canAcknowledge = computed(
  () => alert.value?.status === AlertStatus.OPEN
);
const canClose = computed(
  () =>
    alert.value?.status === AlertStatus.OPEN ||
    alert.value?.status === AlertStatus.ACKNOWLEDGED
);

onMounted(() => {
  alertsStore.fetchAlert(alertId.value);
});

async function handleAcknowledge() {
  try {
    await alertsStore.acknowledgeAlert(alertId.value);
    toast.success("Alert acknowledged.");
  } catch {
    toast.error("Failed to acknowledge alert.");
  }
}

async function handleClose() {
  try {
    await alertsStore.closeAlert(alertId.value);
    toast.success("Alert closed.");
  } catch {
    toast.error("Failed to close alert.");
  }
}
</script>

<template>
  <div>
    <button class="text-sm text-navy-500 hover:text-navy-auth mb-4 flex items-center gap-1" @click="router.push('/alerts')">
      &larr; Back to Alerts
    </button>

    <div v-if="alertsStore.loading && !alert" class="space-y-4">
      <AppSkeletonLoader shape="rect" height="8rem" />
    </div>

    <template v-else-if="alert">
      <GlassPanel class="mb-4">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h1 class="text-xl font-semibold text-navy-auth mb-1">Alert Detail</h1>
            <div class="text-xs text-navy-500 font-mono">{{ alert.id }}</div>
          </div>
          <div class="flex items-center gap-2">
            <AlertSeverityBadge :severity="alert.severity" />
            <AlertStatusBadge :status="alert.status" />
          </div>
        </div>

        <div class="space-y-4">
          <!-- Summary -->
          <div>
            <div class="text-xs text-navy-500 mb-1">Summary</div>
            <div class="text-sm text-navy-auth">{{ alert.summary }}</div>
          </div>

          <!-- Recommended action -->
          <div>
            <div class="text-xs text-navy-500 mb-1">Recommended Action</div>
            <div class="text-sm text-navy-auth">{{ alert.recommendedAction }}</div>
          </div>

          <!-- Details grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-xs text-navy-500">Claim</span>
              <div
                class="font-mono text-blue-clinical cursor-pointer hover:underline"
                @click="router.push(`/claims/${alert.claimId}`)"
              >
                {{ alert.claimId }}
              </div>
            </div>
            <div v-if="alert.claimLineId">
              <span class="text-xs text-navy-500">Claim Line</span>
              <div class="font-mono text-navy-auth">{{ alert.claimLineId }}</div>
            </div>
            <div>
              <span class="text-xs text-navy-500">Created</span>
              <div>{{ formatDate(alert.createdAt, { includeTime: true }) }}</div>
            </div>
            <div>
              <span class="text-xs text-navy-500">Updated</span>
              <div>{{ formatDate(alert.updatedAt, { includeTime: true }) }}</div>
            </div>
          </div>

          <!-- Triggered rules -->
          <div v-if="alert.triggeredRuleIds.length">
            <div class="text-xs text-navy-500 mb-1">Triggered Rules</div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="ruleId in alert.triggeredRuleIds"
                :key="ruleId"
                class="px-2 py-0.5 bg-surface-glass border border-border-subtle rounded text-xs font-mono"
              >
                {{ ruleId }}
              </span>
            </div>
          </div>
        </div>
      </GlassPanel>

      <!-- Actions -->
      <div class="flex gap-3">
        <AppButton
          v-if="canAcknowledge"
          variant="secondary"
          @click="handleAcknowledge"
        >
          Acknowledge
        </AppButton>
        <AppButton
          v-if="canClose"
          variant="primary"
          @click="handleClose"
        >
          Close Alert
        </AppButton>
      </div>
    </template>
  </div>
</template>
