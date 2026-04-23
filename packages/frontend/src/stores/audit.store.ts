import { defineStore } from "pinia";
import { ref } from "vue";
import type { ClaimAuditTrailEventDto } from "@fdcdf/shared";
import { api } from "@/composables/useApi";

export const useAuditStore = defineStore("audit", () => {
  const currentClaimId = ref<string | null>(null);
  const events = ref<ClaimAuditTrailEventDto[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAuditTrail(claimId: string) {
    loading.value = true;
    error.value = null;
    currentClaimId.value = claimId;
    try {
      const response = await api.get(`/api/v1/claims/${claimId}/audit-trail`);
      events.value = response.data?.events ?? [];
    } catch (err) {
      events.value = [];
      error.value = err instanceof Error ? err.message : "Failed to load audit trail";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    currentClaimId.value = null;
    events.value = [];
    error.value = null;
  }

  return {
    currentClaimId,
    events,
    loading,
    error,
    fetchAuditTrail,
    reset,
  };
});
