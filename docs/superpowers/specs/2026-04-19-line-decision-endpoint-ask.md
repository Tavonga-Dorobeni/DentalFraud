# Backend Ask: Line-Level Decision Endpoint

> **Audience:** Backend track. This document describes a frontend-driven backend requirement — not a frontend implementation plan. The frontend will consume the endpoint once it lands; until then, the Evidence Panel's three action buttons (LEGITIMATE / EDUCATION REQ / CONFIRM FRAUD) show a "UI only" toast and persist nothing.

**Date:** 2026-04-19
**Requested by:** Frontend track
**Driving UI:** `packages/frontend/src/features/evidence/EvidenceSidebar.vue` → `QuickActionToggles.vue`

---

## Why

Analysts open the Evidence Panel for a specific claim line, review the claimed vs. documented evidence, and need to record one of three decisions against that line:

- **LEGITIMATE** — the claim line is supported by evidence; no further action
- **EDUCATION REQUIRED** — the line is technically allowable but the provider needs coaching (e.g., coding habit)
- **CONFIRMED FRAUD** — the line is fraudulent; escalate

Today these three buttons exist in the UI but emit nothing to the backend, so:

1. Decisions don't persist across page reloads or users
2. There's no audit trail of who decided what and when
3. The decision can't feed into provider scoring, case management, or reports
4. Repurposing `POST /alerts/:id/close` loses the decision *type* (legitimate vs. fraud both "close"), and fails entirely when the line has no generated alert

The alert lifecycle (`OPEN → ACKNOWLEDGED → CLOSED`) is about *workflow state*, not *adjudicated outcome*. These are different concepts and need their own persistence.

## What we need

### 1. A `ClaimLineDecision` resource

```ts
enum LineDecision {
  LEGITIMATE = "LEGITIMATE",
  EDUCATION_REQUIRED = "EDUCATION_REQUIRED",
  CONFIRMED_FRAUD = "CONFIRMED_FRAUD",
}

interface ClaimLineDecisionDto {
  id: string;
  claimId: string;
  claimLineId: string;
  decision: LineDecision;
  note?: string;            // optional free-text rationale
  decidedByUserId: string;  // from authMiddleware
  decidedAt: string;        // ISO timestamp
}
```

One decision per `(claimLineId)` is the expected cardinality — re-deciding overwrites the prior decision (keep history via audit log, not via multiple active rows). If you'd rather keep all history live and let the frontend filter to "latest," that works too; please flag the choice.

### 2. Endpoints

```
POST /api/v1/claims/:claimId/lines/:lineId/decision
Body: { decision: LineDecision, note?: string }
Auth: ADMIN | ANALYST | INVESTIGATOR
Returns: ClaimLineDecisionDto
Semantics: upsert — creates if none exists, overwrites if one does
```

```
DELETE /api/v1/claims/:claimId/lines/:lineId/decision
Auth: ADMIN | ANALYST | INVESTIGATOR
Returns: 204
Semantics: clear the decision (e.g., "I misclicked"). Optional but nice.
```

Listing/filtering by decision can live on the claims list (`GET /claims?decision=CONFIRMED_FRAUD`) in a later iteration — not needed for this ask.

### 3. Surface decisions on existing reads

Add a `decisions: ClaimLineDecisionDto[]` field to `ClaimResponse`. When the frontend fetches a claim via `GET /claims/:id` or receives it inside `AnalyzeClaimResponse.claim`, it should get the current set of line decisions in the same payload — no second request. Empty array when none exist.

(Alternative: a `latestDecision?: ClaimLineDecisionDto` field directly on `ClaimLineDto`. Either shape is fine; the array-at-the-claim-level form keeps `ClaimLineDto` stable and makes "claim has any decisions" a cheap check. Please pick one and we'll adapt.)

### 4. Audit log

Every create/overwrite/delete writes to the existing `audit_logs` table via `logSystemEvent(...)` with enough context to reconstruct (who, what claim/line, prior decision, new decision, note). The existing logging pattern is fine — we don't need a new log type.

## Shared-type ownership

The frontend track will add:

- `LineDecision` enum in `packages/shared/src/enums.ts`
- `ClaimLineDecisionDto` in `packages/shared/src/types.ts`
- `decisions` field on `ClaimResponse` (or `latestDecision` on `ClaimLineDto`, depending on choice above)

…as soon as the backend confirms the shape. No need for the backend to add shared types first; flag the shape in a PR comment or message and the frontend will ship `@fdcdf/shared` in lockstep.

## Non-goals (for this ask)

- Workflow state machine around the decision (e.g., "proposed → approved"). A decision is a single act by one analyst.
- Relationship to alerts. The alert lifecycle is independent; closing an alert does not imply a decision, and making a decision does not close its alert. The frontend may *offer* to close the related alert after a fraud decision, but the backend should treat them as orthogonal.
- Per-claim (rather than per-line) decisions. Every UI entry point for these buttons is line-scoped; a claim-level decision would be a separate feature.
- Bulk/batch endpoints. Single-line at a time is sufficient.

## What the frontend will do once this lands

1. Add the enum + DTO to `@fdcdf/shared`.
2. Replace `handleAction` in `EvidenceSidebar.vue` with calls to the new endpoint, wired through a new `decisions.store.ts` (optimistic update + error rollback pattern we already use in `patients.store`).
3. Show the current decision as a pill in the Evidence Panel header and on the claim-line row, so analysts can see at a glance that "this line already has a decision."
4. Persist the decision to the claim cache so the UI re-renders without a refetch after mutation.

Estimated frontend work: ~1 day once the endpoint is live.

## Open questions for the backend track

1. **Upsert vs. immutable-with-history** — do you want one row per line that gets overwritten, or append-only with "latest" derived? Frontend works with either; flag the choice.
2. **Response shape on `ClaimResponse`** — array-at-claim vs. latest-on-line (see §3).
3. **Role scope** — should `INVESTIGATOR` be able to override an `ANALYST`'s decision, or is there a hierarchy? Today all three roles see the buttons equally.
