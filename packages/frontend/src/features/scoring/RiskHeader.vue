<script setup lang="ts">
import { computed } from "vue";
import type { RiskScoreDto } from "@fdcdf/shared";
import GlassPanel from "@/ui/GlassPanel.vue";
import IntegrityShield from "@/ui/IntegrityShield.vue";
import ScoreDisplay from "./components/ScoreDisplay.vue";
import PartnerInsight from "./components/PartnerInsight.vue";
import ContributingFactors from "./components/ContributingFactors.vue";

const props = defineProps<{
  riskScore: RiskScoreDto;
}>();

// NEAR_DUPLICATE is an informational marker that fires on every analyzed claim —
// strip it out of the surfaced factors so it doesn't pollute the partner insight
// or contributing-factor list.
const visibleFactors = computed(() =>
  props.riskScore.contributingFactors.filter((f) => f.ruleId !== "NEAR_DUPLICATE"),
);
</script>

<template>
  <GlassPanel class="mb-4">
    <div class="flex items-start gap-4">
      <!-- Shield icon -->
      <IntegrityShield :band="riskScore.band" size="lg" />

      <!-- Score and insight -->
      <div class="flex-1 space-y-3">
        <div class="flex items-start justify-between">
          <ScoreDisplay
            :score="riskScore.score"
            :band="riskScore.band"
            :confidence="riskScore.confidence"
          />
        </div>

        <PartnerInsight :factors="visibleFactors" />

        <ContributingFactors :factors="visibleFactors" />
      </div>
    </div>
  </GlassPanel>
</template>
