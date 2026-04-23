import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "@/stores/auth.store";
import { UserRole } from "@fdcdf/shared";

// Mock the api module
vi.mock("@/composables/useApi", () => {
  const mockApi = {
    post: vi.fn(),
    get: vi.fn(),
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

// Helper: create a fake JWT token with payload
function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe("auth store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("starts unauthenticated", () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
  });

  it("login sets user and tokens", async () => {
    const { api } = await import("@/composables/useApi");
    const tokenPair = {
      accessToken: fakeJwt({ id: "usr-1", email: "test@test.com", role: UserRole.ANALYST }),
      refreshToken: "refresh-token-123",
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: tokenPair });

    const store = useAuthStore();
    await store.login({ email: "test@test.com", password: "pass" });

    expect(store.isAuthenticated).toBe(true);
    expect(store.user?.email).toBe("test@test.com");
    expect(store.user?.role).toBe(UserRole.ANALYST);
    expect(store.user?.id).toBe("usr-1");
  });

  it("logout clears state", async () => {
    const { api } = await import("@/composables/useApi");
    const tokenPair = {
      accessToken: fakeJwt({ id: "usr-1", email: "test@test.com", role: UserRole.ADMIN }),
      refreshToken: "refresh-token",
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: tokenPair });

    const store = useAuthStore();
    await store.login({ email: "test@test.com", password: "pass" });
    expect(store.isAuthenticated).toBe(true);

    store.logout();
    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
    expect(store.accessToken).toBeNull();
  });

  it("refresh returns false when no stored token", async () => {
    const store = useAuthStore();
    const result = await store.refresh();
    expect(result).toBe(false);
  });
});
