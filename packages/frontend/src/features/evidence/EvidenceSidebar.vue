<script setup lang="ts">
import { computed } from "vue";
import type { ClaimLineDto, LineDecision } from "@fdcdf/shared";
import { useToast } from "@/composables/useToast";
import { useClaimsStore } from "@/stores/claims.store";
import { useDecisionsStore } from "@/stores/decisions.store";
import GlassPanel from "@/ui/GlassPanel.vue";
import ComparisonCard from "./components/ComparisonCard.vue";
import MismatchMarker from "./components/MismatchMarker.vue";
import QuickActionToggles from "./components/QuickActionToggles.vue";
import DecisionPill from "@/features/claims/components/DecisionPill.vue";

const props = defineProps<{
  line: ClaimLineDto | null;
  toothNumber: number | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const toast = useToast();
const claimsStore = useClaimsStore();
const decisionsStore = useDecisionsStore();

const currentDecision = computed(() => {
  if (!props.line || !claimsStore.currentClaim) return null;
  const decisions = claimsStore.currentClaim.decisions ?? [];
  return decisions.find((d) => d.claimLineId === props.line!.id) ?? null;
});

const decisionLabels: Record<LineDecision, string> = {
  LEGITIMATE: "marked as legitimate",
  EDUCATION_REQUIRED: "flagged for education",
  CONFIRMED_FRAUD: "marked as confirmed fraud",
};

async function handleSet(decision: LineDecision) {
  if (!props.line || !claimsStore.currentClaim) return;
  if (currentDecision.value?.decision === decision) return;
  try {
    await decisionsStore.setDecision(
      claimsStore.currentClaim.id,
      props.line.id,
      { decision }
    );
    toast.success(`Line ${decisionLabels[decision]}.`);
  } catch {
    toast.error("Could not save decision.");
  }
}

async function handleClear() {
  if (!props.line || !claimsStore.currentClaim) return;
  try {
    await decisionsStore.clearDecision(
      claimsStore.currentClaim.id,
      props.line.id
    );
    toast.success("Decision cleared.");
  } catch {
    toast.error("Could not clear decision.");
  }
}
</script>

<template>
  <Transition name="slide">
    <GlassPanel
      v-if="line"
      class="fixed top-0 right-0 h-full w-96 z-40 shadow-2xl overflow-y-auto rounded-none"
    >
      <!-- Header -->
      <div class="flex items-start justify-between mb-4 gap-3">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-navy-auth">Evidence Panel</h3>
          <div v-if="toothNumber" class="text-xs text-navy-500">
            Tooth <span class="font-mono font-medium">{{ toothNumber }}</span>
          </div>
          <div v-if="currentDecision" class="mt-2 flex items-center gap-2">
            <DecisionPill :decision="currentDecision.decision" />
            <button
              type="button"
              class="text-[11px] text-navy-500 hover:text-navy-auth underline decoration-dotted disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="decisionsStore.saving"
              @click="handleClear"
            >
              Clear
            </button>
          </div>
        </div>
        <button
          class="text-navy-500 hover:text-navy-auth transition-colors flex-shrink-0"
          aria-label="Close evidence panel"
          @click="emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Mismatch marker -->
      <MismatchMarker
        v-if="line.procedureCode && line.documentedProcedureCode"
        :claimed-code="line.procedureCode"
        :documented-code="line.documentedProcedureCode"
        class="mb-4"
      />

      <!-- Side-by-side comparison -->
      <div class="flex gap-3 mb-4">
        <ComparisonCard
          title="Claimed"
          variant="claimed"
          :procedure-code="line.procedureCode"
          :amount="line.claimedAmount"
          :notes="line.evidenceSummary"
        />
        <ComparisonCard
          title="Documented"
          variant="verified"
          :procedure-code="line.documentedProcedureCode"
          :notes="line.chartNotes"
        />
      </div>

      <!-- Additional evidence -->
      <div v-if="line.radiographReference || line.treatmentPlanReference" class="mb-4 space-y-2">
        <div v-if="line.radiographReference">
          <div class="text-[10px] text-navy-500 uppercase tracking-wider">Radiograph</div>
          <div class="text-xs text-navy-auth font-mono">{{ line.radiographReference }}</div>
        </div>
        <div v-if="line.treatmentPlanReference">
          <div class="text-[10px] text-navy-500 uppercase tracking-wider">Treatment Plan</div>
          <div class="text-xs text-navy-auth font-mono">{{ line.treatmentPlanReference }}</div>
        </div>
      </div>

      <!-- Quick action toggles -->
      <QuickActionToggles
        :current="currentDecision?.decision ?? null"
        :disabled="decisionsStore.saving"
        @set="handleSet"
      />
    </GlassPanel>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
