# Analyze Progress Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a claim is analyzed, open a modal that walks the user through four stages (tooth-level verification, rule-based detection, risk scoring, and conditionally alert generation) with a vertical timeline that loads each stage for 700ms and reveals any findings.

**Architecture:** New Vue component `AnalyzeProgressModal.vue` wrapping the existing `AppModal`. A pure helper `buildStages(response)` partitions the `AnalyzeClaimResponse` into typed stage objects. `ClaimDetailView.vue` opens the modal after a successful analyze call. No store or backend changes.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), TypeScript, Tailwind CSS, Vitest + jsdom for unit tests. Shared types from `@fdcdf/shared` (`AnalyzeClaimResponse`, `RuleResultDto`, `RiskScoreDto`, `AlertDto`, `RiskBand`, `RuleSeverity`).

**Reference:** `docs/superpowers/specs/2026-04-19-analyze-progress-modal-design.md` (the approved spec this plan implements).

**Conventions the engineer may not know:**
- Existing modal is at `packages/frontend/src/ui/AppModal.vue`; it emits `close` and supports `size: "md" | "lg" | "xl"` (defaults to `"md"`).
- Existing button is at `packages/frontend/src/ui/AppButton.vue` with `variant: "primary" | "secondary" | "danger"` and `size: "sm" | "md" | "lg"`.
- Frontend tests live under `packages/frontend/tests/features/<feature>/`, named `*.test.ts`, using Vitest globals.
- `humanizeDatesInText` from `@/utils/date` replaces ISO timestamps inside free-text strings with human dates — use it on any backend-produced explanation/summary text.
- NEAR_DUPLICATE rule results are an informational marker that fires on every analyzed claim; they must stay filtered out of any user-visible findings list.
- Colour classes already in use for severity pills (from `ClaimDetailView.vue`):
  - `LOW` → `bg-blue-clinical-light text-blue-clinical`
  - `MEDIUM` / `HIGH` → `bg-amber-alert-light text-amber-alert`
  - `CRITICAL` → `bg-red-critical-light text-red-critical`
- Commit frequently (one commit per task). This repo has `packages/frontend/` inside a larger monorepo; the git repository root is at `C:\Projects\DentalFraudDetection` (per project notes, it is not a git repo — if `git status` errors, skip commit steps and note it in the task output).

---

## File Structure

**New files:**

- `packages/frontend/src/features/claims/components/buildStages.ts` — pure helper that turns an `AnalyzeClaimResponse` into an array of `Stage` objects. Zero Vue dependencies so it's trivial to unit-test.
- `packages/frontend/src/features/claims/components/AnalyzeProgressModal.vue` — the modal component. Owns step-advancing state and the 700ms timer. Renders the vertical timeline.
- `packages/frontend/tests/features/claims/buildStages.test.ts` — Vitest spec for `buildStages`.

**Modified files:**

- `packages/frontend/src/features/claims/ClaimDetailView.vue` — import the modal, add a `showAnalyzeModal` ref, open the modal after a successful analyze, render it.

**Responsibility boundaries:**

- `buildStages.ts` owns the mapping from response → stage objects. Pure. No timers, no Vue, no DOM.
- `AnalyzeProgressModal.vue` owns presentation + step animation + emits `close`. Receives `analysis` as a prop. Calls `buildStages` internally.
- `ClaimDetailView.vue` owns the open/close state and hands off the response. Nothing else changes there.

---

## Task 1: Create `buildStages` pure helper with failing test

**Files:**
- Create: `packages/frontend/src/features/claims/components/buildStages.ts`
- Create: `packages/frontend/tests/features/claims/buildStages.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/frontend/tests/features/claims/buildStages.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { RiskBand, RuleSeverity } from "@fdcdf/shared";
import type { AnalyzeClaimResponse, ClaimLineDto, ClaimResponse } from "@fdcdf/shared";
import { buildStages } from "@/features/claims/components/buildStages";

function makeLine(overrides: Partial<ClaimLineDto> = {}): ClaimLineDto {
  return {
    id: "line-1",
    claimId: "claim-1",
    procedureCode: "D7140",
    toothNumber: 16,
    quantity: 1,
    amountClaimed: 100,
    ...overrides,
  } as ClaimLineDto;
}

function makeResponse(overrides: Partial<AnalyzeClaimResponse> = {}): AnalyzeClaimResponse {
  const claim: ClaimResponse = {
    id: "claim-1",
    externalClaimId: "CLM-TEST",
    patientId: "pat-1",
    providerId: "prov-1",
    dateOfService: "2026-01-01T00:00:00.000Z",
    submissionDate: "2026-01-02T00:00:00.000Z",
    status: "PENDING_REVIEW",
    totalClaimedAmount: 100,
    warnings: [],
    lines: [makeLine()],
  } as unknown as ClaimResponse;

  return {
    claim,
    ruleResults: [],
    riskScore: {
      id: "rs-1",
      claimId: "claim-1",
      score: 0,
      band: RiskBand.LOW,
      confidence: 100,
      contributingFactors: [],
      configVersionId: "cfg-1",
    } as any,
    alerts: [],
    ...overrides,
  };
}

describe("buildStages", () => {
  it("always emits tooth, rules, and scoring stages; alerts hidden when none", () => {
    const stages = buildStages(makeResponse());
    const visible = stages.filter((s) => s.visible);

    expect(visible.map((s) => s.id)).toEqual(["tooth", "rules", "scoring"]);
    expect(stages.find((s) => s.id === "alerts")?.visible).toBe(false);
  });

  it("tooth stage includes IMPOSSIBLE_PROCEDURE and SUSPICIOUS_REPEAT only", () => {
    const response = makeResponse({
      ruleResults: [
        {
          id: "r1",
          claimId: "claim-1",
          claimLineId: "line-1",
          ruleId: "IMPOSSIBLE_PROCEDURE",
          severity: RuleSeverity.HIGH,
          explanation: "Tooth already extracted",
          evidenceFields: [],
          executedAt: "2026-01-01T00:00:00.000Z",
          configVersionId: "cfg-1",
        },
        {
          id: "r2",
          claimId: "claim-1",
          claimLineId: "line-1",
          ruleId: "EXACT_DUPLICATE",
          severity: RuleSeverity.CRITICAL,
          explanation: "Duplicate",
          evidenceFields: [],
          executedAt: "2026-01-01T00:00:00.000Z",
          configVersionId: "cfg-1",
        },
      ] as any,
    });
    const stages = buildStages(response);
    const tooth = stages.find((s) => s.id === "tooth")!;

    expect(tooth.findings.map((f) => f.id)).toEqual(["r1"]);
    expect(tooth.headline).toBe("1 tooth-history finding");
  });

  it("rules stage includes EXACT_DUPLICATE, UNSUPPORTED_CLAIM, UPCODING only — NEAR_DUPLICATE filtered out", () => {
    const response = makeResponse({
      ruleResults: [
        { id: "r1", ruleId: "EXACT_DUPLICATE", severity: RuleSeverity.CRITICAL, explanation: "Dup", claimLineId: "line-1" } as any,
        { id: "r2", ruleId: "NEAR_DUPLICATE", severity: RuleSeverity.LOW, explanation: "Near-dup marker", claimLineId: "line-1" } as any,
        { id: "r3", ruleId: "UPCODING", severity: RuleSeverity.HIGH, explanation: "Upcoded", claimLineId: "line-1" } as any,
      ],
    });
    const rules = buildStages(response).find((s) => s.id === "rules")!;

    expect(rules.findings.map((f) => f.id)).toEqual(["r1", "r3"]);
  });

  it("scoring stage carries a single synthetic row with score, band and confidence", () => {
    const response = makeResponse({
      riskScore: {
        id: "rs-1", claimId: "claim-1", score: 72, band: RiskBand.HIGH, confidence: 85,
        contributingFactors: [], configVersionId: "cfg-1",
      } as any,
    });
    const scoring = buildStages(response).find((s) => s.id === "scoring")!;

    expect(scoring.headline).toBe("Risk score: 72 — HIGH");
    expect(scoring.findings).toHaveLength(1);
    expect(scoring.findings[0]).toMatchObject({ label: "72/100", severity: "HIGH", detail: "85% confidence" });
  });

  it("alerts stage is visible and populated when alerts exist", () => {
    const response = makeResponse({
      alerts: [
        { id: "a1", severity: RuleSeverity.HIGH, summary: "Review required", recommendedAction: "Escalate" } as any,
      ],
    });
    const alerts = buildStages(response).find((s) => s.id === "alerts")!;

    expect(alerts.visible).toBe(true);
    expect(alerts.findings.map((f) => f.id)).toEqual(["a1"]);
    expect(alerts.headline).toBe("1 alert generated");
  });

  it("empty tooth and rules stages produce explicit empty-state headlines", () => {
    const stages = buildStages(makeResponse());

    expect(stages.find((s) => s.id === "tooth")!.headline).toBe("No tooth-history conflicts detected");
    expect(stages.find((s) => s.id === "rules")!.headline).toBe("No suspicious-claim rules triggered");
  });

  it("tooth findings include a Tooth {fdi} label resolved from claim lines", () => {
    const response = makeResponse({
      ruleResults: [
        { id: "r1", ruleId: "SUSPICIOUS_REPEAT", severity: RuleSeverity.MEDIUM, explanation: "Repeat inside 180 days", claimLineId: "line-1" } as any,
      ],
    });
    const tooth = buildStages(response).find((s) => s.id === "tooth")!;

    expect(tooth.findings[0].label).toBe("Tooth 16");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `packages/frontend/`:
```
npx vitest run tests/features/claims/buildStages.test.ts
```
Expected: FAIL — `Cannot find module '@/features/claims/components/buildStages'` or equivalent module-not-found error.

- [ ] **Step 3: Create the helper with the minimal implementation**

Create `packages/frontend/src/features/claims/components/buildStages.ts`:

```ts
import type {
  AnalyzeClaimResponse,
  AlertDto,
  RuleResultDto,
} from "@fdcdf/shared";

export type StageId = "tooth" | "rules" | "scoring" | "alerts";

// `severity` carries values from either `RuleSeverity` (for rule/tooth/alert
// findings) or `RiskBand` (for the scoring stage). Both enums share the same
// string values — LOW/MEDIUM/HIGH/CRITICAL — and feed a single pill colour
// lookup in the modal, so `string` is the honest type.
export interface StageFinding {
  id: string;
  severity: string | null;
  label: string;
  detail: string;
}

export interface Stage {
  id: StageId;
  title: string;
  headline: string;
  findings: StageFinding[];
  visible: boolean;
}

const TOOTH_RULE_IDS = new Set(["IMPOSSIBLE_PROCEDURE", "SUSPICIOUS_REPEAT"]);
const RULES_RULE_IDS = new Set(["EXACT_DUPLICATE", "UNSUPPORTED_CLAIM", "UPCODING"]);

const RULE_NAMES: Record<string, string> = {
  IMPOSSIBLE_PROCEDURE: "Impossible procedure",
  SUSPICIOUS_REPEAT: "Suspicious repeat interval",
  EXACT_DUPLICATE: "Exact duplicate",
  UNSUPPORTED_CLAIM: "Unsupported claim",
  UPCODING: "Upcoding",
};

function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function toothLabel(result: RuleResultDto, response: AnalyzeClaimResponse): string {
  const line = response.claim.lines.find((l) => l.id === result.claimLineId);
  return line?.toothNumber != null ? `Tooth ${line.toothNumber}` : "Tooth (unknown)";
}

function buildToothStage(response: AnalyzeClaimResponse): Stage {
  const findings: StageFinding[] = response.ruleResults
    .filter((r) => TOOTH_RULE_IDS.has(r.ruleId))
    .map((r) => ({
      id: r.id,
      severity: r.severity,
      label: toothLabel(r, response),
      detail: r.explanation,
    }));

  return {
    id: "tooth",
    title: "Tooth-level verification (FDI)",
    headline: findings.length === 0
      ? "No tooth-history conflicts detected"
      : pluralize(findings.length, "tooth-history finding", "tooth-history findings"),
    findings,
    visible: true,
  };
}

function buildRulesStage(response: AnalyzeClaimResponse): Stage {
  const findings: StageFinding[] = response.ruleResults
    .filter((r) => RULES_RULE_IDS.has(r.ruleId))
    .map((r) => ({
      id: r.id,
      severity: r.severity,
      label: RULE_NAMES[r.ruleId] ?? r.ruleId,
      detail: r.explanation,
    }));

  return {
    id: "rules",
    title: "Rule-based suspicious-claim detection",
    headline: findings.length === 0
      ? "No suspicious-claim rules triggered"
      : pluralize(findings.length, "rule finding", "rule findings"),
    findings,
    visible: true,
  };
}

function buildScoringStage(response: AnalyzeClaimResponse): Stage {
  const { score, band, confidence } = response.riskScore;
  return {
    id: "scoring",
    title: "Claim risk scoring",
    headline: `Risk score: ${score} — ${band}`,
    findings: [
      {
        id: response.riskScore.id,
        severity: band,
        label: `${score}/100`,
        detail: `${confidence}% confidence`,
      },
    ],
    visible: true,
  };
}

function buildAlertsStage(response: AnalyzeClaimResponse): Stage {
  const findings: StageFinding[] = response.alerts.map((a: AlertDto) => ({
    id: a.id,
    severity: a.severity,
    label: a.summary,
    detail: a.recommendedAction,
  }));

  return {
    id: "alerts",
    title: "Alert generation",
    headline: pluralize(findings.length, "alert generated", "alerts generated"),
    findings,
    visible: findings.length > 0,
  };
}

export function buildStages(response: AnalyzeClaimResponse): Stage[] {
  return [
    buildToothStage(response),
    buildRulesStage(response),
    buildScoringStage(response),
    buildAlertsStage(response),
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run from `packages/frontend/`:
```
npx vitest run tests/features/claims/buildStages.test.ts
```
Expected: PASS — all 7 test cases green.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/features/claims/components/buildStages.ts packages/frontend/tests/features/claims/buildStages.test.ts
git commit -m "feat(claims): add buildStages helper for analyze progress modal"
```

(If `git status` errors because the directory is not a git repo, skip the commit step and note it — the project notes say the working directory `C:\Projects\DentalFraudDetection` reports as not a git repo.)

---

## Task 2: Scaffold `AnalyzeProgressModal.vue` component (static, no animation)

Goal of this task: get the modal rendering with the timeline rows in their terminal `done` state (no spinner, no timer yet). We'll add the animation in Task 3.

**Files:**
- Create: `packages/frontend/src/features/claims/components/AnalyzeProgressModal.vue`

- [ ] **Step 1: Create the component file**

Create `packages/frontend/src/features/claims/components/AnalyzeProgressModal.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { AnalyzeClaimResponse } from "@fdcdf/shared";
import AppModal from "@/ui/AppModal.vue";
import AppButton from "@/ui/AppButton.vue";
import { humanizeDatesInText } from "@/utils/date";
import { buildStages, type Stage, type StageFinding } from "./buildStages";

interface Props {
  open: boolean;
  analysis: AnalyzeClaimResponse | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const stages = computed<Stage[]>(() =>
  props.analysis ? buildStages(props.analysis).filter((s) => s.visible) : []
);

function severityClass(severity: StageFinding["severity"]): string {
  switch (severity) {
    case "LOW":
      return "bg-blue-clinical-light text-blue-clinical";
    case "MEDIUM":
    case "HIGH":
      return "bg-amber-alert-light text-amber-alert";
    case "CRITICAL":
      return "bg-red-critical-light text-red-critical";
    default:
      return "bg-surface-glass text-navy-500";
  }
}
</script>

<template>
  <AppModal
    v-if="open && analysis"
    title="Analysis in progress"
    size="md"
    @close="emit('close')"
  >
    <ol role="list" class="space-y-4">
      <li
        v-for="stage in stages"
        :key="stage.id"
        role="listitem"
        class="flex gap-3"
      >
        <!-- Marker: done state (checkmark) -->
        <div
          class="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-blue-clinical-light text-blue-clinical flex items-center justify-center"
          aria-label="Complete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>

        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-navy-auth">{{ stage.title }}</div>
          <div class="text-xs text-navy-500 mt-0.5">{{ stage.headline }}</div>

          <ul v-if="stage.findings.length" class="mt-2 space-y-2">
            <li
              v-for="finding in stage.findings"
              :key="finding.id"
              class="flex items-start gap-2 text-xs"
            >
              <span
                v-if="finding.severity"
                class="flex-shrink-0 font-medium px-2 py-0.5 rounded-full"
                :class="severityClass(finding.severity)"
              >
                {{ finding.severity }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-navy-auth font-medium">{{ finding.label }}</div>
                <div class="text-navy-500 mt-0.5">{{ humanizeDatesInText(finding.detail) }}</div>
              </div>
            </li>
          </ul>
        </div>
      </li>
    </ol>

    <template #footer>
      <div class="flex justify-end">
        <AppButton size="sm" @click="emit('close')">Done</AppButton>
      </div>
    </template>
  </AppModal>
</template>
```

- [ ] **Step 2: Visually verify (no automated test for this task)**

Run the dev server and exercise the flow:
```
cd packages/frontend && npm run dev
```
- Log in, open an analyzed claim (e.g. `CLM-2026-0011`).
- There's no way to open the modal yet — skip; Task 4 wires it up.
- Instead, confirm the file compiles: `npx vue-tsc --noEmit` from `packages/frontend/`.

Expected: vue-tsc reports no new errors in `AnalyzeProgressModal.vue` or `buildStages.ts`. (Pre-existing errors in `useApi.ts`, `AppCombobox.vue`, `AppDataTable.vue`, `tsconfig.node.json` may still appear — those are known from prior sessions.)

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/features/claims/components/AnalyzeProgressModal.vue
git commit -m "feat(claims): scaffold AnalyzeProgressModal (static timeline)"
```

---

## Task 3: Add step state machine and 700ms animation

Goal: stages start in `loading` (spinner), transition to `done` (checkmark) after 700ms, and the user advances through them with a "Next" / "Done" button. Pending stages render dim.

**Files:**
- Modify: `packages/frontend/src/features/claims/components/AnalyzeProgressModal.vue`

- [ ] **Step 1: Replace the component with the animated version**

Replace the entire contents of `packages/frontend/src/features/claims/components/AnalyzeProgressModal.vue` with:

```vue
<script setup lang="ts">
import { computed, ref, watch, onUnmounted, nextTick } from "vue";
import type { AnalyzeClaimResponse } from "@fdcdf/shared";
import AppModal from "@/ui/AppModal.vue";
import AppButton from "@/ui/AppButton.vue";
import { humanizeDatesInText } from "@/utils/date";
import { buildStages, type Stage, type StageFinding } from "./buildStages";

interface Props {
  open: boolean;
  analysis: AnalyzeClaimResponse | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const STEP_LOADING_MS = 700;

type StageState = "pending" | "loading" | "done";

const stages = computed<Stage[]>(() =>
  props.analysis ? buildStages(props.analysis).filter((s) => s.visible) : []
);

const activeIndex = ref(0);
const stageStates = ref<StageState[]>([]);
const nextButtonRef = ref<InstanceType<typeof AppButton> | null>(null);

let timerId: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function startLoadingAt(index: number) {
  clearTimer();
  if (index < 0 || index >= stages.value.length) return;

  stageStates.value[index] = "loading";
  timerId = setTimeout(() => {
    stageStates.value[index] = "done";
    timerId = null;
    // Move focus to the advance button so keyboard users can continue.
    nextTick(() => {
      const el = (nextButtonRef.value as unknown as { $el?: HTMLElement } | null)?.$el;
      if (el && typeof (el as HTMLElement).focus === "function") {
        (el as HTMLElement).focus();
      }
    });
  }, STEP_LOADING_MS);
}

function reset() {
  clearTimer();
  activeIndex.value = 0;
  stageStates.value = stages.value.map(() => "pending");
  if (stages.value.length > 0) {
    startLoadingAt(0);
  }
}

function advance() {
  if (stageStates.value[activeIndex.value] !== "done") return;
  if (activeIndex.value >= stages.value.length - 1) {
    emit("close");
    return;
  }
  activeIndex.value += 1;
  startLoadingAt(activeIndex.value);
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      reset();
    } else {
      clearTimer();
    }
  },
  { immediate: true }
);

onUnmounted(() => clearTimer());

const activeState = computed(() => stageStates.value[activeIndex.value]);
const isLastStage = computed(() => activeIndex.value === stages.value.length - 1);
const advanceLabel = computed(() => (isLastStage.value ? "Done" : "Next"));

function severityClass(severity: StageFinding["severity"]): string {
  switch (severity) {
    case "LOW":
      return "bg-blue-clinical-light text-blue-clinical";
    case "MEDIUM":
    case "HIGH":
      return "bg-amber-alert-light text-amber-alert";
    case "CRITICAL":
      return "bg-red-critical-light text-red-critical";
    default:
      return "bg-surface-glass text-navy-500";
  }
}
</script>

<template>
  <AppModal
    v-if="open && analysis"
    title="Analysis in progress"
    size="md"
    @close="emit('close')"
  >
    <ol role="list" class="space-y-4">
      <li
        v-for="(stage, index) in stages"
        :key="stage.id"
        role="listitem"
        class="flex gap-3"
        :aria-current="index === activeIndex ? 'step' : undefined"
      >
        <!-- Marker -->
        <div class="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center"
          :class="{
            'bg-surface-glass text-navy-500': stageStates[index] === 'pending',
            'bg-amber-alert-light text-amber-alert': stageStates[index] === 'loading',
            'bg-blue-clinical-light text-blue-clinical': stageStates[index] === 'done',
          }"
          :aria-label="stageStates[index] === 'done' ? 'Complete' : stageStates[index] === 'loading' ? 'Working' : 'Pending'"
        >
          <!-- pending: dim dot -->
          <svg v-if="stageStates[index] === 'pending'" class="h-2 w-2" viewBox="0 0 8 8" fill="currentColor">
            <circle cx="4" cy="4" r="4" />
          </svg>
          <!-- loading: spinner -->
          <svg v-else-if="stageStates[index] === 'loading'" class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <!-- done: checkmark -->
          <svg v-else class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>

        <div class="flex-1 min-w-0" :class="{ 'opacity-50': stageStates[index] === 'pending' }">
          <div class="text-sm font-medium text-navy-auth">{{ stage.title }}</div>

          <div v-if="stageStates[index] === 'loading'" class="text-xs text-navy-500 mt-0.5">Working…</div>

          <template v-else-if="stageStates[index] === 'done'">
            <div class="text-xs text-navy-500 mt-0.5">{{ stage.headline }}</div>
            <ul v-if="stage.findings.length" class="mt-2 space-y-2">
              <li
                v-for="finding in stage.findings"
                :key="finding.id"
                class="flex items-start gap-2 text-xs"
              >
                <span
                  v-if="finding.severity"
                  class="flex-shrink-0 font-medium px-2 py-0.5 rounded-full"
                  :class="severityClass(finding.severity)"
                >
                  {{ finding.severity }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-navy-auth font-medium">{{ finding.label }}</div>
                  <div class="text-navy-500 mt-0.5">{{ humanizeDatesInText(finding.detail) }}</div>
                </div>
              </li>
            </ul>
          </template>
        </div>
      </li>
    </ol>

    <template #footer>
      <div class="flex justify-end">
        <AppButton
          ref="nextButtonRef"
          size="sm"
          :disabled="activeState !== 'done'"
          @click="advance"
        >
          {{ advanceLabel }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
```

- [ ] **Step 2: Typecheck**

Run from `packages/frontend/`:
```
npx vue-tsc --noEmit
```
Expected: no new errors introduced by this file. (Pre-existing errors in the files noted above may still appear — ignore.)

- [ ] **Step 3: Unit tests for `buildStages` still pass**

Run from `packages/frontend/`:
```
npx vitest run tests/features/claims/buildStages.test.ts
```
Expected: PASS (7 tests). This confirms we didn't regress the pure helper.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/features/claims/components/AnalyzeProgressModal.vue
git commit -m "feat(claims): animate AnalyzeProgressModal with 700ms per-step loader"
```

---

## Task 4: Wire the modal into `ClaimDetailView`

**Files:**
- Modify: `packages/frontend/src/features/claims/ClaimDetailView.vue`

- [ ] **Step 1: Add imports and the open-state ref**

Open `packages/frontend/src/features/claims/ClaimDetailView.vue`. Find the imports block at the top. Add this import with the other `./components/…` imports:

```ts
import AnalyzeProgressModal from "./components/AnalyzeProgressModal.vue";
```

Then add the open-state ref. Just below the line `const expanded = reactive<Record<string, boolean>>({});` add:

```ts
const showAnalyzeModal = ref(false);
```

(`ref` is already imported at the top from `vue`.)

- [ ] **Step 2: Open the modal after a successful analyze**

Replace the existing `handleAnalyze` function (currently at approximately line 79-86):

```ts
async function handleAnalyze() {
  try {
    await claimsStore.analyzeClaim(claimId.value);
    toast.success("Analysis complete.");
  } catch {
    toast.error("Analysis failed.");
  }
}
```

with:

```ts
async function handleAnalyze() {
  try {
    await claimsStore.analyzeClaim(claimId.value);
    showAnalyzeModal.value = true;
  } catch {
    toast.error("Analysis failed.");
  }
}
```

Note: the success toast is replaced by the modal itself — the modal is the "completion" signal now. The error toast stays.

- [ ] **Step 3: Render the modal at the bottom of the template**

Inside the root `<template>` block, just before the closing `</div>` of the outermost wrapper (after the `</template>` that closes `<template v-else-if="claim">`), add:

```vue
    <AnalyzeProgressModal
      :open="showAnalyzeModal"
      :analysis="analysis"
      @close="showAnalyzeModal = false"
    />
```

The final template skeleton should look like:

```vue
<template>
  <div>
    <!-- Back button -->
    <!-- Loading skeleton -->
    <template v-else-if="claim">
      <!-- ... existing content ... -->
    </template>
    <AnalyzeProgressModal
      :open="showAnalyzeModal"
      :analysis="analysis"
      @close="showAnalyzeModal = false"
    />
  </div>
</template>
```

The modal should sit at the root `<div>` level so it isn't conditionally unmounted when `claim` is still loading — in practice users can't click Analyze before the claim loads, but keeping the modal at root makes the open/close state independent of the claim-load branch.

- [ ] **Step 4: Typecheck**

Run from `packages/frontend/`:
```
npx vue-tsc --noEmit
```
Expected: no new errors in `ClaimDetailView.vue`.

- [ ] **Step 5: Manual verification via dev server**

Start the dev server and exercise the flow:

```
cd packages/frontend && npm run dev
```

Log in, open one of the seeded claims, and click **Analyze**. Verify for each case:

**Case A — `CLM-2026-0011` (duplicate + alerts expected):**
- [ ] Modal opens after the backend responds.
- [ ] Stage 1 "Tooth-level verification (FDI)" shows spinner for ~700ms, then shows findings (if any) with `Tooth {n}` labels.
- [ ] Clicking **Next** advances to stage 2 "Rule-based suspicious-claim detection". No NEAR_DUPLICATE row appears; an EXACT_DUPLICATE finding should be present.
- [ ] Stage 3 "Claim risk scoring" shows the headline `Risk score: X — BAND` and a single row `X/100 · Y% confidence`.
- [ ] Stage 4 "Alert generation" is visible (alerts were generated for this claim); button label is **Done**.
- [ ] Clicking **Done** closes the modal. The claim page underneath shows the risk header, rule results, and generated alerts as before.
- [ ] Dismissing with Esc or backdrop click also closes the modal and preserves the results.

**Case B — a clean claim with no findings:**
- [ ] Create or pick a claim with no duplicate signals / no tooth-history conflicts.
- [ ] Modal opens with **3 stages** (alerts stage hidden).
- [ ] Each stage shows its empty-state headline: `No tooth-history conflicts detected`, `No suspicious-claim rules triggered`, `Risk score: X — BAND`.
- [ ] Last stage button label is **Done**.

**Case C — analyze error path:**
- [ ] With the dev server running, stop the backend, click **Analyze**.
- [ ] The error toast `Analysis failed.` appears; the modal does NOT open.

- [ ] **Step 6: Commit**

```bash
git add packages/frontend/src/features/claims/ClaimDetailView.vue
git commit -m "feat(claims): open analyze progress modal after successful analyze"
```

---

## Task 5: Update `claude_progress.md` with this session's work

**Files:**
- Modify: `claude_progress.md`

- [ ] **Step 1: Append a new numbered section under "This session"**

Open `claude_progress.md` and update the `_Last updated:_` line at the top to today's date: `2026-04-19`.

Under the existing "This session" block (which currently ends at item 10 "NEAR_DUPLICATE noise suppression"), append:

```markdown
11. **Analyze progress modal**
    - New component `features/claims/components/AnalyzeProgressModal.vue` walks the user through four stages after a successful analyze: tooth-level verification (FDI), rule-based detection, risk scoring, and alert generation (conditional on alerts existing).
    - Vertical timeline layout: each stage loads for 700ms, then reveals a headline and an expandable list of findings. Past steps stay visible; the active step has `aria-current="step"`.
    - Pure helper `features/claims/components/buildStages.ts` partitions `AnalyzeClaimResponse` into stage objects; unit-tested at `tests/features/claims/buildStages.test.ts`.
    - `ClaimDetailView` opens the modal after `claimsStore.analyzeClaim` resolves successfully; the existing error toast handles the failure path.
    - Design spec: `docs/superpowers/specs/2026-04-19-analyze-progress-modal-design.md`. Plan: `docs/superpowers/plans/2026-04-19-analyze-progress-modal.md`.
```

Also move the previous open follow-up item #3 ("End-to-end test coverage") up to reflect that it's still open, and keep the rest of "Known gaps / next steps" unchanged.

- [ ] **Step 2: Commit**

```bash
git add claude_progress.md
git commit -m "docs: log analyze progress modal in session progress snapshot"
```

---

## Post-implementation verification

Run this checklist once Tasks 1-5 are complete:

- [ ] `npx vitest run` from `packages/frontend/` — all tests pass (including the new `buildStages.test.ts`).
- [ ] `npx vue-tsc --noEmit` from `packages/frontend/` — no new errors.
- [ ] Dev-server exercise of Cases A, B, and C from Task 4 Step 5 — all pass visually.
