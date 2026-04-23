# Claim Resolution Status & Analysis Persistence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface a derived claim-level "resolution" status that reacts to line decisions, and persist analysis results across reloads by reading a new `latestAnalysis` field on `ClaimResponse`.

**Architecture:** Two independent additions that ship together. (1) A new `ResolutionStatus` enum + pure `deriveResolutionStatus` helper in `@fdcdf/shared`, rendered via a new `ResolutionStatusBadge` component in the claim detail and list views. (2) An optional `latestAnalysis` field on `ClaimResponse` that the frontend hydrates into the existing `analysisResult` ref — no new endpoints on the frontend side; backend populates the field (flagged as handoff).

**Tech Stack:** TypeScript, Vue 3 Composition API (`<script setup>`), Pinia, Vitest + Vue Test Utils, Tailwind CSS. Monorepo with npm workspaces — `@fdcdf/shared` is consumed from its compiled `dist/`, so any change in `packages/shared/` requires a rebuild before the frontend can see it.

**Workspace note:** This workspace is not currently a git repository, so the plan omits commit steps. If you're running this in a git-tracked fork/clone, commit after each task with a message referencing the task number.

**Reference spec:** `docs/superpowers/specs/2026-04-20-claim-resolution-status-and-analysis-persistence-design.md`

---

## File Structure

**Shared (`packages/shared/src/`):**
- Modify `enums.ts` — add `ResolutionStatus` enum
- Create `resolution-status.ts` — pure `deriveResolutionStatus(lines, decisions)` helper
- Modify `types.ts` — add `ClaimLatestAnalysis` interface; add optional `latestAnalysis` to `ClaimResponse`
- Modify `index.ts` — re-export `resolution-status`

**Frontend (`packages/frontend/src/`):**
- Modify `stores/claims.store.ts` — `fetchClaim` hydrates `analysisResult` from `latestAnalysis` instead of clearing it
- Create `features/claims/components/ResolutionStatusBadge.vue` — new badge component
- Modify `features/claims/ClaimDetailView.vue` — render resolution badge; switch Analyze button label to "Re-analyze" when analysis exists
- Modify `features/claims/ClaimsListView.vue` — add a "Review" column rendering the resolution badge per row

**Tests (`packages/frontend/tests/`):**
- Create `shared/resolution-status.test.ts` — unit tests for `deriveResolutionStatus` (lives in the frontend test tree because `packages/shared` has no test runner configured)
- Modify `stores/claims.store.test.ts` — update the existing `fetchClaim` assertion; add a new test for `latestAnalysis` hydration
- Create `features/claims/ResolutionStatusBadge.test.ts` — component test for each state

---

## Task 1: Add `ResolutionStatus` enum and `deriveResolutionStatus` helper (shared)

**Files:**
- Modify: `packages/shared/src/enums.ts`
- Create: `packages/shared/src/resolution-status.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/frontend/tests/shared/resolution-status.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/tests/shared/resolution-status.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  LineDecision,
  ResolutionStatus,
  deriveResolutionStatus,
} from "@fdcdf/shared";

type Line = { id: string };
type Dec = { claimLineId: string; decision: LineDecision };

function decided(lineId: string, decision: LineDecision): Dec {
  return { claimLineId: lineId, decision };
}

describe("deriveResolutionStatus", () => {
  const lines: Line[] = [{ id: "l1" }, { id: "l2" }];

  it("returns PENDING_REVIEW when there are no lines", () => {
    expect(deriveResolutionStatus([], [])).toBe(ResolutionStatus.PENDING_REVIEW);
  });

  it("returns PENDING_REVIEW when no line has a decision", () => {
    expect(deriveResolutionStatus(lines, [])).toBe(ResolutionStatus.PENDING_REVIEW);
  });

  it("returns IN_REVIEW when some (but not all) lines are decided", () => {
    const decisions = [decided("l1", LineDecision.LEGITIMATE)];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.IN_REVIEW);
  });

  it("returns CLEARED when all lines are decided LEGITIMATE", () => {
    const decisions = [
      decided("l1", LineDecision.LEGITIMATE),
      decided("l2", LineDecision.LEGITIMATE),
    ];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.CLEARED);
  });

  it("returns EDUCATION_FLAGGED when all decided, >=1 EDUCATION_REQUIRED, none fraud", () => {
    const decisions = [
      decided("l1", LineDecision.LEGITIMATE),
      decided("l2", LineDecision.EDUCATION_REQUIRED),
    ];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.EDUCATION_FLAGGED);
  });

  it("returns CONFIRMED_FRAUD when all decided and >=1 CONFIRMED_FRAUD (fraud wins over education)", () => {
    const decisions = [
      decided("l1", LineDecision.EDUCATION_REQUIRED),
      decided("l2", LineDecision.CONFIRMED_FRAUD),
    ];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.CONFIRMED_FRAUD);
  });

  it("returns CONFIRMED_FRAUD when all decided and fraud mixed with legitimate", () => {
    const decisions = [
      decided("l1", LineDecision.LEGITIMATE),
      decided("l2", LineDecision.CONFIRMED_FRAUD),
    ];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.CONFIRMED_FRAUD);
  });

  it("ignores decisions referencing unknown line ids", () => {
    const decisions = [decided("ghost", LineDecision.CONFIRMED_FRAUD)];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.PENDING_REVIEW);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w @fdcdf/frontend -- tests/shared/resolution-status.test.ts`
Expected: FAIL with `ResolutionStatus`/`deriveResolutionStatus` not exported from `@fdcdf/shared`.

- [ ] **Step 3: Add the `ResolutionStatus` enum**

Append to `packages/shared/src/enums.ts` (after the existing `LineDecision` enum):

```ts
export enum ResolutionStatus {
  PENDING_REVIEW = "PENDING_REVIEW",
  IN_REVIEW = "IN_REVIEW",
  CLEARED = "CLEARED",
  EDUCATION_FLAGGED = "EDUCATION_FLAGGED",
  CONFIRMED_FRAUD = "CONFIRMED_FRAUD",
}
```

- [ ] **Step 4: Create the helper**

Create `packages/shared/src/resolution-status.ts`:

```ts
import { LineDecision, ResolutionStatus } from "./enums";

export interface ResolutionLine {
  id: string;
}

export interface ResolutionDecision {
  claimLineId: string;
  decision: LineDecision;
}

export function deriveResolutionStatus(
  lines: ResolutionLine[],
  decisions: ResolutionDecision[]
): ResolutionStatus {
  if (lines.length === 0) return ResolutionStatus.PENDING_REVIEW;

  const lineIds = new Set(lines.map((l) => l.id));
  const decisionByLine = new Map<string, LineDecision>();
  for (const d of decisions) {
    if (lineIds.has(d.claimLineId)) {
      decisionByLine.set(d.claimLineId, d.decision);
    }
  }

  if (decisionByLine.size === 0) return ResolutionStatus.PENDING_REVIEW;
  if (decisionByLine.size < lines.length) return ResolutionStatus.IN_REVIEW;

  const values = Array.from(decisionByLine.values());
  if (values.includes(LineDecision.CONFIRMED_FRAUD)) return ResolutionStatus.CONFIRMED_FRAUD;
  if (values.includes(LineDecision.EDUCATION_REQUIRED)) return ResolutionStatus.EDUCATION_FLAGGED;
  return ResolutionStatus.CLEARED;
}
```

- [ ] **Step 5: Re-export from the shared index**

Modify `packages/shared/src/index.ts` to:

```ts
export * from "./enums";
export * from "./types";
export * from "./resolution-status";
```

- [ ] **Step 6: Rebuild shared so the frontend can import the new exports**

Run: `npm run build -w @fdcdf/shared`
Expected: build succeeds; `packages/shared/dist/resolution-status.js` and `.d.ts` exist.

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test -w @fdcdf/frontend -- tests/shared/resolution-status.test.ts`
Expected: PASS (8 tests).

---

## Task 2: Add `ClaimLatestAnalysis` type and extend `ClaimResponse`

**Files:**
- Modify: `packages/shared/src/types.ts`

- [ ] **Step 1: Add the interface and extend `ClaimResponse`**

In `packages/shared/src/types.ts`, add a new interface near the existing analysis types (after `AlertDto`, around line 250):

```ts
export interface ClaimLatestAnalysis {
  riskScore: RiskScoreDto;
  ruleResults: RuleResultDto[];
  alerts: AlertDto[];
  analyzedAt: string;
}
```

Then modify the existing `ClaimResponse` interface (around lines 191-204) to add the optional field. The full updated interface should be:

```ts
export interface ClaimResponse {
  id: string;
  externalClaimId: string;
  patientId: string;
  providerId: string;
  duplicateOfClaimId?: string | null;
  dateOfService: string;
  submissionDate: string;
  status: ClaimStatus;
  warnings: string[];
  lines: ClaimLineDto[];
  decisions: ClaimLineDecisionDto[];
  createdAt: string;
  latestAnalysis?: ClaimLatestAnalysis;
}
```

- [ ] **Step 2: Rebuild shared**

Run: `npm run build -w @fdcdf/shared`
Expected: build succeeds.

- [ ] **Step 3: Verify frontend still typechecks**

Run: `npm run build -w @fdcdf/frontend`
Expected: build succeeds. (The new field is optional, so existing code continues to compile.)

---

## Task 3: Hydrate `analysisResult` from `latestAnalysis` in `claims.store`

**Files:**
- Modify: `packages/frontend/src/stores/claims.store.ts`
- Test: `packages/frontend/tests/stores/claims.store.test.ts`

- [ ] **Step 1: Update the existing test and add a new one**

In `packages/frontend/tests/stores/claims.store.test.ts`, replace the existing `"fetchClaim sets currentClaim"` test and add a second one. The full replacement block (replacing lines 65-74 of the current file):

```ts
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
```

- [ ] **Step 2: Run the tests to verify the new one fails**

Run: `npm test -w @fdcdf/frontend -- tests/stores/claims.store.test.ts`
Expected: the new hydration test FAILS because the store still clears `analysisResult` unconditionally.

- [ ] **Step 3: Update the store**

In `packages/frontend/src/stores/claims.store.ts`, replace the existing `fetchClaim` function (lines 32-41) with:

```ts
async function fetchClaim(claimId: string) {
  loading.value = true;
  try {
    const response = await api.get(`/api/v1/claims/${claimId}`);
    const claim = response.data as ClaimResponse;
    currentClaim.value = claim;
    if (claim.latestAnalysis) {
      analysisResult.value = {
        claim,
        riskScore: claim.latestAnalysis.riskScore,
        ruleResults: claim.latestAnalysis.ruleResults,
        alerts: claim.latestAnalysis.alerts,
      };
    } else {
      analysisResult.value = null;
    }
  } finally {
    loading.value = false;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -w @fdcdf/frontend -- tests/stores/claims.store.test.ts`
Expected: PASS (5 tests, including the two updated ones).

---

## Task 4: Create `ResolutionStatusBadge.vue` component

**Files:**
- Create: `packages/frontend/src/features/claims/components/ResolutionStatusBadge.vue`
- Test: `packages/frontend/tests/features/claims/ResolutionStatusBadge.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/tests/features/claims/ResolutionStatusBadge.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { ResolutionStatus } from "@fdcdf/shared";
import ResolutionStatusBadge from "@/features/claims/components/ResolutionStatusBadge.vue";

describe("ResolutionStatusBadge", () => {
  const cases: Array<[ResolutionStatus, string, string]> = [
    [ResolutionStatus.PENDING_REVIEW, "Pending Review", "navy-500"],
    [ResolutionStatus.IN_REVIEW, "In Review", "blue-clinical"],
    [ResolutionStatus.CLEARED, "Cleared", "blue-clinical"],
    [ResolutionStatus.EDUCATION_FLAGGED, "Education Flagged", "amber-alert"],
    [ResolutionStatus.CONFIRMED_FRAUD, "Confirmed Fraud", "red-critical"],
  ];

  for (const [status, label, colorFragment] of cases) {
    it(`renders "${label}" with the ${colorFragment} color for ${status}`, () => {
      const wrapper = mount(ResolutionStatusBadge, {
        props: { status },
      });
      expect(wrapper.text()).toBe(label);
      expect(wrapper.classes().join(" ")).toContain(colorFragment);
    });
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w @fdcdf/frontend -- tests/features/claims/ResolutionStatusBadge.test.ts`
Expected: FAIL — component file does not exist.

- [ ] **Step 3: Create the component**

Create `packages/frontend/src/features/claims/components/ResolutionStatusBadge.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";
import { ResolutionStatus } from "@fdcdf/shared";

const props = defineProps<{ status: ResolutionStatus }>();

const style = computed(() => {
  switch (props.status) {
    case ResolutionStatus.PENDING_REVIEW:
      return "bg-border-subtle text-navy-500";
    case ResolutionStatus.IN_REVIEW:
    case ResolutionStatus.CLEARED:
      return "bg-blue-clinical-light text-blue-clinical";
    case ResolutionStatus.EDUCATION_FLAGGED:
      return "bg-amber-alert-light text-amber-alert";
    case ResolutionStatus.CONFIRMED_FRAUD:
      return "bg-red-critical-light text-red-critical";
    default:
      return "bg-border-subtle text-navy-500";
  }
});

const label = computed(() => {
  switch (props.status) {
    case ResolutionStatus.PENDING_REVIEW:
      return "Pending Review";
    case ResolutionStatus.IN_REVIEW:
      return "In Review";
    case ResolutionStatus.CLEARED:
      return "Cleared";
    case ResolutionStatus.EDUCATION_FLAGGED:
      return "Education Flagged";
    case ResolutionStatus.CONFIRMED_FRAUD:
      return "Confirmed Fraud";
    default:
      return props.status;
  }
});
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="style">
    {{ label }}
  </span>
</template>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w @fdcdf/frontend -- tests/features/claims/ResolutionStatusBadge.test.ts`
Expected: PASS (5 tests).

---

## Task 5: Render resolution badge and "Re-analyze" label in `ClaimDetailView.vue`

**Files:**
- Modify: `packages/frontend/src/features/claims/ClaimDetailView.vue`

No automated test here (there is no existing unit test for `ClaimDetailView`, and adding one is out of scope for this plan). Manual verification at the end.

- [ ] **Step 1: Import the new badge and helper**

In `packages/frontend/src/features/claims/ClaimDetailView.vue`, add to the existing imports block (after the `ClaimStatusBadge` import on line 10):

```ts
import ResolutionStatusBadge from "./components/ResolutionStatusBadge.vue";
import { deriveResolutionStatus } from "@fdcdf/shared";
```

- [ ] **Step 2: Add the `resolutionStatus` and `analyzeButtonLabel` computed values**

In the `<script setup>` block, after the existing `analysis` computed (around line 26), add:

```ts
const resolutionStatus = computed(() => {
  if (!claim.value) return null;
  return deriveResolutionStatus(claim.value.lines, claim.value.decisions ?? []);
});

const analyzeButtonLabel = computed(() => (analysis.value ? "Re-analyze" : "Analyze"));
```

- [ ] **Step 3: Render the resolution badge next to the claim-status badge**

In the template, find the block around lines 118-124 that renders `<ClaimStatusBadge>` + the Analyze button. Replace that `<div class="flex items-center gap-3">` block with:

```vue
<div class="flex items-center gap-3">
  <ClaimStatusBadge :status="claim.status" />
  <ResolutionStatusBadge v-if="resolutionStatus" :status="resolutionStatus" />
  <AppButton size="sm" :loading="claimsStore.loading" @click="handleAnalyze">
    {{ analyzeButtonLabel }}
  </AppButton>
</div>
```

- [ ] **Step 4: Typecheck**

Run: `npm run build -w @fdcdf/frontend`
Expected: build succeeds.

---

## Task 6: Render resolution badge on `ClaimsListView.vue`

**Files:**
- Modify: `packages/frontend/src/features/claims/ClaimsListView.vue`

- [ ] **Step 1: Import the badge and helper**

In `packages/frontend/src/features/claims/ClaimsListView.vue`, add to the existing imports (after the `ClaimStatusBadge` import on line 10):

```ts
import ResolutionStatusBadge from "./components/ResolutionStatusBadge.vue";
import { deriveResolutionStatus } from "@fdcdf/shared";
```

- [ ] **Step 2: Add the Review column**

In the `columns` array (lines 22-29), add a new column entry after the existing `status` column:

```ts
const columns: Column<ClaimResponse>[] = [
  { key: "externalClaimId", label: "Claim ID", mono: true },
  { key: "patientId", label: "Patient" },
  { key: "providerId", label: "Provider" },
  { key: "dateOfService", label: "Date of Service" },
  { key: "status", label: "Status" },
  { key: "resolution", label: "Review" },
  { key: "createdAt", label: "Created" },
];
```

- [ ] **Step 3: Add the slot that renders the badge**

In the template, after the existing `#cell-status` slot (around lines 86-88), add:

```vue
<template #cell-resolution="{ row }">
  <ResolutionStatusBadge
    :status="deriveResolutionStatus(row.lines, row.decisions ?? [])"
  />
</template>
```

Make sure `deriveResolutionStatus` is accessible from the template. Because `<script setup>` auto-exposes top-level bindings, the import from Step 1 is enough — no `defineExpose` needed.

- [ ] **Step 4: Typecheck and run the existing frontend tests**

Run: `npm run build -w @fdcdf/frontend && npm test -w @fdcdf/frontend`
Expected: build succeeds; all tests pass (including the new ones from Tasks 1, 3, 4).

---

## Task 7: Manual verification

- [ ] **Step 1: Start the dev server**

Run: `npm run dev -w @fdcdf/frontend`

- [ ] **Step 2: Verify the claims list view**

Navigate to `/claims`. Confirm:
- A "Review" column is visible between "Status" and "Created".
- Claims with no decisions show the grey "Pending Review" badge.
- Claims with partial decisions show the blue "In Review" badge.
- Claims with all-legitimate decisions show "Cleared", etc.

- [ ] **Step 3: Verify the detail view — resolution badge reacts to decisions**

Open a claim that has no decisions yet. Confirm:
- Both `ClaimStatusBadge` and `ResolutionStatusBadge` render in the header, with resolution showing "Pending Review".
- Clicking a tooth on the dental map (or a row in the line table) opens the Evidence Sidebar.
- Setting a decision on one line changes the resolution badge to "In Review" immediately (no page refresh).
- Setting decisions on all lines transitions the badge to the correct terminal state per the precedence rules: `CONFIRMED_FRAUD` > `EDUCATION_REQUIRED` > `LEGITIMATE`.
- Clearing all decisions returns the badge to "Pending Review".

- [ ] **Step 4: Verify analysis persistence**

Still on the detail view:
- Click "Analyze". Verify the risk header, rule results, and generated alerts render, and the button label becomes "Re-analyze".
- Navigate to the claims list and back to the same claim. If the backend is populating `latestAnalysis`, the analysis should still be visible and the button should still say "Re-analyze". If the backend has not yet been updated, the analysis will disappear — note this as the pending backend handoff.
- Click "Re-analyze". Confirm it runs and the analysis is refreshed.

- [ ] **Step 5: Regression sweep**

Navigate through the rest of the app (alerts, patients, providers, reports) to confirm no unrelated regressions.

---

## Backend handoff (out of scope)

Leave a note for the backend team in the project tracker:

- Extend `GET /api/v1/claims/:id` to populate the new optional `latestAnalysis` field when analysis rows exist.
- Source: most recent rows from `risk_scores`, `rule_results`, `alerts` joined by `claim_id`. `analyzedAt` = timestamp of that analysis run.
- List endpoint `GET /api/v1/claims` should omit the field to keep payloads small.
- No migration needed. No change to `POST /api/v1/claims/:id/analyze`.

Until that change ships, Task 7 Step 4 will show analysis disappearing after navigation — expected and documented.
