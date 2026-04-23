<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { deriveResolutionStatus, type ClaimResponse } from "@fdcdf/shared";
import { useClaimsStore } from "@/stores/claims.store";
import { useToast } from "@/composables/useToast";
import AppDataTable, { type Column } from "@/ui/AppDataTable.vue";
import AppButton from "@/ui/AppButton.vue";
import AppModal from "@/ui/AppModal.vue";
import ClaimStatusBadge from "./components/ClaimStatusBadge.vue";
import ResolutionStatusBadge from "./components/ResolutionStatusBadge.vue";
import ClaimCreateForm from "./components/ClaimCreateForm.vue";
import { formatDate } from "@/utils/date";

const router = useRouter();
const claimsStore = useClaimsStore();
const toast = useToast();
const showCreateForm = ref(false);
const isValidating = ref(false);

const VALIDATION_DELAY_MS = 1600;

const columns = [
  { key: "externalClaimId", label: "Claim ID", mono: true },
  { key: "patientId", label: "Patient" },
  { key: "providerId", label: "Provider" },
  { key: "dateOfService", label: "Date of Service" },
  { key: "status", label: "Status" },
  { key: "resolution", label: "Review" },
  { key: "createdAt", label: "Created" },
  { key: "actions", label: "", class: "w-28" },
] as Column<ClaimResponse>[];

function openAuditTrail(row: ClaimResponse) {
  router.push({ path: "/audit-trail", query: { claimId: row.id } });
}

onMounted(() => {
  claimsStore.fetchClaims();
});

function handlePageChange(page: number) {
  claimsStore.fetchClaims(page);
}

function handleRowClick(row: ClaimResponse) {
  router.push(`/claims/${row.id}`);
}

function handleModalClose() {
  if (isValidating.value) return;
  showCreateForm.value = false;
}

async function handleCreate(data: Parameters<typeof claimsStore.createClaim>[0]) {
  if (isValidating.value) return;
  isValidating.value = true;
  try {
    const [claim] = await Promise.all([
      claimsStore.createClaim(data),
      new Promise((resolve) => setTimeout(resolve, VALIDATION_DELAY_MS)),
    ]);
    showCreateForm.value = false;
    if (claim.warnings && claim.warnings.length > 0) {
      toast.warning("Claim Accepted with Warning");
    } else {
      toast.success("Claim Accepted");
    }
    router.push(`/claims/${claim.id}`);
  } catch {
    toast.error("Failed to create claim.");
  } finally {
    isValidating.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-navy-auth">Claims</h1>
      <AppButton @click="showCreateForm = true">New Claim</AppButton>
    </div>

    <AppDataTable
      :columns="columns"
      :rows="claimsStore.claims"
      :pagination="claimsStore.pagination ?? undefined"
      :loading="claimsStore.loading"
      @page-change="handlePageChange"
      @row-click="handleRowClick"
    >
      <template #cell-status="{ row }">
        <ClaimStatusBadge :status="row.status" />
      </template>
      <template #cell-resolution="{ row }">
        <ResolutionStatusBadge
          :status="deriveResolutionStatus(row.lines, row.decisions ?? [])"
        />
      </template>
      <template #cell-dateOfService="{ value }">
        {{ formatDate(value as string) }}
      </template>
      <template #cell-createdAt="{ value }">
        {{ formatDate(value as string) }}
      </template>
      <template #cell-actions="{ row }">
        <button
          class="text-xs font-medium text-blue-clinical hover:underline"
          @click.stop="openAuditTrail(row)"
        >
          Audit trail
        </button>
      </template>
    </AppDataTable>

    <!-- Create claim modal -->
    <AppModal
      v-if="showCreateForm"
      title="Create New Claim"
      size="xl"
      @close="handleModalClose"
    >
      <ClaimCreateForm
        :loading="isValidating"
        @submit="handleCreate"
        @cancel="handleModalClose"
      />
    </AppModal>
  </div>
</template>
