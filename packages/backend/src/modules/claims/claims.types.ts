import { ClaimLineInput, ClaimStatus } from "@fdcdf/shared";

export interface CreateClaimCommand {
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

export interface ClaimCreationResult {
  claimId: string;
  status: ClaimStatus;
  warnings: string[];
}
