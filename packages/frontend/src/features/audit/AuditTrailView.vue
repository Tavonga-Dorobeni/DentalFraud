<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, nextTick, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { deriveResolutionStatus, ResolutionStatus, type ClaimResponse } from "@fdcdf/shared";
import { useClaimsStore } from "@/stores/claims.store";
import { useAuditStore } from "@/stores/audit.store";
import { useToast } from "@/composables/useToast";
import GlassPanel from "@/ui/GlassPanel.vue";
import AppSkeletonLoader from "@/ui/AppSkeletonLoader.vue";
import ClaimStatusBadge from "@/features/claims/components/ClaimStatusBadge.vue";
import ResolutionStatusBadge from "@/features/claims/components/ResolutionStatusBadge.vue";
import AuditTrailTimeline from "./components/AuditTrailTimeline.vue";
import { formatDate } from "@/utils/date";

interface ClaimOption {
  id: string;
  label: string;
  externalClaimId: string;
  resolution: ResolutionStatus;
  resolutionLabel: string;
}

const route = useRoute();
const router = useRouter();
const claimsStore = useClaimsStore();
const auditStore = useAuditStore();
const toast = useToast();

const selectedClaimId = ref<string | null>(null);
const query = ref("");
const dropdownOpen = ref(false);
const inputEl = ref<HTMLInputElement | null>(null);
const menuPos = reactive({ top: 0, left: 0, width: 0, maxHeight: 320 });

function updateMenuPosition() {
  if (!inputEl.value) return;
  const rect = inputEl.value.getBoundingClientRect();
  menuPos.top = rect.bottom + 4;
  menuPos.left = rect.left;
  menuPos.width = rect.width;
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  menuPos.maxHeight = Math.max(200, Math.min(320, spaceBelow));
}

const RESOLUTION_LABELS: Record<ResolutionStatus, string> = {
  [ResolutionStatus.PENDING_REVIEW]: "Pending Review",
  [ResolutionStatus.IN_REVIEW]: "In Review",
  [ResolutionStatus.CLEARED]: "Cleared",
  [ResolutionStatus.EDUCATION_FLAGGED]: "Education Flagged",
  [ResolutionStatus.CONFIRMED_FRAUD]: "Confirmed Fraud",
};

const options = computed<ClaimOption[]>(() =>
  claimsStore.selectOptions.map((c: ClaimResponse) => {
    const resolution = deriveResolutionStatus(c.lines, c.decisions ?? []);
    return {
      id: c.id,
      externalClaimId: c.externalClaimId,
      label: c.externalClaimId,
      resolution,
      resolutionLabel: RESOLUTION_LABELS[resolution],
    };
  }),
);

const selectedClaim = computed<ClaimResponse | null>(() => {
  if (!selectedClaimId.value) return null;
  return claimsStore.selectOptions.find((c) => c.id === selectedClaimId.value) ?? null;
});

const selectedOption = computed(() =>
  options.value.find((o) => o.id === selectedClaimId.value) ?? null,
);

const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return options.value;
  return options.value.filter(
    (o) =>
      o.externalClaimId.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.resolutionLabel.toLowerCase().includes(q),
  );
});

function resolutionClass(status: ResolutionStatus): string {
  switch (status) {
    case ResolutionStatus.PENDING_REVIEW:
      return "bg-border-subtle text-navy-500";
    case ResolutionStatus.IN_REVIEW:
    case ResolutionStatus.CLEARED:
      return "bg-blue-clinical-light text-blue-clinical";
    case ResolutionStatus.EDUCATION_FLAGGED:
      return "bg-amber-alert-light text-amber-alert";
    case ResolutionStatus.CONFIRMED_FRAUD:
      return "bg-red-critical-light text-red-critical";
    default:
      return "bg-border-subtle text-navy-500";
  }
}

function onFocus() {
  dropdownOpen.value = true;
  if (selectedOption.value) query.value = "";
  nextTick(updateMenuPosition);
  window.addEventListener("scroll", updateMenuPosition, true);
  window.addEventListener("resize", updateMenuPosition);
}

function closeDropdown() {
  dropdownOpen.value = false;
  if (selectedOption.value) query.value = selectedOption.value.label;
  else query.value = "";
  window.removeEventListener("scroll", updateMenuPosition, true);
  window.removeEventListener("resize", updateMenuPosition);
}

function onBlur() {
  setTimeout(closeDropdown, 150);
}

function onInput() {
  dropdownOpen.value = true;
  updateMenuPosition();
}

function pickOption(opt: ClaimOption) {
  selectedClaimId.value = opt.id;
  query.value = opt.label;
  closeDropdown();
  router.replace({ query: { ...route.query, claimId: opt.id } });
}

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateMenuPosition, true);
  window.removeEventListener("resize", updateMenuPosition);
});

function clearSelection() {
  selectedClaimId.value = null;
  query.value = "";
  auditStore.reset();
  const nextQuery = { ...route.query };
  delete nextQuery.claimId;
  router.replace({ query: nextQuery });
  inputEl.value?.focus();
}

async function loadAuditTrail(claimId: string) {
  try {
    await auditStore.fetchAuditTrail(claimId);
  } catch {
    toast.error("Failed to load audit trail.");
  }
}

watch(selectedClaimId, (id) => {
  if (id) loadAuditTrail(id);
});

onMounted(async () => {
  await claimsStore.fetchClaimsForSelect();
  const queryClaimId = route.query.claimId;
  if (typeof queryClaimId === "string" && queryClaimId) {
    selectedClaimId.value = queryClaimId;
    const match = options.value.find((o) => o.id === queryClaimId);
    query.value = match?.label ?? "";
  }
});
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-navy-auth">Audit Trail</h1>
      <p class="text-sm text-navy-500 mt-1">
        Immutable record of every action taken against a claim — ingestion, analysis, decisions, and alert lifecycle.
      </p>
    </div>

    <!-- Claim selector -->
    <GlassPanel class="mb-6">
      <label class="block text-xs font-medium text-navy-500 mb-1.5">
        Select claim
      </label>
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <input
            ref="inputEl"
            v-model="query"
            type="text"
            autocomplete="off"
            placeholder="Search by claim ID or review status…"
            :disabled="claimsStore.selectOptionsLoading"
            class="w-full px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-clinical bg-white font-mono"
            @focus="onFocus"
            @blur="onBlur"
            @input="onInput"
          />
          <Teleport to="body">
            <div
              v-if="dropdownOpen && filteredOptions.length"
              class="fixed z-[60] overflow-auto rounded-lg border border-border-subtle bg-white shadow-lg"
              :style="{
                top: menuPos.top + 'px',
                left: menuPos.left + 'px',
                width: menuPos.width + 'px',
                maxHeight: menuPos.maxHeight + 'px',
              }"
            >
              <button
                v-for="opt in filteredOptions"
                :key="opt.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-b-0 border-border-subtle/50 flex items-center justify-between gap-3"
                @mousedown.prevent="pickOption(opt)"
              >
                <div class="min-w-0">
                  <div class="font-mono font-medium text-navy-auth truncate">
                    {{ opt.externalClaimId }}
                  </div>
                  <div class="text-[11px] font-mono text-navy-500 truncate">{{ opt.id }}</div>
                </div>
                <span
                  class="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                  :class="resolutionClass(opt.resolution)"
                >
                  {{ opt.resolutionLabel }}
                </span>
              </button>
            </div>
            <div
              v-else-if="dropdownOpen && !filteredOptions.length"
              class="fixed z-[60] rounded-lg border border-border-subtle bg-white shadow-lg px-3 py-2 text-xs text-navy-500"
              :style="{
                top: menuPos.top + 'px',
                left: menuPos.left + 'px',
                width: menuPos.width + 'px',
              }"
            >
              {{ claimsStore.selectOptionsLoading ? "Loading claims…" : "No matching claims." }}
            </div>
          </Teleport>
        </div>
        <button
          v-if="selectedClaimId"
          type="button"
          class="text-xs text-navy-500 hover:text-red-critical px-2 py-1"
          @click="clearSelection"
        >
          Clear
        </button>
      </div>
    </GlassPanel>

    <!-- Empty state before selection -->
    <div
      v-if="!selectedClaimId"
      class="text-sm text-navy-500 border border-dashed border-border-subtle rounded-xl px-6 py-12 text-center"
    >
      Select a claim above to view its audit trail.
    </div>

    <!-- Selected claim summary + timeline -->
    <template v-else>
      <GlassPanel class="mb-4" :padding="true">
        <div v-if="selectedClaim" class="flex items-center justify-between gap-4 flex-wrap">
          <div class="min-w-0">
            <div class="text-xs text-navy-500">Claim</div>
            <div class="text-lg font-semibold text-navy-auth font-mono">
              {{ selectedClaim.externalClaimId }}
            </div>
            <div class="text-[11px] font-mono text-navy-500 mt-0.5">{{ selectedClaim.id }}</div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
            <div>
              <div class="text-[11px] text-navy-500">Patient</div>
              <div class="font-mono text-navy-auth">{{ selectedClaim.patientId }}</div>
            </div>
            <div>
              <div class="text-[11px] text-navy-500">Provider</div>
              <div class="font-mono text-navy-auth">{{ selectedClaim.providerId }}</div>
            </div>
            <div>
              <div class="text-[11px] text-navy-500">Date of Service</div>
              <div>{{ formatDate(selectedClaim.dateOfService) }}</div>
            </div>
            <div class="flex items-end gap-2">
              <ClaimStatusBadge :status="selectedClaim.status" />
              <ResolutionStatusBadge
                :status="deriveResolutionStatus(selectedClaim.lines, selectedClaim.decisions ?? [])"
              />
            </div>
          </div>
          <router-link
            :to="`/claims/${selectedClaim.id}`"
            class="text-xs font-medium text-blue-clinical hover:underline"
          >
            Open claim &rarr;
          </router-link>
        </div>
      </GlassPanel>

      <!-- Loading skeleton -->
      <div v-if="auditStore.loading" class="space-y-3">
        <AppSkeletonLoader v-for="i in 4" :key="i" shape="rect" height="4.5rem" />
      </div>

      <!-- Error state -->
      <div
        v-else-if="auditStore.error"
        class="text-sm text-red-critical border border-red-critical/30 bg-red-critical-light rounded-lg px-4 py-3"
      >
        {{ auditStore.error }}
      </div>

      <!-- Timeline -->
      <AuditTrailTimeline v-else :events="auditStore.events" />
    </template>
  </div>
</template>
