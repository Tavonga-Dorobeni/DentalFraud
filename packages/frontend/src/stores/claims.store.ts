import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  ClaimResponse,
  CreateClaimRequest,
  AnalyzeClaimResponse,
  PaginationMeta,
} from "@fdcdf/shared";
import { api } from "@/composables/useApi";

export const useClaimsStore = defineStore("claims", () => {
  const claims = ref<ClaimResponse[]>([]);
  const currentClaim = ref<ClaimResponse | null>(null);
  const analysisResult = ref<AnalyzeClaimResponse | null>(null);
  const pagination = ref<PaginationMeta | null>(null);
  const loading = ref(false);

  const selectOptions = ref<ClaimResponse[]>([]);
  const selectOptionsLoaded = ref(false);
  const selectOptionsLoading = ref(false);

  async function fetchClaims(page = 1, pageSize = 25) {
    loading.value = true;
    try {
      const response = await api.get("/api/v1/claims", {
        params: { page, pageSize },
      });
      const data = response.data;
      claims.value = data.items;
      pagination.value = data.pagination;
    } finally {
      loading.value = false;
    }
  }

  async function fetchClaimsForSelect(force = false) {
    if (selectOptionsLoaded.value && !force) return;
    selectOptionsLoading.value = true;
    try {
      const response = await api.get("/api/v1/claims", {
        params: { page: 1, pageSize: 200 },
      });
      selectOptions.value = response.data?.items ?? [];
      selectOptionsLoaded.value = true;
    } finally {
      selectOptionsLoading.value = false;
    }
  }

  async function fetchClaim(claimId: string) {
    loading.value = true;
    try {
      const response = await api.get(`/api/v1/claims/${claimId}`);
      const claim = response.data as ClaimResponse;
      currentClaim.value = claim;
      if (claim.latestAnalysis) {
        analysisResult.value = {
          claim,
          riskScore: claim.latestAnalysis.riskScore,
          ruleResults: claim.latestAnalysis.ruleResults,
          alerts: claim.latestAnalysis.alerts,
        };
      } else {
        analysisResult.value = null;
      }
    } finally {
      loading.value = false;
    }
  }

  async function createClaim(data: CreateClaimRequest): Promise<ClaimResponse> {
    const response = await api.post("/api/v1/claims", data);
    return response.data;
  }

  async function analyzeClaim(claimId: string) {
    loading.value = true;
    try {
      const response = await api.post(`/api/v1/claims/${claimId}/analyze`);
      analysisResult.value = response.data;
      // Update the current claim with the analyzed version
      if (analysisResult.value) {
        currentClaim.value = analysisResult.value.claim;
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    claims,
    currentClaim,
    analysisResult,
    pagination,
    loading,
    selectOptions,
    selectOptionsLoaded,
    selectOptionsLoading,
    fetchClaims,
    fetchClaimsForSelect,
    fetchClaim,
    createClaim,
    analyzeClaim,
  };
});
