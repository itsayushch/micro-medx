import {
  AdminDashboardData,
  DoctorDashboardData,
  NurseDashboardData,
  PharmacistDashboardData,
} from "./types";
import {
  DEMO_SCENARIO_RESULTS,
  generateSyntheticAuditLedger,
  generateSyntheticPatients,
  INITIAL_INVENTORY,
  INITIAL_NURSE_MAR,
  INITIAL_NURSE_VITALS,
  INITIAL_PHARMACIST_QUEUE,
  PHARMACOLOGY_REFERENCE,
} from "./mock-data";

const patients = generateSyntheticPatients(4);

export const MOCK_DOCTOR_DASHBOARD: DoctorDashboardData = {
  role: "Doctor",
  stats: { total_patients: patients.length, pending_cosigns_count: 1, active_findings_count: 0, substitution_requests_count: 1 },
  substitution_requests: [{
    request_id: 9001, case_id: "CASE-002", patient_name: "Robert Chen", patient_identifier: "DEMO-PT-002",
    original_prescription: "Enoxaparin 80 mg", suggested_alternative: "Clexane 80 mg",
    stock_detail: "Demo inventory: available", pharmacist_name: "Demo Pharmacist",
    request_time: "Demo request", clinical_reason: "Demo substitution request",
    status: "PENDING_DOCTOR_APPROVAL",
  }],
  pending_cosigns: [{
    simulation_id: "DEMO-SIM-001", case_id: "CASE-001", patient_identifier: "DEMO-PT-001",
    patient_name: "Sarah Jenkins", proposed_action: "Review the demo scenario",
    rationale: "Static demonstration record; not a patient-specific recommendation.",
    status: "PENDING", urgency: "STANDARD",
  }],
  inpatients: patients,
  active_findings: [],
};

export const MOCK_NURSE_DASHBOARD: NurseDashboardData = {
  role: "Nurse",
  stats: {
    medications_due: INITIAL_NURSE_MAR.filter((item) => item.status === "DUE").length,
    medications_administered: INITIAL_NURSE_MAR.filter((item) => item.status === "ADMINISTERED").length,
    medications_held: INITIAL_NURSE_MAR.filter((item) => item.status === "HELD").length,
    vitals_recorded: INITIAL_NURSE_VITALS.length,
    attention_required: INITIAL_NURSE_MAR.filter((item) => item.requires_escalation).length,
  },
  mar_schedule: INITIAL_NURSE_MAR,
  vitals_labs: INITIAL_NURSE_VITALS,
  patients: patients.map((patient) => ({ patient_identifier: patient.id, name: patient.name })),
  mar_schedule_available: true,
  mar_schedule_note: "Static demo data; actions are not saved.",
};

export const MOCK_PHARMACIST_DASHBOARD: PharmacistDashboardData = {
  role: "Clinical Pharmacist",
  stats: {
    prescriptions_received: INITIAL_PHARMACIST_QUEUE.length,
    available: INITIAL_PHARMACIST_QUEUE.filter((item) => item.availability === "AVAILABLE").length,
    substitution_required: 1,
    dispensed_today: 2,
    high_risk_flagged: 2,
    inventory_value: "Demo only",
  },
  availability_queue: INITIAL_PHARMACIST_QUEUE,
  local_inventory: INITIAL_INVENTORY,
  pharmacology_insights: PHARMACOLOGY_REFERENCE,
};

export const MOCK_ADMIN_DASHBOARD: AdminDashboardData = {
  stats: {
    total_patients: patients.length,
    total_audit_events: generateSyntheticAuditLedger().length,
    tamper_checks_passed: false,
    chain_length: generateSyntheticAuditLedger().length,
    active_inpatients: patients.length,
    critical_interventions: DEMO_SCENARIO_RESULTS[1]?.findings.length || 0,
  },
  audit_records: generateSyntheticAuditLedger(),
  patients,
};
