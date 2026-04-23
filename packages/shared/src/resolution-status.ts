import { LineDecision, ResolutionStatus } from "./enums";

export function deriveResolutionStatus(
  lines: Array<{ id: string }>,
  decisions: Array<{ claimLineId: string; decision: LineDecision }>
): ResolutionStatus {
  if (lines.length === 0) {
    return ResolutionStatus.PENDING_REVIEW;
  }

  const decisionsByLineId = new Map(decisions.map((decision) => [decision.claimLineId, decision.decision]));
  const decidedLines = lines.filter((line) => decisionsByLineId.has(line.id));

  if (decidedLines.length === 0) {
    return ResolutionStatus.PENDING_REVIEW;
  }

  if (decidedLines.length < lines.length) {
    return ResolutionStatus.IN_REVIEW;
  }

  const decisionValues = decidedLines.map((line) => decisionsByLineId.get(line.id)!);

  if (decisionValues.includes(LineDecision.CONFIRMED_FRAUD)) {
    return ResolutionStatus.CONFIRMED_FRAUD;
  }

  if (decisionValues.includes(LineDecision.EDUCATION_REQUIRED)) {
    return ResolutionStatus.EDUCATION_FLAGGED;
  }

  return ResolutionStatus.CLEARED;
}
