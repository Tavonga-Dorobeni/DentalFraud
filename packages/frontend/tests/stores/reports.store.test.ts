import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useReportsStore } from "@/stores/reports.store";

vi.mock("@/composables/useApi", () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    api: mockApi,
    setAccessToken: vi.fn(),
    getAccessToken: vi.fn(),
  };
});

describe("reports store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("starts with empty state and no loading/error flags", () => {
    const store = useReportsStore();
    expect(store.riskBands).toBeNull();
    expect(store.ruleFrequency).toBeNull();
    expect(store.decisionCounts).toBeNull();
    expect(store.topEntities).toBeNull();
    expect(store.loading.riskBands).toBe(false);
    expect(store.error.riskBands).toBe(false);
  });

  it("fetchRiskBands populates the slice on success", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { series: [{ label: "HIGH", value: 4 }] },
    });

    const store = useReportsStore();
    await store.fetchRiskBands();

    expect(api.get).toHaveBeenCalledWith(
      "/api/v1/reports/risk-band-distribution"
    );
    expect(store.riskBands).toEqual([{ label: "HIGH", value: 4 }]);
    expect(store.loading.riskBands).toBe(false);
    expect(store.error.riskBands).toBe(false);
  });

  it("fetchRiskBands sets the error flag on failure", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.get).mockRejectedValueOnce(new Error("boom"));

    const store = useReportsStore();
    await store.fetchRiskBands();

    expect(store.riskBands).toBeNull();
    expect(store.error.riskBands).toBe(true);
    expect(store.loading.riskBands).toBe(false);
  });

  it("fetchRuleFrequency populates the slice on success", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { series: [{ label: "DUPLICATE_CLAIM", value: 3 }] },
    });

    const store = useReportsStore();
    await store.fetchRuleFrequency();

    expect(api.get).toHaveBeenCalledWith("/api/v1/reports/rule-frequency");
    expect(store.ruleFrequency).toEqual([
      { label: "DUPLICATE_CLAIM", value: 3 },
    ]);
  });

  it("fetchDecisionCounts populates the slice on success", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { series: [{ label: "LEGITIMATE", value: 2 }] },
    });

    const store = useReportsStore();
    await store.fetchDecisionCounts();

    expect(api.get).toHaveBeenCalledWith("/api/v1/reports/decision-counts");
    expect(store.decisionCounts).toEqual([
      { label: "LEGITIMATE", value: 2 },
    ]);
  });

  it("fetchTopEntities passes limit as a query param", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        procedures: [{ id: "D2140", label: "D2140", value: 8 }],
        providers: [],
        patients: [],
      },
    });

    const store = useReportsStore();
    await store.fetchTopEntities(5);

    expect(api.get).toHaveBeenCalledWith("/api/v1/reports/top-entities", {
      params: { limit: 5 },
    });
    expect(store.topEntities?.procedures).toHaveLength(1);
  });

  it("fetchAllReports does not bail out when one endpoint fails", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { series: [{ label: "LOW", value: 1 }] } })
      .mockRejectedValueOnce(new Error("rule-frequency failed"))
      .mockResolvedValueOnce({
        data: { series: [{ label: "LEGITIMATE", value: 1 }] },
      })
      .mockResolvedValueOnce({
        data: { procedures: [], providers: [], patients: [] },
      });

    const store = useReportsStore();
    await store.fetchAllReports();

    expect(store.riskBands).not.toBeNull();
    expect(store.ruleFrequency).toBeNull();
    expect(store.error.ruleFrequency).toBe(true);
    expect(store.decisionCounts).not.toBeNull();
    expect(store.topEntities).not.toBeNull();
  });
});
