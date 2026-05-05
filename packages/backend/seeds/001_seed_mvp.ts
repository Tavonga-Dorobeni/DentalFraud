import { Knex } from "knex";
import bcrypt from "bcryptjs";

const now = "2026-04-09T00:00:00.000Z";

interface SeedClaimLine {
  id: string;
  procedureCode: string;
  claimedAmount: number;
  toothNumber?: number;
  documentedProcedureCode?: string;
  evidenceSummary?: string;
  chartNotes?: string;
  radiographReference?: string;
  treatmentPlanReference?: string;
}

interface SeedClaim {
  id: string;
  externalClaimId: string;
  patientId: string;
  patientExternalId: string;
  providerId: string;
  providerExternalId: string;
  dateOfService: string;
  submissionDate: string;
  duplicateOfClaimId?: string;
  warnings?: string[];
  lines: SeedClaimLine[];
}

const seededPatients = [
  { id: "patient_tafadzwa_moyo", external_id: "PAT-001", name: "Tafadzwa Moyo", date_of_birth: "1990-01-01T00:00:00.000Z" },
  { id: "patient_rumbidzai_ncube", external_id: "PAT-00012", name: "Rumbidzai Ncube", date_of_birth: "1987-03-14" },
  { id: "patient_tatenda_chikowore", external_id: "PAT-00034", name: "Tatenda Chikowore", date_of_birth: "1965-11-02" },
  { id: "patient_kudakwashe_dube", external_id: "PAT-00051", name: "Kudakwashe Dube", date_of_birth: "1992-07-28" },
  { id: "patient_anesu_zhou", external_id: "PAT-00078", name: "Anesu Zhou", date_of_birth: "1978-01-19" },
  { id: "patient_nyasha_mlambo", external_id: "PAT-00102", name: "Nyasha Mlambo", date_of_birth: "2001-09-05" },
  { id: "patient_takudzwa_marufu", external_id: "PAT-00119", name: "Takudzwa Marufu", date_of_birth: "1998-06-11" },
  { id: "patient_panashe_sibanda", external_id: "PAT-00133", name: "Panashe Sibanda", date_of_birth: "1984-12-22" },
  { id: "patient_vimbai_gutu", external_id: "PAT-00147", name: "Vimbai Gutu", date_of_birth: "1972-04-18" },
  { id: "patient_chiedza_bvuma", external_id: "PAT-00158", name: "Chiedza Bvuma", date_of_birth: "1995-02-07" },
  { id: "patient_tendai_hove", external_id: "PAT-00164", name: "Tendai Hove", date_of_birth: "1989-10-15" },
  { id: "patient_rutendo_chari", external_id: "PAT-00179", name: "Rutendo Chari", date_of_birth: "2003-08-24" },
  { id: "patient_munashe_chingono", external_id: "PAT-00183", name: "Munashe Chingono", date_of_birth: "1976-05-30" },
  { id: "patient_simbarashe_muchengeti", external_id: "PAT-00197", name: "Simbarashe Muchengeti", date_of_birth: "1991-01-27" },
  { id: "patient_tariro_muchengeti", external_id: "PAT-00208", name: "Tariro Muchengeti", date_of_birth: "2014-02-20" },
  { id: "patient_ashley_muzanenhamo", external_id: "PAT-00216", name: "Ashley Muzanenhamo", date_of_birth: "2000-11-13" },
  { id: "patient_farai_katsande", external_id: "PAT-00229", name: "Farai Katsande", date_of_birth: "1982-09-09" },
  { id: "patient_munashe_chisango", external_id: "PAT-00241", name: "Munashe Chisango", date_of_birth: "1996-07-03" },
  { id: "patient_tadiwanashe_hlatshwayo", external_id: "PAT-00255", name: "Tadiwanashe Hlatshwayo", date_of_birth: "1985-03-25" },
  { id: "patient_ropafadzo_gweshe", external_id: "PAT-00268", name: "Ropafadzo Gweshe", date_of_birth: "1999-12-01" }
].map((patient) => ({
  ...patient,
  created_at: now,
  updated_at: now
}));

const seededProviders = [
  { id: "provider_tawanda_moyo", external_id: "PROV-001", name: "Dr. Tawanda Moyo", specialty: "General Dentistry" },
  { id: "provider_rutendo_ndlovu", external_id: "PRV-1001", name: "Dr. Rutendo Ndlovu", specialty: "General Dentistry" },
  { id: "provider_kudzai_chikafu", external_id: "PRV-1044", name: "Dr. Kudzai Chikafu", specialty: "Endodontics" },
  { id: "provider_nyasha_mlambo", external_id: "PRV-1092", name: "Dr. Nyasha Mlambo", specialty: "Orthodontics" },
  { id: "provider_simbarashe_dube", external_id: "PRV-1130", name: "Dr. Simbarashe Dube", specialty: "Oral Surgery" },
  { id: "provider_vimbai_zhou", external_id: "PRV-1187", name: "Dr. Vimbai Zhou", specialty: "Periodontics" },
  { id: "provider_panashe_chari", external_id: "PRV-1204", name: "Dr. Panashe Chari", specialty: "Paediatric Dentistry" },
  { id: "provider_tatenda_gono", external_id: "PRV-1221", name: "Dr. Tatenda Gono", specialty: "Prosthodontics" },
  { id: "provider_chiedza_ncube", external_id: "PRV-1236", name: "Dr. Chiedza Ncube", specialty: "General Dentistry" },
  { id: "provider_anotida_mupfumi", external_id: "PRV-1250", name: "Dr. Anotida Mupfumi", specialty: "Oral Medicine" },
  { id: "provider_tinashe_gwaze", external_id: "PRV-1264", name: "Dr. Tinashe Gwaze", specialty: "Endodontics" },
  { id: "provider_rumbidzai_chimhini", external_id: "PRV-1279", name: "Dr. Rumbidzai Chimhini", specialty: "Orthodontics" },
  { id: "provider_munyaradzi_hove", external_id: "PRV-1293", name: "Dr. Munyaradzi Hove", specialty: "Periodontics" },
  { id: "provider_tariro_chitongo", external_id: "PRV-1308", name: "Dr. Tariro Chitongo", specialty: "General Dentistry" },
  { id: "provider_kudzanai_machingura", external_id: "PRV-1322", name: "Dr. Kudzanai Machingura", specialty: "Prosthodontics" },
  { id: "provider_ropafadzo_soko", external_id: "PRV-1337", name: "Dr. Ropafadzo Soko", specialty: "Paediatric Dentistry" },
  { id: "provider_tafadzwa_mudzonga", external_id: "PRV-1351", name: "Dr. Tafadzwa Mudzonga", specialty: "Oral Surgery" },
  { id: "provider_takudzwa_chikowore", external_id: "PRV-1366", name: "Dr. Takudzwa Chikowore", specialty: "General Dentistry" },
  { id: "provider_lorraine_moyo", external_id: "PRV-1380", name: "Dr. Lorraine Moyo", specialty: "Oral Pathology" },
  { id: "provider_ashley_dzvairo", external_id: "PRV-1394", name: "Dr. Ashley Dzvairo", specialty: "General Dentistry" }
].map((provider) => ({
  ...provider,
  created_at: now,
  updated_at: now
}));

const seededProcedures = [
  ["proc_d0120", "D0120", "Periodic oral evaluation", "Diagnostic", 1, false, "BOTH"],
  ["proc_d0140", "D0140", "Limited oral evaluation - problem focused", "Diagnostic", 1, false, "BOTH"],
  ["proc_d0210", "D0210", "Intraoral - complete series of radiographic images", "Diagnostic", 1, false, "BOTH"],
  ["proc_d0220", "D0220", "Intraoral - periapical first radiographic image", "Diagnostic", 1, false, "BOTH"],
  ["proc_d0230", "D0230", "Intraoral - periapical each additional radiographic image", "Diagnostic", 1, false, "BOTH"],
  ["proc_d0274", "D0274", "Bitewings - four radiographic images", "Diagnostic", 1, false, "BOTH"],
  ["proc_d1110", "D1110", "Prophylaxis - adult", "Preventive", 1, false, "PERMANENT"],
  ["proc_d1120", "D1120", "Prophylaxis - child", "Preventive", 1, false, "PRIMARY"],
  ["proc_d1206", "D1206", "Topical fluoride varnish", "Preventive", 1, false, "BOTH"],
  ["proc_d1351", "D1351", "Sealant - per tooth", "Preventive", 1, false, "BOTH"],
  ["proc_d2140", "D2140", "Amalgam - one surface, primary or permanent", "Restorative", 2, true, "BOTH"],
  ["proc_d2150", "D2150", "Amalgam - two surfaces, primary or permanent", "Restorative", 2, true, "BOTH"],
  ["proc_d2330", "D2330", "Resin-based composite - one surface, anterior", "Restorative", 2, true, "BOTH"],
  ["proc_d2391", "D2391", "Resin-based composite - one surface, posterior", "Restorative", 2, true, "BOTH"],
  ["proc_d2740", "D2740", "Crown - porcelain/ceramic", "Restorative", 4, true, "PERMANENT"],
  ["proc_d2750", "D2750", "Crown - porcelain fused to high noble metal", "Restorative", 4, true, "PERMANENT"],
  ["proc_d2950", "D2950", "Core buildup, including any pins", "Restorative", 3, true, "PERMANENT"],
  ["proc_d3310", "D3310", "Endodontic therapy, anterior tooth", "Endodontics", 4, true, "PERMANENT"],
  ["proc_d3320", "D3320", "Endodontic therapy, bicuspid tooth", "Endodontics", 4, true, "PERMANENT"],
  ["proc_d3330", "D3330", "Endodontic therapy, molar tooth", "Endodontics", 4, true, "PERMANENT"],
  ["proc_d4341", "D4341", "Periodontal scaling and root planing - four or more teeth", "Periodontics", 3, true, "PERMANENT"],
  ["proc_d4342", "D4342", "Periodontal scaling and root planing - one to three teeth", "Periodontics", 3, true, "PERMANENT"],
  ["proc_d4910", "D4910", "Periodontal maintenance", "Periodontics", 2, true, "PERMANENT"],
  ["proc_d5110", "D5110", "Complete denture - maxillary", "Prosthodontics", 4, true, "PERMANENT"],
  ["proc_d7140", "D7140", "Extraction, erupted tooth or exposed root", "Oral Surgery", 3, true, "BOTH"],
  ["proc_d7210", "D7210", "Extraction of erupted tooth requiring removal of bone", "Oral Surgery", 4, true, "BOTH"],
  ["proc_d7220", "D7220", "Removal of impacted tooth - soft tissue", "Oral Surgery", 4, true, "PERMANENT"],
  ["proc_d9230", "D9230", "Inhalation of nitrous oxide/analgesia, anxiolysis", "Adjunctive", 1, false, "BOTH"]
].map(([id, procedure_code, description, category, complexity_level, requires_evidence, allowed_dentition]) => ({
  id,
  procedure_code,
  description,
  category,
  complexity_level,
  requires_evidence,
  allowed_dentition,
  created_at: now
}));

const createLineSignature = (lines: SeedClaimLine[]) =>
  JSON.stringify(
    [...lines]
      .map((line) => ({
        procedureCode: line.procedureCode,
        toothNumber: line.toothNumber ?? null
      }))
      .sort((left, right) =>
        `${left.procedureCode}${left.toothNumber}`.localeCompare(
          `${right.procedureCode}${right.toothNumber}`
        )
      )
  );

const seededClaims: SeedClaim[] = [
  {
    id: "claim_seed_1",
    externalClaimId: "CLM-2026-0001",
    patientId: "patient_rumbidzai_ncube",
    patientExternalId: "PAT-00012",
    providerId: "provider_rutendo_ndlovu",
    providerExternalId: "PRV-1001",
    dateOfService: "2026-01-10",
    submissionDate: "2026-01-12",
    lines: [{ id: "cline_seed_1", procedureCode: "D0120", claimedAmount: 35, toothNumber: 11 }]
  },
  {
    id: "claim_seed_2",
    externalClaimId: "CLM-2026-0002",
    patientId: "patient_tatenda_chikowore",
    patientExternalId: "PAT-00034",
    providerId: "provider_kudzai_chikafu",
    providerExternalId: "PRV-1044",
    dateOfService: "2026-01-14",
    submissionDate: "2026-01-15",
    lines: [{ id: "cline_seed_2", procedureCode: "D0210", claimedAmount: 55, toothNumber: 24 }]
  },
  {
    id: "claim_seed_3",
    externalClaimId: "CLM-2026-0003",
    patientId: "patient_kudakwashe_dube",
    patientExternalId: "PAT-00051",
    providerId: "provider_nyasha_mlambo",
    providerExternalId: "PRV-1092",
    dateOfService: "2026-01-20",
    submissionDate: "2026-01-22",
    lines: [{ id: "cline_seed_3", procedureCode: "D1110", claimedAmount: 80, toothNumber: 31 }]
  },
  {
    id: "claim_seed_4",
    externalClaimId: "CLM-2026-0004",
    patientId: "patient_anesu_zhou",
    patientExternalId: "PAT-00078",
    providerId: "provider_simbarashe_dube",
    providerExternalId: "PRV-1130",
    dateOfService: "2026-01-25",
    submissionDate: "2026-01-27",
    lines: [{ id: "cline_seed_4", procedureCode: "D7140", claimedAmount: 180, toothNumber: 18 }]
  },
  {
    id: "claim_seed_5",
    externalClaimId: "CLM-2026-0005",
    patientId: "patient_nyasha_mlambo",
    patientExternalId: "PAT-00102",
    providerId: "provider_vimbai_zhou",
    providerExternalId: "PRV-1187",
    dateOfService: "2026-02-02",
    submissionDate: "2026-02-04",
    lines: [{ id: "cline_seed_5", procedureCode: "D4341", claimedAmount: 260, toothNumber: 36 }]
  },
  {
    id: "claim_seed_6",
    externalClaimId: "CLM-2026-0006",
    patientId: "patient_takudzwa_marufu",
    patientExternalId: "PAT-00119",
    providerId: "provider_panashe_chari",
    providerExternalId: "PRV-1204",
    dateOfService: "2026-02-08",
    submissionDate: "2026-02-10",
    lines: [{ id: "cline_seed_6", procedureCode: "D1120", claimedAmount: 65, toothNumber: 64 }]
  },
  {
    id: "claim_seed_7",
    externalClaimId: "CLM-2026-0007",
    patientId: "patient_panashe_sibanda",
    patientExternalId: "PAT-00133",
    providerId: "provider_tatenda_gono",
    providerExternalId: "PRV-1221",
    dateOfService: "2026-02-13",
    submissionDate: "2026-02-14",
    lines: [{ id: "cline_seed_7", procedureCode: "D2740", claimedAmount: 450, toothNumber: 21 }]
  },
  {
    id: "claim_seed_8",
    externalClaimId: "CLM-2026-0008",
    patientId: "patient_vimbai_gutu",
    patientExternalId: "PAT-00147",
    providerId: "provider_chiedza_ncube",
    providerExternalId: "PRV-1236",
    dateOfService: "2026-02-18",
    submissionDate: "2026-02-19",
    lines: [{ id: "cline_seed_8", procedureCode: "D2140", claimedAmount: 120, toothNumber: 46 }]
  },
  {
    id: "claim_seed_9",
    externalClaimId: "CLM-2026-0009",
    patientId: "patient_chiedza_bvuma",
    patientExternalId: "PAT-00158",
    providerId: "provider_anotida_mupfumi",
    providerExternalId: "PRV-1250",
    dateOfService: "2026-02-22",
    submissionDate: "2026-02-24",
    lines: [{ id: "cline_seed_9", procedureCode: "D9230", claimedAmount: 45, toothNumber: 27 }]
  },
  {
    id: "claim_seed_10",
    externalClaimId: "CLM-2026-0010",
    patientId: "patient_tendai_hove",
    patientExternalId: "PAT-00164",
    providerId: "provider_tinashe_gwaze",
    providerExternalId: "PRV-1264",
    dateOfService: "2026-03-02",
    submissionDate: "2026-03-03",
    lines: [{ id: "cline_seed_10", procedureCode: "D3310", claimedAmount: 390, toothNumber: 11 }]
  },
  {
    id: "claim_seed_11",
    externalClaimId: "CLM-2026-0011",
    patientId: "patient_rumbidzai_ncube",
    patientExternalId: "PAT-00012",
    providerId: "provider_rutendo_ndlovu",
    providerExternalId: "PRV-1001",
    dateOfService: "2026-01-10",
    submissionDate: "2026-03-06",
    duplicateOfClaimId: "claim_seed_1",
    warnings: ["Potential exact duplicate claim detected"],
    lines: [{ id: "cline_seed_11", procedureCode: "D0120", claimedAmount: 35, toothNumber: 11 }]
  },
  {
    id: "claim_seed_12",
    externalClaimId: "CLM-2026-0012",
    patientId: "patient_munashe_chingono",
    patientExternalId: "PAT-00183",
    providerId: "provider_munyaradzi_hove",
    providerExternalId: "PRV-1293",
    dateOfService: "2026-03-09",
    submissionDate: "2026-03-11",
    lines: [{ id: "cline_seed_12", procedureCode: "D4910", claimedAmount: 140, toothNumber: 33 }]
  },
  {
    id: "claim_seed_13",
    externalClaimId: "CLM-2026-0013",
    patientId: "patient_simbarashe_muchengeti",
    patientExternalId: "PAT-00197",
    providerId: "provider_tariro_chitongo",
    providerExternalId: "PRV-1308",
    dateOfService: "2026-03-13",
    submissionDate: "2026-03-15",
    lines: [
      { id: "cline_seed_13", procedureCode: "D0120", claimedAmount: 35, toothNumber: 16 },
      { id: "cline_seed_14", procedureCode: "D0274", claimedAmount: 60, toothNumber: 16 }
    ]
  },
  {
    id: "claim_seed_14",
    externalClaimId: "CLM-2026-0014",
    patientId: "patient_tariro_muchengeti",
    patientExternalId: "PAT-00208",
    providerId: "provider_kudzanai_machingura",
    providerExternalId: "PRV-1322",
    dateOfService: "2026-03-20",
    submissionDate: "2026-03-21",
    lines: [{ id: "cline_seed_15", procedureCode: "D5110", claimedAmount: 820, toothNumber: 21 }]
  },
  {
    id: "claim_seed_15",
    externalClaimId: "CLM-2026-0015",
    patientId: "patient_ashley_muzanenhamo",
    patientExternalId: "PAT-00216",
    providerId: "provider_ropafadzo_soko",
    providerExternalId: "PRV-1337",
    dateOfService: "2026-03-25",
    submissionDate: "2026-03-26",
    lines: [{ id: "cline_seed_16", procedureCode: "D1351", claimedAmount: 40, toothNumber: 36 }]
  },
  {
    id: "claim_seed_16",
    externalClaimId: "CLM-2026-0016",
    patientId: "patient_farai_katsande",
    patientExternalId: "PAT-00229",
    providerId: "provider_tafadzwa_mudzonga",
    providerExternalId: "PRV-1351",
    dateOfService: "2026-03-28",
    submissionDate: "2026-03-30",
    lines: [{ id: "cline_seed_17", procedureCode: "D7210", claimedAmount: 280, toothNumber: 28 }]
  },
  {
    id: "claim_seed_17",
    externalClaimId: "CLM-2026-0017",
    patientId: "patient_munashe_chisango",
    patientExternalId: "PAT-00241",
    providerId: "provider_takudzwa_chikowore",
    providerExternalId: "PRV-1366",
    dateOfService: "2026-04-03",
    submissionDate: "2026-04-05",
    lines: [{ id: "cline_seed_18", procedureCode: "D2391", claimedAmount: 135, toothNumber: 47 }]
  },
  {
    id: "claim_seed_18",
    externalClaimId: "CLM-2026-0018",
    patientId: "patient_vimbai_gutu",
    patientExternalId: "PAT-00147",
    providerId: "provider_lorraine_moyo",
    providerExternalId: "PRV-1380",
    dateOfService: "2026-04-08",
    submissionDate: "2026-04-10",
    duplicateOfClaimId: "claim_seed_8",
    warnings: ["Potential near-duplicate claim detected"],
    lines: [{ id: "cline_seed_19", procedureCode: "D2140", claimedAmount: 120, toothNumber: 46 }]
  },
  {
    id: "claim_seed_19",
    externalClaimId: "CLM-2026-0019",
    patientId: "patient_ropafadzo_gweshe",
    patientExternalId: "PAT-00268",
    providerId: "provider_ashley_dzvairo",
    providerExternalId: "PRV-1394",
    dateOfService: "2026-04-11",
    submissionDate: "2026-04-12",
    lines: [{ id: "cline_seed_20", procedureCode: "D2150", claimedAmount: 165, toothNumber: 16 }]
  },
  {
    id: "claim_seed_20",
    externalClaimId: "CLM-2026-0020",
    patientId: "patient_tafadzwa_moyo",
    patientExternalId: "PAT-001",
    providerId: "provider_vimbai_zhou",
    providerExternalId: "PRV-1187",
    dateOfService: "2026-04-15",
    submissionDate: "2026-04-16",
    lines: [
      { id: "cline_seed_21", procedureCode: "D0120", claimedAmount: 35, toothNumber: 26 },
      { id: "cline_seed_22", procedureCode: "D0220", claimedAmount: 20, toothNumber: 26 },
      { id: "cline_seed_23", procedureCode: "D2140", claimedAmount: 125, toothNumber: 26 }
    ]
  },
  {
    id: "claim_seed_21",
    externalClaimId: "CLM-2026-0021",
    patientId: "patient_vimbai_gutu",
    patientExternalId: "PAT-00147",
    providerId: "provider_lorraine_moyo",
    providerExternalId: "PRV-1380",
    dateOfService: "2026-04-21",
    submissionDate: "2026-04-22",
    duplicateOfClaimId: "claim_seed_8",
    warnings: ["Potential near-duplicate claim detected"],
    lines: [
      {
        id: "cline_seed_24",
        procedureCode: "D2140",
        claimedAmount: 120,
        toothNumber: 46,
        documentedProcedureCode: "D2140"
      }
    ]
  },
  {
    id: "claim_seed_22",
    externalClaimId: "CLM-2026-0022",
    patientId: "patient_chiedza_bvuma",
    patientExternalId: "PAT-00158",
    providerId: "provider_anotida_mupfumi",
    providerExternalId: "PRV-1250",
    dateOfService: "2026-04-24",
    submissionDate: "2026-04-25",
    lines: [{ id: "cline_seed_25", procedureCode: "D2740", claimedAmount: 450, toothNumber: 24 }]
  },
  {
    id: "claim_seed_23",
    externalClaimId: "CLM-2026-0023",
    patientId: "patient_panashe_sibanda",
    patientExternalId: "PAT-00133",
    providerId: "provider_tatenda_gono",
    providerExternalId: "PRV-1221",
    dateOfService: "2026-04-27",
    submissionDate: "2026-04-28",
    lines: [
      {
        id: "cline_seed_26",
        procedureCode: "D2740",
        documentedProcedureCode: "D2140",
        claimedAmount: 450,
        toothNumber: 22
      }
    ]
  },
  {
    id: "claim_seed_24",
    externalClaimId: "CLM-2026-0024",
    patientId: "patient_tafadzwa_moyo",
    patientExternalId: "PAT-001",
    providerId: "provider_anotida_mupfumi",
    providerExternalId: "PRV-1250",
    dateOfService: "2026-04-29",
    submissionDate: "2026-04-30",
    lines: [
      {
        id: "cline_seed_27",
        procedureCode: "D2140",
        claimedAmount: 150,
        toothNumber: 46,
        chartNotes: "Restorative treatment documented"
      }
    ]
  },
  {
    id: "claim_seed_25",
    externalClaimId: "CLM-2026-0025",
    patientId: "patient_tafadzwa_moyo",
    patientExternalId: "PAT-001",
    providerId: "provider_chiedza_ncube",
    providerExternalId: "PRV-1236",
    dateOfService: "2026-04-18",
    submissionDate: "2026-04-19",
    lines: [
      {
        id: "cline_seed_28",
        procedureCode: "D2140",
        documentedProcedureCode: "D2140",
        claimedAmount: 125,
        toothNumber: 26
      }
    ]
  }
];

export async function seed(knex: Knex): Promise<void> {
  await knex("audit_logs").del();
  await knex("alerts").del();
  await knex("risk_scores").del();
  await knex("rule_results").del();
  await knex("clinical_rules").del();
  await knex("config_versions").del();
  await knex("tooth_history").del();
  await knex("claim_lines").del();
  await knex("claims").del();
  await knex("procedure_catalog").del();
  await knex("providers").del();
  await knex("patients").del();
  await knex("users").del();

  await knex("users").insert([
    {
      id: "user_admin",
      email: "admin@fdcdf.local",
      password_hash: bcrypt.hashSync("Password123!", 10),
      role: "ADMIN",
      created_at: now,
      updated_at: now
    },
    {
      id: "user_analyst",
      email: "analyst@fdcdf.local",
      password_hash: bcrypt.hashSync("Password123!", 10),
      role: "ANALYST",
      created_at: now,
      updated_at: now
    },
    {
      id: "user_investigator",
      email: "investigator@fdcdf.local",
      password_hash: bcrypt.hashSync("Password123!", 10),
      role: "INVESTIGATOR",
      created_at: now,
      updated_at: now
    }
  ]);

  await knex("config_versions").insert({
    id: "cfg_v1",
    version_name: "MVP Default Rules",
    snapshot_json: JSON.stringify({
      scoreBands: {
        medium: 25,
        high: 55,
        critical: 80
      }
    }),
    is_active: true,
    created_at: now
  });

  await knex("procedure_catalog").insert(seededProcedures);

  await knex("clinical_rules").insert([
    {
      id: "rule_exact_duplicate",
      rule_code: "EXACT_DUPLICATE",
      name: "Exact Duplicate Claim",
      severity: "CRITICAL",
      enabled: true,
      parameters_json: JSON.stringify({}),
      description: "Detect exact duplicate claims",
      version: "1.0.0",
      created_at: now
    },
    {
      id: "rule_near_duplicate",
      rule_code: "NEAR_DUPLICATE",
      name: "Near Duplicate Claim",
      severity: "LOW",
      enabled: true,
      parameters_json: JSON.stringify({}),
      description: "Deterministic near duplicate heuristic",
      version: "1.0.0",
      created_at: now
    },
    {
      id: "rule_unsupported_claim",
      rule_code: "UNSUPPORTED_CLAIM",
      name: "Unsupported Claim",
      severity: "MEDIUM",
      enabled: true,
      parameters_json: JSON.stringify({}),
      description: "Missing supporting evidence",
      version: "1.0.0",
      created_at: now
    },
    {
      id: "rule_upcoding",
      rule_code: "UPCODING",
      name: "Upcoding Suspicion",
      severity: "HIGH",
      enabled: true,
      parameters_json: JSON.stringify({}),
      description: "Claimed procedure exceeds documented complexity",
      version: "1.0.0",
      created_at: now
    },
    {
      id: "rule_impossible_procedure",
      rule_code: "IMPOSSIBLE_PROCEDURE",
      name: "Impossible Procedure",
      severity: "CRITICAL",
      enabled: true,
      parameters_json: JSON.stringify({}),
      description: "Claim conflicts with tooth history",
      version: "1.0.0",
      created_at: now
    },
    {
      id: "rule_suspicious_repeat",
      rule_code: "SUSPICIOUS_REPEAT",
      name: "Suspicious Repeat",
      severity: "HIGH",
      enabled: true,
      parameters_json: JSON.stringify({ repeatIntervalDays: 180 }),
      description: "Repeat procedure within forbidden interval",
      version: "1.0.0",
      created_at: now
    }
  ]);

  await knex("patients").insert(seededPatients);

  await knex("providers").insert(seededProviders);

  await knex("tooth_history").insert([
    {
      id: "hist_1",
      patient_id: "patient_tafadzwa_moyo",
      tooth_number: 46,
      event_type: "EXTRACTED",
      event_date: "2025-01-10T00:00:00.000Z",
      notes: "Prior extraction",
      created_at: now
    },
    {
      id: "hist_2",
      patient_id: "patient_tafadzwa_moyo",
      tooth_number: 26,
      event_type: "D2140",
      event_date: "2026-03-01T00:00:00.000Z",
      notes: "Recent filling",
      created_at: now
    }
  ]);

  await knex("claims").insert(
    seededClaims.map((claim) => ({
      id: claim.id,
      external_claim_id: claim.externalClaimId,
      patient_id: claim.patientId,
      provider_id: claim.providerId,
      patient_external_id: claim.patientExternalId,
      provider_external_id: claim.providerExternalId,
      date_of_service: claim.dateOfService,
      submission_date: claim.submissionDate,
      status: claim.duplicateOfClaimId ? "ACCEPTED_WITH_WARNINGS" : "ACCEPTED",
      warnings_json: JSON.stringify(claim.warnings ?? []),
      duplicate_of_claim_id: claim.duplicateOfClaimId ?? null,
      line_signature: createLineSignature(claim.lines),
      created_at: now,
      updated_at: now,
      deleted_at: null
    }))
  );

  await knex("claim_lines").insert(
    seededClaims.flatMap((claim) =>
      claim.lines.map((line) => ({
        id: line.id,
        claim_id: claim.id,
        procedure_code: line.procedureCode,
        claimed_amount: line.claimedAmount,
        tooth_number: line.toothNumber ?? null,
        documented_procedure_code: line.documentedProcedureCode ?? null,
        evidence_summary: line.evidenceSummary ?? null,
        chart_notes: line.chartNotes ?? null,
        radiograph_reference: line.radiographReference ?? null,
        treatment_plan_reference: line.treatmentPlanReference ?? null,
        created_at: now,
        updated_at: now
      }))
    )
  );
}
