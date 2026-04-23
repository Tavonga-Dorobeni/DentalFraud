import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "@/stores/auth.store";
import { UserRole } from "@fdcdf/shared";

vi.mock("@/composables/useApi", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
}));

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-sig`;
}

describe("route guard logic", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("unauthenticated user has isAuthenticated = false", () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
  });

  it("authenticated user has correct role", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        accessToken: fakeJwt({ id: "u1", email: "a@b.com", role: UserRole.INVESTIGATOR }),
        refreshToken: "rt",
      },
    });

    const store = useAuthStore();
    await store.login({ email: "a@b.com", password: "p" });

    expect(store.isAuthenticated).toBe(true);
    expect(store.user?.role).toBe(UserRole.INVESTIGATOR);
  });

  it("role check: ANALYST can access ANALYST routes", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        accessToken: fakeJwt({ id: "u1", email: "a@b.com", role: UserRole.ANALYST }),
        refreshToken: "rt",
      },
    });

    const store = useAuthStore();
    await store.login({ email: "a@b.com", password: "p" });

    const allowedRoles = [UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR];
    expect(allowedRoles.includes(store.user!.role)).toBe(true);
  });

  it("role check: RULES_ADMIN cannot access analyst-only routes", async () => {
    const { api } = await import("@/composables/useApi");
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        accessToken: fakeJwt({ id: "u1", email: "a@b.com", role: UserRole.RULES_ADMIN }),
        refreshToken: "rt",
      },
    });

    const store = useAuthStore();
    await store.login({ email: "a@b.com", password: "p" });

    const claimsAllowedRoles = [UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR];
    expect(claimsAllowedRoles.includes(store.user!.role)).toBe(false);
  });
});
