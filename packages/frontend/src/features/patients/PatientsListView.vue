<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { PatientDto } from "@fdcdf/shared";
import { usePatientsStore } from "@/stores/patients.store";
import { useToast } from "@/composables/useToast";
import AppDataTable, { type Column } from "@/ui/AppDataTable.vue";
import AppButton from "@/ui/AppButton.vue";
import AppModal from "@/ui/AppModal.vue";
import PatientForm from "./components/PatientForm.vue";
import { formatDate } from "@/utils/date";

const store = usePatientsStore();
const toast = useToast();

const showForm = ref(false);
const editing = ref<PatientDto | null>(null);
const submitting = ref(false);

const columns: Column<PatientDto>[] = [
  { key: "externalId", label: "External ID", mono: true },
  { key: "name", label: "Name" },
  { key: "dateOfBirth", label: "Date of Birth" },
  { key: "createdAt", label: "Created" },
];

onMounted(() => store.fetchList());

function handlePageChange(page: number) {
  store.fetchList(page);
}

function openCreate() {
  editing.value = null;
  showForm.value = true;
}

function openEdit(row: PatientDto) {
  editing.value = row;
  showForm.value = true;
}

async function handleSubmit(data: { externalId: string; name: string; dateOfBirth?: string }) {
  submitting.value = true;
  try {
    if (editing.value) {
      await store.updatePatient(editing.value.id, data);
      toast.success("Patient updated.");
    } else {
      await store.createPatient(data);
      toast.success("Patient created.");
    }
    showForm.value = false;
    await store.fetchList(store.pagination?.page ?? 1);
  } catch {
    toast.error("Failed to save patient.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-navy-auth">Patients</h1>
      <AppButton @click="openCreate">New Patient</AppButton>
    </div>

    <AppDataTable
      :columns="columns"
      :rows="store.list"
      :pagination="store.pagination ?? undefined"
      :loading="store.listLoading"
      @page-change="handlePageChange"
      @row-click="openEdit"
    >
      <template #cell-dateOfBirth="{ value }">
        {{ formatDate(value as string | null | undefined) }}
      </template>
      <template #cell-createdAt="{ value }">
        {{ formatDate(value as string) }}
      </template>
    </AppDataTable>

    <AppModal
      v-if="showForm"
      :title="editing ? 'Edit Patient' : 'Create New Patient'"
      @close="showForm = false"
    >
      <PatientForm
        :initial="editing"
        :submitting="submitting"
        @submit="handleSubmit"
        @cancel="showForm = false"
      />
    </AppModal>
  </div>
</template>
