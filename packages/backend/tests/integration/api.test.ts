import request from "supertest";
import { createApp } from "../../src/app/app";
import { createTestDb, destroyTestDb } from "../test-db";

const app = createApp();

const login = async () => {
  const response = await request(app).post("/api/v1/auth/login").send({
    email: "analyst@fdcdf.local",
    password: "Password123!"
  });

  return response.body.data.accessToken as string;
};

const loginAdmin = async () => {
  const response = await request(app).post("/api/v1/auth/login").send({
    email: "admin@fdcdf.local",
    password: "Password123!"
  });

  return response.body.data.accessToken as string;
};

describe("FDCDF API", () => {
  beforeEach(async () => {
    await createTestDb();
  });

  afterEach(async () => {
    await destroyTestDb();
  });

  it("authenticates and protects claim routes", async () => {
    const unauthenticated = await request(app).get("/api/v1/claims");
    expect(unauthenticated.status).toBe(401);

    const token = await login();
    const authenticated = await request(app)
      .get("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`);

    expect(authenticated.status).toBe(200);
    expect(authenticated.body.success).toBe(true);
  });

  it("allows CORS for the frontend origins", async () => {
    const preflight = await request(app)
      .options("/api/v1/auth/login")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Authorization, Content-Type");

    expect(preflight.status).toBe(204);
    expect(preflight.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(preflight.headers["access-control-allow-methods"]).toContain("POST");
    expect(preflight.headers["access-control-allow-headers"]).toContain("Authorization");

    const netlifyRequest = await request(app)
      .post("/api/v1/auth/login")
      .set("Origin", "https://fdcdf.netlify.app")
      .send({
        email: "analyst@fdcdf.local",
        password: "Password123!"
      });

    expect(netlifyRequest.status).toBe(200);
    expect(netlifyRequest.headers["access-control-allow-origin"]).toBe("https://fdcdf.netlify.app");
  });

  it("lists patients, providers, and procedures for the frontend", async () => {
    const token = await login();

    const [patients, providers, procedures] = await Promise.all([
      request(app).get("/api/v1/patients").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/v1/providers").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/v1/procedures").set("Authorization", `Bearer ${token}`)
    ]);

    expect(patients.status).toBe(200);
    expect(patients.body.data.items.some((item: { externalId: string }) => item.externalId === "PAT-00012")).toBe(true);

    expect(providers.status).toBe(200);
    expect(providers.body.data.items.some((item: { externalId: string }) => item.externalId === "PRV-1001")).toBe(true);

    expect(procedures.status).toBe(200);
    expect(procedures.body.data.items.some((item: { code: string }) => item.code === "D0140")).toBe(true);
  });

  it("supports CRUD for patients, providers, and procedures", async () => {
    const adminToken = await loginAdmin();

    const createdPatient = await request(app)
      .post("/api/v1/patients")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        externalId: "PAT-NEW-1",
        name: "New Patient",
        dateOfBirth: "2000-01-01"
      });
    expect(createdPatient.status).toBe(201);

    const patientId = createdPatient.body.data.id as string;
    const updatedPatient = await request(app)
      .put(`/api/v1/patients/${patientId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Updated Patient"
      });
    expect(updatedPatient.status).toBe(200);
    expect(updatedPatient.body.data.name).toBe("Updated Patient");

    const createdProvider = await request(app)
      .post("/api/v1/providers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        externalId: "PRV-NEW-1",
        name: "New Provider",
        specialty: "Orthodontics"
      });
    expect(createdProvider.status).toBe(201);

    const providerId = createdProvider.body.data.id as string;
    const updatedProvider = await request(app)
      .put(`/api/v1/providers/${providerId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        specialty: "Periodontics"
      });
    expect(updatedProvider.status).toBe(200);
    expect(updatedProvider.body.data.specialty).toBe("Periodontics");

    const createdProcedure = await request(app)
      .post("/api/v1/procedures")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "D9999",
        description: "Custom procedure",
        category: "Custom",
        complexityLevel: 2,
        requiresEvidence: true,
        allowedDentition: "BOTH"
      });
    expect(createdProcedure.status).toBe(201);

    const procedureId = createdProcedure.body.data.id as string;
    const updatedProcedure = await request(app)
      .put(`/api/v1/procedures/${procedureId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        description: "Updated custom procedure",
        category: "Updated"
      });
    expect(updatedProcedure.status).toBe(200);
    expect(updatedProcedure.body.data.description).toBe("Updated custom procedure");

    const fetchedPatient = await request(app)
      .get(`/api/v1/patients/${patientId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(fetchedPatient.status).toBe(200);

    const fetchedProvider = await request(app)
      .get(`/api/v1/providers/${providerId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(fetchedProvider.status).toBe(200);

    const fetchedProcedure = await request(app)
      .get(`/api/v1/procedures/${procedureId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(fetchedProcedure.status).toBe(200);

    const deletedPatient = await request(app)
      .delete(`/api/v1/patients/${patientId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deletedPatient.status).toBe(204);

    const deletedProvider = await request(app)
      .delete(`/api/v1/providers/${providerId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deletedProvider.status).toBe(204);

    const deletedProcedure = await request(app)
      .delete(`/api/v1/procedures/${procedureId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deletedProcedure.status).toBe(204);
  });

  it("creates a valid claim and rejects invalid tooth numbers", async () => {
    const token = await login();

    const created = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-VALID-1",
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

    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe("ACCEPTED");

    const invalidTooth = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-INVALID-1",
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
            claimedAmount: 100,
            toothNumber: 99
          }
        ]
      });

    expect(invalidTooth.status).toBe(400);
  });

  it("accepts plain YYYY-MM-DD dates in claim payloads", async () => {
    const token = await login();

    const created = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-DATE-ONLY-1",
        patientExternalId: "PAT-032",
        patientName: "Tariro",
        patientDateOfBirth: "2014-02-20",
        providerExternalId: "PROV-034",
        providerName: "CIMAS",
        providerSpecialty: "Dental",
        dateOfService: "2026-04-13",
        submissionDate: "2026-04-14",
        lines: [
          {
            procedureCode: "D0120",
            claimedAmount: 300,
            toothNumber: 21
          }
        ]
      });

    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    expect(created.body.data.dateOfService).toBe("2026-04-13");
    expect(created.body.data.submissionDate).toBe("2026-04-14");
  });

  it("marks exact duplicate claims with warnings", async () => {
    const token = await login();

    const payload = {
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
    };

    const original = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-DUP-A",
        ...payload
      });

    const duplicate = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-DUP-B",
        ...payload
      });

    expect(duplicate.status).toBe(201);
    expect(duplicate.body.data.status).toBe("ACCEPTED_WITH_WARNINGS");
    expect(duplicate.body.data.warnings).toContain("Potential exact duplicate claim detected");
    expect(duplicate.body.data.duplicateOfClaimId).toBe(original.body.data.id);

    const analyzed = await request(app)
      .post(`/api/v1/claims/${duplicate.body.data.id}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    expect(analyzed.status).toBe(200);
    const duplicateRules = analyzed.body.data.ruleResults.filter(
      (result: { ruleId: string }) => result.ruleId === "EXACT_DUPLICATE"
    );
    expect(duplicateRules.length).toBeGreaterThan(0);
    expect(
      duplicateRules.every(
        (result: { matchedClaimId?: string | null }) => result.matchedClaimId === original.body.data.id
      )
    ).toBe(true);
  });

  it("marks near-duplicate claims when provider or service date differs", async () => {
    const token = await login();

    const original = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-NEAR-A",
        patientExternalId: "PAT-NEAR-1",
        patientName: "Near Duplicate Patient",
        patientDateOfBirth: "1990-01-01",
        providerExternalId: "PROV-NEAR-A",
        providerName: "Provider A",
        providerSpecialty: "General Dentistry",
        dateOfService: "2026-04-20",
        submissionDate: "2026-04-21",
        lines: [
          {
            procedureCode: "D2140",
            claimedAmount: 120,
            toothNumber: 26
          }
        ]
      });

    const duplicate = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-NEAR-B",
        patientExternalId: "PAT-NEAR-1",
        patientName: "Near Duplicate Patient",
        patientDateOfBirth: "1990-01-01",
        providerExternalId: "PROV-NEAR-B",
        providerName: "Provider B",
        providerSpecialty: "General Dentistry",
        dateOfService: "2026-04-22",
        submissionDate: "2026-04-23",
        lines: [
          {
            procedureCode: "D2140",
            claimedAmount: 999,
            toothNumber: 26
          }
        ]
      });

    expect(duplicate.status).toBe(201);
    expect(duplicate.body.data.warnings).toContain("Potential near-duplicate claim detected");
    expect(duplicate.body.data.duplicateOfClaimId).toBe(original.body.data.id);

    const analyzed = await request(app)
      .post(`/api/v1/claims/${duplicate.body.data.id}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    expect(analyzed.status).toBe(200);
    expect(
      analyzed.body.data.ruleResults.some(
        (result: { ruleId: string; matchedClaimId?: string | null }) =>
          result.ruleId === "NEAR_DUPLICATE" && result.matchedClaimId === original.body.data.id
      )
    ).toBe(true);
    expect(
      analyzed.body.data.ruleResults.some((result: { ruleId: string }) => result.ruleId === "EXACT_DUPLICATE")
    ).toBe(false);
  });

  it("returns matchedClaimId for seeded duplicate claims", async () => {
    const token = await login();

    const seededDuplicate = await request(app)
      .get("/api/v1/claims/claim_seed_11")
      .set("Authorization", `Bearer ${token}`);

    expect(seededDuplicate.status).toBe(200);
    expect(seededDuplicate.body.data.duplicateOfClaimId).toBe("claim_seed_1");
    expect(seededDuplicate.body.data.warnings).toContain("Potential exact duplicate claim detected");

    const analyzed = await request(app)
      .post("/api/v1/claims/claim_seed_11/analyze")
      .set("Authorization", `Bearer ${token}`);

    expect(analyzed.status).toBe(200);
    const duplicateRules = analyzed.body.data.ruleResults.filter(
      (result: { ruleId: string }) => result.ruleId === "EXACT_DUPLICATE"
    );

    expect(duplicateRules.length).toBeGreaterThan(0);
    expect(
      duplicateRules.every(
        (result: { matchedClaimId?: string | null }) => result.matchedClaimId === "claim_seed_1"
      )
    ).toBe(true);
  });

  it("upserts and clears claim line decisions while surfacing them on claim reads", async () => {
    const token = await login();

    const created = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-DECISION-1",
        patientExternalId: "PAT-DECISION-1",
        patientName: "Decision Patient",
        patientDateOfBirth: "1990-01-01",
        providerExternalId: "PROV-DECISION-1",
        providerName: "Decision Provider",
        providerSpecialty: "General Dentistry",
        dateOfService: "2026-04-18",
        submissionDate: "2026-04-19",
        lines: [
          {
            procedureCode: "D2140",
            claimedAmount: 120,
            toothNumber: 26
          }
        ]
      });

    expect(created.status).toBe(201);
    const claimId = created.body.data.id as string;
    const lineId = created.body.data.lines[0].id as string;

    const firstDecision = await request(app)
      .post(`/api/v1/claims/${claimId}/lines/${lineId}/decision`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        decision: "LEGITIMATE",
        note: "Supported by evidence"
      });

    expect(firstDecision.status).toBe(200);
    expect(firstDecision.body.data.decision).toBe("LEGITIMATE");
    expect(firstDecision.body.data.note).toBe("Supported by evidence");

    const updatedDecision = await request(app)
      .post(`/api/v1/claims/${claimId}/lines/${lineId}/decision`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        decision: "CONFIRMED_FRAUD",
        note: "Escalate for investigation"
      });

    expect(updatedDecision.status).toBe(200);
    expect(updatedDecision.body.data.id).toBe(firstDecision.body.data.id);
    expect(updatedDecision.body.data.decision).toBe("CONFIRMED_FRAUD");

    const fetchedClaim = await request(app)
      .get(`/api/v1/claims/${claimId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(fetchedClaim.status).toBe(200);
    expect(fetchedClaim.body.data.decisions).toHaveLength(1);
    expect(fetchedClaim.body.data.decisions[0].claimLineId).toBe(lineId);
    expect(fetchedClaim.body.data.decisions[0].decision).toBe("CONFIRMED_FRAUD");

    const analyzedClaim = await request(app)
      .post(`/api/v1/claims/${claimId}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    expect(analyzedClaim.status).toBe(200);
    expect(analyzedClaim.body.data.claim.decisions).toHaveLength(1);
    expect(analyzedClaim.body.data.claim.decisions[0].decision).toBe("CONFIRMED_FRAUD");

    const clearedDecision = await request(app)
      .delete(`/api/v1/claims/${claimId}/lines/${lineId}/decision`)
      .set("Authorization", `Bearer ${token}`);

    expect(clearedDecision.status).toBe(204);

    const fetchedAfterClear = await request(app)
      .get(`/api/v1/claims/${claimId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(fetchedAfterClear.status).toBe(200);
    expect(fetchedAfterClear.body.data.decisions).toHaveLength(0);
  });

  it("returns chart-ready dashboard report data", async () => {
    const token = await login();

    const created = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-REPORT-1",
        patientExternalId: "PAT-REPORT-1",
        patientName: "Report Patient",
        patientDateOfBirth: "1991-05-12",
        providerExternalId: "PROV-REPORT-1",
        providerName: "Report Provider",
        providerSpecialty: "General Dentistry",
        dateOfService: "2026-04-18",
        submissionDate: "2026-04-19",
        lines: [
          {
            procedureCode: "D2740",
            documentedProcedureCode: "D2140",
            claimedAmount: 450,
            toothNumber: 46
          }
        ]
      });

    const claimId = created.body.data.id as string;
    const lineId = created.body.data.lines[0].id as string;

    await request(app)
      .post(`/api/v1/claims/${claimId}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    await request(app)
      .post(`/api/v1/claims/${claimId}/lines/${lineId}/decision`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        decision: "CONFIRMED_FRAUD",
        note: "Dashboard reporting test"
      });

    const [riskBand, ruleFrequency, decisionCounts, topEntities] = await Promise.all([
      request(app).get("/api/v1/reports/risk-band-distribution").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/v1/reports/rule-frequency").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/v1/reports/decision-counts").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/v1/reports/top-entities?limit=3").set("Authorization", `Bearer ${token}`)
    ]);

    expect(riskBand.status).toBe(200);
    expect(riskBand.body.data.series).toHaveLength(4);
    expect(riskBand.body.data.series.every((item: { label: string; value: number }) => typeof item.label === "string" && typeof item.value === "number")).toBe(true);

    expect(ruleFrequency.status).toBe(200);
    expect(ruleFrequency.body.data.series.length).toBeGreaterThan(0);
    expect(ruleFrequency.body.data.series.some((item: { label: string }) => item.label === "UPCODING")).toBe(true);

    expect(decisionCounts.status).toBe(200);
    expect(decisionCounts.body.data.series).toHaveLength(3);
    expect(
      decisionCounts.body.data.series.some(
        (item: { label: string; value: number }) => item.label === "CONFIRMED_FRAUD" && item.value > 0
      )
    ).toBe(true);

    expect(topEntities.status).toBe(200);
    expect(topEntities.body.data.procedures.length).toBeLessThanOrEqual(3);
    expect(topEntities.body.data.providers.length).toBeLessThanOrEqual(3);
    expect(topEntities.body.data.patients.length).toBeLessThanOrEqual(3);
  });

  it("hydrates latestAnalysis on claim detail after analysis while keeping claim lists lean", async () => {
    const token = await login();

    const created = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-LATEST-ANALYSIS-1",
        patientExternalId: "PAT-LATEST-1",
        patientName: "Latest Analysis Patient",
        patientDateOfBirth: "1990-01-01",
        providerExternalId: "PROV-LATEST-1",
        providerName: "Latest Analysis Provider",
        providerSpecialty: "General Dentistry",
        dateOfService: "2026-04-19",
        submissionDate: "2026-04-20",
        lines: [
          {
            procedureCode: "D2740",
            documentedProcedureCode: "D2140",
            claimedAmount: 450,
            toothNumber: 46
          }
        ]
      });

    const claimId = created.body.data.id as string;

    const beforeAnalysis = await request(app)
      .get(`/api/v1/claims/${claimId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(beforeAnalysis.status).toBe(200);
    expect(beforeAnalysis.body.data.latestAnalysis).toBeUndefined();

    const analyzed = await request(app)
      .post(`/api/v1/claims/${claimId}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    expect(analyzed.status).toBe(200);

    const afterAnalysis = await request(app)
      .get(`/api/v1/claims/${claimId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(afterAnalysis.status).toBe(200);
    expect(afterAnalysis.body.data.latestAnalysis).toBeDefined();
    expect(afterAnalysis.body.data.latestAnalysis.riskScore.id).toBe(analyzed.body.data.riskScore.id);
    expect(afterAnalysis.body.data.latestAnalysis.ruleResults.length).toBeGreaterThan(0);
    expect(afterAnalysis.body.data.latestAnalysis.analyzedAt).toBeTruthy();

    const listedClaims = await request(app)
      .get("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`);

    expect(listedClaims.status).toBe(200);
    const listedClaim = listedClaims.body.data.items.find((item: { id: string }) => item.id === claimId);
    expect(listedClaim).toBeDefined();
    expect(listedClaim.latestAnalysis).toBeUndefined();
  });

  it("does not flag unsupported claims when documentedProcedureCode is present", async () => {
    const token = await login();

    const created = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-DOC-SUPPORT-1",
        patientExternalId: "PAT-DOC-SUPPORT-1",
        patientName: "Documented Support Patient",
        patientDateOfBirth: "1991-06-10",
        providerExternalId: "PROV-DOC-SUPPORT-1",
        providerName: "Documented Support Provider",
        providerSpecialty: "General Dentistry",
        dateOfService: "2026-04-23",
        submissionDate: "2026-04-24",
        lines: [
          {
            procedureCode: "D2740",
            documentedProcedureCode: "D2140",
            claimedAmount: 450,
            toothNumber: 21
          }
        ]
      });

    const claimId = created.body.data.id as string;

    const analyzed = await request(app)
      .post(`/api/v1/claims/${claimId}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    expect(analyzed.status).toBe(200);
    expect(
      analyzed.body.data.ruleResults.some((result: { ruleId: string }) => result.ruleId === "UNSUPPORTED_CLAIM")
    ).toBe(false);
  });

  it("returns a claim-centered audit trail timeline", async () => {
    const token = await login();

    const created = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-AUDIT-1",
        patientExternalId: "PAT-AUDIT-1",
        patientName: "Audit Patient",
        patientDateOfBirth: "1992-03-01",
        providerExternalId: "PROV-AUDIT-1",
        providerName: "Audit Provider",
        providerSpecialty: "General Dentistry",
        dateOfService: "2026-04-21",
        submissionDate: "2026-04-22",
        lines: [
          {
            procedureCode: "D2740",
            documentedProcedureCode: "D2140",
            claimedAmount: 450,
            toothNumber: 46
          }
        ]
      });

    const claimId = created.body.data.id as string;
    const lineId = created.body.data.lines[0].id as string;

    const analyzed = await request(app)
      .post(`/api/v1/claims/${claimId}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    const alertId = analyzed.body.data.alerts[0].id as string;

    await request(app)
      .post(`/api/v1/claims/${claimId}/lines/${lineId}/decision`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        decision: "CONFIRMED_FRAUD",
        note: "Audit trail test"
      });

    await request(app)
      .post(`/api/v1/alerts/${alertId}/acknowledge`)
      .set("Authorization", `Bearer ${token}`);

    await request(app)
      .post(`/api/v1/alerts/${alertId}/close`)
      .set("Authorization", `Bearer ${token}`);

    const auditTrail = await request(app)
      .get(`/api/v1/claims/${claimId}/audit-trail`)
      .set("Authorization", `Bearer ${token}`);

    expect(auditTrail.status).toBe(200);
    expect(auditTrail.body.data.claimId).toBe(claimId);
    expect(auditTrail.body.data.events.length).toBeGreaterThan(0);
    expect(
      auditTrail.body.data.events.every((event: { claimId: string }) => event.claimId === claimId)
    ).toBe(true);
    expect(
      auditTrail.body.data.events.some((event: { action: string }) => event.action === "CLAIM_INGESTED")
    ).toBe(true);
    expect(
      auditTrail.body.data.events.some((event: { action: string }) => event.action === "CLAIM_ANALYZED")
    ).toBe(true);
    expect(
      auditTrail.body.data.events.some((event: { action: string }) => event.action === "CLAIM_LINE_DECISION_SET")
    ).toBe(true);
    expect(
      auditTrail.body.data.events.some((event: { action: string }) => event.action === "ALERT_ACKNOWLEDGED")
    ).toBe(true);
    expect(
      auditTrail.body.data.events.some((event: { action: string }) => event.action === "ALERT_CLOSED")
    ).toBe(true);
  });

  it("analyzes a claim, persists alerts, and supports acknowledge/close", async () => {
    const token = await login();

    const created = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-ANALYZE-1",
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
            procedureCode: "D2740",
            documentedProcedureCode: "D2140",
            claimedAmount: 450,
            toothNumber: 46
          },
          {
            procedureCode: "D2140",
            claimedAmount: 150,
            toothNumber: 26
          }
        ]
      });

    const claimId = created.body.data.id as string;

    const analyzed = await request(app)
      .post(`/api/v1/claims/${claimId}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    expect(analyzed.status).toBe(200);
    expect(analyzed.body.data.ruleResults.length).toBeGreaterThan(0);
    expect(analyzed.body.data.riskScore.contributingFactors.length).toBeGreaterThan(0);
    expect(analyzed.body.data.alerts.length).toBeGreaterThan(0);

    const alertId = analyzed.body.data.alerts[0].id as string;

    const acknowledged = await request(app)
      .post(`/api/v1/alerts/${alertId}/acknowledge`)
      .set("Authorization", `Bearer ${token}`);
    expect(acknowledged.status).toBe(200);
    expect(acknowledged.body.data.status).toBe("ACKNOWLEDGED");

    const closed = await request(app)
      .post(`/api/v1/alerts/${alertId}/close`)
      .set("Authorization", `Bearer ${token}`);
    expect(closed.status).toBe(200);
    expect(closed.body.data.status).toBe("CLOSED");
  });

  it("keeps deterministic scores for the same input and config version", async () => {
    const token = await login();

    const payload = {
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
          procedureCode: "D2740",
          documentedProcedureCode: "D2140",
          claimedAmount: 450,
          toothNumber: 46
        }
      ]
    };

    const first = await request(app)
      .post("/api/v1/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        externalClaimId: "CLAIM-DET-1",
        ...payload
      });

    const firstAnalysis = await request(app)
      .post(`/api/v1/claims/${first.body.data.id}/analyze`)
      .set("Authorization", `Bearer ${token}`);
    const secondAnalysis = await request(app)
      .post(`/api/v1/claims/${first.body.data.id}/analyze`)
      .set("Authorization", `Bearer ${token}`);

    expect(firstAnalysis.body.data.riskScore.score).toBe(secondAnalysis.body.data.riskScore.score);
    expect(firstAnalysis.body.data.riskScore.band).toBe(secondAnalysis.body.data.riskScore.band);
  });
});
