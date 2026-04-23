# Dashboard Report Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render four chart-driven visualizations on the Dashboard that consume the new `/api/v1/reports/*` endpoints directly — risk-band distribution (doughnut), rule frequency (horizontal bar), decision counts (single 100% stacked horizontal bar), and top procedures/providers/patients (three horizontal bars).

**Architecture:** A new `reports` Pinia store fetches four endpoints in parallel (via `Promise.allSettled` so one failure doesn't blank the others). A new `features/reports/` folder holds three presentational chart components (`DoughnutChart.vue`, `HorizontalBarChart.vue`, `StackedShareBar.vue`) that wrap `vue-chartjs` inside `GlassPanel`. `DashboardView.vue` composes them into a responsive grid between the existing summary cards and the recent-claims table.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), TypeScript, Tailwind CSS, Pinia, `chart.js` + `vue-chartjs` (new deps), Vitest + `@vue/test-utils` + jsdom for tests. Shared types from `@fdcdf/shared`.

**Reference:** `docs/superpowers/specs/2026-04-19-dashboard-report-charts-design.md` (the approved spec this plan implements).

**Conventions the engineer may not know:**

- This project is **not currently a git repo**. If any `git` command errors, skip the commit step, note it in the task output, and continue. (The repo root `C:\Projects\DentalFraudDetection\.git` does not exist.)
- Scope is frontend only. Do **not** touch anything under `packages/backend/`.
- The axios instance at `packages/frontend/src/composables/useApi.ts` has a response interceptor that unwraps the `{ success, data }` envelope, so `response.data` inside a store action is already the inner payload (e.g. `{ series: [...] }` or `{ procedures, providers, patients }`).
- Frontend tests live under `packages/frontend/tests/**/*.test.ts` (not `__tests__`). Mirror the source tree: store tests in `tests/stores/`, feature tests in `tests/features/<feature>/`.
- Store tests mock `@/composables/useApi` with `vi.mock(...)` at the top — see `packages/frontend/tests/stores/alerts.store.test.ts` for the canonical pattern (the mock must include `interceptors.request.use` and `interceptors.response.use` or the import will crash).
- Design tokens live in `packages/frontend/src/assets/styles/main.css` inside a `@theme { ... }` block (Tailwind v4 syntax). Adding a token there automatically makes matching Tailwind utilities available (e.g. `--color-orange-warning` → `text-orange-warning`, `bg-orange-warning`).
- `GlassPanel` (in `src/ui/GlassPanel.vue`) already has `padding: true` by default — don't wrap a chart in extra padding utilities.
- `AppSkeletonLoader` (in `src/ui/AppSkeletonLoader.vue`) takes `shape`, `width`, `height` props — use `shape="rect"` for chart skeletons.
- Chart.js **must** be tree-shaken — import and register only the controllers/elements/scales/plugins we actually use. Never `import 'chart.js/auto'`.
- Chart.js consumes **hex strings**, not CSS variable references. Keep canonical colors in `main.css` and also in a plain `CHART_COLORS` object in `charts.colors.ts`. Duplication is fine and preferable to runtime `getComputedStyle` lookups.
- One commit per task (when git is available). Commit message format: imperative, lowercase conventional-commit prefix (`feat:`, `test:`, `chore:`).

---

## File Structure

**New files:**

- `packages/frontend/src/features/reports/charts.colors.ts` — exports `CHART_COLORS` (hex literals mirroring the CSS tokens) and three label-keyed maps: `RISK_BAND_COLORS`, `DECISION_COLORS`, plus a `FALLBACK_COLOR`. No Vue, no DOM — trivially unit-testable.
- `packages/frontend/src/features/reports/charts.config.ts` — one-time, idempotent Chart.js registration. Exports nothing; side effect only. Imported at the top of each chart component.
- `packages/frontend/src/features/reports/components/DoughnutChart.vue` — doughnut renderer for the risk-band distribution. Wraps `<Doughnut>` from `vue-chartjs` inside a `GlassPanel`.
- `packages/frontend/src/features/reports/components/HorizontalBarChart.vue` — horizontal bar renderer, reused for rule frequency and each top-entity list.
- `packages/frontend/src/features/reports/components/StackedShareBar.vue` — single-row 100% stacked horizontal bar for decision counts.
- `packages/frontend/src/stores/reports.store.ts` — Pinia store with four fetch actions plus `fetchAllReports()`.
- `packages/frontend/tests/stores/reports.store.test.ts` — store unit tests.
- `packages/frontend/tests/features/reports/charts.colors.test.ts` — color-map unit tests.
- `packages/frontend/tests/features/reports/DoughnutChart.test.ts` — component test (loading / empty / populated).
- `packages/frontend/tests/features/reports/HorizontalBarChart.test.ts` — component test (loading / empty / populated).
- `packages/frontend/tests/features/reports/StackedShareBar.test.ts` — component test (loading / empty / populated).

**Modified files:**

- `packages/shared/src/types.ts` — add `ChartSeriesPoint`, `ChartSeriesReport`, `TopEntity`, `TopEntitiesReport`.
- `packages/frontend/package.json` — add `chart.js` and `vue-chartjs` to `dependencies`.
- `packages/frontend/src/assets/styles/main.css` — add `--color-orange-warning: #F97316;` inside `@theme`.
- `packages/frontend/src/features/dashboard/DashboardView.vue` — insert chart grid between summary cards and recent-claims table; call `reportsStore.fetchAllReports()` on mount.

**Responsibility boundaries:**

- `charts.colors.ts` owns hex literals and label → color maps. Pure.
- `charts.config.ts` owns Chart.js registration. Side effect once, no-op on re-import.
- Each chart component owns one chart type: props → Chart.js data/options → canvas inside `GlassPanel`. No data fetching, no store access.
- `reports.store.ts` owns server state + fetch actions. No knowledge of charts.
- `DashboardView.vue` is the only composer — it pulls from the store and hands series to chart components.

---

## Task 1: Add shared types to `@fdcdf/shared`

**Files:**
- Modify: `packages/shared/src/types.ts` (append at end of file)

- [ ] **Step 1: Add the four new interfaces**

Open `packages/shared/src/types.ts` and append these exports at the end of the file:

```ts
// Reports — chart-ready payloads from /api/v1/reports/*
export interface ChartSeriesPoint {
  label: string;
  value: number;
}

export interface ChartSeriesReport {
  series: ChartSeriesPoint[];
}

export interface TopEntity {
  id: string;
  label: string;
  value: number;
}

export interface TopEntitiesReport {
  procedures: TopEntity[];
  providers: TopEntity[];
  patients: TopEntity[];
}
```

- [ ] **Step 2: Verify the shared package re-exports them**

Run: `Read packages/shared/src/index.ts`
Expected: the file contains `export * from "./types";` (already present — no edit needed).

- [ ] **Step 3: Type-check the shared package**

Run (from `C:\Projects\DentalFraudDetection`):

```bash
cd packages/frontend && npx vue-tsc --noEmit
```

Expected: exit code 0. The new interfaces are compilable and reachable from the frontend via `@fdcdf/shared`.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types.ts
git commit -m "feat: add chart-series and top-entity shared types"
```

If `git` errors (repo is not a git repo), note it in the task output and continue.

---

## Task 2: Add `chart.js` and `vue-chartjs` dependencies

**Files:**
- Modify: `packages/frontend/package.json`

- [ ] **Step 1: Add the two dependencies**

In `packages/frontend/package.json`, insert these two lines inside `dependencies` (alphabetical order — `chart.js` goes after `axios`, `vue-chartjs` goes after `vue` and before `vue-router`):

```json
"chart.js": "^4.4.7",
"vue-chartjs": "^5.3.2",
```

The resulting `dependencies` block should look like:

```json
"dependencies": {
  "@fdcdf/shared": "1.0.0",
  "axios": "^1.7.9",
  "chart.js": "^4.4.7",
  "gsap": "^3.12.7",
  "pinia": "^2.3.1",
  "vue": "^3.5.13",
  "vue-chartjs": "^5.3.2",
  "vue-router": "^4.5.0"
},
```

- [ ] **Step 2: Install**

Run (from `C:\Projects\DentalFraudDetection\packages\frontend`):

```bash
npm install
```

Expected: both packages install without peer-dep warnings that reference Vue 3 (both support Vue 3). If you see a peer warning about `chart.js` from `vue-chartjs`, it's cosmetic — keep going.

- [ ] **Step 3: Verify import resolves**

From `packages/frontend/`:

```bash
node -e "require.resolve('chart.js'); require.resolve('vue-chartjs'); console.log('ok');"
```

Expected output: `ok`.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/package.json packages/frontend/package-lock.json
git commit -m "chore: add chart.js and vue-chartjs"
```

If `git` errors, note it and continue.

---

## Task 3: Add the `--color-orange-warning` design token

**Files:**
- Modify: `packages/frontend/src/assets/styles/main.css`

- [ ] **Step 1: Add the token**

In `packages/frontend/src/assets/styles/main.css`, inside the `@theme { ... }` block, add `--color-orange-warning: #F97316;` after the `--color-amber-alert-light` line:

```css
  --color-amber-alert: #F59E0B;
  --color-amber-alert-light: #FEF3C7;
  --color-orange-warning: #F97316;

  --color-red-critical: #EF4444;
```

- [ ] **Step 2: Type-check**

Run from `packages/frontend/`:

```bash
npx vue-tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/assets/styles/main.css
git commit -m "feat: add orange-warning color token for high-risk band"
```

If `git` errors, note it and continue.

---

## Task 4: Create `charts.colors.ts` with failing test

**Files:**
- Create: `packages/frontend/src/features/reports/charts.colors.ts`
- Create: `packages/frontend/tests/features/reports/charts.colors.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/tests/features/reports/charts.colors.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  CHART_COLORS,
  DECISION_COLORS,
  FALLBACK_COLOR,
  RISK_BAND_COLORS,
  colorForLabel,
} from "@/features/reports/charts.colors";

describe("charts.colors", () => {
  it("exposes the hex palette matching the CSS tokens", () => {
    expect(CHART_COLORS.blueClinical).toBe("#3B82F6");
    expect(CHART_COLORS.amberAlert).toBe("#F59E0B");
    expect(CHART_COLORS.orangeWarning).toBe("#F97316");
    expect(CHART_COLORS.redCritical).toBe("#EF4444");
    expect(CHART_COLORS.greenLegitimate).toBe("#22C55E");
    expect(CHART_COLORS.navyAuth).toBe("#0F172A");
  });

  it("maps every risk band to a semantic color", () => {
    expect(RISK_BAND_COLORS.LOW).toBe(CHART_COLORS.blueClinical);
    expect(RISK_BAND_COLORS.MEDIUM).toBe(CHART_COLORS.amberAlert);
    expect(RISK_BAND_COLORS.HIGH).toBe(CHART_COLORS.orangeWarning);
    expect(RISK_BAND_COLORS.CRITICAL).toBe(CHART_COLORS.redCritical);
  });

  it("maps every decision type to a semantic color", () => {
    expect(DECISION_COLORS.LEGITIMATE).toBe(CHART_COLORS.greenLegitimate);
    expect(DECISION_COLORS.EDUCATION_REQUIRED).toBe(CHART_COLORS.amberAlert);
    expect(DECISION_COLORS.CONFIRMED_FRAUD).toBe(CHART_COLORS.redCritical);
  });

  it("colorForLabel returns the mapped color when label is known", () => {
    expect(colorForLabel("CRITICAL", RISK_BAND_COLORS)).toBe(
      CHART_COLORS.redCritical
    );
  });

  it("colorForLabel returns the fallback when label is unknown", () => {
    expect(colorForLabel("UNKNOWN", RISK_BAND_COLORS)).toBe(FALLBACK_COLOR);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `packages/frontend/`:

```bash
npx vitest run tests/features/reports/charts.colors.test.ts
```

Expected: FAIL — the module `@/features/reports/charts.colors` does not exist yet.

- [ ] **Step 3: Implement `charts.colors.ts`**

Create `packages/frontend/src/features/reports/charts.colors.ts`:

```ts
export const CHART_COLORS = {
  blueClinical: "#3B82F6",
  amberAlert: "#F59E0B",
  orangeWarning: "#F97316",
  redCritical: "#EF4444",
  greenLegitimate: "#22C55E",
  navyAuth: "#0F172A",
} as const;

export const FALLBACK_COLOR = "rgba(15, 23, 42, 0.6)"; // navy-auth at 60% opacity

export const RISK_BAND_COLORS: Record<string, string> = {
  LOW: CHART_COLORS.blueClinical,
  MEDIUM: CHART_COLORS.amberAlert,
  HIGH: CHART_COLORS.orangeWarning,
  CRITICAL: CHART_COLORS.redCritical,
};

export const DECISION_COLORS: Record<string, string> = {
  LEGITIMATE: CHART_COLORS.greenLegitimate,
  EDUCATION_REQUIRED: CHART_COLORS.amberAlert,
  CONFIRMED_FRAUD: CHART_COLORS.redCritical,
};

export function colorForLabel(
  label: string,
  map: Record<string, string>
): string {
  return map[label] ?? FALLBACK_COLOR;
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx vitest run tests/features/reports/charts.colors.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/features/reports/charts.colors.ts \
        packages/frontend/tests/features/reports/charts.colors.test.ts
git commit -m "feat: add chart color palette and semantic label maps"
```

If `git` errors, note it and continue.

---

## Task 5: Create `charts.config.ts` (Chart.js registration)

**Files:**
- Create: `packages/frontend/src/features/reports/charts.config.ts`

No test — this module is side-effect-only and is covered implicitly by the chart component tests.

- [ ] **Step 1: Implement the registration module**

Create `packages/frontend/src/features/reports/charts.config.ts`:

```ts
import {
  Chart as ChartJS,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  LinearScale,
  Legend,
  Tooltip,
} from "chart.js";

// Idempotent: Chart.js.register is a no-op when called multiple times
// with already-registered components, so importing this file from every
// chart component is safe.
ChartJS.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  LinearScale,
  Legend,
  Tooltip
);
```

- [ ] **Step 2: Type-check**

Run from `packages/frontend/`:

```bash
npx vue-tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/features/reports/charts.config.ts
git commit -m "feat: register Chart.js components used by dashboard charts"
```

If `git` errors, note it and continue.

---

## Task 6: Create `reports.store.ts` with failing test

**Files:**
- Create: `packages/frontend/src/stores/reports.store.ts`
- Create: `packages/frontend/tests/stores/reports.store.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/tests/stores/reports.store.test.ts`:

```ts
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
      .mockResolvedValueOnce({ data: { series: [{ label: "LOW", value: 1 }] } }) // risk-bands
      .mockRejectedValueOnce(new Error("rule-frequency failed"))
      .mockResolvedValueOnce({
        data: { series: [{ label: "LEGITIMATE", value: 1 }] },
      }) // decisions
      .mockResolvedValueOnce({
        data: { procedures: [], providers: [], patients: [] },
      }); // top entities

    const store = useReportsStore();
    await store.fetchAllReports();

    expect(store.riskBands).not.toBeNull();
    expect(store.ruleFrequency).toBeNull();
    expect(store.error.ruleFrequency).toBe(true);
    expect(store.decisionCounts).not.toBeNull();
    expect(store.topEntities).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `packages/frontend/`:

```bash
npx vitest run tests/stores/reports.store.test.ts
```

Expected: FAIL — `@/stores/reports.store` does not exist yet.

- [ ] **Step 3: Implement the store**

Create `packages/frontend/src/stores/reports.store.ts`:

```ts
import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  ChartSeriesPoint,
  ChartSeriesReport,
  TopEntitiesReport,
} from "@fdcdf/shared";
import { api } from "@/composables/useApi";

type ReportKey = "riskBands" | "ruleFrequency" | "decisionCounts" | "topEntities";

function makeFlagMap(): Record<ReportKey, boolean> {
  return {
    riskBands: false,
    ruleFrequency: false,
    decisionCounts: false,
    topEntities: false,
  };
}

export const useReportsStore = defineStore("reports", () => {
  const riskBands = ref<ChartSeriesPoint[] | null>(null);
  const ruleFrequency = ref<ChartSeriesPoint[] | null>(null);
  const decisionCounts = ref<ChartSeriesPoint[] | null>(null);
  const topEntities = ref<TopEntitiesReport | null>(null);

  const loading = ref<Record<ReportKey, boolean>>(makeFlagMap());
  const error = ref<Record<ReportKey, boolean>>(makeFlagMap());

  async function runFetch<T>(
    key: ReportKey,
    request: () => Promise<T>,
    apply: (value: T) => void
  ) {
    loading.value[key] = true;
    error.value[key] = false;
    try {
      const value = await request();
      apply(value);
    } catch {
      error.value[key] = true;
    } finally {
      loading.value[key] = false;
    }
  }

  async function fetchRiskBands() {
    await runFetch(
      "riskBands",
      async () => {
        const response = await api.get("/api/v1/reports/risk-band-distribution");
        return response.data as ChartSeriesReport;
      },
      (value) => {
        riskBands.value = value.series;
      }
    );
  }

  async function fetchRuleFrequency() {
    await runFetch(
      "ruleFrequency",
      async () => {
        const response = await api.get("/api/v1/reports/rule-frequency");
        return response.data as ChartSeriesReport;
      },
      (value) => {
        ruleFrequency.value = value.series;
      }
    );
  }

  async function fetchDecisionCounts() {
    await runFetch(
      "decisionCounts",
      async () => {
        const response = await api.get("/api/v1/reports/decision-counts");
        return response.data as ChartSeriesReport;
      },
      (value) => {
        decisionCounts.value = value.series;
      }
    );
  }

  async function fetchTopEntities(limit = 5) {
    await runFetch(
      "topEntities",
      async () => {
        const response = await api.get("/api/v1/reports/top-entities", {
          params: { limit },
        });
        return response.data as TopEntitiesReport;
      },
      (value) => {
        topEntities.value = value;
      }
    );
  }

  async function fetchAllReports() {
    await Promise.allSettled([
      fetchRiskBands(),
      fetchRuleFrequency(),
      fetchDecisionCounts(),
      fetchTopEntities(),
    ]);
  }

  return {
    riskBands,
    ruleFrequency,
    decisionCounts,
    topEntities,
    loading,
    error,
    fetchRiskBands,
    fetchRuleFrequency,
    fetchDecisionCounts,
    fetchTopEntities,
    fetchAllReports,
  };
});
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx vitest run tests/stores/reports.store.test.ts
```

Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/stores/reports.store.ts \
        packages/frontend/tests/stores/reports.store.test.ts
git commit -m "feat: add reports store with parallel fetch and per-slice error flags"
```

If `git` errors, note it and continue.

---

## Task 7: Create `DoughnutChart.vue` with failing test

**Files:**
- Create: `packages/frontend/src/features/reports/components/DoughnutChart.vue`
- Create: `packages/frontend/tests/features/reports/DoughnutChart.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/tests/features/reports/DoughnutChart.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import DoughnutChart from "@/features/reports/components/DoughnutChart.vue";

// vue-chartjs renders a real <canvas>; in jsdom the Chart.js constructor
// calls canvas.getContext('2d') which returns null. Stubbing the component
// avoids that without losing the wrapping behavior we want to assert.
vi.mock("vue-chartjs", () => ({
  Doughnut: {
    name: "Doughnut",
    props: ["data", "options"],
    template: `<canvas data-test="chart-canvas" />`,
  },
}));

describe("DoughnutChart.vue", () => {
  it("renders a skeleton when loading is true", () => {
    const wrapper = mount(DoughnutChart, {
      props: { series: null, loading: true, error: false, title: "Risk bands" },
    });
    expect(wrapper.find('[data-test="chart-skeleton"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="chart-canvas"]').exists()).toBe(false);
  });

  it("renders the error state with a retry button when error is true", () => {
    const onRetry = vi.fn();
    const wrapper = mount(DoughnutChart, {
      props: {
        series: null,
        loading: false,
        error: true,
        title: "Risk bands",
        onRetry,
      },
    });
    expect(wrapper.text()).toContain("Could not load chart");
    wrapper.find('[data-test="chart-retry"]').trigger("click");
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders an empty-state message when series is empty", () => {
    const wrapper = mount(DoughnutChart, {
      props: { series: [], loading: false, error: false, title: "Risk bands" },
    });
    expect(wrapper.text()).toContain("No data yet");
    expect(wrapper.find('[data-test="chart-canvas"]').exists()).toBe(false);
  });

  it("renders the canvas when series has points", () => {
    const wrapper = mount(DoughnutChart, {
      props: {
        series: [
          { label: "LOW", value: 2 },
          { label: "CRITICAL", value: 1 },
        ],
        loading: false,
        error: false,
        title: "Risk bands",
      },
    });
    expect(wrapper.find('[data-test="chart-canvas"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Risk bands");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/features/reports/DoughnutChart.test.ts
```

Expected: FAIL — component does not exist yet.

- [ ] **Step 3: Implement the component**

Create `packages/frontend/src/features/reports/components/DoughnutChart.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import type { ChartData, ChartOptions } from "chart.js";
import type { ChartSeriesPoint } from "@fdcdf/shared";
import GlassPanel from "@/ui/GlassPanel.vue";
import AppSkeletonLoader from "@/ui/AppSkeletonLoader.vue";
import { colorForLabel, FALLBACK_COLOR } from "@/features/reports/charts.colors";
import "@/features/reports/charts.config";

interface Props {
  series: ChartSeriesPoint[] | null;
  loading: boolean;
  error: boolean;
  title?: string;
  colorMap?: Record<string, string>;
  onRetry?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  colorMap: undefined,
  onRetry: undefined,
});

const isEmpty = computed(
  () => Array.isArray(props.series) && props.series.length === 0
);

const isPopulated = computed(
  () => Array.isArray(props.series) && props.series.length > 0
);

const chartData = computed<ChartData<"doughnut">>(() => {
  const points = props.series ?? [];
  return {
    labels: points.map((p) => p.label),
    datasets: [
      {
        data: points.map((p) => p.value),
        backgroundColor: points.map((p) =>
          props.colorMap ? colorForLabel(p.label, props.colorMap) : FALLBACK_COLOR
        ),
        borderWidth: 0,
      },
    ],
  };
});

const chartOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { boxWidth: 12, padding: 12 } },
    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}` } },
  },
  cutout: "60%",
};
</script>

<template>
  <GlassPanel>
    <div v-if="title" class="text-sm font-semibold text-navy-auth mb-3">
      {{ title }}
    </div>
    <div class="relative" style="height: 240px">
      <div
        v-if="loading"
        data-test="chart-skeleton"
        class="h-full w-full flex items-center justify-center"
      >
        <AppSkeletonLoader shape="rect" width="100%" height="100%" />
      </div>
      <div
        v-else-if="error"
        class="h-full w-full flex flex-col items-center justify-center text-sm text-navy-500"
      >
        <div class="mb-2">Could not load chart.</div>
        <button
          v-if="onRetry"
          data-test="chart-retry"
          class="px-3 py-1 rounded-md border border-border-subtle text-xs font-medium hover:bg-surface-glass"
          @click="() => onRetry?.()"
        >
          Retry
        </button>
      </div>
      <div
        v-else-if="isEmpty"
        class="h-full w-full flex items-center justify-center text-sm text-navy-500"
      >
        No data yet.
      </div>
      <Doughnut
        v-else-if="isPopulated"
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </GlassPanel>
</template>
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx vitest run tests/features/reports/DoughnutChart.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/features/reports/components/DoughnutChart.vue \
        packages/frontend/tests/features/reports/DoughnutChart.test.ts
git commit -m "feat: add DoughnutChart for risk-band distribution"
```

If `git` errors, note it and continue.

---

## Task 8: Create `HorizontalBarChart.vue` with failing test

**Files:**
- Create: `packages/frontend/src/features/reports/components/HorizontalBarChart.vue`
- Create: `packages/frontend/tests/features/reports/HorizontalBarChart.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/tests/features/reports/HorizontalBarChart.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import HorizontalBarChart from "@/features/reports/components/HorizontalBarChart.vue";

vi.mock("vue-chartjs", () => ({
  Bar: {
    name: "Bar",
    props: ["data", "options"],
    template: `<canvas data-test="chart-canvas" />`,
  },
}));

describe("HorizontalBarChart.vue", () => {
  it("renders a skeleton when loading", () => {
    const wrapper = mount(HorizontalBarChart, {
      props: { series: null, loading: true, error: false, title: "Rule frequency" },
    });
    expect(wrapper.find('[data-test="chart-skeleton"]').exists()).toBe(true);
  });

  it("renders error with a retry button", () => {
    const onRetry = vi.fn();
    const wrapper = mount(HorizontalBarChart, {
      props: {
        series: null,
        loading: false,
        error: true,
        title: "Rule frequency",
        onRetry,
      },
    });
    wrapper.find('[data-test="chart-retry"]').trigger("click");
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders empty state when series is empty", () => {
    const wrapper = mount(HorizontalBarChart, {
      props: { series: [], loading: false, error: false, title: "Rule frequency" },
    });
    expect(wrapper.text()).toContain("No data yet");
  });

  it("renders the canvas when series has points", () => {
    const wrapper = mount(HorizontalBarChart, {
      props: {
        series: [{ label: "DUPLICATE_CLAIM", value: 3 }],
        loading: false,
        error: false,
        title: "Rule frequency",
      },
    });
    expect(wrapper.find('[data-test="chart-canvas"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Rule frequency");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/features/reports/HorizontalBarChart.test.ts
```

Expected: FAIL — component does not exist yet.

- [ ] **Step 3: Implement the component**

Create `packages/frontend/src/features/reports/components/HorizontalBarChart.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import type { ChartData, ChartOptions } from "chart.js";
import type { ChartSeriesPoint } from "@fdcdf/shared";
import GlassPanel from "@/ui/GlassPanel.vue";
import AppSkeletonLoader from "@/ui/AppSkeletonLoader.vue";
import { CHART_COLORS, colorForLabel } from "@/features/reports/charts.colors";
import "@/features/reports/charts.config";

interface Props {
  series: ChartSeriesPoint[] | null;
  loading: boolean;
  error: boolean;
  title?: string;
  colorMap?: Record<string, string>;
  height?: number;
  onRetry?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  colorMap: undefined,
  height: 240,
  onRetry: undefined,
});

const isEmpty = computed(
  () => Array.isArray(props.series) && props.series.length === 0
);
const isPopulated = computed(
  () => Array.isArray(props.series) && props.series.length > 0
);

const chartData = computed<ChartData<"bar">>(() => {
  const points = props.series ?? [];
  const colors = points.map((p) =>
    props.colorMap ? colorForLabel(p.label, props.colorMap) : CHART_COLORS.blueClinical
  );
  return {
    labels: points.map((p) => p.label),
    datasets: [
      {
        data: points.map((p) => p.value),
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };
});

const chartOptions: ChartOptions<"bar"> = {
  indexAxis: "y",
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, ticks: { precision: 0 } },
    y: { ticks: { autoSkip: false } },
  },
};
</script>

<template>
  <GlassPanel>
    <div v-if="title" class="text-sm font-semibold text-navy-auth mb-3">
      {{ title }}
    </div>
    <div class="relative" :style="{ height: `${height}px` }">
      <div
        v-if="loading"
        data-test="chart-skeleton"
        class="h-full w-full flex items-center justify-center"
      >
        <AppSkeletonLoader shape="rect" width="100%" height="100%" />
      </div>
      <div
        v-else-if="error"
        class="h-full w-full flex flex-col items-center justify-center text-sm text-navy-500"
      >
        <div class="mb-2">Could not load chart.</div>
        <button
          v-if="onRetry"
          data-test="chart-retry"
          class="px-3 py-1 rounded-md border border-border-subtle text-xs font-medium hover:bg-surface-glass"
          @click="() => onRetry?.()"
        >
          Retry
        </button>
      </div>
      <div
        v-else-if="isEmpty"
        class="h-full w-full flex items-center justify-center text-sm text-navy-500"
      >
        No data yet.
      </div>
      <Bar v-else-if="isPopulated" :data="chartData" :options="chartOptions" />
    </div>
  </GlassPanel>
</template>
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx vitest run tests/features/reports/HorizontalBarChart.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/features/reports/components/HorizontalBarChart.vue \
        packages/frontend/tests/features/reports/HorizontalBarChart.test.ts
git commit -m "feat: add HorizontalBarChart for rule frequency and top entities"
```

If `git` errors, note it and continue.

---

## Task 9: Create `StackedShareBar.vue` with failing test

**Files:**
- Create: `packages/frontend/src/features/reports/components/StackedShareBar.vue`
- Create: `packages/frontend/tests/features/reports/StackedShareBar.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/tests/features/reports/StackedShareBar.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import StackedShareBar from "@/features/reports/components/StackedShareBar.vue";

vi.mock("vue-chartjs", () => ({
  Bar: {
    name: "Bar",
    props: ["data", "options"],
    template: `<canvas data-test="chart-canvas" />`,
  },
}));

describe("StackedShareBar.vue", () => {
  it("renders a skeleton when loading", () => {
    const wrapper = mount(StackedShareBar, {
      props: { series: null, loading: true, error: false, title: "Decisions" },
    });
    expect(wrapper.find('[data-test="chart-skeleton"]').exists()).toBe(true);
  });

  it("renders error with a retry button", () => {
    const onRetry = vi.fn();
    const wrapper = mount(StackedShareBar, {
      props: {
        series: null,
        loading: false,
        error: true,
        title: "Decisions",
        onRetry,
      },
    });
    wrapper.find('[data-test="chart-retry"]').trigger("click");
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders empty state when series is empty", () => {
    const wrapper = mount(StackedShareBar, {
      props: { series: [], loading: false, error: false, title: "Decisions" },
    });
    expect(wrapper.text()).toContain("No data yet");
  });

  it("renders the canvas when series has points", () => {
    const wrapper = mount(StackedShareBar, {
      props: {
        series: [
          { label: "LEGITIMATE", value: 4 },
          { label: "CONFIRMED_FRAUD", value: 1 },
        ],
        loading: false,
        error: false,
        title: "Decisions",
      },
    });
    expect(wrapper.find('[data-test="chart-canvas"]').exists()).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/features/reports/StackedShareBar.test.ts
```

Expected: FAIL — component does not exist yet.

- [ ] **Step 3: Implement the component**

Create `packages/frontend/src/features/reports/components/StackedShareBar.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import type { ChartData, ChartOptions } from "chart.js";
import type { ChartSeriesPoint } from "@fdcdf/shared";
import GlassPanel from "@/ui/GlassPanel.vue";
import AppSkeletonLoader from "@/ui/AppSkeletonLoader.vue";
import { colorForLabel, FALLBACK_COLOR } from "@/features/reports/charts.colors";
import "@/features/reports/charts.config";

interface Props {
  series: ChartSeriesPoint[] | null;
  loading: boolean;
  error: boolean;
  title?: string;
  colorMap?: Record<string, string>;
  onRetry?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  colorMap: undefined,
  onRetry: undefined,
});

const isEmpty = computed(
  () => Array.isArray(props.series) && props.series.length === 0
);
const isPopulated = computed(
  () => Array.isArray(props.series) && props.series.length > 0
);

// One dataset per segment so they stack on a single row
const chartData = computed<ChartData<"bar">>(() => {
  const points = props.series ?? [];
  return {
    labels: [""], // single row
    datasets: points.map((p) => ({
      label: p.label,
      data: [p.value],
      backgroundColor: props.colorMap
        ? colorForLabel(p.label, props.colorMap)
        : FALLBACK_COLOR,
      borderWidth: 0,
      borderRadius: 4,
      barPercentage: 0.9,
      categoryPercentage: 0.9,
    })),
  };
});

const chartOptions: ChartOptions<"bar"> = {
  indexAxis: "y",
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { boxWidth: 12, padding: 12 } },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x}`,
      },
    },
  },
  scales: {
    x: { stacked: true, display: false, beginAtZero: true },
    y: { stacked: true, display: false },
  },
};
</script>

<template>
  <GlassPanel>
    <div v-if="title" class="text-sm font-semibold text-navy-auth mb-3">
      {{ title }}
    </div>
    <div class="relative" style="height: 140px">
      <div
        v-if="loading"
        data-test="chart-skeleton"
        class="h-full w-full flex items-center justify-center"
      >
        <AppSkeletonLoader shape="rect" width="100%" height="100%" />
      </div>
      <div
        v-else-if="error"
        class="h-full w-full flex flex-col items-center justify-center text-sm text-navy-500"
      >
        <div class="mb-2">Could not load chart.</div>
        <button
          v-if="onRetry"
          data-test="chart-retry"
          class="px-3 py-1 rounded-md border border-border-subtle text-xs font-medium hover:bg-surface-glass"
          @click="() => onRetry?.()"
        >
          Retry
        </button>
      </div>
      <div
        v-else-if="isEmpty"
        class="h-full w-full flex items-center justify-center text-sm text-navy-500"
      >
        No data yet.
      </div>
      <Bar v-else-if="isPopulated" :data="chartData" :options="chartOptions" />
    </div>
  </GlassPanel>
</template>
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx vitest run tests/features/reports/StackedShareBar.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/features/reports/components/StackedShareBar.vue \
        packages/frontend/tests/features/reports/StackedShareBar.test.ts
git commit -m "feat: add StackedShareBar for decision-counts composition"
```

If `git` errors, note it and continue.

---

## Task 10: Integrate charts into `DashboardView.vue`

**Files:**
- Modify: `packages/frontend/src/features/dashboard/DashboardView.vue`

No test for this step — the chart-component tests already cover the individual behaviors, and `DashboardView.vue` is a thin composer with no branching logic. Visual verification happens in Task 11.

- [ ] **Step 1: Replace the file contents**

Overwrite `packages/frontend/src/features/dashboard/DashboardView.vue` with:

```vue
<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { AlertStatus, RuleSeverity } from "@fdcdf/shared";
import { useClaimsStore } from "@/stores/claims.store";
import { useAlertsStore } from "@/stores/alerts.store";
import { useReportsStore } from "@/stores/reports.store";
import GlassPanel from "@/ui/GlassPanel.vue";
import { formatDate } from "@/utils/date";
import DoughnutChart from "@/features/reports/components/DoughnutChart.vue";
import HorizontalBarChart from "@/features/reports/components/HorizontalBarChart.vue";
import StackedShareBar from "@/features/reports/components/StackedShareBar.vue";
import {
  DECISION_COLORS,
  RISK_BAND_COLORS,
} from "@/features/reports/charts.colors";

const router = useRouter();
const claimsStore = useClaimsStore();
const alertsStore = useAlertsStore();
const reportsStore = useReportsStore();

const openAlerts = computed(
  () => alertsStore.alerts.filter((a) => a.status === AlertStatus.OPEN).length
);
const criticalAlerts = computed(
  () =>
    alertsStore.alerts.filter(
      (a) => a.severity === RuleSeverity.CRITICAL && a.status === AlertStatus.OPEN
    ).length
);
const totalClaims = computed(() => claimsStore.pagination?.total ?? 0);

const topProcedures = computed(() =>
  (reportsStore.topEntities?.procedures ?? []).map((e) => ({
    label: e.label,
    value: e.value,
  }))
);
const topProviders = computed(() =>
  (reportsStore.topEntities?.providers ?? []).map((e) => ({
    label: e.label,
    value: e.value,
  }))
);
const topPatients = computed(() =>
  (reportsStore.topEntities?.patients ?? []).map((e) => ({
    label: e.label,
    value: e.value,
  }))
);

// For top-entities, show an empty state when the slice has loaded but all
// three arrays are empty. Pass `null` before loading, `[]` when empty.
const topProceduresSeries = computed(() =>
  reportsStore.topEntities === null ? null : topProcedures.value
);
const topProvidersSeries = computed(() =>
  reportsStore.topEntities === null ? null : topProviders.value
);
const topPatientsSeries = computed(() =>
  reportsStore.topEntities === null ? null : topPatients.value
);

onMounted(() => {
  claimsStore.fetchClaims(1, 10);
  alertsStore.fetchAlerts(1, 100);
  reportsStore.fetchAllReports();
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-navy-auth mb-6">Dashboard</h1>

    <!-- Summary cards (existing) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <GlassPanel class="cursor-pointer hover:shadow-md transition-shadow" @click="router.push('/alerts')">
        <div class="text-xs text-navy-500 mb-1">Open Alerts</div>
        <div class="text-3xl font-semibold text-navy-auth">{{ openAlerts }}</div>
      </GlassPanel>
      <GlassPanel class="cursor-pointer hover:shadow-md transition-shadow" @click="router.push('/alerts')">
        <div class="text-xs text-navy-500 mb-1">Critical Alerts</div>
        <div class="text-3xl font-semibold text-red-critical">{{ criticalAlerts }}</div>
      </GlassPanel>
      <GlassPanel class="cursor-pointer hover:shadow-md transition-shadow" @click="router.push('/claims')">
        <div class="text-xs text-navy-500 mb-1">Total Claims</div>
        <div class="text-3xl font-semibold text-navy-auth">{{ totalClaims }}</div>
      </GlassPanel>
    </div>

    <!-- Row: risk bands (1/3) + decision counts (2/3) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="md:col-span-1">
        <DoughnutChart
          title="Risk bands"
          :series="reportsStore.riskBands"
          :loading="reportsStore.loading.riskBands"
          :error="reportsStore.error.riskBands"
          :color-map="RISK_BAND_COLORS"
          :on-retry="reportsStore.fetchRiskBands"
        />
      </div>
      <div class="md:col-span-2">
        <StackedShareBar
          title="Decisions"
          :series="reportsStore.decisionCounts"
          :loading="reportsStore.loading.decisionCounts"
          :error="reportsStore.error.decisionCounts"
          :color-map="DECISION_COLORS"
          :on-retry="reportsStore.fetchDecisionCounts"
        />
      </div>
    </div>

    <!-- Row: rule frequency (full width) -->
    <div class="mb-4">
      <HorizontalBarChart
        title="Rule frequency"
        :series="reportsStore.ruleFrequency"
        :loading="reportsStore.loading.ruleFrequency"
        :error="reportsStore.error.ruleFrequency"
        :height="280"
        :on-retry="reportsStore.fetchRuleFrequency"
      />
    </div>

    <!-- Row: top procedures / providers / patients -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <HorizontalBarChart
        title="Top procedures"
        :series="topProceduresSeries"
        :loading="reportsStore.loading.topEntities"
        :error="reportsStore.error.topEntities"
        :on-retry="reportsStore.fetchTopEntities"
      />
      <HorizontalBarChart
        title="Top providers"
        :series="topProvidersSeries"
        :loading="reportsStore.loading.topEntities"
        :error="reportsStore.error.topEntities"
        :on-retry="reportsStore.fetchTopEntities"
      />
      <HorizontalBarChart
        title="Top patients"
        :series="topPatientsSeries"
        :loading="reportsStore.loading.topEntities"
        :error="reportsStore.error.topEntities"
        :on-retry="reportsStore.fetchTopEntities"
      />
    </div>

    <!-- Recent claims (existing) -->
    <div>
      <h2 class="text-sm font-semibold text-navy-auth mb-3">Recent Claims</h2>
      <div v-if="claimsStore.claims.length" class="border border-border-subtle rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border-subtle bg-surface-glass">
              <th class="px-4 py-2 text-left font-semibold">Claim ID</th>
              <th class="px-4 py-2 text-left font-semibold">Date</th>
              <th class="px-4 py-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="claim in claimsStore.claims.slice(0, 5)"
              :key="claim.id"
              class="border-b border-border-subtle last:border-0 hover:bg-surface-glass cursor-pointer"
              @click="router.push(`/claims/${claim.id}`)"
            >
              <td class="px-4 py-2 font-mono">{{ claim.externalClaimId }}</td>
              <td class="px-4 py-2">{{ formatDate(claim.dateOfService) }}</td>
              <td class="px-4 py-2">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-blue-clinical-light text-blue-clinical': claim.status === 'ACCEPTED',
                    'bg-amber-alert-light text-amber-alert': claim.status === 'ACCEPTED_WITH_WARNINGS',
                    'bg-red-critical-light text-red-critical': claim.status === 'REJECTED',
                  }"
                >
                  {{ claim.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <GlassPanel v-else>
        <div class="text-center py-4 text-navy-500 text-sm">No claims yet.</div>
      </GlassPanel>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Type-check**

Run from `packages/frontend/`:

```bash
npx vue-tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 3: Run the full frontend test suite**

```bash
npm test
```

Expected: all suites pass, including the new `reports` store and chart tests and all existing tests.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/features/dashboard/DashboardView.vue
git commit -m "feat: surface report charts on the dashboard"
```

If `git` errors, note it and continue.

---

## Task 11: Visual verification in a browser

**Files:** none modified — this task only runs the dev server and verifies the charts render correctly end-to-end against the backend.

- [ ] **Step 1: Start the frontend dev server**

From `packages/frontend/`:

```bash
npm run dev
```

Expected: Vite prints a local URL (typically `http://localhost:5173`).

- [ ] **Step 2: Ensure the backend is running**

The charts call `/api/v1/reports/*` on the same host. The dev proxy (configured in `vite.config.ts`) forwards to the backend. If the backend is not already running, start it per project instructions (outside this plan's scope) — do **not** modify backend code.

- [ ] **Step 3: Log in and navigate to the Dashboard**

Open the dev URL in a browser, log in with a test account that has dashboard access, and land on the Dashboard route.

Expected to see, from top to bottom:

1. Existing three summary cards (Open Alerts / Critical Alerts / Total Claims) unchanged.
2. **Risk bands** doughnut on the left (1/3 width) with legend at the bottom.
3. **Decisions** single-row stacked bar on the right (2/3 width) with colored segments for LEGITIMATE / EDUCATION_REQUIRED / CONFIRMED_FRAUD.
4. **Rule frequency** full-width horizontal bar chart.
5. Three horizontal bar charts side-by-side: **Top procedures / Top providers / Top patients**.
6. Recent Claims table unchanged at the bottom.

- [ ] **Step 4: Verify each chart state manually**

**Populated:** all six charts render canvases matching the layout above.

**Empty:** in DevTools Network panel, right-click a single `/api/v1/reports/*` request and use "Block request URL". Hard-refresh the Dashboard. The matching chart should show "Could not load chart." with a "Retry" button. Click Retry — the chart should reload (unblock the URL first).

**Loading:** throttle the network to "Slow 3G" (DevTools → Network → Throttling) and reload. Each chart should display its skeleton loader before resolving.

- [ ] **Step 5: Verify layout at md and below breakpoints**

Resize the browser to below 768 px. All chart rows should collapse to a single column. Nothing should overflow horizontally.

- [ ] **Step 6: Check console for errors**

The browser console should be free of errors from Chart.js, vue-chartjs, or Vue. A warning about `Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true` can be ignored — it's a Chrome hint, not a bug.

- [ ] **Step 7: Record verification outcome**

In your task output, explicitly state:

- "Visual verification: **passed**" if all six charts render and states behave correctly.
- "Visual verification: **could not run**" with the reason if the backend is not available. Do not mark the plan complete in that case — flag it to the user.

- [ ] **Step 8: Commit (documentation only if any docs were updated during verification)**

No code changes. If nothing changed, skip the commit.

---

## Final verification

- [ ] **Step 1: Run the full test suite one more time**

```bash
cd packages/frontend && npm test
```

Expected: all suites pass, zero failures.

- [ ] **Step 2: Run the TypeScript build**

```bash
npm run build
```

Expected: `vue-tsc -b && vite build` both succeed. Dist output includes a separate chunk containing `chart.js`.

- [ ] **Step 3: Report completion**

Confirm to the user:

- All tasks checked off.
- Full test suite green.
- `npm run build` succeeds.
- Visual verification status (passed / could-not-run).
- Note any deviations from the spec or plan.
