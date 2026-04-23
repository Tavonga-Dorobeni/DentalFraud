import { RuleSeverity } from "@fdcdf/shared";
import { findChronologyConflict, findRepeatIntervalConflict } from "../../src/modules/teeth/teeth.service";
import { scoreClaim } from "../../src/modules/scoring/scoring.service";
import { createTestDb, destroyTestDb } from "../test-db";

describe("teeth and scoring services", () => {
  beforeEach(async () => {
    await createTestDb();
  });

  afterEach(async () => {
    await destroyTestDb();
  });

  it("detects chronology conflicts after extraction", () => {
    const result = findChronologyConflict(
      [
        {
          id: "1",
          patientId: "p1",
          toothNumber: 46,
          eventType: "EXTRACTED",
          eventDate: "2025-01-10T00:00:00.000Z"
        }
      ],
      "2026-04-01T00:00:00.000Z",
      "D2740"
    );

    expect(result).toContain("extraction");
  });

  it("detects repeat procedures inside the configured interval", () => {
    const result = findRepeatIntervalConflict(
      [
        {
          id: "1",
          patientId: "p1",
          toothNumber: 26,
          eventType: "D2140",
          eventDate: "2026-03-01T00:00:00.000Z"
        }
      ],
      "2026-04-01T00:00:00.000Z",
      "D2140",
      180
    );

    expect(result).toContain("repeated within 180 days");
  });

  it("produces deterministic score bands from rule severities", async () => {
    const first = await scoreClaim(
      "claim_1",
      [
        {
          id: "r1",
          claimId: "claim_1",
          claimLineId: "line_1",
          ruleId: "IMPOSSIBLE_PROCEDURE",
          severity: RuleSeverity.CRITICAL,
          explanation: "Impossible procedure",
          evidenceFields: ["toothHistory"],
          executedAt: "2026-04-09T00:00:00.000Z",
          configVersionId: "cfg_v1"
        }
      ],
      "cfg_v1"
    );

    const second = await scoreClaim(
      "claim_1",
      [
        {
          id: "r1",
          claimId: "claim_1",
          claimLineId: "line_1",
          ruleId: "IMPOSSIBLE_PROCEDURE",
          severity: RuleSeverity.CRITICAL,
          explanation: "Impossible procedure",
          evidenceFields: ["toothHistory"],
          executedAt: "2026-04-09T00:00:00.000Z",
          configVersionId: "cfg_v1"
        }
      ],
      "cfg_v1"
    );

    expect(first.score).toBe(second.score);
    expect(first.band).toBe(second.band);
  });
});
