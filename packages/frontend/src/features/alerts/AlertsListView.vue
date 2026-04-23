<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { AlertStatus } from "@fdcdf/shared";
import { useAlertsStore } from "@/stores/alerts.store";
import GlassPanel from "@/ui/GlassPanel.vue";
import AppSkeletonLoader from "@/ui/AppSkeletonLoader.vue";
import AlertSeverityBadge from "./components/AlertSeverityBadge.vue";
import AlertStatusBadge from "./components/AlertStatusBadge.vue";
import { formatDate } from "@/utils/date";

const router = useRouter();
const alertsStore = useAlertsStore();

const statusFilter = ref<string>("");
const statusTabs = [
  { label: "All", value: "" },
  { label: "Open", value: AlertStatus.OPEN },
  { label: "Acknowledged", value: AlertStatus.ACKNOWLEDGED },
  { label: "Closed", value: AlertStatus.CLOSED },
];

onMounted(() => {
  alertsStore.fetchAlerts();
  alertsStore.markCriticalAsSeen();
});

function handleFilterChange(status: string) {
  statusFilter.value = status;
  alertsStore.fetchAlerts(1, 25, status || undefined);
}

function handlePageChange(page: number) {
  alertsStore.fetchAlerts(page, 25, statusFilter.value || undefined);
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-navy-auth mb-6">Alerts</h1>

    <!-- Status filter tabs -->
    <div class="flex gap-1 mb-4">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
        :class="statusFilter === tab.value
          ? 'bg-navy-auth text-white'
          : 'text-navy-500 hover:bg-surface-glass'
        "
        @click="handleFilterChange(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="alertsStore.loading && !alertsStore.alerts.length" class="space-y-3">
      <AppSkeletonLoader v-for="i in 5" :key="i" shape="rect" height="4rem" />
    </div>

    <!-- Alert list -->
    <div v-else-if="alertsStore.alerts.length" class="space-y-2">
      <GlassPanel
        v-for="alert in alertsStore.alerts"
        :key="alert.id"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="router.push(`/alerts/${alert.id}`)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <AlertSeverityBadge :severity="alert.severity" />
            <div class="flex-1 min-w-0">
              <div class="text-sm text-navy-auth truncate">{{ alert.summary }}</div>
              <div class="text-xs text-navy-500 mt-0.5">
                Claim: <span class="font-mono">{{ alert.claimId }}</span>
                <span class="mx-1">&middot;</span>
                {{ formatDate(alert.createdAt) }}
              </div>
            </div>
          </div>
          <AlertStatusBadge :status="alert.status" />
        </div>
      </GlassPanel>

      <!-- Pagination -->
      <div
        v-if="alertsStore.pagination && alertsStore.pagination.totalPages > 1"
        class="flex items-center justify-center gap-4 pt-4"
      >
        <button
          class="px-3 py-1 text-xs rounded hover:bg-surface-glass disabled:opacity-30"
          :disabled="alertsStore.pagination.page <= 1"
          @click="handlePageChange(alertsStore.pagination!.page - 1)"
        >
          Prev
        </button>
        <span class="text-xs text-navy-500">
          {{ alertsStore.pagination.page }} / {{ alertsStore.pagination.totalPages }}
        </span>
        <button
          class="px-3 py-1 text-xs rounded hover:bg-surface-glass disabled:opacity-30"
          :disabled="alertsStore.pagination.page >= alertsStore.pagination.totalPages"
          @click="handlePageChange(alertsStore.pagination!.page + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <GlassPanel v-else>
      <div class="text-center py-8 text-navy-500">No alerts found.</div>
    </GlassPanel>
  </div>
</template>
