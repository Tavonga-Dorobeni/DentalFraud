<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { ProcedureDto } from "@fdcdf/shared";
import { useProceduresStore } from "@/stores/procedures.store";
import { useToast } from "@/composables/useToast";
import AppDataTable, { type Column } from "@/ui/AppDataTable.vue";
import AppButton from "@/ui/AppButton.vue";
import AppModal from "@/ui/AppModal.vue";
import ProcedureForm from "./components/ProcedureForm.vue";

type ProcedureFormData = {
  code: string;
  description: string;
  category: string;
  complexityLevel: number;
  requiresEvidence: boolean;
  allowedDentition: "PRIMARY" | "PERMANENT" | "BOTH";
};

const store = useProceduresStore();
const toast = useToast();

const showForm = ref(false);
const editing = ref<ProcedureDto | null>(null);
const submitting = ref(false);

const columns: Column<ProcedureDto>[] = [
  { key: "code", label: "Code", mono: true },
  { key: "description", label: "Description" },
  { key: "category", label: "Category" },
  { key: "complexityLevel", label: "Complexity" },
  { key: "allowedDentition", label: "Dentition" },
  { key: "requiresEvidence", label: "Evidence" },
];

onMounted(() => store.fetchList());

function handlePageChange(page: number) {
  store.fetchList(page);
}

function openCreate() {
  editing.value = null;
  showForm.value = true;
}

function openEdit(row: ProcedureDto) {
  editing.value = row;
  showForm.value = true;
}

async function handleSubmit(data: ProcedureFormData) {
  submitting.value = true;
  try {
    if (editing.value) {
      await store.updateProcedure(editing.value.id, data);
      toast.success("Procedure updated.");
    } else {
      await store.createProcedure(data);
      toast.success("Procedure created.");
    }
    showForm.value = false;
    await store.fetchList(store.pagination?.page ?? 1);
  } catch {
    toast.error("Failed to save procedure.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-navy-auth">Procedure Catalog</h1>
      <AppButton @click="openCreate">New Procedure</AppButton>
    </div>

    <AppDataTable
      :columns="columns"
      :rows="store.list"
      :pagination="store.pagination ?? undefined"
      :loading="store.listLoading"
      @page-change="handlePageChange"
      @row-click="openEdit"
    >
      <template #cell-requiresEvidence="{ value }">
        <span
          :class="[
            'text-xs px-2 py-0.5 rounded-full',
            value
              ? 'bg-amber-warn-light text-amber-warn'
              : 'bg-surface-glass text-navy-500',
          ]"
        >
          {{ value ? "Required" : "—" }}
        </span>
      </template>
    </AppDataTable>

    <AppModal
      v-if="showForm"
      :title="editing ? 'Edit Procedure' : 'Create New Procedure'"
      size="lg"
      @close="showForm = false"
    >
      <ProcedureForm
        :initial="editing"
        :submitting="submitting"
        @submit="handleSubmit"
        @cancel="showForm = false"
      />
    </AppModal>
  </div>
</template>
