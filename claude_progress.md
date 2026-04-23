# FDCDSS Frontend — Progress Snapshot

_Last updated: 2026-04-24_

## Scope
Frontend-only work in `packages/frontend/` and shared types in `packages/shared/`.
Backend (`packages/backend/`) is owned by another track; this session only consumes its endpoints.

## What we accomplished

### Prior sessions (carried forward)

1. **Reference data dropdowns on the New Claim form** — searchable patient/provider/procedure/documented-code selectors sourced from real catalog endpoints; dependent-field autopopulation; procedure validation on submit.
2. **Shared types** for `PatientSummary`/`PatientDto`, `ProviderSummary`/`ProviderDto`, `ProcedureCatalogItem`/`ProcedureDto` plus `Create|Update*Request` shapes.
3. **Pinia stores aligned to live backend** — `patients.store`, `providers.store`, `procedures.store` with paged `fetchList`, dropdown cache, mutations, and external-id/code lookups.
4. **Reusable UI primitives** — `AppCombobox.vue` (body-teleported with auto-flip), `AppModal.vue` (`size` prop).
5. **New Claim modal layout fixes** — `xl` size, full-width submission date, explicit grid for claim-line rows.
6. **Admin pages for Patients / Providers / Procedures** — list + form + routes + sidebar tabs, role-gated.

### This session

7. **System rename FDCDF → FDCDSS**
   - `index.html` title, `AppLayout.vue` sidebar brand, `LoginView.vue` heading all updated to "FDCDSS — Forensic Dental Claims Decision Support System."
   - No shared-type or backend references contained the old name.

8. **System-wide date formatting**
   - New utility `src/utils/date.ts` exports `formatDate(iso, { includeTime?, fallback? })` and `humanizeDatesInText(text)` (regex-replaces ISO timestamps inside arbitrary strings).
   - Swept every `new Date(...).toLocaleDateString()` / `toLocaleString()` call across Claims, Patients, Providers, Dashboard, and Alerts views onto `formatDate`.
   - `ClaimDetailView` wraps `ruleResult.explanation`, warnings, alert `summary`, and `recommendedAction` with `humanizeDatesInText` so backend-produced strings like `"Tooth history shows extraction on 2025-01-10T00:00:00.000Z"` render as `"Jan 10, 2025"`.

9. **Duplicate claim comparison**
   - Drafted the backend delta (`ClaimDto.duplicateOfClaimId`, `RuleResultDto.matchedClaimId`, migration `20260416090000_add_duplicate_match_columns`, seed wiring). **Shipped by the backend track.**
   - New component `features/claims/components/DuplicateComparisonPanel.vue` — fetches the matched claim via `api.get('/api/v1/claims/:id')` (no store mutation) and renders a two-column side-by-side:
     - Header fields: Claim ID, Patient, Provider, Date of Service, Submitted, Status, Total Claimed
     - Claim lines paired by `procedureCode + toothNumber`, each block comparing Procedure, Tooth, Amount, Documented code
   - **Highlight semantics:** matching fields (the ones that make the claims duplicates) are painted `bg-amber-alert-light`; differing fields render neutral. Guard ensures one-sided (unmatched) lines aren't falsely highlighted.
   - "All compared fields match — exact duplicate." note shown when nothing differs; "Matching fields highlighted in amber." otherwise.
   - Expand affordances in `ClaimDetailView`:
     - Warnings banner: "Compare with matched claim" when `claim.duplicateOfClaimId` is set (works pre-analysis).
     - Rule-result rows: "Compare" button on `EXACT_DUPLICATE` results with `matchedClaimId`.
   - Seeded pairs that exercise the flow: `CLM-2026-0011` → `CLM-2026-0001`, `CLM-2026-0018` → `CLM-2026-0008`.

10. **NEAR_DUPLICATE noise suppression**
    - Backend emits a `NEAR_DUPLICATE` rule result on every analyzed claim as an "evaluation ran" marker (explanation: *"Near-duplicate evaluation available for deterministic signature matching only"*) regardless of whether a duplicate exists.
    - `ClaimDetailView.visibleRuleResults` filters all `NEAR_DUPLICATE` rows out of the Rule Results list — `EXACT_DUPLICATE` already carries the real positive-match signal plus the Compare button and a clearer explanation.
    - `RiskHeader.visibleFactors` filters the same `ruleId` out of `contributingFactors` before passing to `PartnerInsight` and `ContributingFactors`, so the misleading text no longer appears in either surface.

11. **Analyze progress modal**
    - New component `features/claims/components/AnalyzeProgressModal.vue` walks the user through four stages after a successful analyze: tooth-level verification (FDI), rule-based detection, risk scoring, and alert generation (conditional on alerts existing).
    - Vertical timeline layout: each stage loads for 700ms, then reveals a headline and a list of findings. Past steps stay visible; the active step has `aria-current="step"`. Pending steps render dim.
    - Pure helper `features/claims/components/buildStages.ts` partitions `AnalyzeClaimResponse` into stage objects; unit-tested in `tests/features/claims/buildStages.test.ts` (7 cases, all green).
    - `ClaimDetailView` opens the modal after `claimsStore.analyzeClaim` resolves successfully (replacing the previous "Analysis complete." toast); the error toast still handles the failure path.
    - Provider/trend analytics stage was deliberately dropped — no provider-specific signal exists in the current backend response. Can be re-added when the backend emits provider analytics.
    - Scoring stage formats confidence via `Math.round(confidence * 100)` — backend stores `confidence` as a fraction (e.g., 0.7), matching `ScoreDisplay.vue`'s existing convention. Full suite (30 tests) green; browser verified end-to-end on `CLM-2026-0011`: all four stages render, "70% confidence" shows correctly, Done closes the modal and the claim page retains the risk header, rule results, and alert.
    - Design spec: `docs/superpowers/specs/2026-04-19-analyze-progress-modal-design.md`. Plan: `docs/superpowers/plans/2026-04-19-analyze-progress-modal.md`.

### Session 2026-04-24

12. **Netlify build unblocked**
    - Split typecheck from production build to fix two stacked failures on Netlify:
      1. `tsconfig.json` referenced `tsconfig.node.json` without `composite: true`, which breaks `vue-tsc -b` (project-reference build mode) — TS6306 / TS6310.
      2. Monorepo had two vite installs (root `vite@5.4.21` hoisted via backend's `vitest@2.1.8` peer; frontend-local `vite@6.4.2`). Under `-b`, `vue-tsc` typechecked `vite.config.ts`, where `@vitejs/plugin-vue` and `defineConfig` resolved `Plugin`/`PluginOption` against different vite copies — TS2769 on `plugins: [vue(), tailwindcss()]`. Only manifests on Linux/Netlify because Windows symlink layout happens to collapse to a single vite.
    - Fix:
      - `packages/frontend/package.json`: build is now `vite build`; added separate `"typecheck": "vue-tsc --noEmit"` script.
      - `packages/frontend/tsconfig.json`: dropped the `tsconfig.node.json` project reference (unused now that `-b` is gone). `tsconfig.node.json` file left in place but orphaned.
    - Verified: `npm run build` succeeds in 2.23s (210 modules); `npx vitest run` → 68/68 green; `npm run typecheck` surfaces exactly the 5 pre-existing errors previously flagged (`useApi.ts` × 2, `AppCombobox.vue` × 2, `AppDataTable.vue` × 1) and nothing new.
    - Trade-off: Netlify deploys no longer block on TS errors. Typecheck remains available as a CI/local script. Pre-existing errors are candidate for a dedicated cleanup pass.

## Session summary (2026-04-19)

**Shipped this session:**
- System rename FDCDF → FDCDSS (items 7)
- Date formatting utility + site-wide sweep (item 8)
- Duplicate claim comparison panel + expand affordances (item 9)
- NEAR_DUPLICATE noise suppression in Rule Results and RiskHeader (item 10)
- Analyze progress modal — 4-stage timeline after `Analyze`, with pure `buildStages` helper + 7 unit tests, bugfix for `confidence` fraction-vs-percentage (item 11)
- Backend ask drafted for line-level decision endpoint (asks §3)

**Verified:** 30/30 unit tests pass (`npx vitest run`). Analyze-modal end-to-end on `CLM-2026-0011` via Playwright — all four stages render, "70% confidence" correct, Done closes cleanly, claim page retains results.

## Current state

- Vite dev server on :5173 and backend on :3000 were running during the session. Nothing blocking on restart.
- `vue-tsc` shows **zero new errors** in any file this session touched. Pre-existing errors in `useApi.ts`, `AppCombobox.vue`, `AppDataTable.vue`, and the `tsconfig.node.json` project-reference setup remain.
- Duplicate-comparison flow requires the DB to have been reset after the backend migration (`cd packages/backend && npm run build && npm run db:reset:sqlite`). Seeded pairs: `CLM-2026-0011` ↔ `CLM-2026-0001`, `CLM-2026-0018` ↔ `CLM-2026-0008`.
- No git repo detected at the project root — changes are not committed anywhere yet; preserve `claude_progress.md` and `docs/superpowers/` as the paper trail.

## Known gaps / next steps

### Backend asks (flagged, not shipped)

1. **NEAR_DUPLICATE still pads every claim's risk score by +10.**
   Frontend now hides the explanation text, but `riskScore.score` and `riskScore.confidence` are inflated on every claim (confidence heuristic at `scoring.service.ts:48` climbs with rule count). Suggested fix: guard the `NEAR_DUPLICATE` push in `rules.service.ts:49` on `claim.warnings.includes("Potential near-duplicate claim detected")`, matching the `EXACT_DUPLICATE` guard on line 34.

2. **Claims list filter by patient + provider + date.**
   Would simplify the duplicate-comparison fetch and enable future "find related claims" workflows. Currently the panel fetches the matched claim directly by id — fine for the MVP.

3. **Line-level decision endpoint (LEGITIMATE / EDUCATION REQUIRED / CONFIRMED FRAUD).**
   The Evidence Panel's three action buttons currently fire a "UI only" toast — no backend endpoint exists to persist analyst decisions against a claim line. Full ask drafted in `docs/superpowers/specs/2026-04-19-line-decision-endpoint-ask.md`: new `ClaimLineDecision` resource + `POST/DELETE /api/v1/claims/:claimId/lines/:lineId/decision` + decisions surfaced on `ClaimResponse`. Frontend will wire the buttons (est. ~1 day) once the shape is confirmed.

### Frontend follow-ups (open, ordered by likely next pick)

1. **Wire Evidence Panel action buttons** — blocked on backend ask §3 above. Plan once endpoint lands: add `LineDecision` enum + `ClaimLineDecisionDto` to `@fdcdf/shared`, create `decisions.store.ts`, replace `handleAction` in `EvidenceSidebar.vue`, surface the current decision as a pill in the panel header and claim-line row.
2. **End-to-end test coverage** — no Playwright/E2E harness installed in-tree (Playwright MCP used ad-hoc for verification). Install `@playwright/test` + smoke flow: login → CRUD per entity → analyze → duplicate compare → analyze-modal advance.
3. **Search inputs on list pages** — `fetchList` accepts `search` but no search bar is rendered on PatientsListView / ProvidersListView / ProceduresListView.
4. **Delete actions** — backend supports `DELETE /:id` for patients/providers/procedures; no frontend UI yet.
5. **Role-aware UI affordances** — hide/disable "New" and "Save" buttons for users whose role can't write (write requires `ADMIN` for patients/providers; `ADMIN | RULES_ADMIN` for procedures) instead of letting them 403.
6. **Validation polish on procedure form** — surface `ConflictError` inline for duplicate `code` rather than via generic toast.
7. **Optimistic cache update after mutation** — today we invalidate `loaded` and refetch; could splice the new/updated row directly.
8. **Memory bootstrap** — still no `memory/` entries. Worth capturing as feedback memories: (a) frontend-only scope rule, (b) the backend write-permission split, (c) NEAR_DUPLICATE quirk, (d) `confidence` is a fraction (0.7) not a percent — multiply by 100 when displaying.
