# Analyze Progress Modal — Design Spec

**Date:** 2026-04-19
**Scope:** Frontend only (`packages/frontend/`)
**Status:** Approved — ready for implementation plan

## 1. Goal

When a user clicks **Analyze** on a claim, reveal the backend's analysis stages as a guided narrative instead of a single silent request. The modal walks the user through four stages — tooth-level verification, rule-based detection, risk scoring, and (conditionally) alert generation — showing any findings from each stage before the user advances.

## 2. User-visible flow

1. User clicks **Analyze** on `ClaimDetailView`.
2. Existing behaviour: the frontend POSTs to `/api/v1/claims/:id/analyze` and the store updates.
3. On success, a modal opens showing a vertical timeline of stages.
4. The first stage enters a loading state; after a fixed delay, it flips to done and reveals its headline + findings.
5. User clicks **Next** to advance to the next stage. Each stage shows a loader → headline + findings.
6. On the final visible stage, the button label is **Done**. Clicking it closes the modal.
7. The claim page underneath already shows the full analysis results (risk header, rule results, alerts) — unchanged from today.
8. On request failure, the modal never opens and the existing error toast shows.

## 3. Stage partitioning

The response `AnalyzeClaimResponse = { claim, ruleResults, riskScore, alerts }` is split into stages by a pure helper `buildStages(response)`.

| Stage id | Title | Source | Visibility |
|---|---|---|---|
| `tooth` | Tooth-level verification (FDI) | `ruleResults` filtered to `IMPOSSIBLE_PROCEDURE`, `SUSPICIOUS_REPEAT` | always |
| `rules` | Rule-based suspicious-claim detection | `ruleResults` filtered to `EXACT_DUPLICATE`, `UNSUPPORTED_CLAIM`, `UPCODING` (NEAR_DUPLICATE stays filtered out) | always |
| `scoring` | Claim risk scoring | `riskScore` | always |
| `alerts` | Alert generation | `alerts` | only when `alerts.length > 0` |

### Finding shape per stage

**Tooth stage finding:** severity pill · `Tooth {fdiNumber}` (resolved via `claim.lines.find(l => l.id === ruleResult.claimLineId).toothNumber`) · explanation text.

**Rules stage finding:** severity pill · human-readable rule name (map from `ruleId`) · explanation (wrapped with existing `humanizeDatesInText` so ISO timestamps render as e.g. `Jan 10, 2025`).

**Scoring stage finding:** single synthetic row — band pill (`riskScore.band`) · `{score}/100` · `{confidence}% confidence`.

**Alerts stage finding:** one row per alert — severity pill · `alert.summary` · `alert.recommendedAction`.

### Headlines

Each stage renders a one-line headline under its title once done:

- Tooth: `"No tooth-history conflicts detected"` or `"{n} tooth-history finding(s)"`.
- Rules: `"No suspicious-claim rules triggered"` or `"{n} rule finding(s)"`.
- Scoring: `"Risk score: {score} — {band}"`.
- Alerts: `"{n} alert(s) generated"`.

### Rule name mapping

| ruleId | Display name |
|---|---|
| `IMPOSSIBLE_PROCEDURE` | Impossible procedure |
| `SUSPICIOUS_REPEAT` | Suspicious repeat interval |
| `EXACT_DUPLICATE` | Exact duplicate |
| `UNSUPPORTED_CLAIM` | Unsupported claim |
| `UPCODING` | Upcoding |

Lives as a `const RULE_NAMES` map in the modal component.

## 4. Component architecture

One new component:

- **`packages/frontend/src/features/claims/components/AnalyzeProgressModal.vue`**
  - Props: `open: boolean`, `analysis: AnalyzeClaimResponse | null`.
  - Emits: `close`.
  - Wraps `AppModal` with `size="md"`.
  - Owns internal step state (`activeIndex`, per-stage `loading | done`).
  - Runs the stage-advancing timer internally.

Consumer changes:

- **`packages/frontend/src/features/claims/ClaimDetailView.vue`**
  - Add `const showAnalyzeModal = ref(false)`.
  - After `await claimsStore.analyzeClaim(...)` succeeds, set `showAnalyzeModal.value = true`.
  - Render `<AnalyzeProgressModal :open="showAnalyzeModal" :analysis="analysis" @close="showAnalyzeModal = false" />`.
  - Keep the existing toast on error; do not open the modal on error.

No store changes. No new API calls. `claimsStore.loading` already tracks the request phase.

## 5. Step state machine

Each stage has an internal state: `pending | loading | done`.

On modal open (when `open` flips true and `analysis` is non-null):
1. `stages = buildStages(analysis).filter(s => s.visible)`.
2. `activeIndex = 0`; stage 0 → `loading`.
3. After `STEP_LOADING_MS` (700ms, top-level `const`), stage 0 → `done`. Headline + findings render. Footer shows **Next** button.
4. User clicks **Next** → `activeIndex++`; next stage → `loading`. Repeat from step 3.
5. On the last stage, footer button is **Done**. Click emits `close`.

Stage row rendering:
- `pending`: dim circle marker · title · no body.
- `loading`: spinner marker · title · `Working…` subtext.
- `done`: checkmark marker · title · headline line · findings list (collapsed; expandable via chevron).

## 6. Dismissal and edge cases

- Closing via X, backdrop, or Esc at any point emits `close` — results remain on the claim page because the store has already updated.
- The Next button only appears once the current stage is `done`, so double-click can't advance past the timer.
- `buildStages` is pure — safe to re-evaluate on prop changes.
- If the user reopens the modal after closing early, it restarts from stage 0 (same mount behaviour).

## 7. Accessibility

- Stepper uses `role="list"` with each stage `role="listitem"`; the active stage has `aria-current="step"`.
- When a stage transitions to `done`, focus moves to the **Next** / **Done** button so keyboard users can advance immediately.
- Esc closes the modal (`AppModal` default).
- Spinner marker has `aria-label="Working"`; completed marker has `aria-label="Complete"`.

## 8. Error handling

Unchanged from today. Errors in `claimsStore.analyzeClaim` propagate to `handleAnalyze`'s existing `try/catch`, which calls `toast.error("Analysis failed.")`. The modal is not involved in the error path.

## 9. Testing

- **Unit:** Vitest spec for `buildStages(response)` (Vitest already configured at `packages/frontend/vitest.config.ts`) covering:
  - Response with no rule findings, no alerts → tooth/rules empty headlines, scoring present, alerts stage hidden.
  - Response with tooth-only findings → tooth populated, rules empty, alerts hidden.
  - Response with all rule types + alerts → all four stages populated.
  - NEAR_DUPLICATE in ruleResults → filtered out of the rules stage.
- **Manual visual verification** via the dev server:
  - `CLM-2026-0011` (duplicate + alerts) — exercises all four stages.
  - A clean claim (no findings, no alerts) — three stages, all empty-state headlines.
- **No E2E coverage** — harness not installed (tracked as open follow-up #3 in `claude_progress.md`).

## 10. Files changed

- **New:** `packages/frontend/src/features/claims/components/AnalyzeProgressModal.vue`.
- **New:** `packages/frontend/tests/features/claims/buildStages.test.ts` (matches existing test layout, e.g. `tests/features/dental-map/DentalMap.test.ts`).
- **Edit:** `packages/frontend/src/features/claims/ClaimDetailView.vue` — add modal ref + render.

## 11. Out of scope

- Backend changes (stage 3 "provider and trend analytics" was dropped because no signal exists in the response today).
- Fixing the NEAR_DUPLICATE score inflation (already flagged for the backend track in `claude_progress.md`).
- Installing a Playwright E2E harness.
- Role-aware hiding of the Analyze button.
