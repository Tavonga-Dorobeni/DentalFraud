import {
  AlertStatus,
  ClaimStatus,
  LineDecision,
  RiskBand,
  ResolutionStatus,
  RuleSeverity,
  ToothDentitionType,
  UserRole
} from "./enums";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiFailureResponse {
  success: false;
  error: ApiError;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PatientSummary {
  externalId: string;
  name: string;
  dateOfBirth?: string;
}

export interface PatientDto extends PatientSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
  externalId: string;
  name: string;
  dateOfBirth?: string;
}

export interface UpdatePatientRequest {
  externalId?: string;
  name?: string;
  dateOfBirth?: string;
}

export interface ProviderSummary {
  externalId: string;
  name: string;
  specialty?: string;
}

export interface ProviderDto extends ProviderSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderRequest {
  externalId: string;
  name: string;
  specialty?: string;
}

export interface UpdateProviderRequest {
  externalId?: string;
  name?: string;
  specialty?: string;
}

export interface ProcedureCatalogItem {
  code: string;
  description: string;
  category?: string;
}

export interface ProcedureDto extends ProcedureCatalogItem {
  id: string;
  complexityLevel: number;
  requiresEvidence: boolean;
  allowedDentition: "PRIMARY" | "PERMANENT" | "BOTH";
  createdAt: string;
}

export interface CreateProcedureRequest {
  code: string;
  description: string;
  category: string;
  complexityLevel: number;
  requiresEvidence?: boolean;
  allowedDentition: "PRIMARY" | "PERMANENT" | "BOTH";
}

export interface UpdateProcedureRequest {
  code?: string;
  description?: string;
  category?: string;
  complexityLevel?: number;
  requiresEvidence?: boolean;
  allowedDentition?: "PRIMARY" | "PERMANENT" | "BOTH";
}

export interface ClaimLineInput {
  procedureCode: string;
  claimedAmount: number;
  toothNumber?: number;
  documentedProcedureCode?: string;
  evidenceSummary?: string;
  chartNotes?: string;
  radiographReference?: string;
  treatmentPlanReference?: string;
}

export interface CreateClaimRequest {
  externalClaimId: string;
  patientExternalId: string;
  patientName: string;
  patientDateOfBirth?: string;
  providerExternalId: string;
  providerName: string;
  providerSpecialty?: string;
  dateOfService: string;
  submissionDate: string;
  lines: ClaimLineInput[];
}

export interface ClaimLineDto {
  id: string;
  procedureCode: string;
  claimedAmount: number;
  toothNumber?: number;
  dentitionType?: ToothDentitionType;
  documentedProcedureCode?: string;
  evidenceSummary?: string;
  chartNotes?: string;
  radiographReference?: string;
  treatmentPlanReference?: string;
}

export interface ClaimLineDecisionDto {
  id: string;
  claimId: string;
  claimLineId: string;
  decision: LineDecision;
  note?: string;
  decidedByUserId: string;
  decidedAt: string;
}

export interface UpsertClaimLineDecisionRequest {
  decision: LineDecision;
  note?: string;
}

export interface ClaimLatestAnalysis {
  riskScore: RiskScoreDto;
  ruleResults: RuleResultDto[];
  alerts: AlertDto[];
  analyzedAt: string;
}

export interface ClaimResponse {
  id: string;
  externalClaimId: string;
  patientId: string;
  providerId: string;
  duplicateOfClaimId?: string | null;
  dateOfService: string;
  submissionDate: string;
  status: ClaimStatus;
  warnings: string[];
  lines: ClaimLineDto[];
  decisions: ClaimLineDecisionDto[];
  latestAnalysis?: ClaimLatestAnalysis;
  createdAt: string;
}

export interface RuleResultDto {
  id: string;
  claimId: string;
  claimLineId?: string;
  ruleId: string;
  matchedClaimId?: string | null;
  severity: RuleSeverity;
  explanation: string;
  evidenceFields: string[];
  executedAt: string;
  configVersionId: string;
}

export interface ScoreFactorDto {
  ruleId: string;
  severity: RuleSeverity;
  weight: number;
  contribution: number;
  explanation: string;
}

export interface RiskScoreDto {
  id: string;
  claimId: string;
  score: number;
  band: RiskBand;
  confidence: number;
  contributingFactors: ScoreFactorDto[];
  configVersionId: string;
  createdAt: string;
}

export interface AlertDto {
  id: string;
  claimId: string;
  claimLineId?: string;
  severity: RuleSeverity;
  status: AlertStatus;
  summary: string;
  recommendedAction: string;
  assignedUserId?: string;
  triggeredRuleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AnalyzeClaimResponse {
  claim: ClaimResponse;
  ruleResults: RuleResultDto[];
  riskScore: RiskScoreDto;
  alerts: AlertDto[];
}

export interface ChartDatumDto {
  label: string;
  value: number;
}

export interface RiskBandDistributionReportDto {
  series: ChartDatumDto[];
}

export interface RuleFrequencyReportDto {
  series: ChartDatumDto[];
}

export interface DecisionCountsReportDto {
  series: ChartDatumDto[];
}

export interface TopEntityDatumDto {
  id: string;
  label: string;
  value: number;
}

export interface TopEntitiesReportDto {
  procedures: TopEntityDatumDto[];
  providers: TopEntityDatumDto[];
  patients: TopEntityDatumDto[];
}

export interface ClaimAuditTrailEventDto {
  id: string;
  claimId: string;
  claimLineId?: string;
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: UserRole;
  action: string;
  targetEntity: string;
  targetEntityId?: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ClaimAuditTrailResponse {
  claimId: string;
  events: ClaimAuditTrailEventDto[];
}
