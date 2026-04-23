<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { ProviderDto } from "@fdcdf/shared";
import { useProvidersStore } from "@/stores/providers.store";
import { useToast } from "@/composables/useToast";
import AppDataTable, { type Column } from "@/ui/AppDataTable.vue";
import AppButton from "@/ui/AppButton.vue";
import AppModal from "@/ui/AppModal.vue";
import ProviderForm from "./components/ProviderForm.vue";
import { formatDate } from "@/utils/date";

const store = useProvidersStore();
const toast = useToast();

const showForm = ref(false);
const editing = ref<ProviderDto | null>(null);
const submitting = ref(false);

const columns: Column<ProviderDto>[] = [
  { key: "externalId", label: "External ID", mono: true },
  { key: "name", label: "Name" },
  { key: "specialty", label: "Specialty" },
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

function openEdit(row: ProviderDto) {
  editing.value = row;
  showForm.value = true;
}

async function handleSubmit(data: { externalId: string; name: string; specialty?: string }) {
  submitting.value = true;
  try {
    if (editing.value) {
      await store.updateProvider(editing.value.id, data);
      toast.success("Provider updated.");
    } else {
      await store.createProvider(data);
      toast.success("Provider created.");
    }
    showForm.value = false;
    await store.fetchList(store.pagination?.page ?? 1);
  } catch {
    toast.error("Failed to save provider.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-navy-auth">Providers</h1>
      <AppButton @click="openCreate">New Provider</AppButton>
    </div>

    <AppDataTable
      :columns="columns"
      :rows="store.list"
      :pagination="store.pagination ?? undefined"
      :loading="store.listLoading"
      @page-change="handlePageChange"
      @row-click="openEdit"
    >
      <template #cell-specialty="{ value }">
        {{ value ?? "—" }}
      </template>
      <template #cell-createdAt="{ value }">
        {{ formatDate(value as string) }}
      </template>
    </AppDataTable>

    <AppModal
      v-if="showForm"
      :title="editing ? 'Edit Provider' : 'Create New Provider'"
      @close="showForm = false"
    >
      <ProviderForm
        :initial="editing"
        :submitting="submitting"
        @submit="handleSubmit"
        @cancel="showForm = false"
      />
    </AppModal>
  </div>
</template>
