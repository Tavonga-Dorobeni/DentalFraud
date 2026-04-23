<script setup lang="ts">
import { onMounted, computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { deriveResolutionStatus, type ClaimLineDto, type RuleResultDto } from "@fdcdf/shared";
import { useClaimsStore } from "@/stores/claims.store";
import { useAuthStore } from "@/stores/auth.store";
import { useToast } from "@/composables/useToast";
import GlassPanel from "@/ui/GlassPanel.vue";
import AppButton from "@/ui/AppButton.vue";
import AppSkeletonLoader from "@/ui/AppSkeletonLoader.vue";
import ClaimStatusBadge from "./components/ClaimStatusBadge.vue";
import ResolutionStatusBadge from "./components/ResolutionStatusBadge.vue";
import ClaimLineTable from "./components/ClaimLineTable.vue";
import DuplicateComparisonPanel from "./components/DuplicateComparisonPanel.vue";
import AnalyzeProgressModal from "./components/AnalyzeProgressModal.vue";
import RiskHeader from "@/features/scoring/RiskHeader.vue";
import DentalMap from "@/features/dental-map/DentalMap.vue";
import EvidenceSidebar from "@/features/evidence/EvidenceSidebar.vue";
import { formatDate, humanizeDatesInText } from "@/utils/date";

const route = useRoute();
const router = useRouter();
const claimsStore = useClaimsStore();
const authStore = useAuthStore();
const toast = useToast();

const claimId = computed(() => String(route.params.claimId));
const claim = computed(() => claimsStore.currentClaim);
const analysis = computed(() => claimsStore.analysisResult);

const resolutionStatus = computed(() => {
  if (!claim.value) return null;
  return deriveResolutionStatus(claim.value.lines, claim.value.decisions ?? []);
});

const analyzeButtonLabel = computed(() => (analysis.value ? "Re-analyze" : "Analyze"));

// NEAR_DUPLICATE fires on every analyzed claim as an informational marker and
// carries no unique signal — EXACT_DUPLICATE handles positive matches with a
// clearer explanation, so hide NEAR_DUPLICATE from the findings list entirely.
const visibleRuleResults = computed(() =>
  analysis.value?.ruleResults?.filter((r) => r.ruleId !== "NEAR_DUPLICATE") ?? [],
);

// Dental map + evidence sidebar state
const selectedTooth = ref<number | null>(null);
const selectedLine = ref<ClaimLineDto | null>(null);

// Duplicate-comparison expansion state — keyed by rule-result id, or "warning" for the banner button
const expanded = reactive<Record<string, boolean>>({});
function toggleExpanded(key: string) {
  expanded[key] = !expanded[key];
}

const showAnalyzeModal = ref(false);

const flaggedTeeth = computed(() =>
  claim.value?.lines
    .filter((l) => l.toothNumber != null)
    .map((l) => l.toothNumber!) ?? []
);

function isDuplicateRule(result: RuleResultDto): boolean {
  return result.ruleId === "EXACT_DUPLICATE" || result.ruleId === "NEAR_DUPLICATE";
}

function handleToothSelect(toothNumber: number) {
  if (!authStore.canUseEvidence) return;
  if (toothNumber === 0 || toothNumber === selectedTooth.value) {
    selectedTooth.value = null;
    selectedLine.value = null;
    return;
  }
  selectedTooth.value = toothNumber;
  selectedLine.value =
    claim.value?.lines.find((l) => l.toothNumber === toothNumber) ?? null;
}

function handleLineSelect(line: ClaimLineDto) {
  if (!authStore.canUseEvidence) return;
  selectedLine.value = line;
  selectedTooth.value = line.toothNumber ?? null;
}

function closeEvidence() {
  selectedTooth.value = null;
  selectedLine.value = null;
}

onMounted(() => {
  claimsStore.fetchClaim(claimId.value);
});

async function handleAnalyze() {
  try {
    await claimsStore.analyzeClaim(claimId.value);
    showAnalyzeModal.value = true;
  } catch {
    toast.error("Analysis failed.");
  }
}
</script>

<template>
  <div>
    <!-- Back button -->
    <button class="text-sm text-navy-500 hover:text-navy-auth mb-4 flex items-center gap-1" @click="router.push('/claims')">
      &larr; Back to Claims
    </button>

    <!-- Loading skeleton -->
    <div v-if="claimsStore.loading && !claim" class="space-y-4">
      <AppSkeletonLoader shape="rect" height="6rem" />
      <AppSkeletonLoader shape="rect" height="12rem" />
    </div>

    <template v-else-if="claim">
      <!-- Risk Header (shown after analysis) -->
      <RiskHeader v-if="analysis?.riskScore" :risk-score="analysis.riskScore" />

      <!-- Claim header -->
      <GlassPanel class="mb-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-xl font-semibold text-navy-auth">
              Claim <span class="font-mono">{{ claim.externalClaimId }}</span>
            </h1>
            <div class="text-xs text-navy-500 mt-1">Internal ID: {{ claim.id }}</div>
          </div>
          <div class="flex items-center gap-3">
            <ClaimStatusBadge :status="claim.status" />
            <ResolutionStatusBadge v-if="resolutionStatus" :status="resolutionStatus" />
            <AppButton
              size="sm"
              variant="secondary"
              @click="router.push({ path: '/audit-trail', query: { claimId: claim.id } })"
            >
              Audit Trail
            </AppButton>
            <AppButton size="sm" :loading="claimsStore.loading" @click="handleAnalyze">
              {{ analyzeButtonLabel }}
            </AppButton>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-xs text-navy-500">Patient</span>
            <div class="font-mono text-navy-auth">{{ claim.patientId }}</div>
          </div>
          <div>
            <span class="text-xs text-navy-500">Provider</span>
            <div class="font-mono text-navy-auth">{{ claim.providerId }}</div>
          </div>
          <div>
            <span class="text-xs text-navy-500">Date of Service</span>
            <div>{{ formatDate(claim.dateOfService) }}</div>
          </div>
          <div>
            <span class="text-xs text-navy-500">Submitted</span>
            <div>{{ formatDate(claim.submissionDate) }}</div>
          </div>
        </div>

        <!-- Warnings -->
        <div v-if="claim.warnings.length" class="mt-3 bg-amber-alert-light rounded-lg px-3 py-2">
          <div class="flex items-center justify-between">
            <div class="text-xs font-medium text-amber-alert">Warnings</div>
            <button
              v-if="claim.duplicateOfClaimId"
              class="text-xs font-medium text-amber-alert hover:underline"
              @click="toggleExpanded('warning')"
            >
              {{ expanded.warning ? "Hide comparison" : "Compare with matched claim" }}
            </button>
          </div>
          <ul class="text-xs text-navy-auth space-y-0.5 mt-1">
            <li v-for="(w, i) in claim.warnings" :key="i">{{ humanizeDatesInText(w) }}</li>
          </ul>
          <DuplicateComparisonPanel
            v-if="claim.duplicateOfClaimId && expanded.warning"
            class="mt-3"
            :current-claim="claim"
            :matched-claim-id="claim.duplicateOfClaimId"
          />
        </div>
      </GlassPanel>

      <!-- Dental Map (shown when claim has lines with tooth numbers) -->
      <div v-if="flaggedTeeth.length" class="mb-4">
        <DentalMap
          :flagged-teeth="flaggedTeeth"
          :selected-tooth="selectedTooth"
          @select="handleToothSelect"
        />
      </div>

      <!-- Claim lines -->
      <div class="mb-4">
        <h2 class="text-sm font-semibold text-navy-auth mb-2">Claim Lines</h2>
        <ClaimLineTable
          :lines="claim.lines"
          :decisions="claim.decisions ?? []"
          :interactive="authStore.canUseEvidence"
          @select-line="handleLineSelect"
        />
      </div>

      <!-- Analysis results: rule results -->
      <div v-if="visibleRuleResults.length" class="mb-4">
        <h2 class="text-sm font-semibold text-navy-auth mb-2">Rule Results</h2>
        <div class="border border-border-subtle rounded-lg divide-y divide-border-subtle">
          <div
            v-for="result in visibleRuleResults"
            :key="result.id"
            class="px-4 py-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="text-sm text-navy-auth">{{ humanizeDatesInText(result.explanation) }}</div>
                <div class="text-xs text-navy-500 mt-0.5 font-mono">Rule: {{ result.ruleId }}</div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  v-if="isDuplicateRule(result) && result.matchedClaimId"
                  class="text-xs font-medium text-navy-auth border border-border-subtle rounded-full px-2.5 py-0.5 hover:bg-surface-glass"
                  @click="toggleExpanded(result.id)"
                >
                  {{ expanded[result.id] ? "Hide" : "Compare" }}
                </button>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="{
                  'bg-blue-clinical-light text-blue-clinical': result.severity === 'LOW',
                  'bg-amber-alert-light text-amber-alert': result.severity === 'MEDIUM' || result.severity === 'HIGH',
                  'bg-red-critical-light text-red-critical': result.severity === 'CRITICAL',
                }">
                  {{ result.severity }}
                </span>
              </div>
            </div>
            <DuplicateComparisonPanel
              v-if="isDuplicateRule(result) && result.matchedClaimId && expanded[result.id]"
              class="mt-3"
              :current-claim="claim"
              :matched-claim-id="result.matchedClaimId"
            />
          </div>
        </div>
      </div>

      <!-- Analysis results: alerts generated (only roles that can view alerts) -->
      <div v-if="authStore.canViewAlerts && analysis?.alerts?.length">
        <h2 class="text-sm font-semibold text-navy-auth mb-2">Generated Alerts</h2>
        <div class="border border-border-subtle rounded-lg divide-y divide-border-subtle">
          <div
            v-for="alert in analysis.alerts"
            :key="alert.id"
            class="px-4 py-3 cursor-pointer hover:bg-surface-glass"
            @click="router.push(`/alerts/${alert.id}`)"
          >
            <div class="flex items-center justify-between">
              <div class="text-sm text-navy-auth">{{ humanizeDatesInText(alert.summary) }}</div>
              <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="{
                'bg-blue-clinical-light text-blue-clinical': alert.severity === 'LOW',
                'bg-amber-alert-light text-amber-alert': alert.severity === 'MEDIUM' || alert.severity === 'HIGH',
                'bg-red-critical-light text-red-critical': alert.severity === 'CRITICAL',
              }">
                {{ alert.severity }}
              </span>
            </div>
            <div class="text-xs text-navy-500 mt-1">{{ humanizeDatesInText(alert.recommendedAction) }}</div>
          </div>
        </div>
      </div>

      <!-- Evidence Sidebar (Admin/Investigator only) -->
      <EvidenceSidebar
        v-if="authStore.canUseEvidence"
        :line="selectedLine"
        :tooth-number="selectedTooth"
        @close="closeEvidence"
      />
    </template>

    <AnalyzeProgressModal
      :open="showAnalyzeModal"
      :analysis="analysis"
      @close="showAnalyzeModal = false"
    />
  </div>
</template>
