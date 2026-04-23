import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { RuleSeverity, AlertStatus, type AlertDto, type PaginationMeta } from "@fdcdf/shared";
import { api } from "@/composables/useApi";

export const useAlertsStore = defineStore("alerts", () => {
  const alerts = ref<AlertDto[]>([]);
  const currentAlert = ref<AlertDto | null>(null);
  const pagination = ref<PaginationMeta | null>(null);
  const loading = ref(false);
  const seenCriticalIds = ref<Set<string>>(new Set());

  const hasUnseenCriticalAlerts = computed(() =>
    alerts.value.some(
      (a) =>
        a.severity === RuleSeverity.CRITICAL &&
        a.status === AlertStatus.OPEN &&
        !seenCriticalIds.value.has(a.id)
    )
  );

  function markCriticalAsSeen() {
    for (const a of alerts.value) {
      if (a.severity === RuleSeverity.CRITICAL) {
        seenCriticalIds.value.add(a.id);
      }
    }
  }

  async function fetchAlerts(page = 1, pageSize = 25, status?: string) {
    loading.value = true;
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (status) params.status = status;
      const response = await api.get("/api/v1/alerts", { params });
      const data = response.data;
      alerts.value = data.items;
      pagination.value = data.pagination;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAlert(alertId: string) {
    loading.value = true;
    try {
      const response = await api.get(`/api/v1/alerts/${alertId}`);
      currentAlert.value = response.data;
    } finally {
      loading.value = false;
    }
  }

  async function acknowledgeAlert(alertId: string) {
    const response = await api.post(`/api/v1/alerts/${alertId}/acknowledge`);
    currentAlert.value = response.data;
    // Update in list
    const idx = alerts.value.findIndex((a) => a.id === alertId);
    if (idx >= 0) alerts.value[idx] = response.data;
  }

  async function closeAlert(alertId: string) {
    const response = await api.post(`/api/v1/alerts/${alertId}/close`);
    currentAlert.value = response.data;
    const idx = alerts.value.findIndex((a) => a.id === alertId);
    if (idx >= 0) alerts.value[idx] = response.data;
  }

  return {
    alerts,
    currentAlert,
    pagination,
    loading,
    hasUnseenCriticalAlerts,
    markCriticalAsSeen,
    fetchAlerts,
    fetchAlert,
    acknowledgeAlert,
    closeAlert,
  };
});
