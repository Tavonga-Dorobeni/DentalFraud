# Claim Resolution Status & Analysis Persistence — Design

**Date:** 2026-04-20
**Scope:** Frontend (`packages/frontend/`) + shared types (`packages/shared/`). One backend handoff item flagged at the bottom.

---

## 1. Problem

Two related gaps in the claim review workflow today:

1. **Evidence-panel decisions don't roll up to the claim.** Setting a line decision (`LEGITIMATE` / `EDUCATION_REQUIRED` / `CONFIRMED_FRAUD`) via the Evidence sidebar updates only the line. There is no claim-level signal of the overall review outcome — the claim's ingestion `status` (`ACCEPTED` / `ACCEPTED_WITH_WARNINGS` / `REJECTED`) stays whatever it was at intake.
2. **Analysis results vanish on reload.** `POST /claims/:id/analyze` returns risk score, rule results, and generated alerts — but `GET /claims/:id` returns none of those, and `claims.store.fetchClaim` explicitly clears `analysisResult = null` on mount. A claim that was analyzed yesterday looks un-analyzed today, forcing the user to re-run analysis to see results that already exist server-side.

---

## 2. Goals

- Give reviewers a claim-level view of the adjudication outcome that updates in real time as decisions are set.
- Make analysis results persist across navigations, reloads, and sessions without re-running analysis.
- Let reviewers re-analyze on demand (e.g. after claim edits) — re-running is user-initiated, not automatic.

## 3. Non-goals

- Automatic stale-analysis detection based on claim edits. Re-analysis is always a manual user action.
- Server-side persistence of resolution status. It is derived from `claim.decisions` on the frontend; if the backend ever needs to filter/search on it, the shared helper is reusable.
- Cross-claim bulk resolution workflows.

---

## 4. Design

### 4.1 Resolution status (shared + frontend)

A new, frontend-derived status independent from `ClaimStatus`. Ingestion status answers *"did this claim pass intake checks?"*; resolution status answers *"where is this claim in the human-review workflow?"*.

#### States and transitions

Resolution status is a pure function of `(claim.lines, claim.decisions)`:

| State | Condition | Badge color token |
|---|---|---|
| `PENDING_REVIEW` | No line has a decision | neutral (`border-subtle` / `navy-500`) |
| `IN_REVIEW` | At least one line has a decision, at least one does not | `blue-clinical-light` / `blue-clinical` |
| `CLEARED` | Every line has a decision, **all** are `LEGITIMATE` | `blue-clinical-light` / `blue-clinical` (distinct label, "Cleared") |
| `EDUCATION_FLAGGED` | Every line has a decision, ≥1 is `EDUCATION_REQUIRED`, none is `CONFIRMED_FRAUD` | `amber-alert-light` / `amber-alert` |
| `CONFIRMED_FRAUD` | Every line has a decision, ≥1 is `CONFIRMED_FRAUD` | `red-critical-light` / `red-critical` |

**Precedence** (when all lines are decided and decisions are mixed): `CONFIRMED_FRAUD` > `EDUCATION_REQUIRED` > `LEGITIMATE`. Fraud always wins.

Labels shown to users:
- `PENDING_REVIEW` → "Pending Review"
- `IN_REVIEW` → "In Review"
- `CLEARED` → "Cleared"
- `EDUCATION_FLAGGED` → "Education Flagged"
- `CONFIRMED_FRAUD` → "Confirmed Fraud"

#### Where the logic lives

Both the enum and the derivation helper live in `packages/shared/src/`:

```ts
// packages/shared/src/enums.ts
export enum ResolutionStatus {
  PENDING_REVIEW = "PENDING_REVIEW",
  IN_REVIEW = "IN_REVIEW",
  CLEARED = "CLEARED",
  EDUCATION_FLAGGED = "EDUCATION_FLAGGED",
  CONFIRMED_FRAUD = "CONFIRMED_FRAUD",
}

// packages/shared/src/resolution-status.ts
export function deriveResolutionStatus(
  lines: Array<{ id: string }>,
  decisions: Array<{ claimLineId: string; decision: LineDecision }>
): ResolutionStatus {
  if (lines.length === 0) return ResolutionStatus.PENDING_REVIEW;
  const byLine = new Map(decisions.map(d => [d.claimLineId, d.decision]));
  const decided = lines.filter(l => byLine.has(l.id));
  if (decided.length === 0) return ResolutionStatus.PENDING_REVIEW;
  if (decided.length < lines.length) return ResolutionStatus.IN_REVIEW;
  const vals = decided.map(l => byLine.get(l.id)!);
  if (vals.includes(LineDecision.CONFIRMED_FRAUD)) return ResolutionStatus.CONFIRMED_FRAUD;
  if (vals.includes(LineDecision.EDUCATION_REQUIRED)) return ResolutionStatus.EDUCATION_FLAGGED;
  return ResolutionStatus.CLEARED;
}
```

Pure, no dependencies beyond `LineDecision`. Unit-testable. Re-usable if the backend later wants to filter claims by resolution status.

#### Component: `ResolutionStatusBadge.vue`

New component in `packages/frontend/src/features/claims/components/`. Mirrors `ClaimStatusBadge.vue`:

- Props: `{ status: ResolutionStatus }`
- Computed `label` and `style` per the table above
- Uses existing Tailwind design tokens; no new colors

#### Render locations

1. **`ClaimDetailView.vue` header** — to the right of the existing `ClaimStatusBadge`, separated by a small gap. Computed via `deriveResolutionStatus(claim.lines, claim.decisions)`. Reactive: updates immediately when the Evidence panel saves a decision (the decisions store already patches `currentClaim.decisions`).
2. **`ClaimsListView.vue` row** — new column or inline badge next to the existing status. Lets reviewers spot claims still in `PENDING_REVIEW` / `IN_REVIEW` at a glance. Derived per row from the same helper.

No changes to the decisions store, Evidence sidebar, or backend for this piece.

### 4.2 Analysis persistence

#### Shared type change

Add an optional `latestAnalysis` field to `ClaimResponse`:

```ts
// packages/shared/src/types.ts
export interface ClaimLatestAnalysis {
  riskScore: RiskScoreDto;
  ruleResults: RuleResultDto[];
  alerts: AlertDto[];
  analyzedAt: string; // ISO 8601
}

export interface ClaimResponse {
  // ...existing fields
  latestAnalysis?: ClaimLatestAnalysis;
}
```

List endpoints MAY omit the field (keeps list payloads lean). Detail endpoint populates it whenever at least one analysis exists for the claim.

`AnalyzeClaimResponse` is unchanged.

#### Frontend changes

**`claims.store.ts` — `fetchClaim`:**

Replace the unconditional `analysisResult.value = null` with hydration:

```ts
async function fetchClaim(claimId: string) {
  loading.value = true;
  try {
    const response = await api.get(`/api/v1/claims/${claimId}`);
    currentClaim.value = response.data;
    analysisResult.value = response.data.latestAnalysis
      ? {
          claim: response.data,
          riskScore: response.data.latestAnalysis.riskScore,
          ruleResults: response.data.latestAnalysis.ruleResults,
          alerts: response.data.latestAnalysis.alerts,
        }
      : null;
  } finally {
    loading.value = false;
  }
}
```

**`ClaimDetailView.vue`:**

- `RiskHeader`, rule-results section, and generated-alerts section already gate on `analysis.value` — no template changes needed, they'll just render once `analysisResult` is hydrated.
- Rename the Analyze button: `"Analyze"` when `!analysis.value`, `"Re-analyze"` when `analysis.value` exists.

**Edge cases:**

- Claim has no analysis yet → `latestAnalysis` absent → `analysisResult` stays null → button says "Analyze". Current behaviour preserved.
- Analysis payload arrives alongside fresh claim data on `analyzeClaim` → existing code path already sets `currentClaim` and `analysisResult` together; no change needed.
- Server returns `latestAnalysis` with stale `configVersionId` → still rendered as-is. Re-analysis is user-initiated; we do not block display on config drift.

### 4.3 Minor cleanup

`claims.store.ts` currently returns `analysisResult.value = null` inside `fetchClaim` with no ceremony. The replacement logic is a few lines; no broader refactor is warranted.

---

## 5. Testing

Unit tests (Vitest):

- `deriveResolutionStatus` — all five states, mixed-decision precedence, empty lines, empty decisions, more decisions than lines (defensive).
- `ResolutionStatusBadge` — renders each state's label + class.
- `claims.store.fetchClaim` — hydrates `analysisResult` when `latestAnalysis` present; leaves it null when absent.

Component tests:

- `ClaimDetailView` — button label flips between "Analyze" and "Re-analyze" based on `analysisResult`.
- `ClaimsListView` — resolution badge renders for each row.

Manual smoke:

- Set decisions on a claim one line at a time; verify badge transitions `PENDING_REVIEW` → `IN_REVIEW` → terminal state.
- Analyze a claim, navigate away, return; verify risk header, rule results, alerts are still visible without re-running analysis.
- Click "Re-analyze"; verify fresh analysis replaces the old one.

---

## 6. Backend handoff

**Out of scope for this work** (per `CLAUDE.md` — frontend-only). Flagged here so the backend team can pick it up:

- Extend `GET /api/v1/claims/:id` to populate `latestAnalysis` when analysis rows exist.
- Source data: join `risk_scores`, `rule_results`, `alerts` on `claim_id`, take the most recent analysis run (by `executed_at` / `created_at`).
- `analyzedAt` should be the timestamp of the analysis run that produced these rows.
- List endpoints (`GET /api/v1/claims`) should continue to omit `latestAnalysis` to keep payloads small.
- No schema migration needed — the tables already exist.
- No change to `POST /api/v1/claims/:id/analyze`.

Until this endpoint change ships, the frontend changes in §4.2 remain backward-compatible: absent `latestAnalysis` simply means analysis doesn't persist (current behaviour).

---

## 7. Open risks

- **Resolution status not persisted.** If two reviewers look at the same claim simultaneously and one sets a decision, the other's derived badge won't update until they refetch. Acceptable for now — line-level decisions already have the same limitation, and this feature doesn't make it worse.
- **List-view badge performance.** Deriving resolution status for every row on each render is O(lines × decisions) per claim. Pinia reactivity memoizes per-render; with typical claim sizes (<10 lines, <10 decisions) this is negligible.
