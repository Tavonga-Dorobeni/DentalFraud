import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  CreateProviderRequest,
  PaginationMeta,
  ProviderDto,
  UpdateProviderRequest,
} from "@fdcdf/shared";
import { api } from "@/composables/useApi";

export const useProvidersStore = defineStore("providers", () => {
  const providers = ref<ProviderDto[]>([]);
  const loaded = ref(false);
  const loading = ref(false);

  const list = ref<ProviderDto[]>([]);
  const pagination = ref<PaginationMeta | null>(null);
  const listLoading = ref(false);

  async function fetchProviders(force = false) {
    if (loaded.value && !force) return;
    loading.value = true;
    try {
      const response = await api.get("/api/v1/providers", {
        params: { page: 1, pageSize: 100 },
      });
      providers.value = response.data?.items ?? [];
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function fetchList(page = 1, pageSize = 25, search?: string) {
    listLoading.value = true;
    try {
      const response = await api.get("/api/v1/providers", {
        params: { page, pageSize, ...(search ? { search } : {}) },
      });
      list.value = response.data?.items ?? [];
      pagination.value = response.data?.pagination ?? null;
    } finally {
      listLoading.value = false;
    }
  }

  async function createProvider(input: CreateProviderRequest): Promise<ProviderDto> {
    const response = await api.post("/api/v1/providers", input);
    loaded.value = false;
    return response.data;
  }

  async function updateProvider(
    providerId: string,
    input: UpdateProviderRequest
  ): Promise<ProviderDto> {
    const response = await api.put(`/api/v1/providers/${providerId}`, input);
    loaded.value = false;
    return response.data;
  }

  function findByExternalId(externalId: string): ProviderDto | undefined {
    return providers.value.find((p) => p.externalId === externalId);
  }

  return {
    providers,
    loaded,
    loading,
    list,
    pagination,
    listLoading,
    fetchProviders,
    fetchList,
    createProvider,
    updateProvider,
    findByExternalId,
  };
});
