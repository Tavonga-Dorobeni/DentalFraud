# Dashboard Report Charts — Design Spec

**Date:** 2026-04-19
**Scope:** Frontend only (`packages/frontend/`, `packages/shared/`). Backend endpoints already exist and are out of scope.

---

## 1. Goal

Add four chart-driven visualizations to the dashboard that consume the new `/api/v1/reports/*` endpoints directly. The frontend treats these endpoints as chart-ready sources and does not re-aggregate raw claims.

Visualizations:

| # | Source endpoint | Visualization |
|---|------------------|---------------|
| 1 | `GET /api/v1/reports/risk-band-distribution` | Doughnut |
| 2 | `GET /api/v1/reports/rule-frequency` | Horizontal bar |
| 3 | `GET /api/v1/reports/decision-counts` | Single 100% stacked horizontal bar (composition / share bar) |
| 4 | `GET /api/v1/reports/top-entities?limit=5` | Three horizontal bars: procedures, providers, patients |

---

## 2. Contract with the backend

The frontend consumes these response shapes verbatim.

**Endpoints 1–3:**

```json
{
  "success": true,
  "data": {
    "series": [
      { "label": "HIGH", "value": 4 },
      { "label": "CRITICAL", "value": 2 }
    ]
  }
}
```

**Endpoint 4:**

```json
{
  "success": true,
  "data": {
    "procedures": [{ "id": "D2140", "label": "D2140", "value": 8 }],
    "providers":  [{ "id": "provider_x", "label": "Dr. Example", "value": 6 }],
    "patients":   [{ "id": "patient_y", "label": "Anesu Zhou", "value": 4 }]
  }
}
```

The existing axios interceptor (`packages/frontend/src/composables/useApi.ts`) already unwraps the `{ success, data }` envelope, so stores receive the inner object directly.

---

## 3. Technology choice

**Chart library:** `chart.js` + `vue-chartjs`.

Rejected alternatives:

- **Custom inline SVG charts.** Consistent with the project's SVG-heavy aesthetic (dental arch, Integrity Shield), but requires re-implementing axes, tooltips, legends, and animations for six visualizations — disproportionate effort for the output.
- **Apache ECharts via `vue-echarts`.** Most feature-rich but 300 KB+ is overkill for these charts.

Chart.js controllers, elements, and plugins are tree-shaken — only the pieces we actually use are registered.

---

## 4. Data layer

### 4.1 Shared types

Added to `packages/shared/src/types.ts` and re-exported from the package index:

```ts
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

### 4.2 Pinia store

New file: `packages/frontend/src/stores/reports.store.ts`.

**State:**

```
riskBands:       ChartSeriesPoint[] | null
ruleFrequency:   ChartSeriesPoint[] | null
decisionCounts:  ChartSeriesPoint[] | null
topEntities:     TopEntitiesReport  | null

loading: { riskBands, ruleFrequency, decisionCounts, topEntities }   // booleans
error:   { riskBands, ruleFrequency, decisionCounts, topEntities }   // booleans
```

**Actions:**

- `fetchRiskBands()` → `GET /api/v1/reports/risk-band-distribution`
- `fetchRuleFrequency()` → `GET /api/v1/reports/rule-frequency`
- `fetchDecisionCounts()` → `GET /api/v1/reports/decision-counts`
- `fetchTopEntities(limit = 5)` → `GET /api/v1/reports/top-entities?limit=${limit}`
- `fetchAllReports()` — convenience wrapper that runs the four in parallel via `Promise.allSettled` so one failing endpoint does not blank the others.

Each action sets its own `loading` flag on entry, clears it on exit (`try / finally`), and flips the matching `error` flag on failure so the component can show a per-chart error state.

No composable layer — stores are the project's established pattern for server state and there is no reusable logic that needs to live separately.

---

## 5. Chart components

### 5.1 File layout

```
packages/frontend/src/features/reports/
  components/
    DoughnutChart.vue        # risk band distribution
    HorizontalBarChart.vue   # rule frequency + top-entity charts (reused 4×)
    StackedShareBar.vue      # decision counts (single-row 100% stacked bar)
  charts.config.ts           # one-time Chart.js registration
  charts.colors.ts           # semantic color maps
```

### 5.2 Component contract

All three chart components share the same prop shape:

| Prop | Type | Required | Purpose |
|------|------|----------|---------|
| `series` | `ChartSeriesPoint[]` | yes | Data to render |
| `title` | `string` | no | Rendered above the chart body inside the same `GlassPanel` |
| `colorMap` | `Record<string, string>` | no | Label → CSS color override (falls back to default palette) |

Components emit nothing. Each wraps its Chart.js canvas in a `GlassPanel`.

Chart sizing: fixed panel height (240 px for single-row charts, 280 px for rule frequency) with Chart.js configured as `responsive: true, maintainAspectRatio: false`. This avoids layout thrash from Chart.js's default aspect-ratio sizing.

Legends: **on** for doughnut and stacked share bar (they need to decode colors); **off** for monochrome horizontal bars (axis labels already act as the legend).

**Stacked share bar implementation notes:** rendered as a Chart.js `bar` chart with `indexAxis: 'y'`, `stacked: true`, and one dataset per decision-type segment. Segment widths are proportional to raw `value`; the x-axis is hidden. Tooltips show `<label>: <count>` — raw counts, not percentages.

### 5.3 `charts.config.ts`

Registers exactly the Chart.js pieces used:

- Controllers: `DoughnutController`, `BarController`
- Elements: `ArcElement`, `BarElement`
- Scales: `CategoryScale`, `LinearScale`
- Plugins: `Tooltip`, `Legend`

Registration is idempotent; the module is imported at the top of each chart component.

### 5.4 `charts.colors.ts`

Semantic color maps keyed off the labels the backend returns:

```
Risk bands (doughnut):
  LOW       → var(--color-blue-clinical)   // #3B82F6
  MEDIUM    → var(--color-amber-alert)     // #F59E0B
  HIGH      → var(--color-orange-warning)  // #F97316  (NEW token)
  CRITICAL  → var(--color-red-critical)    // #EF4444

Decisions (stacked share bar):
  LEGITIMATE         → var(--color-green-legitimate)  // #22C55E (existing token)
  EDUCATION_REQUIRED → var(--color-amber-alert)
  CONFIRMED_FRAUD    → var(--color-red-critical)

Rule frequency / top entities (horizontal bars):
  All bars → var(--color-blue-clinical)  (monochrome — labels are arbitrary strings)

Fallback for unknown labels:
  var(--color-navy-auth) at 60% opacity
```

**New CSS token** added to `packages/frontend/src/assets/styles/main.css`:

```css
--color-orange-warning: #F97316;
```

This is required because risk has four bands but the existing palette only exposes three warm colors (amber-alert, red-critical, plus the blue/navy cool set).

Chart.js consumes hex values, not CSS custom properties, so the color map resolves the tokens to their hex literals. The CSS variable still lives in `main.css` as the canonical source.

---

## 6. Dashboard layout

File touched: `packages/frontend/src/features/dashboard/DashboardView.vue`.

Existing content is preserved; charts are inserted between the summary cards and the recent-claims table.

**Grid (md breakpoint and above):**

```
Dashboard heading
──────────────────────────────────────────────────────
[ Open Alerts ][ Critical Alerts ][ Total Claims ]    ← existing
──────────────────────────────────────────────────────
[ Risk Bands (1/3) ][ Decision Counts (2/3) ]
──────────────────────────────────────────────────────
[ Rule Frequency (full width) ]
──────────────────────────────────────────────────────
[ Top Procedures ][ Top Providers ][ Top Patients ]
──────────────────────────────────────────────────────
Recent Claims table                                   ← existing
```

All rows collapse to single column below `md`. Uses Tailwind grid utilities (`grid grid-cols-1 md:grid-cols-3 gap-4`, etc.) consistent with the existing dashboard.

**On mount:** `DashboardView.vue` calls `reportsStore.fetchAllReports()` alongside the existing `claimsStore.fetchClaims(...)` and `alertsStore.fetchAlerts(...)` calls.

---

## 7. Per-chart states

Each chart panel renders exactly one of four states:

| State | Condition | Rendered content |
|-------|-----------|------------------|
| Loading | `loading[chart]` is `true` | `AppSkeletonLoader` filling the panel body |
| Error | `error[chart]` is `true` | Centered `"Could not load chart."` message with a small `Retry` button that re-invokes the matching store action |
| Empty | Fetched successfully but the data is empty (`series.length === 0` for the single-series charts, or all three entity arrays empty for top entities) | Centered `"No data yet."` message (same tone as the existing `"No claims yet."` treatment) |
| Populated | Data is present | Chart.js canvas |

Errors are surfaced inline rather than via toast — three simultaneous failures would be noisy, and inline retry is more actionable.

---

## 8. Non-goals (explicitly out of scope)

- No time-series or trend charts (none of the endpoints carry a time dimension).
- No drill-through navigation from chart segments to the underlying claim list. Can be layered on later; the entity IDs are already in the `TopEntity` payload.
- No CSV/PDF export from the dashboard. Export belongs to a future `features/reports/` page.
- No role-specific chart visibility. The dashboard route is already gated upstream.
- No changes to any backend code or to `packages/backend/`.

---

## 9. Testing

Component tests (Vitest + Vue Test Utils), one file per chart component in `features/reports/components/__tests__/`:

- Renders a loading skeleton when `series` is absent.
- Renders the empty-state message when `series` is an empty array.
- Renders a Chart.js canvas when `series` contains points.

Store test (`stores/__tests__/reports.store.spec.ts`):

- Each fetch action populates its slice on success and sets the matching `error` flag on failure.
- `fetchAllReports` does not bail out when one underlying endpoint rejects.

No E2E additions — existing Playwright coverage (if any) is sufficient; the chart canvases are not meaningfully assertable through DOM queries.

---

## 10. File change summary

**Added:**

- `packages/shared/src/types.ts` — four new interfaces (`ChartSeriesPoint`, `ChartSeriesReport`, `TopEntity`, `TopEntitiesReport`)
- `packages/frontend/src/stores/reports.store.ts`
- `packages/frontend/src/features/reports/charts.config.ts`
- `packages/frontend/src/features/reports/charts.colors.ts`
- `packages/frontend/src/features/reports/components/DoughnutChart.vue`
- `packages/frontend/src/features/reports/components/HorizontalBarChart.vue`
- `packages/frontend/src/features/reports/components/StackedShareBar.vue`
- `packages/frontend/src/features/reports/components/__tests__/*.spec.ts` (three files)
- `packages/frontend/src/stores/__tests__/reports.store.spec.ts`

**Modified:**

- `packages/frontend/package.json` — add `chart.js` and `vue-chartjs` dependencies
- `packages/frontend/src/assets/styles/main.css` — add `--color-orange-warning`
- `packages/frontend/src/features/dashboard/DashboardView.vue` — insert chart grid between summary cards and recent-claims table; call `reportsStore.fetchAllReports()` on mount
