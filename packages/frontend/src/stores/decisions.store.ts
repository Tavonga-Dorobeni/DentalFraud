import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  AnalyzeClaimResponse,
  ClaimLineDecisionDto,
  ClaimResponse,
  LineDecision,
} from "@fdcdf/shared";
import { api } from "@/composables/useApi";
import { useClaimsStore } from "@/stores/claims.store";

export const useDecisionsStore = defineStore("decisions", () => {
  const saving = ref(false);

  function mergeIntoClaim(claim: ClaimResponse, decision: ClaimLineDecisionDto) {
    const existing = claim.decisions ?? [];
    claim.decisions = [
      ...existing.filter((d) => d.claimLineId !== decision.claimLineId),
      decision,
    ];
  }

  function removeFromClaim(claim: ClaimResponse, lineId: string) {
    const existing = claim.decisions ?? [];
    claim.decisions = existing.filter((d) => d.claimLineId !== lineId);
  }

  function applyToStore(claimId: string, mutate: (claim: ClaimResponse) => void) {
    const claims = useClaimsStore();
    if (claims.currentClaim?.id === claimId) mutate(claims.currentClaim);
    const analysis = claims.analysisResult as AnalyzeClaimResponse | null;
    if (analysis?.claim?.id === claimId) mutate(analysis.claim);
    const listed = claims.claims.find((c) => c.id === claimId);
    if (listed) mutate(listed);
    const option = claims.selectOptions.find((c) => c.id === claimId);
    if (option) mutate(option);
  }

  async function setDecision(
    claimId: string,
    lineId: string,
    input: { decision: LineDecision; note?: string }
  ): Promise<ClaimLineDecisionDto> {
    saving.value = true;
    try {
      const response = await api.post(
        `/api/v1/claims/${claimId}/lines/${lineId}/decision`,
        input
      );
      const decision = response.data as ClaimLineDecisionDto;
      applyToStore(claimId, (claim) => mergeIntoClaim(claim, decision));
      return decision;
    } finally {
      saving.value = false;
    }
  }

  async function clearDecision(claimId: string, lineId: string): Promise<void> {
    saving.value = true;
    try {
      await api.delete(`/api/v1/claims/${claimId}/lines/${lineId}/decision`);
      applyToStore(claimId, (claim) => removeFromClaim(claim, lineId));
    } finally {
      saving.value = false;
    }
  }

  return { saving, setDecision, clearDecision };
});
