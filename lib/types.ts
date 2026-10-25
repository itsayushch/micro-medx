export type RoleType = "Doctor" | "Nurse" | "Clinical Pharmacist" | "Administrator";

export interface ClinicalPersona {
  phone: string;
  name: string;
  roleTitle: RoleType;
  dept: string;
  avatar: string;
  greeting: string;
}

export interface UserSession {
  user_id: number;
  phone: string;
  name: string;
  role: RoleType;
  department: string;
  session_token?: string;
  is_authenticated: boolean;
}

// ==========================================
// PATIENT DIRECTORY & EHR TYPES
// ==========================================
export interface PatientDirectoryItem {
  id: string; // CASE-001 or PT-005
  name: string;
  age: number;
  sex: "M" | "F";
  dept: string;
  condition: string;
  regimen: string;
  risk: "Critical" | "High" | "Moderate" | "Low";
  clinician: string;
}

export interface PatientHistoryDetail {
  case_id: string;
  patient_identifier: string;
  name: string;
  mrn: string;
  age: number;
  sex: string;
  blood_group: string;
  allergies_summary: string;
  conditions_summary: string;
  last_updated: string;
  timeline: Array<{
    date: string;
    event: string;
    actor: string;
    badge: string;
  }>;
  medical_conditions: Array<{
    condition: string;
    diagnosis_date: string;
    status: string;
    notes: string;
  }>;
  medication_history: Array<{
    medication: string;
    strength: string;
    route: string;
    start_date: string;
    end_date: string;
    status: string;
    prescribing_doctor: string;
  }>;
  allergies: Array<{
    allergen: string;
    reaction: string;
    severity: string;
    recorded_date: string;
  }>;
  laboratory_history: Array<{
    date: string;
    test: string;
    result: string;
    unit: string;
    reference_range: string;
    status: string;
    source_report_id?: string;
    source_doc?: string;
  }>;
  clinical_assessments: Array<{
    date: string;
    assessment: string;
    risk_level: string;
    recommendation: string;
    doctor: string;
  }>;
  pharmacy_events: Array<{
    date: string;
    medication: string;
    availability: string;
    substitution_request: string;
    doctor_verification: string;
    dispensing_status: string;
  }>;
  audit_events: Array<{
    timestamp: string;
    user_role: string;
    action: string;
    event_type: string;
    audit_hash: string;
  }>;
}

// ==========================================
// DOCTOR TYPES
// ==========================================
export interface SubstitutionRequestItem {
  case_id: string;
  patient_name: string;
  patient_identifier: string;
  original_prescription: string;
  suggested_alternative: string;
  stock_detail: string;
  pharmacist_name: string;
  request_time: string;
  clinical_reason: string;
  status: "PENDING_DOCTOR_APPROVAL" | "APPROVED" | "REJECTED";
}

export interface PendingCosignItem {
  simulation_id: string;
  case_id: string;
  patient_identifier: string;
  patient_name: string;
  proposed_action: string;
  rationale: string;
  status: string;
  urgency: "CRITICAL" | "HIGH" | "STANDARD";
}

export interface DoctorFinding {
  id: string;
  patient_id: string;
  patient_name: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  description: string;
  rule_id: string;
  created_at: string;
}

export interface DoctorDashboardData {
  role: "Doctor";
  stats: {
    total_patients: number;
    pending_cosigns_count: number;
    active_findings_count: number;
    substitution_requests_count: number;
  };
  substitution_requests: SubstitutionRequestItem[];
  pending_cosigns: PendingCosignItem[];
  inpatients: PatientDirectoryItem[];
  active_findings: DoctorFinding[];
}

export interface ExplainableAIInsight {
  badge?: string;
  powered_by?: string;
  disclaimer?: string;
  why_flagged?: string;
  mechanism?: string;
  significance?: string;
  alternatives?: string;
  monitoring?: string;
  reversible_actions?: string;
}

export interface SixAgentResult {
  scenario_id?: number;
  findings: Array<{
    title: string;
    severity: string;
    description: string;
    rule_id?: string;
  }>;
  simulated_orders: Array<{
    simulation_id?: string;
    proposed_action: string;
    rationale: string;
    doctor_action?: string;
  }>;
  explainable_ai: ExplainableAIInsight;
  lab_evidence: {
    lab_report_id?: string;
    evidence_id?: string;
    source?: string;
    source_document?: string;
    findings?: string;
  };
  six_agents_trace?: Array<{
    agent: string;
    status: string;
    summary: string;
  }>;
  deterministic_verification?: {
    rules_fired?: string[];
    chain_intact?: boolean;
    hash?: string;
  };
  audit_event?: {
    block_id?: number;
    hash?: string;
  };
  patient?: {
    identifier: string;
    name: string;
    mrn?: string;
  };
  clinical_rationale?: string;
}

// ==========================================
// NURSE TYPES
// ==========================================
export interface NurseMARItem {
  mar_id: string;
  case_id: string;
  patient_identifier: string;
  patient_name: string;
  medication: string;
  dose: string;
  route: string;
  scheduled_time: string;
  status: "DUE" | "ADMINISTERED" | "HELD" | "MISSED" | "PENDING";
  prescribing_doctor: string;
  nursing_note?: string;
  clinical_alert?: string | null;
  requires_escalation?: boolean;
  recorded_by?: string | null;
  recorded_at?: string | null;
  hold_reason?: string | null;
  barcode_scanned?: boolean;
}

export interface NurseVitalLabItem {
  id: string;
  case_id: string;
  patient_identifier: string;
  patient_name: string;
  parameter: string;
  value: string;
  unit: string;
  recorded_time: string;
  status: "Normal" | "High" | "Critical" | "Low";
  source_type: string;
  recorded_by: string;
  notes?: string;
  reference_range?: string;
}

export interface NurseDashboardData {
  role: "Nurse";
  stats: {
    medications_due: number;
    medications_administered: number;
    medications_held: number;
    vitals_recorded: number;
    attention_required: number;
  };
  mar_schedule: NurseMARItem[];
  vitals_labs: NurseVitalLabItem[];
}

// ==========================================
// PHARMACIST TYPES
// ==========================================
export interface MedicationAlternative {
  brand_name: string;
  generic_name: string;
  strength: string;
  formulation: string;
  same_active_ingredient: boolean;
  same_strength: boolean;
  availability: "AVAILABLE" | "UNAVAILABLE";
  stock: string;
}

export interface AvailabilityQueueItem {
  case_id: string;
  patient_id: number;
  patient_name: string;
  patient_identifier: string;
  mrn: string;
  age: number;
  sex: string;
  prescribed_medicine: string;
  prescribed_brand: string;
  generic_name: string;
  strength: string;
  formulation: string;
  route: string;
  frequency: string;
  prescribing_doctor: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
  available_quantity: number;
  available_qty_formatted: string;
  status: string;
  substitution_status: string;
  is_ready_for_dispensing: boolean;
  doctor_recommendation?: string;
  doctor_suggested_alt?: string;
  alt_availability?: string;
  available_alternatives: MedicationAlternative[];
  action: string;
  lot_number?: string;
  bin_location?: string;
}

export interface InventoryItem {
  medication: string;
  brand_name: string;
  strength: string;
  formulation: string;
  stock: number;
  unit: string;
  status: "AVAILABLE" | "LOW_STOCK" | "UNAVAILABLE";
  location: string;
  batch: string;
  expiry: string;
  unit_price?: string;
}

export interface PharmacologyReferenceItem {
  pair: string;
  mechanism: string;
  clinical_impact: string;
  recommended_action: string;
  evidence_source: string;
  evidence_id: string;
  provenance: string;
}

export interface PharmacistDashboardData {
  role: "Clinical Pharmacist";
  stats: {
    prescriptions_received: number;
    available: number;
    substitution_required: number;
    dispensed_today: number;
    high_risk_flagged: number;
    inventory_value: string;
  };
  availability_queue: AvailabilityQueueItem[];
  local_inventory: InventoryItem[];
  pharmacology_insights: PharmacologyReferenceItem[];
}

// ==========================================
// AUDIT & ADMIN TYPES
// ==========================================
export interface AuditLedgerRecord {
  id: number;
  timestamp: string;
  actor: string;
  role: string;
  category: "CLINICAL" | "VERIFICATION" | "SUBSTITUTION" | "SAFETY" | "AUDIT";
  entity: string;
  action: string;
  result: string;
  prev_hash: string;
  current_hash: string;
  payload: {
    block_id: number;
    timestamp: string;
    actor: string;
    role: string;
    action: string;
    entity: string;
    cryptographic_verification: string;
    [key: string]: unknown;
  };
}

export interface AdminDashboardData {
  stats: {
    total_patients: number;
    total_audit_events: number;
    tamper_checks_passed: boolean;
    chain_length: number;
    active_inpatients: number;
    critical_interventions: number;
  };
  audit_records: AuditLedgerRecord[];
  patients: PatientDirectoryItem[];
}

// ==========================================
// LAB REPORT SOURCE TYPES
// ==========================================
export interface LabReportDetail {
  lab_report_id: string;
  case_id: string;
  patient_identifier: string;
  patient_name: string;
  collection_date: string;
  report_date: string;
  category: string;
  clinical_indication: string;
  source_document: string;
  evidence_status: string;
  last_reviewed: string;
  laboratory_facility: string;
  sha256_checksum: string;
  results: Array<{
    test_name: string;
    result: string;
    unit: string;
    reference_range: string;
    status: string;
    clinical_significance: string;
  }>;
}
