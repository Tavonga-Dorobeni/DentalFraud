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
        detail: `${Math.round(confidence * 100)}% confidence`,
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
