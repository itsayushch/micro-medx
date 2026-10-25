import {
  AuditLedgerRecord,
  AvailabilityQueueItem,
  ClinicalPersona,
  InventoryItem,
  LabReportDetail,
  NurseMARItem,
  NurseVitalLabItem,
  PatientDirectoryItem,
  PatientHistoryDetail,
  PharmacologyReferenceItem,
  SixAgentResult,
  SubstitutionRequestItem,
} from "./types";

export const CLINICAL_PERSONAS: Record<string, ClinicalPersona> = {
  Doctor: {
    phone: "+1 (555) 019-2831",
    name: "Dr. Sarah Lin, MD",
    roleTitle: "Doctor",
    dept: "Cardiology & Intensive Care • Doctor Workspace",
    avatar: "👨‍⚕️",
    greeting: "Good morning, Dr. Sarah",
  },
  Nurse: {
    phone: "+1 (555) 019-2832",
    name: "Elena Rostova, RN",
    roleTitle: "Nurse",
    dept: "Cardiothoracic Unit • Nurse Workspace",
    avatar: "👩‍⚕️",
    greeting: "Good morning, Nurse Elena",
  },
  "Clinical Pharmacist": {
    phone: "+1 (555) 019-2833",
    name: "Marcus Vance, PharmD, BCPS",
    roleTitle: "Clinical Pharmacist",
    dept: "Medication Fulfillment & Substitution Workspace",
    avatar: "💊",
    greeting: "Good morning, Dr. Marcus",
  },
  Administrator: {
    phone: "+1 (555) 019-2834",
    name: "Arthur Pendelton, MS, CPHIMS",
    roleTitle: "Administrator",
    dept: "Health Informatics & Clinical Governance",
    avatar: "🛡️",
    greeting: "Good morning, Administrator Arthur",
  },
};

// =========================================================================
// SYNTHETIC PATIENT GENERATOR (265 PATIENTS)
// =========================================================================
export function generateSyntheticPatients(totalCount = 265): PatientDirectoryItem[] {
  const firstNames = ["Sarah", "Robert", "Elena", "Arthur", "David", "Emily", "Michael", "Karen", "James", "Jennifer", "William", "Elizabeth", "Thomas", "Jessica", "Charles", "Ashley"];
  const lastNames = ["Jenkins", "Chen", "Rostova", "Pendelton", "Sterling", "Zhang", "Mercer", "Davis", "Vance", "Taylor", "Smith", "Johnson", "Williams", "Miller", "Garcia", "Martinez"];
  const depts = ["Cardiology", "Nephrology", "Internal Med", "ICU", "Oncology", "Surgery"];
  const conditions = [
    "Non-valvular Atrial Fibrillation", "Stage 3B Chronic Kidney Disease", "Essential Hypertension Stage II",
    "Congestive Heart Failure", "Acute Coronary Syndrome", "Deep Vein Thrombosis", "Type 2 Diabetes Mellitus"
  ];
  const regimens = [
    "Warfarin 2.5mg PO Daily", "Enoxaparin 80mg SC Daily", "Lisinopril 20mg PO Daily",
    "Digoxin 0.125mg PO Daily", "Amlodipine 5mg PO Daily", "Atorvastatin 20mg PO Daily"
  ];
  const risks: Array<"Critical" | "High" | "Moderate" | "Low"> = ["Critical", "High", "Moderate", "Low"];
  const clinicians = ["Dr. Sarah Lin, MD", "Dr. David Sterling, MD", "Dr. Alan Mercer, MD", "Dr. Emily Zhang, MD"];

  const list: PatientDirectoryItem[] = [
    { id: "CASE-001", name: "Sarah Jenkins", age: 64, sex: "F", dept: "Cardiology", condition: "Atrial Fibrillation w/ Rising INR", regimen: "Warfarin 2.5mg PO Daily", risk: "Critical", clinician: "Dr. Sarah Lin, MD" },
    { id: "CASE-002", name: "Robert Chen", age: 72, sex: "M", dept: "Nephrology", condition: "DVT w/ Renal Decline (Cr 2.4)", regimen: "Enoxaparin 80mg SC Daily", risk: "Critical", clinician: "Dr. Sarah Lin, MD" },
    { id: "CASE-003", name: "Elena Rostova", age: 58, sex: "F", dept: "Internal Med", condition: "Essential Hypertension Stage II", regimen: "Lisinopril 20mg PO Daily", risk: "High", clinician: "Dr. Sarah Lin, MD" },
    { id: "CASE-004", name: "Arthur Pendelton", age: 79, sex: "M", dept: "Cardiology", condition: "Congestive Heart Failure & AF", regimen: "Digoxin 0.125mg PO Daily", risk: "Critical", clinician: "Dr. Sarah Lin, MD" },
  ];

  for (let i = 5; i <= totalCount; i++) {
    const id = "PT-" + String(i).padStart(3, "0");
    list.push({
      id,
      name: `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`,
      age: 30 + ((i * 7) % 55),
      sex: i % 2 === 0 ? "M" : "F",
      dept: depts[i % depts.length],
      condition: conditions[i % conditions.length],
      regimen: regimens[i % regimens.length],
      risk: risks[i % risks.length],
      clinician: clinicians[i % clinicians.length],
    });
  }
  return list;
}

export function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return hex + "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855".slice(hex.length);
}

// =========================================================================
// SYNTHETIC AUDIT LEDGER DATASET
// =========================================================================
export function generateSyntheticAuditLedger(): AuditLedgerRecord[] {
  const records: AuditLedgerRecord[] = [];
  const templates = [
    { time: "2026-10-08 09:35:10", actor: "Marcus Vance, PharmD", role: "Pharmacist", cat: "VERIFICATION" as const, entity: "Sarah Jenkins (CASE-001)", action: "Prescription Verified & Marked Ready for Dispensing: Warfarin 2.5mg", result: "READY TO DISPENSE ✓" },
    { time: "2026-10-08 09:20:00", actor: "Dr. Sarah Lin, MD", role: "Doctor", cat: "CLINICAL" as const, entity: "Sarah Jenkins (CASE-001)", action: "Prescription Authorized: Warfarin 2.5 mg PO Daily", result: "PRESCRIBED ✓" },
    { time: "2026-10-08 11:25:00", actor: "Dr. Sarah Lin, MD", role: "Doctor", cat: "SUBSTITUTION" as const, entity: "Robert Chen (CASE-002)", action: "Doctor Approved Brand Substitution: Lovenox -> Clexane 80 mg", result: "SUBSTITUTION APPROVED ✓" },
    { time: "2026-10-08 11:20:00", actor: "Marcus Vance, PharmD", role: "Pharmacist", cat: "SUBSTITUTION" as const, entity: "Robert Chen (CASE-002)", action: "Pharmacy Substitution Requested: Clexane 80 mg (Lovenox Unavailable)", result: "DOCTOR APPROVAL PENDING ⏳" },
    { time: "2026-10-08 11:15:00", actor: "Marcus Vance, PharmD", role: "Pharmacist", cat: "VERIFICATION" as const, entity: "Robert Chen (CASE-002)", action: "Prescription Checked: Lovenox 80 mg UNAVAILABLE in Stock", result: "MEDICATION UNAVAILABLE ⚠️" },
    { time: "2026-10-08 14:05:00", actor: "Marcus Vance, PharmD", role: "Pharmacist", cat: "VERIFICATION" as const, entity: "Elena Rostova (CASE-003)", action: "Prescription Verified: Lisinopril (Prinivil) 20 mg PO Daily", result: "READY TO DISPENSE ✓" },
    { time: "2026-10-08 09:40:00", actor: "Dr. Sarah Lin, MD", role: "Doctor", cat: "SAFETY" as const, entity: "Elena Rostova (CASE-003)", action: "Duplicate ACE-I Safety Warning: Deprescribed Enalapril 10 mg", result: "HOLD ENFORCED ⚠️" },
    { time: "2026-10-08 16:05:00", actor: "Marcus Vance, PharmD", role: "Pharmacist", cat: "VERIFICATION" as const, entity: "Arthur Pendelton (CASE-004)", action: "Prescription Verified: Digoxin (Lanoxin) 0.125 mg PO Daily", result: "READY TO DISPENSE ✓" },
    { time: "2026-10-08 08:30:00", actor: "Elena Rostova, RN", role: "Nurse", cat: "CLINICAL" as const, entity: "Sarah Jenkins (CASE-001)", action: "Inpatient Lab Released: INR 3.4 High", result: "INGESTED ✓" },
    { time: "2026-10-08 08:00:00", actor: "Arthur Pendelton", role: "Administrator", cat: "AUDIT" as const, entity: "Audit Ledger", action: "Executed Live SHA-256 Cryptographic Hash Chain Verification", result: "VALID & INTACT ✓" },
  ];

  let prevHash = "GENESIS_BLOCK_00000000000000000000000000000000";
  for (let i = 0; i < templates.length; i++) {
    const item = templates[i];
    const curHash = generateHash(`${i}:${item.time}:${item.actor}:${item.action}:${prevHash}`);
    records.push({
      id: i + 1,
      timestamp: item.time + " UTC",
      actor: item.actor,
      role: item.role,
      category: item.cat,
      entity: item.entity,
      action: item.action,
      result: item.result,
      prev_hash: prevHash,
      current_hash: curHash,
      payload: {
        block_id: i + 1,
        timestamp: item.time + " UTC",
        actor: item.actor,
        role: item.role,
        action: item.action,
        entity: item.entity,
        cryptographic_verification: "SHA256_HASH_VALID_INTACT",
      },
    });
    prevHash = curHash;
  }
  return records;
}

// =========================================================================
// DETERMINISTIC PATIENT MEDICAL HISTORIES
// =========================================================================
export const DETERMINISTIC_PATIENT_HISTORIES: Record<string, PatientHistoryDetail> = {
  "CASE-001": {
    case_id: "CASE-001",
    patient_identifier: "DEMO-PT-001",
    name: "Sarah Jenkins",
    mrn: "MRN-2026-9041",
    age: 64,
    sex: "Female",
    blood_group: "A+",
    allergies_summary: "Penicillins (Anaphylaxis)",
    conditions_summary: "Non-valvular Atrial Fibrillation, Hypertension, Hyperlipidemia",
    last_updated: "2026-10-08 09:30 UTC",
    timeline: [
      { date: "2026-10-08 08:30 UTC", event: "Baseline laboratory panel drawn (INR: 3.4, PT: 34.2s)", actor: "Elena Rostova, RN", badge: "LAB" },
      { date: "2026-10-08 09:15 UTC", event: "Medication safety assessment completed: CYP2C9 inhibition flagged for Warfarin + Fluconazole", actor: "Dr. Sarah Lin, MD", badge: "CLINICAL" },
      { date: "2026-10-08 09:20 UTC", event: "Prescription issued: Warfarin 2.5 mg PO Daily (50% dose reduction)", actor: "Dr. Sarah Lin, MD", badge: "PRESCRIPTION" },
      { date: "2026-10-08 09:30 UTC", event: "Pharmacist verified medication availability: Coumadin / Warfarin 2.5 mg available in Bin A-04", actor: "Marcus Vance, PharmD", badge: "PHARMACY" },
      { date: "2026-10-08 09:35 UTC", event: "Medication verified & marked ready for dispensing", actor: "Marcus Vance, PharmD", badge: "DISPENSING" },
    ],
    medical_conditions: [
      { condition: "Non-valvular Atrial Fibrillation", diagnosis_date: "2021-06-12", status: "Active", notes: "CHA2DS2-VASc score 3. Maintained on therapeutic anticoagulation." },
      { condition: "Essential Hypertension", diagnosis_date: "2018-11-04", status: "Active", notes: "BP well-controlled on beta-blocker therapy." },
      { condition: "Hyperlipidemia", diagnosis_date: "2019-02-20", status: "Active", notes: "Primary prevention with HMG-CoA reductase inhibitor." },
    ],
    medication_history: [
      { medication: "Warfarin Sodium (Coumadin)", strength: "2.5 mg", route: "Oral", start_date: "2026-10-07", end_date: "Ongoing", status: "Active (Adjusted)", prescribing_doctor: "Dr. Sarah Lin, MD" },
      { medication: "Metoprolol Tartrate", strength: "25 mg", route: "Oral", start_date: "2021-06-15", end_date: "Ongoing", status: "Active", prescribing_doctor: "Dr. Sarah Lin, MD" },
      { medication: "Atorvastatin Calcium", strength: "20 mg", route: "Oral", start_date: "2019-02-22", end_date: "Ongoing", status: "Active", prescribing_doctor: "Dr. David Sterling, MD" },
      { medication: "Fluconazole (Diflucan)", strength: "100 mg", route: "Oral", start_date: "2026-10-07", end_date: "2026-10-21", status: "Active (14-day course)", prescribing_doctor: "Dr. Sarah Lin, MD" },
    ],
    allergies: [
      { allergen: "Penicillin V / Amoxicillin", reaction: "Anaphylaxis & Facial Angioedema", severity: "Severe (Critical)", recorded_date: "2024-03-15" },
    ],
    laboratory_history: [
      { date: "2026-10-08 08:30 UTC", test: "Prothrombin Time (INR)", result: "3.4", unit: "Ratio", reference_range: "0.8 - 1.2", status: "High (Critical)", source_report_id: "LAB-2026-0001", source_doc: "data/lab_reports/LAB-2026-0001.json" },
      { date: "2026-10-08 08:30 UTC", test: "Prothrombin Time (PT)", result: "34.2", unit: "seconds", reference_range: "11.0 - 13.5", status: "High", source_report_id: "LAB-2026-0001", source_doc: "data/lab_reports/LAB-2026-0001.json" },
      { date: "2026-10-08 08:30 UTC", test: "Serum Creatinine", result: "0.9", unit: "mg/dL", reference_range: "0.6 - 1.2", status: "Normal", source_report_id: "LAB-2026-0001", source_doc: "data/lab_reports/LAB-2026-0001.json" },
      { date: "2026-10-08 08:30 UTC", test: "ALT (SGPT)", result: "28", unit: "U/L", reference_range: "7 - 56", status: "Normal", source_report_id: "LAB-2026-0001", source_doc: "data/lab_reports/LAB-2026-0001.json" },
    ],
    clinical_assessments: [
      { date: "2026-10-08 09:15 UTC", assessment: "Warfarin + Fluconazole CYP2C9 Metabolic Inhibition", risk_level: "Critical Risk", recommendation: "Warfarin maintenance dose reduction to 2.5 mg PO Daily OR convert to Micafungin 100 mg IV Daily", doctor: "Dr. Sarah Lin, MD (Cardiology)" },
    ],
    pharmacy_events: [
      { date: "2026-10-08 09:30 UTC", medication: "Warfarin (Coumadin) 2.5 mg", availability: "Available (420 Tabs, Bin A-04)", substitution_request: "None Required", doctor_verification: "Verified", dispensing_status: "Ready for Dispensing" },
    ],
    audit_events: [
      { timestamp: "2026-10-08 09:35:10 UTC", user_role: "Marcus Vance, PharmD (Pharmacist)", action: "Prescription Verified & Marked Ready for Dispensing", event_type: "PHARMACIST_PRESCRIPTION_VERIFIED", audit_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
      { timestamp: "2026-10-08 09:20:00 UTC", user_role: "Dr. Sarah Lin, MD (Doctor)", action: "Prescription Authorized for Warfarin 2.5 mg PO Daily", event_type: "MEDICATION_PRESCRIBED", audit_hash: "4a7d1ed414474e4033ac29ccb8653d9b002c7709b1f28b4c0bc89452b467e2a9" },
    ],
  },
  "CASE-002": {
    case_id: "CASE-002",
    patient_identifier: "DEMO-PT-002",
    name: "Robert Chen",
    mrn: "MRN-2026-8812",
    age: 72,
    sex: "Male",
    blood_group: "B+",
    allergies_summary: "Sulfa drugs (Sulfamethoxazole - Rash)",
    conditions_summary: "Acute Deep Vein Thrombosis, Stage 3B Chronic Kidney Disease, Type 2 Diabetes",
    last_updated: "2026-10-08 11:30 UTC",
    timeline: [
      { date: "2026-10-08 07:45 UTC", event: "Inpatient renal function panel released (Serum Creatinine: 2.4 mg/dL, eGFR: 28 mL/min)", actor: "Elena Rostova, RN", badge: "LAB" },
      { date: "2026-10-08 08:20 UTC", event: "Medication safety assessment completed: LMWH Anti-Xa accumulation risk in declining renal clearance", actor: "Dr. Sarah Lin, MD", badge: "CLINICAL" },
      { date: "2026-10-08 11:00 UTC", event: "Doctor issued prescription for Enoxaparin Sodium (Lovenox) 80 mg SC Daily", actor: "Dr. Sarah Lin, MD", badge: "PRESCRIPTION" },
      { date: "2026-10-08 11:15 UTC", event: "Pharmacist checked availability: Prescribed brand Lovenox 80 mg is UNAVAILABLE (Out-of-Stock)", actor: "Marcus Vance, PharmD", badge: "PHARMACY" },
      { date: "2026-10-08 11:20 UTC", event: "Pharmacist identified configured brand alternative (Clexane 80 mg) and submitted Substitution Request to Doctor", actor: "Marcus Vance, PharmD", badge: "SUBSTITUTION" },
      { date: "2026-10-08 11:25 UTC", event: "Doctor reviewed and approved brand substitution request for Clexane 80 mg / 0.8 mL", actor: "Dr. Sarah Lin, MD", badge: "APPROVAL" },
      { date: "2026-10-08 11:30 UTC", event: "Pharmacist verified Doctor approval and marked Clexane 80 mg ready for dispensing", actor: "Marcus Vance, PharmD", badge: "DISPENSING" },
    ],
    medical_conditions: [
      { condition: "Acute Deep Vein Thrombosis (Left Lower Extremity)", diagnosis_date: "2026-10-05", status: "Active", notes: "Confirmed on duplex ultrasound; requires therapeutic anticoagulation." },
      { condition: "Stage 3B Chronic Kidney Disease", diagnosis_date: "2022-04-18", status: "Active", notes: "Baseline creatinine 1.8 mg/dL with acute rise to 2.4 mg/dL." },
      { condition: "Type 2 Diabetes Mellitus w/ Neuropathy", diagnosis_date: "2016-09-12", status: "Active", notes: "Managed with glargine insulin and dietary controls." },
    ],
    medication_history: [
      { medication: "Enoxaparin Sodium (Lovenox)", strength: "80 mg / 0.8 mL", route: "Subcutaneous", start_date: "2026-10-06", end_date: "2026-10-08", status: "Substituted (Unavailable)", prescribing_doctor: "Dr. Sarah Lin, MD" },
      { medication: "Clexane (Enoxaparin Sodium)", strength: "80 mg / 0.8 mL", route: "Subcutaneous", start_date: "2026-10-08", end_date: "Ongoing", status: "Active (Approved Substitution)", prescribing_doctor: "Dr. Sarah Lin, MD" },
      { medication: "Insulin Glargine (Lantus)", strength: "18 Units", route: "Subcutaneous", start_date: "2019-01-10", end_date: "Ongoing", status: "Active", prescribing_doctor: "Dr. David Sterling, MD" },
    ],
    allergies: [
      { allergen: "Sulfamethoxazole / Trimethoprim (Bactrim)", reaction: "Maculopapular Rash & Pruritus", severity: "Moderate", recorded_date: "2021-08-14" },
    ],
    laboratory_history: [
      { date: "2026-10-08 07:45 UTC", test: "Serum Creatinine", result: "2.4", unit: "mg/dL", reference_range: "0.7 - 1.3", status: "High (Critical)", source_report_id: "LAB-2026-0002", source_doc: "data/lab_reports/LAB-2026-0002.json" },
      { date: "2026-10-08 07:45 UTC", test: "eGFR (CKD-EPI)", result: "28", unit: "mL/min/1.73m²", reference_range: "> 60", status: "Low (Critical)", source_report_id: "LAB-2026-0002", source_doc: "data/lab_reports/LAB-2026-0002.json" },
      { date: "2026-10-08 07:45 UTC", test: "Blood Urea Nitrogen (BUN)", result: "42", unit: "mg/dL", reference_range: "8 - 20", status: "High", source_report_id: "LAB-2026-0002", source_doc: "data/lab_reports/LAB-2026-0002.json" },
      { date: "2026-10-08 07:45 UTC", test: "Potassium (K+)", result: "4.8", unit: "mEq/L", reference_range: "3.5 - 5.0", status: "Normal", source_report_id: "LAB-2026-0002", source_doc: "data/lab_reports/LAB-2026-0002.json" },
    ],
    clinical_assessments: [
      { date: "2026-10-08 08:20 UTC", assessment: "Enoxaparin Dose Adjustment for Severe Renal Impairment", risk_level: "High Risk", recommendation: "Reduce Enoxaparin to 30 mg SC Once Daily OR Convert to Unfractionated Heparin infusion with aPTT monitoring", doctor: "Dr. Sarah Lin, MD (Nephrology / ID)" },
    ],
    pharmacy_events: [
      { date: "2026-10-08 11:15 UTC", medication: "Lovenox 80 mg / 0.8 mL", availability: "Unavailable (Stock 0)", substitution_request: "Clexane 80 mg / 0.8 mL requested", doctor_verification: "Doctor Approved", dispensing_status: "Ready for Dispensing" },
    ],
    audit_events: [
      { timestamp: "2026-10-08 11:30:00 UTC", user_role: "Marcus Vance, PharmD (Pharmacist)", action: "Substituted Medication Marked Ready for Dispensing: Clexane 80 mg", event_type: "MEDICATION_MARKED_READY_FOR_DISPENSING", audit_hash: "7b4c8011239aa8e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca4" },
      { timestamp: "2026-10-08 11:25:00 UTC", user_role: "Dr. Sarah Lin, MD (Doctor)", action: "Approved Brand Substitution: Lovenox -> Clexane 80 mg", event_type: "DOCTOR_SUBSTITUTION_APPROVED", audit_hash: "29fbe91823901bcae3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c" },
    ],
  },
  "CASE-003": {
    case_id: "CASE-003",
    patient_identifier: "DEMO-PT-003",
    name: "Elena Rostova",
    mrn: "MRN-2026-7731",
    age: 58,
    sex: "Female",
    blood_group: "O+",
    allergies_summary: "No known drug allergies (NKDA)",
    conditions_summary: "Essential Hypertension Stage II, Type 2 Diabetes",
    last_updated: "2026-10-08 14:15 UTC",
    timeline: [
      { date: "2026-10-08 09:30 UTC", event: "Physician order entered for Lisinopril 20 mg PO Daily", actor: "Dr. Sarah Lin, MD", badge: "PRESCRIPTION" },
      { date: "2026-10-08 09:40 UTC", event: "Safety Alert: Duplicate ACE-inhibitor therapy detected (Existing Enalapril 10 mg + Lisinopril 20 mg)", actor: "AEGIS Rules Engine", badge: "SAFETY" },
      { date: "2026-10-08 09:45 UTC", event: "Physician deprescribed Enalapril 10 mg and authorized Lisinopril monotherapy", actor: "Dr. Sarah Lin, MD", badge: "CLINICAL" },
      { date: "2026-10-08 14:05 UTC", event: "Pharmacist verified Prinivil (Lisinopril) 20 mg available in Bin C-02", actor: "Marcus Vance, PharmD", badge: "PHARMACY" },
    ],
    medical_conditions: [
      { condition: "Essential Hypertension Stage II", diagnosis_date: "2019-04-10", status: "Active", notes: "Suboptimally controlled on monotherapy." },
      { condition: "Type 2 Diabetes Mellitus", diagnosis_date: "2021-11-03", status: "Active", notes: "HbA1c 6.8% on Metformin 500 mg BID." },
    ],
    medication_history: [
      { medication: "Lisinopril (Prinivil)", strength: "20 mg", route: "Oral", start_date: "2026-10-08", end_date: "Ongoing", status: "Active", prescribing_doctor: "Dr. Sarah Lin, MD" },
      { medication: "Enalapril Maleate", strength: "10 mg", route: "Oral", start_date: "2022-01-15", end_date: "2026-10-08", status: "Discontinued (Duplicate ACE-I)", prescribing_doctor: "Dr. David Sterling, MD" },
      { medication: "Metformin HCl", strength: "500 mg", route: "Oral", start_date: "2021-11-05", end_date: "Ongoing", status: "Active", prescribing_doctor: "Dr. David Sterling, MD" },
    ],
    allergies: [],
    laboratory_history: [
      { date: "2026-10-08 08:00 UTC", test: "Potassium (K+)", result: "4.4", unit: "mEq/L", reference_range: "3.5 - 5.0", status: "Normal", source_report_id: "LAB-2026-0003", source_doc: "data/lab_reports/LAB-2026-0003.json" },
      { date: "2026-10-08 08:00 UTC", test: "Serum Creatinine", result: "0.85", unit: "mg/dL", reference_range: "0.6 - 1.1", status: "Normal", source_report_id: "LAB-2026-0003", source_doc: "data/lab_reports/LAB-2026-0003.json" },
    ],
    clinical_assessments: [
      { date: "2026-10-08 09:40 UTC", assessment: "Duplicate ACE Inhibitor Therapeutic Duplication", risk_level: "High Risk", recommendation: "Discontinue Enalapril before initiating Lisinopril to avoid severe hypotension & acute hyperkalemia.", doctor: "Dr. Sarah Lin, MD" },
    ],
    pharmacy_events: [
      { date: "2026-10-08 14:05 UTC", medication: "Lisinopril (Prinivil) 20 mg", availability: "Available (580 Tabs, Bin C-02)", substitution_request: "None", doctor_verification: "Verified", dispensing_status: "Ready for Dispensing" },
    ],
    audit_events: [
      { timestamp: "2026-10-08 14:05:00 UTC", user_role: "Marcus Vance, PharmD (Pharmacist)", action: "Prescription Verified & Marked Ready: Lisinopril 20 mg", event_type: "PHARMACIST_PRESCRIPTION_VERIFIED", audit_hash: "189abcde0912384e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca" },
    ],
  },
  "CASE-004": {
    case_id: "CASE-004",
    patient_identifier: "DEMO-PT-004",
    name: "Arthur Pendelton",
    mrn: "MRN-2026-6629",
    age: 79,
    sex: "Male",
    blood_group: "AB+",
    allergies_summary: "Codeine (Severe Nausea & Bronchospasm)",
    conditions_summary: "Congestive Heart Failure (HFrEF EF 30%), Atrial Fibrillation, CKD Stage 3A",
    last_updated: "2026-10-08 16:15 UTC",
    timeline: [
      { date: "2026-10-08 10:15 UTC", event: "Therapeutic drug monitoring drawn for Digoxin level & Serum Electrolytes", actor: "Elena Rostova, RN", badge: "LAB" },
      { date: "2026-10-08 11:30 UTC", event: "Digoxin level reported at 1.8 ng/mL (High / Borderline Toxic)", actor: "Pathology Core Lab", badge: "LAB" },
      { date: "2026-10-08 15:00 UTC", event: "Doctor modified Digoxin order to 0.125 mg Every Other Day with continuous cardiac telemetry", actor: "Dr. Sarah Lin, MD", badge: "PRESCRIPTION" },
      { date: "2026-10-08 16:05 UTC", event: "Pharmacist verified Lanoxin (Digoxin) 0.125 mg available in Bin B-06", actor: "Marcus Vance, PharmD", badge: "PHARMACY" },
    ],
    medical_conditions: [
      { condition: "Congestive Heart Failure (NYHA Class III)", diagnosis_date: "2017-09-24", status: "Active", notes: "LVEF 30%. S3 gallop absent." },
      { condition: "Permanent Atrial Fibrillation", diagnosis_date: "2018-03-12", status: "Active", notes: "Rate controlled with low-dose digoxin and carvedilol." },
      { condition: "Chronic Kidney Disease Stage 3A", diagnosis_date: "2020-05-19", status: "Active", notes: "eGFR 48 mL/min." },
    ],
    medication_history: [
      { medication: "Digoxin (Lanoxin)", strength: "0.125 mg", route: "Oral", start_date: "2026-10-08", end_date: "Ongoing", status: "Active (Dose Reduced)", prescribing_doctor: "Dr. Sarah Lin, MD" },
      { medication: "Carvedilol (Coreg)", strength: "6.25 mg", route: "Oral", start_date: "2018-04-01", end_date: "Ongoing", status: "Active", prescribing_doctor: "Dr. Sarah Lin, MD" },
      { medication: "Furosemide (Lasix)", strength: "40 mg", route: "Oral", start_date: "2017-10-01", end_date: "Ongoing", status: "Active", prescribing_doctor: "Dr. Sarah Lin, MD" },
    ],
    allergies: [
      { allergen: "Codeine Phosphate", reaction: "Bronchospasm & severe emesis", severity: "Severe", recorded_date: "2015-06-20" },
    ],
    laboratory_history: [
      { date: "2026-10-08 11:30 UTC", test: "Digoxin Level", result: "1.8", unit: "ng/mL", reference_range: "0.5 - 0.9", status: "High", source_report_id: "LAB-2026-0004", source_doc: "data/lab_reports/LAB-2026-0004.json" },
      { date: "2026-10-08 11:30 UTC", test: "Potassium (K+)", result: "3.7", unit: "mEq/L", reference_range: "3.5 - 5.0", status: "Normal", source_report_id: "LAB-2026-0004", source_doc: "data/lab_reports/LAB-2026-0004.json" },
      { date: "2026-10-08 11:30 UTC", test: "Serum Creatinine", result: "1.4", unit: "mg/dL", reference_range: "0.7 - 1.3", status: "High", source_report_id: "LAB-2026-0004", source_doc: "data/lab_reports/LAB-2026-0004.json" },
    ],
    clinical_assessments: [
      { date: "2026-10-08 15:00 UTC", assessment: "Digoxin Toxicity Risk in Elderly Patient with Renal Decline", risk_level: "Critical Risk", recommendation: "Reduce maintenance dose to 0.125 mg Q48H. Monitor telemetry for bradycardia or PR prolongation.", doctor: "Dr. Sarah Lin, MD" },
    ],
    pharmacy_events: [
      { date: "2026-10-08 16:05 UTC", medication: "Digoxin (Lanoxin) 0.125 mg", availability: "Available (250 Tabs, Bin B-06)", substitution_request: "None", doctor_verification: "Verified", dispensing_status: "Ready for Dispensing" },
    ],
    audit_events: [
      { timestamp: "2026-10-08 16:05:00 UTC", user_role: "Marcus Vance, PharmD (Pharmacist)", action: "Prescription Verified & Marked Ready: Digoxin 0.125 mg", event_type: "PHARMACIST_PRESCRIPTION_VERIFIED", audit_hash: "9912bcde0912384e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca" },
    ],
  },
};

// =========================================================================
// NURSE INITIAL MAR & VITALS
// =========================================================================
export const INITIAL_NURSE_MAR: NurseMARItem[] = [
  {
    mar_id: "MAR-001",
    case_id: "CASE-001",
    patient_identifier: "DEMO-PT-001",
    patient_name: "Sarah Jenkins",
    medication: "Warfarin Sodium",
    dose: "2.5 mg",
    route: "Oral (PO)",
    scheduled_time: "08:00",
    status: "DUE",
    prescribing_doctor: "Dr. Sarah Lin, MD",
    nursing_note: "Target INR 2.0–3.0. Verify morning lab before administration.",
    clinical_alert: "Active DDI flagged: Warfarin + Fluconazole CYP2C9 inhibition. Morning INR elevated at 3.4.",
    requires_escalation: true,
  },
  {
    mar_id: "MAR-002",
    case_id: "CASE-001",
    patient_identifier: "DEMO-PT-001",
    patient_name: "Sarah Jenkins",
    medication: "Fluconazole",
    dose: "200 mg",
    route: "Oral (PO)",
    scheduled_time: "20:00",
    status: "HELD",
    prescribing_doctor: "Dr. Sarah Lin, MD",
    nursing_note: "Safety Hold: High bleeding hazard from CYP2C9 inhibition.",
    clinical_alert: "Medication safety assessment requires medication hold/review.",
    requires_escalation: true,
    recorded_by: "Elena Rostova, RN",
    recorded_at: "08 Oct 2026 07:30 UTC",
    hold_reason: "Clinical safety rule AEGIS-DEMO-001 triggered: Drug interaction with Warfarin.",
  },
  {
    mar_id: "MAR-003",
    case_id: "CASE-001",
    patient_identifier: "DEMO-PT-001",
    patient_name: "Sarah Jenkins",
    medication: "Atorvastatin Calcium",
    dose: "20 mg",
    route: "Oral (PO)",
    scheduled_time: "21:00",
    status: "ADMINISTERED",
    prescribing_doctor: "Dr. Sarah Lin, MD",
    nursing_note: "Administered with evening meal. Patient tolerated well.",
    requires_escalation: false,
    recorded_by: "Elena Rostova, RN",
    recorded_at: "07 Oct 2026 21:05 UTC",
  },
  {
    mar_id: "MAR-004",
    case_id: "CASE-002",
    patient_identifier: "DEMO-PT-002",
    patient_name: "Robert Chen",
    medication: "Clexane (Enoxaparin)",
    dose: "80 mg / 0.8 mL",
    route: "Subcutaneous (SC)",
    scheduled_time: "09:00",
    status: "DUE",
    prescribing_doctor: "Dr. Sarah Lin, MD",
    nursing_note: "Substituted brand approved by physician. Inject into anterolateral abdominal wall.",
    clinical_alert: "Renal clearance impaired (eGFR 28 mL/min). Monitor for hematoma or bleeding.",
    requires_escalation: true,
  },
  {
    mar_id: "MAR-005",
    case_id: "CASE-003",
    patient_identifier: "DEMO-PT-003",
    patient_name: "Elena Rostova",
    medication: "Lisinopril (Prinivil)",
    dose: "20 mg",
    route: "Oral (PO)",
    scheduled_time: "10:00",
    status: "DUE",
    prescribing_doctor: "Dr. Sarah Lin, MD",
    nursing_note: "Confirm BP before dosing. Enalapril was deprescribed.",
    requires_escalation: false,
  },
  {
    mar_id: "MAR-006",
    case_id: "CASE-004",
    patient_identifier: "DEMO-PT-004",
    patient_name: "Arthur Pendelton",
    medication: "Digoxin (Lanoxin)",
    dose: "0.125 mg",
    route: "Oral (PO)",
    scheduled_time: "12:00",
    status: "DUE",
    prescribing_doctor: "Dr. Sarah Lin, MD",
    nursing_note: "Check apical pulse for 60 seconds. Hold if HR < 60 bpm.",
    clinical_alert: "Borderline high serum digoxin level (1.8 ng/mL).",
    requires_escalation: true,
  },
];

export const INITIAL_NURSE_VITALS: NurseVitalLabItem[] = [
  { id: "VIT-001", case_id: "CASE-001", patient_identifier: "DEMO-PT-001", patient_name: "Sarah Jenkins", parameter: "Blood Pressure", value: "128/78", unit: "mmHg", recorded_time: "08:10", status: "Normal", source_type: "Bedside Vitals Monitor", recorded_by: "Elena Rostova, RN", reference_range: "90/60 - 120/80" },
  { id: "VIT-002", case_id: "CASE-001", patient_identifier: "DEMO-PT-001", patient_name: "Sarah Jenkins", parameter: "Heart Rate", value: "82", unit: "bpm", recorded_time: "08:10", status: "Normal", source_type: "Bedside Vitals Monitor", recorded_by: "Elena Rostova, RN", reference_range: "60 - 100" },
  { id: "VIT-003", case_id: "CASE-001", patient_identifier: "DEMO-PT-001", patient_name: "Sarah Jenkins", parameter: "SpO₂", value: "97", unit: "%", recorded_time: "08:10", status: "Normal", source_type: "Pulse Oximetry", recorded_by: "Elena Rostova, RN", reference_range: "95 - 100" },
  { id: "VIT-004", case_id: "CASE-001", patient_identifier: "DEMO-PT-001", patient_name: "Sarah Jenkins", parameter: "Prothrombin Time (INR)", value: "3.4", unit: "ratio", recorded_time: "07:45", status: "High", source_type: "Pathology Core Lab (LAB-2026-0001)", recorded_by: "Verified Laboratory Feed", reference_range: "0.8 - 1.2" },
  { id: "VIT-005", case_id: "CASE-002", patient_identifier: "DEMO-PT-002", patient_name: "Robert Chen", parameter: "Serum Creatinine", value: "2.4", unit: "mg/dL", recorded_time: "08:15", status: "Critical", source_type: "Pathology Core Lab (LAB-2026-0002)", recorded_by: "Verified Laboratory Feed", reference_range: "0.7 - 1.3" },
  { id: "VIT-006", case_id: "CASE-002", patient_identifier: "DEMO-PT-002", patient_name: "Robert Chen", parameter: "eGFR (CKD-EPI)", value: "28", unit: "mL/min", recorded_time: "08:15", status: "Critical", source_type: "Pathology Core Lab (LAB-2026-0002)", recorded_by: "Verified Laboratory Feed", reference_range: "> 60" },
  { id: "VIT-007", case_id: "CASE-003", patient_identifier: "DEMO-PT-003", patient_name: "Elena Rostova", parameter: "Blood Pressure", value: "148/92", unit: "mmHg", recorded_time: "08:30", status: "High", source_type: "Bedside Vitals Monitor", recorded_by: "Elena Rostova, RN", reference_range: "90/60 - 120/80" },
  { id: "VIT-008", case_id: "CASE-004", patient_identifier: "DEMO-PT-004", patient_name: "Arthur Pendelton", parameter: "Heart Rate", value: "58", unit: "bpm", recorded_time: "08:45", status: "Low", source_type: "ECG Telemetry", recorded_by: "Elena Rostova, RN", reference_range: "60 - 100" },
];

// =========================================================================
// PHARMACIST INITIAL QUEUE & INVENTORY
// =========================================================================
export const INITIAL_PHARMACIST_QUEUE: AvailabilityQueueItem[] = [
  {
    case_id: "CASE-001",
    patient_id: 1,
    patient_name: "Sarah Jenkins",
    patient_identifier: "DEMO-PT-001",
    mrn: "MRN-2026-9041",
    age: 64,
    sex: "Female",
    prescribed_medicine: "Warfarin Sodium (Coumadin)",
    prescribed_brand: "Coumadin",
    generic_name: "Warfarin Sodium",
    strength: "2.5 mg",
    formulation: "Oral Tablet",
    route: "Oral",
    frequency: "Once Daily (Q24H)",
    prescribing_doctor: "Dr. Sarah Lin, MD (Cardiology)",
    availability: "AVAILABLE",
    available_quantity: 420,
    available_qty_formatted: "420 Tablets (Bin A-04, Batch #WF-88392)",
    status: "Ready for Dispensing",
    substitution_status: "No Substitution Needed",
    is_ready_for_dispensing: true,
    doctor_recommendation: "Warfarin dose reduction to 2.5 mg PO Daily",
    doctor_suggested_alt: "None Required",
    available_alternatives: [],
    action: "DISPENSE",
    lot_number: "WF-88392",
    bin_location: "Bin A-04",
  },
  {
    case_id: "CASE-002",
    patient_id: 2,
    patient_name: "Robert Chen",
    patient_identifier: "DEMO-PT-002",
    mrn: "MRN-2026-8812",
    age: 72,
    sex: "Male",
    prescribed_medicine: "Enoxaparin Sodium (Lovenox)",
    prescribed_brand: "Lovenox",
    generic_name: "Enoxaparin Sodium",
    strength: "80 mg / 0.8 mL",
    formulation: "Pre-filled Syringe",
    route: "Subcutaneous",
    frequency: "Once Daily (Q24H)",
    prescribing_doctor: "Dr. Sarah Lin, MD (Nephrology / ID)",
    availability: "UNAVAILABLE",
    available_quantity: 0,
    available_qty_formatted: "0 Syringes (Out of Stock)",
    status: "Substitution Approved by Doctor",
    substitution_status: "Substitution Approved (Ready to Dispense)",
    is_ready_for_dispensing: true,
    doctor_recommendation: "Enoxaparin therapeutic anticoagulation 80 mg SC Daily",
    doctor_suggested_alt: "Clexane 80 mg / 0.8 mL",
    available_alternatives: [
      {
        brand_name: "Clexane",
        generic_name: "Enoxaparin Sodium",
        strength: "80 mg / 0.8 mL",
        formulation: "Pre-filled Syringe",
        same_active_ingredient: true,
        same_strength: true,
        availability: "AVAILABLE",
        stock: "60 Syringes (Bin D-12, Batch #CX-88102)",
      },
      {
        brand_name: "Inhixa",
        generic_name: "Enoxaparin Sodium",
        strength: "80 mg / 0.8 mL",
        formulation: "Pre-filled Syringe",
        same_active_ingredient: true,
        same_strength: true,
        availability: "AVAILABLE",
        stock: "45 Syringes (Bin D-14, Batch #IN-33201)",
      },
    ],
    action: "SUBSTITUTION_APPROVED",
    lot_number: "CX-88102",
    bin_location: "Bin D-12",
  },
  {
    case_id: "CASE-003",
    patient_id: 3,
    patient_name: "Elena Rostova",
    patient_identifier: "DEMO-PT-003",
    mrn: "MRN-2026-7731",
    age: 58,
    sex: "Female",
    prescribed_medicine: "Lisinopril (Prinivil)",
    prescribed_brand: "Prinivil",
    generic_name: "Lisinopril",
    strength: "20 mg",
    formulation: "Oral Tablet",
    route: "Oral",
    frequency: "Once Daily (Q24H)",
    prescribing_doctor: "Dr. Sarah Lin, MD (Internal Med)",
    availability: "AVAILABLE",
    available_quantity: 580,
    available_qty_formatted: "580 Tablets (Bin C-02, Batch #LP-10492)",
    status: "Ready for Dispensing",
    substitution_status: "No Substitution Needed",
    is_ready_for_dispensing: true,
    doctor_recommendation: "Lisinopril monotherapy 20 mg PO Daily",
    doctor_suggested_alt: "None Required",
    available_alternatives: [],
    action: "DISPENSE",
    lot_number: "LP-10492",
    bin_location: "Bin C-02",
  },
  {
    case_id: "CASE-004",
    patient_id: 4,
    patient_name: "Arthur Pendelton",
    patient_identifier: "DEMO-PT-004",
    mrn: "MRN-2026-6629",
    age: 79,
    sex: "Male",
    prescribed_medicine: "Digoxin (Lanoxin)",
    prescribed_brand: "Lanoxin",
    generic_name: "Digoxin",
    strength: "0.125 mg",
    formulation: "Oral Tablet",
    route: "Oral",
    frequency: "Every Other Day (Q48H)",
    prescribing_doctor: "Dr. Sarah Lin, MD (Cardiology)",
    availability: "AVAILABLE",
    available_quantity: 250,
    available_qty_formatted: "250 Tablets (Bin B-06, Batch #DG-44021)",
    status: "Ready for Dispensing",
    substitution_status: "No Substitution Needed",
    is_ready_for_dispensing: true,
    doctor_recommendation: "Digoxin maintenance 0.125 mg Q48H",
    doctor_suggested_alt: "None Required",
    available_alternatives: [],
    action: "DISPENSE",
    lot_number: "DG-44021",
    bin_location: "Bin B-06",
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { medication: "Warfarin Sodium", brand_name: "Coumadin", strength: "2.5 mg", formulation: "Oral Tablet", stock: 420, unit: "tabs", status: "AVAILABLE", location: "Bin A-04", batch: "WF-88392", expiry: "2027-11", unit_price: "$0.45" },
  { medication: "Warfarin Sodium", brand_name: "Jantoven", strength: "2.5 mg", formulation: "Oral Tablet", stock: 310, unit: "tabs", status: "AVAILABLE", location: "Bin A-05", batch: "WF-88104", expiry: "2027-09", unit_price: "$0.38" },
  { medication: "Fluconazole", brand_name: "Diflucan", strength: "100 mg", formulation: "Oral Tablet", stock: 140, unit: "tabs", status: "AVAILABLE", location: "Bin B-12", batch: "FL-22910", expiry: "2027-04", unit_price: "$1.85" },
  { medication: "Enoxaparin Sodium", brand_name: "Lovenox", strength: "80 mg / 0.8 mL", formulation: "Pre-filled Syringe", stock: 0, unit: "syringes", status: "UNAVAILABLE", location: "Bin D-10", batch: "OUT-OF-STOCK", expiry: "-", unit_price: "$28.50" },
  { medication: "Enoxaparin Sodium", brand_name: "Clexane", strength: "80 mg / 0.8 mL", formulation: "Pre-filled Syringe", stock: 60, unit: "syringes", status: "AVAILABLE", location: "Bin D-12", batch: "CX-88102", expiry: "2028-02", unit_price: "$24.00" },
  { medication: "Enoxaparin Sodium", brand_name: "Inhixa", strength: "80 mg / 0.8 mL", formulation: "Pre-filled Syringe", stock: 45, unit: "syringes", status: "AVAILABLE", location: "Bin D-14", batch: "IN-33201", expiry: "2027-10", unit_price: "$21.50" },
  { medication: "Lisinopril", brand_name: "Prinivil", strength: "20 mg", formulation: "Oral Tablet", stock: 580, unit: "tabs", status: "AVAILABLE", location: "Bin C-02", batch: "LP-10492", expiry: "2028-06", unit_price: "$0.32" },
  { medication: "Digoxin", brand_name: "Lanoxin", strength: "0.125 mg", formulation: "Oral Tablet", stock: 250, unit: "tabs", status: "AVAILABLE", location: "Bin B-06", batch: "DG-44021", expiry: "2027-08", unit_price: "$0.75" },
  { medication: "Micafungin", brand_name: "Mycamine", strength: "100 mg", formulation: "IV Vial", stock: 32, unit: "vials", status: "AVAILABLE", location: "Bin F-01", batch: "MC-90123", expiry: "2027-03", unit_price: "$115.00" },
  { medication: "Unfractionated Heparin", brand_name: "Heparin Sodium", strength: "25,000 Units / 500 mL", formulation: "IV Infusion", stock: 85, unit: "bags", status: "AVAILABLE", location: "Bin H-04", batch: "HP-33219", expiry: "2027-12", unit_price: "$18.20" },
];

export const PHARMACOLOGY_REFERENCE: PharmacologyReferenceItem[] = [
  {
    pair: "Warfarin + Fluconazole",
    mechanism: "Potent CYP2C9 inhibition by fluconazole impairs hepatic clearance of active S-warfarin enantiomer.",
    clinical_impact: "Rapid INR prolongation, severe bleeding risk within 48–72 hours.",
    recommended_action: "Reduce warfarin maintenance dose by 50% or substitute with echinocandin (Micafungin); repeat INR Day 3.",
    evidence_source: "DDInter / FDA Drug Label Boxed Warning",
    evidence_id: "AEGIS-DEMO-EV-001",
    provenance: "Rule Pack: aegis_hackathon_demo v1.0.0",
  },
  {
    pair: "Enoxaparin + Declining Renal Function (CrCl < 30)",
    mechanism: "Enoxaparin (LMWH) is eliminated primarily by renal clearance. Impairment causes elevated anti-Xa plasma accumulation.",
    clinical_impact: "Excessive systemic anticoagulation and high major hemorrhage risk.",
    recommended_action: "Reduce dose to 30 mg SC Daily OR switch to Unfractionated Heparin monitored with aPTT.",
    evidence_source: "Kidney Disease: Improving Global Outcomes (KDIGO) / ACCP Guidelines",
    evidence_id: "AEGIS-DEMO-EV-002",
    provenance: "Rule Pack: aegis_hackathon_demo v1.0.0",
  },
  {
    pair: "Lisinopril + Enalapril (Dual ACE Inhibitors)",
    mechanism: "Additive inhibition of angiotensin converting enzyme without incremental therapeutic antihypertensive benefit.",
    clinical_impact: "Profound hypotension, acute syncope, hyperkalemia, and acute kidney injury.",
    recommended_action: "Immediately discontinue duplicate agent; maintain single ACE-I or ARB with serial electrolytes.",
    evidence_source: "AHA/ACC Hypertension Guidelines 2024",
    evidence_id: "AEGIS-DEMO-EV-003",
    provenance: "Rule Pack: aegis_hackathon_demo v1.0.0",
  },
];

// =========================================================================
// LAB REPORTS DATABASE
// =========================================================================
export const LAB_REPORTS: Record<string, LabReportDetail> = {
  "LAB-2026-0001": {
    lab_report_id: "LAB-2026-0001",
    case_id: "CASE-001",
    patient_identifier: "DEMO-PT-001",
    patient_name: "Sarah Jenkins",
    collection_date: "2026-10-08T08:30:00Z",
    report_date: "2026-10-08T09:15:00Z",
    category: "Coagulation & Liver Function Panel",
    clinical_indication: "Warfarin therapeutic drug monitoring & baseline hepatic function",
    source_document: "data/lab_reports/LAB-2026-0001.json",
    evidence_status: "Verified Locally",
    last_reviewed: "2026-10-08T09:20:00Z",
    laboratory_facility: "Local Hospital Pathology Laboratory (Internal Repository)",
    results: [
      { test_name: "INR (International Normalized Ratio)", result: "3.4", unit: "ratio", reference_range: "0.8 - 1.2", status: "High (Critical)", clinical_significance: "Elevated baseline coagulopathy; CYP2C9 inhibition by fluconazole will acutely worsen anticoagulation trajectory (>4.0)." },
      { test_name: "Prothrombin Time (PT)", result: "34.2", unit: "seconds", reference_range: "11.0 - 13.5", status: "High", clinical_significance: "Profoundly delayed extrinsic pathway clot formation." },
      { test_name: "Platelet Count", result: "245", unit: "10^3/uL", reference_range: "150 - 450", status: "Normal", clinical_significance: "Adequate circulating platelet count." },
      { test_name: "Alanine Aminotransferase (ALT)", result: "28", unit: "U/L", reference_range: "7 - 56", status: "Normal", clinical_significance: "Normal hepatocellular integrity." },
      { test_name: "Aspartate Aminotransferase (AST)", result: "24", unit: "U/L", reference_range: "10 - 40", status: "Normal", clinical_significance: "Normal hepatic transaminase levels." },
    ],
    sha256_checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  "LAB-2026-0002": {
    lab_report_id: "LAB-2026-0002",
    case_id: "CASE-002",
    patient_identifier: "DEMO-PT-002",
    patient_name: "Robert Chen",
    collection_date: "2026-10-08T07:45:00Z",
    report_date: "2026-10-08T08:15:00Z",
    category: "Renal Function & Electrolyte Panel",
    clinical_indication: "Inpatient renal function surveillance during anticoagulation initiation",
    source_document: "data/lab_reports/LAB-2026-0002.json",
    evidence_status: "Verified Locally",
    last_reviewed: "2026-10-08T08:20:00Z",
    laboratory_facility: "Local Hospital Pathology Laboratory (Internal Repository)",
    results: [
      { test_name: "Serum Creatinine", result: "2.4", unit: "mg/dL", reference_range: "0.7 - 1.3", status: "High (Critical)", clinical_significance: "Acute decline in glomerular filtration rate. LMWH dosage clearance reduced by >60%." },
      { test_name: "Estimated GFR (CKD-EPI)", result: "28", unit: "mL/min/1.73m²", reference_range: "> 60", status: "Low (Critical)", clinical_significance: "Stage 4 severe renal impairment." },
      { test_name: "Blood Urea Nitrogen (BUN)", result: "42", unit: "mg/dL", reference_range: "8 - 20", status: "High", clinical_significance: "Azotemia secondary to decreased renal perfusion." },
      { test_name: "Potassium (K+)", result: "4.8", unit: "mEq/L", reference_range: "3.5 - 5.0", status: "Normal", clinical_significance: "Electrolyte homeostasis maintained." },
    ],
    sha256_checksum: "7b4c8011239aa8e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca4",
  },
  "LAB-2026-0003": {
    lab_report_id: "LAB-2026-0003",
    case_id: "CASE-003",
    patient_identifier: "DEMO-PT-003",
    patient_name: "Elena Rostova",
    collection_date: "2026-10-08T08:00:00Z",
    report_date: "2026-10-08T08:45:00Z",
    category: "Comprehensive Metabolic Panel",
    clinical_indication: "Pre-antihypertensive baseline assessment",
    source_document: "data/lab_reports/LAB-2026-0003.json",
    evidence_status: "Verified Locally",
    last_reviewed: "2026-10-08T09:00:00Z",
    laboratory_facility: "Local Hospital Pathology Laboratory (Internal Repository)",
    results: [
      { test_name: "Potassium (K+)", result: "4.4", unit: "mEq/L", reference_range: "3.5 - 5.0", status: "Normal", clinical_significance: "Baseline potassium within normal limits prior to ACE inhibitor adjustment." },
      { test_name: "Serum Creatinine", result: "0.85", unit: "mg/dL", reference_range: "0.6 - 1.1", status: "Normal", clinical_significance: "Normal renal function." },
      { test_name: "Serum Sodium", result: "140", unit: "mEq/L", reference_range: "136 - 145", status: "Normal", clinical_significance: "Euvolemic electrolyte state." },
    ],
    sha256_checksum: "189abcde0912384e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca",
  },
  "LAB-2026-0004": {
    lab_report_id: "LAB-2026-0004",
    case_id: "CASE-004",
    patient_identifier: "DEMO-PT-004",
    patient_name: "Arthur Pendelton",
    collection_date: "2026-10-08T10:15:00Z",
    report_date: "2026-10-08T11:30:00Z",
    category: "Therapeutic Drug Monitoring & Renal Panel",
    clinical_indication: "Digoxin serum concentration assay and cardiac risk assessment",
    source_document: "data/lab_reports/LAB-2026-0004.json",
    evidence_status: "Verified Locally",
    last_reviewed: "2026-10-08T12:00:00Z",
    laboratory_facility: "Local Hospital Pathology Laboratory (Internal Repository)",
    results: [
      { test_name: "Digoxin Level", result: "1.8", unit: "ng/mL", reference_range: "0.5 - 0.9", status: "High", clinical_significance: "Serum concentration in narrow therapeutic index toxicity range; risk of junctional escape rhythms or ventricular ectopy." },
      { test_name: "Potassium (K+)", result: "3.7", unit: "mEq/L", reference_range: "3.5 - 5.0", status: "Normal (Low-normal)", clinical_significance: "Low-normal potassium potentiates myocardial sensitivity to digoxin." },
      { test_name: "Serum Creatinine", result: "1.4", unit: "mg/dL", reference_range: "0.7 - 1.3", status: "High", clinical_significance: "Age-associated renal impairment slowing digoxin clearance." },
    ],
    sha256_checksum: "9912bcde0912384e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca",
  },
};

// =========================================================================
// CLINICAL SCENARIOS / 6-AGENT RESULTS (1-CLICK EVALUATION)
// =========================================================================
export const DEMO_SCENARIO_RESULTS: Record<number, SixAgentResult> = {
  1: {
    scenario_id: 1,
    patient: { identifier: "CASE-001", name: "Sarah Jenkins", mrn: "MRN-2026-9041" },
    findings: [
      {
        title: "CRITICAL: Severe CYP2C9 Drug-Drug Interaction (Warfarin + Fluconazole)",
        severity: "CRITICAL",
        description: "Concurrent administration of Warfarin Sodium with Fluconazole causes profound CYP2C9 enzymatic inhibition. Active S-warfarin clearance is decreased by >65%, escalating severe major internal hemorrhage hazard. Current baseline INR is already elevated at 3.4.",
        rule_id: "RULE-DDI-CYP2C9-001",
      },
    ],
    simulated_orders: [
      {
        simulation_id: "SIM-ORD-001",
        proposed_action: "Reduce Warfarin maintenance dose by 50% (2.5 mg PO Daily) OR Substitute Antifungal with Micafungin 100 mg IV Daily",
        rationale: "Immediate dose reduction or non-interacting antifungal substitution is necessary to prevent lethal hemorrhagic complications in atrial fibrillation.",
        doctor_action: "CO-SIGN_REQUIRED",
      },
    ],
    explainable_ai: {
      badge: "EXPLAINABLE CLINICAL AI",
      powered_by: "Local Multi-Agent Clinical Inference",
      disclaimer: "AI explanation synthesizes deterministic clinical rules, laboratory parameters, and pharmacogenomic metabolic pathways.",
      why_flagged: "Fluconazole is a potent competitive inhibitor of hepatic cytochrome P450 2C9 (CYP2C9), the primary clearance pathway for the more potent S-enantiomer of Warfarin.",
      mechanism: "Inhibition of CYP2C9 reduces the clearance of S-warfarin by approximately 70%, dramatically increasing serum half-life and inhibiting vitamin K epoxide reductase recycling.",
      significance: "Major bleeding hazard (intracranial hemorrhage, severe gastrointestinal bleed) with expected INR trajectory exceeding 4.5 within 48 to 72 hours.",
      alternatives: "1) Convert Fluconazole to IV Micafungin 100 mg daily (negligible CYP2C9 interaction). 2) Reduce Warfarin dose to 2.5 mg daily with mandatory Day 3 repeat INR.",
      monitoring: "Repeat INR within 48 hours; daily inspection for epistaxis, hematuria, or spontaneous ecchymosis.",
      reversible_actions: "Vitamin K1 (Phytonadione) 5–10 mg slow IV infusion or 4-Factor Prothrombin Complex Concentrate (4F-PCC) for acute reversal.",
    },
    lab_evidence: {
      lab_report_id: "LAB-2026-0001",
      evidence_id: "AEGIS-DEMO-EV-001",
      source: "Pathology Core Lab (Verified Internal Repo)",
      source_document: "data/lab_reports/LAB-2026-0001.json",
      findings: "INR 3.4 (Reference 0.8-1.2), PT 34.2s (Reference 11.0-13.5s). Coagulation panel verified.",
    },
    six_agents_trace: [
      { agent: "1. Clinical Triage & Ingestion", status: "VERIFIED", summary: "Patient CASE-001 active orders ingested: Warfarin 5mg + Fluconazole 200mg." },
      { agent: "2. Pharmacogenomics & Metabolic Path", status: "ALERT", summary: "CYP2C9 competitive clearance inhibition triggered with S-warfarin AUC elevation." },
      { agent: "3. Renal & Hepatic Risk Clearance", status: "NOMINAL", summary: "Hepatic transaminases within normal ranges; renal clearance preserved." },
      { agent: "4. Drug-Drug Interaction Graph", status: "CRITICAL", summary: "High-priority DDI edge matched against validated clinical rule AEGIS-DDI-001." },
      { agent: "5. Explicator & Knowledge Provenance", status: "COMPLETE", summary: "Generated structured 6-point clinical rationale with FDA boxed warning citation." },
      { agent: "6. Dynamic Resolution Engine", status: "ACTIONABLE", summary: "Produced 2 actionable alternatives: 50% dose reduction or Micafungin substitution." },
    ],
    deterministic_verification: {
      rules_fired: ["AEGIS-DDI-CYP2C9-001", "AEGIS-LAB-INR-CRIT-3.0"],
      chain_intact: true,
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
    audit_event: {
      block_id: 11,
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
    clinical_rationale: "Fluconazole acts as a potent inhibitor of CYP2C9 and CYP3A4. S-warfarin is 3–5 times more potent than R-warfarin as a vitamin K antagonist. Impaired hepatic clearance leads to exponential accumulation of circulating anticoagulant factor.",
  },
  2: {
    scenario_id: 2,
    patient: { identifier: "CASE-002", name: "Robert Chen", mrn: "MRN-2026-8812" },
    findings: [
      {
        title: "HIGH RISK: LMWH Accumulation in Declining Renal Clearance (Enoxaparin)",
        severity: "HIGH",
        description: "Enoxaparin Sodium (Lovenox) therapeutic anticoagulation prescribed at 80 mg SC Daily in a patient with severe acute renal impairment (Serum Creatinine 2.4 mg/dL, eGFR 28 mL/min). LMWH relies predominantly on renal clearance; anti-Xa levels will accumulate uncontrollably.",
        rule_id: "RULE-RENAL-LMWH-002",
      },
    ],
    simulated_orders: [
      {
        simulation_id: "SIM-ORD-002",
        proposed_action: "Adjust Enoxaparin to Renal Sparing Dose (30 mg SC Once Daily) OR Convert to Unfractionated Heparin (UFH) with aPTT Monitoring",
        rationale: "Severe renal insufficiency (eGFR < 30 mL/min) requires 50-60% dosage decrease to prevent catastrophic internal bleeding.",
        doctor_action: "CO-SIGN_REQUIRED",
      },
    ],
    explainable_ai: {
      badge: "EXPLAINABLE CLINICAL AI",
      powered_by: "Local Multi-Agent Clinical Inference",
      disclaimer: "AI explanation synthesizes deterministic clinical rules, renal clearance calculations, and formulary brand alternatives.",
      why_flagged: "Enoxaparin anti-Factor Xa clearance is directly proportional to creatinine clearance. At eGFR < 30 mL/min, drug half-life doubles from 4.5 hours to >9 hours.",
      mechanism: "Reduced glomerular filtration leads to progressive retention of active low-molecular-weight heparin chains, compounding systemic anticoagulant activity.",
      significance: "Extremely high hemorrhagic hazard, particularly retroperitoneal or gastrointestinal bleeding.",
      alternatives: "1) Dose adjust Enoxaparin to 30 mg SC once daily. 2) Switch to Unfractionated Heparin (non-renally cleared) titrated to target aPTT 60–80 seconds.",
      monitoring: "Check peak anti-Xa level 4 hours post-dose (target 0.5–1.0 IU/mL); serial serum creatinine and hemoglobin.",
      reversible_actions: "Protamine Sulfate IV infusion (partially neutralizes anti-Xa activity, ~60%).",
    },
    lab_evidence: {
      lab_report_id: "LAB-2026-0002",
      evidence_id: "AEGIS-DEMO-EV-002",
      source: "Pathology Core Lab (Verified Internal Repo)",
      source_document: "data/lab_reports/LAB-2026-0002.json",
      findings: "Serum Creatinine 2.4 mg/dL (Baseline 1.8), eGFR 28 mL/min/1.73m² (Critical Low).",
    },
    six_agents_trace: [
      { agent: "1. Clinical Triage & Ingestion", status: "VERIFIED", summary: "Patient CASE-002 order ingested: Enoxaparin 80 mg SC Daily." },
      { agent: "2. Pharmacogenomics & Metabolic Path", status: "NOMINAL", summary: "Non-hepatic clearance pathway evaluated." },
      { agent: "3. Renal & Hepatic Risk Clearance", status: "CRITICAL", summary: "eGFR calculated at 28 mL/min; contraindication threshold reached." },
      { agent: "4. Drug-Drug Interaction Graph", status: "ALERT", summary: "Flagged therapeutic accumulation risk under Renal Impairment Module." },
      { agent: "5. Explicator & Knowledge Provenance", status: "COMPLETE", summary: "Retrieved KDIGO clinical guidelines and manufacturer boxed dosage restrictions." },
      { agent: "6. Dynamic Resolution Engine", status: "ACTIONABLE", summary: "Formulated renal dosage adjustment & hospital formulary brand substitution pathway." },
    ],
    deterministic_verification: {
      rules_fired: ["AEGIS-RENAL-EGFR-SUB30", "AEGIS-DOSE-LMWH-80MG"],
      chain_intact: true,
      hash: "7b4c8011239aa8e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca4",
    },
    audit_event: {
      block_id: 12,
      hash: "7b4c8011239aa8e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca4",
    },
    clinical_rationale: "Unlike unfractionated heparin which undergoes hepatic clearance via the reticuloendothelial system, low-molecular-weight heparins depend on renal elimination. In Stage 4 CKD, standard therapeutic dosing results in accumulation.",
  },
  3: {
    scenario_id: 3,
    patient: { identifier: "CASE-003", name: "Elena Rostova", mrn: "MRN-2026-7731" },
    findings: [
      {
        title: "HIGH RISK: Duplicate Angiotensin-Converting Enzyme (ACE) Inhibitor Therapy",
        severity: "HIGH",
        description: "Concurrent orders detected for Lisinopril 20 mg PO Daily and Enalapril Maleate 10 mg PO Daily. Dual ACE inhibitor administration confers zero incremental antihypertensive benefit while substantially multiplying the risk of acute refractory hypotension, severe hyperkalemia, and sudden renal decompensation.",
        rule_id: "RULE-DUP-ACEI-003",
      },
    ],
    simulated_orders: [
      {
        simulation_id: "SIM-ORD-003",
        proposed_action: "Deprescribe Enalapril 10 mg PO Daily; Maintain Single-Agent Lisinopril 20 mg PO Daily with Serum Electrolyte Follow-up",
        rationale: "Therapeutic duplication within the same pharmacological class must be resolved immediately to protect hemodynamics.",
        doctor_action: "CO-SIGN_REQUIRED",
      },
    ],
    explainable_ai: {
      badge: "EXPLAINABLE CLINICAL AI",
      powered_by: "Local Multi-Agent Clinical Inference",
      disclaimer: "AI explanation synthesizes deterministic clinical rules and therapeutic duplication safeguards.",
      why_flagged: "Both medications belong to the same pharmacologic class (ACE inhibitors) and exert identical mechanisms on the renin-angiotensin-aldosterone axis.",
      mechanism: "Dual ACE inhibition causes excessive systemic vasodilation, blunts aldosterone production causing potassium retention, and causes efferent arteriolar vasodilation reducing intraglomerular pressure.",
      significance: "Severe orthostatic hypotension, syncope, hyperkalemia (>5.5 mEq/L), and acute kidney injury.",
      alternatives: "Deprescribe one ACE inhibitor. If additional blood pressure reduction is required, add a complementary class (e.g. Amlodipine 5 mg or Chlorthalidone 12.5 mg).",
      monitoring: "Blood pressure standing and seated; basic metabolic panel (potassium and creatinine) in 7–14 days.",
      reversible_actions: "Fluid resuscitation with normal saline for acute hypotension; calcium gluconate/insulin-dextrose for acute hyperkalemia.",
    },
    lab_evidence: {
      lab_report_id: "LAB-2026-0003",
      evidence_id: "AEGIS-DEMO-EV-003",
      source: "Pathology Core Lab (Verified Internal Repo)",
      source_document: "data/lab_reports/LAB-2026-0003.json",
      findings: "Potassium 4.4 mEq/L (Normal), Creatinine 0.85 mg/dL (Normal).",
    },
    six_agents_trace: [
      { agent: "1. Clinical Triage & Ingestion", status: "VERIFIED", summary: "Detected 2 active renin-angiotensin system inhibitor orders." },
      { agent: "2. Pharmacogenomics & Metabolic Path", status: "NOMINAL", summary: "Class effect duplication verification." },
      { agent: "3. Renal & Hepatic Risk Clearance", status: "ALERT", summary: "Renal hemodynamics vulnerability flagged." },
      { agent: "4. Drug-Drug Interaction Graph", status: "ALERT", summary: "Therapeutic class duplication edge flagged with maximum priority." },
      { agent: "5. Explicator & Knowledge Provenance", status: "COMPLETE", summary: "Mapped to AHA/ACC 2024 Hypertension guidelines against dual RAS blockade." },
      { agent: "6. Dynamic Resolution Engine", status: "ACTIONABLE", summary: "Triggered 1-click Deprescribing recommendation." },
    ],
    deterministic_verification: {
      rules_fired: ["AEGIS-DUP-CLASS-ACEI", "AEGIS-GUIDELINE-RAS-DUAL"],
      chain_intact: true,
      hash: "189abcde0912384e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca",
    },
    audit_event: {
      block_id: 13,
      hash: "189abcde0912384e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca",
    },
    clinical_rationale: "Dual renin-angiotensin-aldosterone system inhibition has been definitively established in major clinical trials (e.g. ONTARGET, ALTITUDE) to produce harm without cardiovascular benefit.",
  },
};
