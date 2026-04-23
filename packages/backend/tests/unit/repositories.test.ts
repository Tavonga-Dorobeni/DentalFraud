import {
  findExactDuplicate,
  findNearDuplicate
} from "../../src/modules/claims/claims.repository";
import { createAlerts, updateAlertStatus } from "../../src/modules/alerts/alerts.repository";
import { createTestDb, destroyTestDb } from "../test-db";
import { createClaim } from "../../src/modules/claims/claims.service";

describe("repository flows", () => {
  beforeEach(async () => {
    await createTestDb();
  });

  afterEach(async () => {
    await destroyTestDb();
  });

  it("finds exact and near duplicates using patient plus procedure/tooth signature", async () => {
    await createClaim({
      externalClaimId: "CLAIM-1",
      patientExternalId: "PAT-001",
      patientName: "Seed Patient",
      patientDateOfBirth: "1990-01-01T00:00:00.000Z",
      providerExternalId: "PROV-001",
      providerName: "Seed Provider",
      providerSpecialty: "General Dentistry",
      dateOfService: "2026-04-01T00:00:00.000Z",
      submissionDate: "2026-04-02T00:00:00.000Z",
      lines: [
        {
          procedureCode: "D2140",
          claimedAmount: 20,
          toothNumber: 26
        }
      ]
    });

    const exactDuplicate = await findExactDuplicate({
      externalClaimId: "CLAIM-2",
      patientExternalId: "PAT-001",
      patientName: "Seed Patient",
      patientDateOfBirth: "1990-01-01T00:00:00.000Z",
      providerExternalId: "PROV-001",
      providerName: "Seed Provider",
      providerSpecialty: "General Dentistry",
      dateOfService: "2026-04-01T00:00:00.000Z",
      submissionDate: "2026-04-02T00:00:00.000Z",
      lines: [
        {
          procedureCode: "D2140",
          claimedAmount: 999,
          toothNumber: 26
        }
      ]
    });

    const nearDuplicate = await findNearDuplicate({
      externalClaimId: "CLAIM-3",
      patientExternalId: "PAT-001",
      patientName: "Seed Patient",
      patientDateOfBirth: "1990-01-01T00:00:00.000Z",
      providerExternalId: "PROV-002",
      providerName: "Different Provider",
      providerSpecialty: "General Dentistry",
      dateOfService: "2026-04-04T00:00:00.000Z",
      submissionDate: "2026-04-05T00:00:00.000Z",
      lines: [
        {
          procedureCode: "D2140",
          claimedAmount: 30,
          toothNumber: 26
        }
      ]
    });

    expect(exactDuplicate).toBeTruthy();
    expect(nearDuplicate).toBeTruthy();
    expect(exactDuplicate?.provider_external_id).toBe("PROV-001");
    expect(nearDuplicate?.provider_external_id).toBe("PROV-001");
  });

  it("updates alert state in persistence", async () => {
    const createdClaim = await createClaim({
      externalClaimId: "CLAIM-ALERT-1",
      patientExternalId: "PAT-001",
      patientName: "Seed Patient",
      patientDateOfBirth: "1990-01-01T00:00:00.000Z",
      providerExternalId: "PROV-001",
      providerName: "Seed Provider",
      providerSpecialty: "General Dentistry",
      dateOfService: "2026-04-01T00:00:00.000Z",
      submissionDate: "2026-04-02T00:00:00.000Z",
      lines: [
        {
          procedureCode: "D0120",
          claimedAmount: 20
        }
      ]
    });

    const [createdAlert] = await createAlerts([
      {
        claimId: createdClaim.id,
        severity: "HIGH",
        summary: "Manual alert",
        recommendedAction: "Review",
        triggeredRuleIds: ["EXACT_DUPLICATE"]
      }
    ]);

    const updated = await updateAlertStatus(createdAlert.id, "CLOSED", "user_admin");
    expect(updated?.status).toBe("CLOSED");
    expect(updated?.assigned_user_id).toBe("user_admin");
  });
});
