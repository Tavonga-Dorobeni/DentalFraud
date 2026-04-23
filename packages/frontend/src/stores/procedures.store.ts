import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  CreateProcedureRequest,
  PaginationMeta,
  ProcedureDto,
  UpdateProcedureRequest,
} from "@fdcdf/shared";
import { api } from "@/composables/useApi";

export const useProceduresStore = defineStore("procedures", () => {
  const procedures = ref<ProcedureDto[]>([]);
  const loaded = ref(false);
  const loading = ref(false);

  const list = ref<ProcedureDto[]>([]);
  const pagination = ref<PaginationMeta | null>(null);
  const listLoading = ref(false);

  async function fetchProcedures(force = false) {
    if (loaded.value && !force) return;
    loading.value = true;
    try {
      const response = await api.get("/api/v1/procedures", {
        params: { page: 1, pageSize: 100 },
      });
      procedures.value = response.data?.items ?? [];
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function fetchList(page = 1, pageSize = 25, search?: string) {
    listLoading.value = true;
    try {
      const response = await api.get("/api/v1/procedures", {
        params: { page, pageSize, ...(search ? { search } : {}) },
      });
      list.value = response.data?.items ?? [];
      pagination.value = response.data?.pagination ?? null;
    } finally {
      listLoading.value = false;
    }
  }

  async function createProcedure(input: CreateProcedureRequest): Promise<ProcedureDto> {
    const response = await api.post("/api/v1/procedures", input);
    loaded.value = false;
    return response.data;
  }

  async function updateProcedure(
    procedureId: string,
    input: UpdateProcedureRequest
  ): Promise<ProcedureDto> {
    const response = await api.put(`/api/v1/procedures/${procedureId}`, input);
    loaded.value = false;
    return response.data;
  }

  function findByCode(code: string): ProcedureDto | undefined {
    return procedures.value.find((p) => p.code === code);
  }

  return {
    procedures,
    loaded,
    loading,
    list,
    pagination,
    listLoading,
    fetchProcedures,
    fetchList,
    createProcedure,
    updateProcedure,
    findByCode,
  };
});
