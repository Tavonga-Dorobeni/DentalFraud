import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  CreatePatientRequest,
  PaginationMeta,
  PatientDto,
  UpdatePatientRequest,
} from "@fdcdf/shared";
import { api } from "@/composables/useApi";

export const usePatientsStore = defineStore("patients", () => {
  const patients = ref<PatientDto[]>([]);
  const loaded = ref(false);
  const loading = ref(false);

  const list = ref<PatientDto[]>([]);
  const pagination = ref<PaginationMeta | null>(null);
  const listLoading = ref(false);

  async function fetchPatients(force = false) {
    if (loaded.value && !force) return;
    loading.value = true;
    try {
      const response = await api.get("/api/v1/patients", {
        params: { page: 1, pageSize: 100 },
      });
      patients.value = response.data?.items ?? [];
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function fetchList(page = 1, pageSize = 25, search?: string) {
    listLoading.value = true;
    try {
      const response = await api.get("/api/v1/patients", {
        params: { page, pageSize, ...(search ? { search } : {}) },
      });
      list.value = response.data?.items ?? [];
      pagination.value = response.data?.pagination ?? null;
    } finally {
      listLoading.value = false;
    }
  }

  async function createPatient(input: CreatePatientRequest): Promise<PatientDto> {
    const response = await api.post("/api/v1/patients", input);
    loaded.value = false;
    return response.data;
  }

  async function updatePatient(
    patientId: string,
    input: UpdatePatientRequest
  ): Promise<PatientDto> {
    const response = await api.put(`/api/v1/patients/${patientId}`, input);
    loaded.value = false;
    return response.data;
  }

  function findByExternalId(externalId: string): PatientDto | undefined {
    return patients.value.find((p) => p.externalId === externalId);
  }

  return {
    patients,
    loaded,
    loading,
    list,
    pagination,
    listLoading,
    fetchPatients,
    fetchList,
    createPatient,
    updatePatient,
    findByExternalId,
  };
});
