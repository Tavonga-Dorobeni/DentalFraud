export interface PersistedClaimRow {
  id: string;
  external_claim_id: string;
  patient_id: string;
  provider_id: string;
  date_of_service: string;
  submission_date: string;
  status: string;
  warnings_json: string;
  created_at: string;
}
