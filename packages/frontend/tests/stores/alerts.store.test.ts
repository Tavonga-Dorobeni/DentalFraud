import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAlertsStore } from "@/stores/alerts.store";
import { AlertStatus, RuleSeverity } from "@fdcdf/shared";

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

const mockAlert = {
  id: "alert-1",
  claimId: "claim-1",
  severity: RuleSeverity.CRITICAL,
  status: AlertStatus.OPEN,
  summary: "Duplicate claim detected",
  recommendedAction: "Review for duplicate billing",
  triggeredRuleIds: ["RULE-001"],
  createdAt: "2026-03-20T09:00:00Z",
  updatedAt: "2026-03-20T09:00:00Z",
};

describe("alerts store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("starts with empty state", () => {
    const store = useAlertsStore();
    expect(store.alerts).toEqual([]);
    expect(store.hasUnseenCriticalAlerts).toBe(false);
  });

  it("fetchAlerts populates alerts", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        items: [mockAlert],
        pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
      },
    });

    const store = useAlertsStore();
    await store.fetchAlerts();

    expect(store.alerts).toHaveLength(1);
    expect(store.hasUnseenCriticalAlerts).toBe(true);
  });

  it("markCriticalAsSeen clears unseen flag", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        items: [mockAlert],
        pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
      },
    });

    const store = useAlertsStore();
    await store.fetchAlerts();
    expect(store.hasUnseenCriticalAlerts).toBe(true);

    store.markCriticalAsSeen();
    expect(store.hasUnseenCriticalAlerts).toBe(false);
  });

  it("acknowledgeAlert updates status", async () => {
    const { api } = await import("@/composables/useApi");
    const acknowledged = { ...mockAlert, status: AlertStatus.ACKNOWLEDGED };

    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        items: [mockAlert],
        pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
      },
    });
    vi.mocked(api.post).mockResolvedValueOnce({ data: acknowledged });

    const store = useAlertsStore();
    await store.fetchAlerts();
    await store.acknowledgeAlert("alert-1");

    expect(store.currentAlert?.status).toBe(AlertStatus.ACKNOWLEDGED);
    expect(store.alerts[0].status).toBe(AlertStatus.ACKNOWLEDGED);
  });

  it("closeAlert updates status", async () => {
    const { api } = await import("@/composables/useApi");
    const closed = { ...mockAlert, status: AlertStatus.CLOSED };

    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        items: [mockAlert],
        pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
      },
    });
    vi.mocked(api.post).mockResolvedValueOnce({ data: closed });

    const store = useAlertsStore();
    await store.fetchAlerts();
    await store.closeAlert("alert-1");

    expect(store.currentAlert?.status).toBe(AlertStatus.CLOSED);
  });
});
