import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useClaimsStore } from "@/stores/claims.store";
import { ClaimStatus } from "@fdcdf/shared";

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

const mockClaim = {
  id: "claim-1",
  externalClaimId: "EXT-001",
  patientId: "pat-1",
  providerId: "prov-1",
  dateOfService: "2026-03-15",
  submissionDate: "2026-03-20",
  status: ClaimStatus.ACCEPTED,
  warnings: [],
  lines: [],
  createdAt: "2026-03-20T09:00:00Z",
};

describe("claims store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("starts with empty state", () => {
    const store = useClaimsStore();
    expect(store.claims).toEqual([]);
    expect(store.currentClaim).toBeNull();
    expect(store.loading).toBe(false);
  });

  it("fetchClaims populates claims and pagination", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        items: [mockClaim],
        pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
      },
    });

    const store = useClaimsStore();
    await store.fetchClaims();

    expect(store.claims).toHaveLength(1);
    expect(store.claims[0].externalClaimId).toBe("EXT-001");
    expect(store.pagination?.total).toBe(1);
  });

  it("fetchClaim sets currentClaim and clears analysisResult when no latestAnalysis is present", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockClaim });

    const store = useClaimsStore();
    await store.fetchClaim("claim-1");

    expect(store.currentClaim?.id).toBe("claim-1");
    expect(store.analysisResult).toBeNull();
  });

  it("fetchClaim hydrates analysisResult from latestAnalysis when present", async () => {
    const { api } = await import("@/composables/useApi");

    const latestAnalysis = {
      riskScore: {
        id: "rs-1",
        claimId: "claim-1",
        score: 72,
        band: "HIGH",
        confidence: 0.8,
        contributingFactors: [],
        configVersionId: "cfg-1",
        createdAt: "2026-04-19T10:00:00Z",
      },
      ruleResults: [],
      alerts: [],
      analyzedAt: "2026-04-19T10:00:00Z",
    };

    vi.mocked(api.get).mockResolvedValueOnce({
      data: { ...mockClaim, latestAnalysis },
    });

    const store = useClaimsStore();
    await store.fetchClaim("claim-1");

    expect(store.analysisResult).not.toBeNull();
    expect(store.analysisResult?.riskScore.score).toBe(72);
    expect(store.analysisResult?.ruleResults).toEqual([]);
    expect(store.analysisResult?.alerts).toEqual([]);
    expect(store.analysisResult?.claim.id).toBe("claim-1");
  });

  it("createClaim returns the created claim", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockClaim });

    const store = useClaimsStore();
    const result = await store.createClaim({
      externalClaimId: "EXT-001",
      patientExternalId: "pat-ext-1",
      patientName: "John Doe",
      providerExternalId: "prov-ext-1",
      providerName: "Dr. Smith",
      dateOfService: "2026-03-15",
      submissionDate: "2026-03-20",
      lines: [{ procedureCode: "D0140", claimedAmount: 45 }],
    });

    expect(result.id).toBe("claim-1");
  });
});
