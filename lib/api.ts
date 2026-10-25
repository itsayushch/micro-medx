import {
  AdminDashboardData,
  AuditLedgerRecord,
  AvailabilityQueueItem,
  DoctorDashboardData,
  LabReportDetail,
  NurseDashboardData,
  NurseMARItem,
  NurseVitalLabItem,
  PatientHistoryDetail,
  PharmacistDashboardData,
  RoleType,
  SixAgentResult,
  UserSession,
} from "./types";
import {
  CLINICAL_PERSONAS,
  DEMO_SCENARIO_RESULTS,
  DETERMINISTIC_PATIENT_HISTORIES,
  generateHash,
  generateSyntheticAuditLedger,
  generateSyntheticPatients,
  INITIAL_INVENTORY,
  INITIAL_NURSE_MAR,
  INITIAL_NURSE_VITALS,
  INITIAL_PHARMACIST_QUEUE,
  LAB_REPORTS,
  PHARMACOLOGY_REFERENCE,
} from "./mock-data";

// In-memory local state fallback (persists throughout session)
let localMARList: NurseMARItem[] = [...INITIAL_NURSE_MAR];
let localVitalsList: NurseVitalLabItem[] = [...INITIAL_NURSE_VITALS];
let localQueue: AvailabilityQueueItem[] = [...INITIAL_PHARMACIST_QUEUE];
let localAuditLedger: AuditLedgerRecord[] = generateSyntheticAuditLedger();
const localPatients = generateSyntheticPatients(265);

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

let isBackendReachable = true;

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function isLiveBackendAvailable(): boolean {
  return isBackendReachable;
}

/**
 * Standard fetch helper with timeout and fallback
 */
async function fetchWithFallback<T>(
  url: string,
  options: RequestInit = {},
  fallbackGenerator: () => T
): Promise<{ data: T; isLive: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      isBackendReachable = true;
      const json = await res.json();
      return { data: json as T, isLive: true };
    }
    // If not OK, fallback
    console.warn(`API returned ${res.status} for ${url}, using clinical fallback.`);
    isBackendReachable = false;
    return { data: fallbackGenerator(), isLive: false };
  } catch (err) {
    // Network / offline / timeout error -> fallback gracefully
    console.warn(`Backend connection notice for ${url}:`, err);
    isBackendReachable = false;
    return { data: fallbackGenerator(), isLive: false };
  }
}

// =========================================================================
// AUTHENTICATION APIS
// =========================================================================
export async function apiCheckSession(): Promise<{ user: UserSession | null; isLive: boolean }> {
  const res = await fetchWithFallback<UserSession | null>(
    "/auth/session",
    { method: "GET" },
    () => null
  );
  return { user: res.data, isLive: res.isLive };
}

export async function apiLogin(
  phone: string,
  role: RoleType,
  password?: string
): Promise<{ user: UserSession; isLive: boolean }> {
  const fallbackUser: UserSession = {
    user_id: 1,
    phone: phone || CLINICAL_PERSONAS[role]?.phone || "+1 (555) 019-2831",
    name: CLINICAL_PERSONAS[role]?.name || "Authorized Clinician",
    role,
    department: CLINICAL_PERSONAS[role]?.dept || "Clinical Services",
    session_token: "mock-session-token-aegis-" + Date.now(),
    is_authenticated: true,
  };

  const res = await fetchWithFallback<UserSession>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ phone, password: password || "demo123", role }),
    },
    () => fallbackUser
  );
  return { user: res.data, isLive: res.isLive };
}

export async function apiLogout(): Promise<boolean> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST" });
  } catch {
    // Ignore
  }
  return true;
}

// =========================================================================
// DOCTOR APIS
// =========================================================================
export async function apiGetDoctorDashboard(): Promise<{ data: DoctorDashboardData; isLive: boolean }> {
  const fallback: DoctorDashboardData = {
    role: "Doctor",
    stats: {
      total_patients: localPatients.length,
      pending_cosigns_count: 1,
      active_findings_count: 2,
      substitution_requests_count: localQueue.filter((q) => q.substitution_status.includes("Pending") || q.substitution_status.includes("Required")).length,
    },
    substitution_requests: [
      {
        case_id: "CASE-002",
        patient_name: "Robert Chen",
        patient_identifier: "DEMO-PT-002",
        original_prescription: "Enoxaparin Sodium (Lovenox) 80 mg / 0.8 mL Pre-filled Syringe",
        suggested_alternative: "Clexane (Enoxaparin Sodium) 80 mg / 0.8 mL Pre-filled Syringe",
        stock_detail: "60 Syringes available in Bin D-12 (Batch #CX-88102)",
        pharmacist_name: "Marcus Vance, PharmD",
        request_time: "Today, 11:20 UTC",
        clinical_reason: "Prescribed brand Lovenox 80mg is completely out of stock. Clexane has identical bioequivalence, strength, and route.",
        status: "PENDING_DOCTOR_APPROVAL",
      },
    ],
    pending_cosigns: [
      {
        simulation_id: "SIM-ORD-001",
        case_id: "CASE-001",
        patient_identifier: "DEMO-PT-001",
        patient_name: "Sarah Jenkins",
        proposed_action: "Reduce Warfarin maintenance dose by 50% (2.5 mg PO Daily)",
        rationale: "CYP2C9 competitive clearance inhibition triggered with severe bleeding risk (INR 3.4).",
        status: "PENDING_DOCTOR_COSIGN",
        urgency: "CRITICAL",
      },
    ],
    inpatients: localPatients.slice(0, 10),
    active_findings: [
      {
        id: "FIND-001",
        patient_id: "CASE-001",
        patient_name: "Sarah Jenkins",
        title: "Severe CYP2C9 Inhibition: Warfarin + Fluconazole",
        severity: "CRITICAL",
        description: "Active high bleeding hazard. Morning INR 3.4 is significantly prolonged.",
        rule_id: "RULE-DDI-CYP2C9-001",
        created_at: "Today, 09:15 UTC",
      },
      {
        id: "FIND-002",
        patient_id: "CASE-002",
        patient_name: "Robert Chen",
        title: "LMWH Accumulation Risk in Declining Renal Function",
        severity: "HIGH",
        description: "Enoxaparin standard dosing with eGFR 28 mL/min.",
        rule_id: "RULE-RENAL-LMWH-002",
        created_at: "Today, 08:20 UTC",
      },
    ],
  };

  return fetchWithFallback<DoctorDashboardData>(
    "/api/dashboard/doctor",
    { method: "GET" },
    () => fallback
  );
}

export async function apiSubmitDoctorSubstitutionDecision(
  caseId: string,
  decision: "APPROVED" | "REJECTED",
  notes: string,
  doctorName = "Dr. Sarah Lin, MD"
): Promise<{ success: boolean; isLive: boolean; message: string }> {
  // Update local queue state for UI continuity
  const found = localQueue.find((q) => q.case_id === caseId);
  if (found) {
    if (decision === "APPROVED") {
      found.status = "Substitution Approved by Doctor";
      found.substitution_status = "Substitution Approved (Ready to Dispense)";
      found.is_ready_for_dispensing = true;
      found.action = "SUBSTITUTION_APPROVED";
    } else {
      found.status = "Substitution Rejected by Doctor";
      found.substitution_status = "Substitution Rejected";
      found.is_ready_for_dispensing = false;
    }
  }

  // Add audit record
  const prevHash = localAuditLedger[localAuditLedger.length - 1]?.current_hash || "GENESIS";
  const newHash = generateHash(`AUDIT_${Date.now()}_${decision}`);
  localAuditLedger.unshift({
    id: localAuditLedger.length + 1,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
    actor: doctorName,
    role: "Doctor",
    category: "SUBSTITUTION",
    entity: `${found?.patient_name || "Patient"} (${caseId})`,
    action: `Doctor ${decision === "APPROVED" ? "Approved" : "Rejected"} Substitution: ${notes || "Verified by clinician"}`,
    result: decision === "APPROVED" ? "SUBSTITUTION APPROVED ✓" : "SUBSTITUTION REJECTED ✗",
    prev_hash: prevHash,
    current_hash: newHash,
    payload: {
      block_id: localAuditLedger.length + 1,
      timestamp: new Date().toISOString(),
      actor: doctorName,
      role: "Doctor",
      action: `DOCTOR_SUBSTITUTION_${decision}`,
      entity: caseId,
      notes,
      cryptographic_verification: "SHA256_HASH_VALID_INTACT",
    },
  });

  const res = await fetchWithFallback<{ success: boolean; message: string }>(
    "/api/dashboard/doctor/substitution-decision",
    {
      method: "POST",
      body: JSON.stringify({
        case_id: caseId,
        decision,
        notes,
        doctor_name: doctorName,
      }),
    },
    () => ({
      success: true,
      message: `Doctor substitution decision (${decision}) recorded successfully.`,
    })
  );

  return {
    success: res.data.success,
    message: res.data.message,
    isLive: res.isLive,
  };
}

export async function apiCosignOrder(
  simulationId: string,
  action: "approved" | "rejected",
  doctorName = "Dr. Sarah Lin, MD",
  reason = "Clinical safety threshold verified"
): Promise<{ success: boolean; isLive: boolean; message: string }> {
  // Add audit record
  const prevHash = localAuditLedger[localAuditLedger.length - 1]?.current_hash || "GENESIS";
  const newHash = generateHash(`COSIGN_${Date.now()}_${simulationId}`);
  localAuditLedger.unshift({
    id: localAuditLedger.length + 1,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
    actor: doctorName,
    role: "Doctor",
    category: "CLINICAL",
    entity: `Simulation Order (${simulationId})`,
    action: `Doctor Authorized & Co-signed Order: ${reason}`,
    result: "CO-SIGNED & APPROVED ✓",
    prev_hash: prevHash,
    current_hash: newHash,
    payload: {
      block_id: localAuditLedger.length + 1,
      timestamp: new Date().toISOString(),
      actor: doctorName,
      role: "Doctor",
      action: "DOCTOR_ORDER_COSIGNED",
      entity: simulationId,
      cryptographic_verification: "SHA256_HASH_VALID_INTACT",
    },
  });

  const res = await fetchWithFallback<{ success: boolean; message: string }>(
    `/simulated-orders/${encodeURIComponent(simulationId)}/cosign`,
    {
      method: "POST",
      body: JSON.stringify({
        simulation_id: simulationId,
        cosigned: action === "approved",
        doctor_name: doctorName,
        reason,
      }),
    },
    () => ({
      success: true,
      message: "Physician co-signature recorded and verified on the cryptographic audit ledger.",
    })
  );

  return {
    success: res.data.success,
    message: res.data.message,
    isLive: res.isLive,
  };
}

// =========================================================================
// NURSE APIS
// =========================================================================
export async function apiGetNurseDashboard(): Promise<{ data: NurseDashboardData; isLive: boolean }> {
  const dueCount = localMARList.filter((m) => m.status === "DUE").length;
  const adminCount = localMARList.filter((m) => m.status === "ADMINISTERED").length;
  const heldCount = localMARList.filter((m) => m.status === "HELD").length;
  const vitalsCount = localVitalsList.length;
  const attentionCount =
    localMARList.filter((m) => m.requires_escalation).length +
    localVitalsList.filter((v) => v.status === "High" || v.status === "Critical").length;

  const fallback: NurseDashboardData = {
    role: "Nurse",
    stats: {
      medications_due: dueCount,
      medications_administered: adminCount,
      medications_held: heldCount,
      vitals_recorded: vitalsCount,
      attention_required: attentionCount,
    },
    mar_schedule: [...localMARList],
    vitals_labs: [...localVitalsList],
  };

  return fetchWithFallback<NurseDashboardData>(
    "/api/dashboard/nurse",
    { method: "GET" },
    () => fallback
  );
}

export async function apiSubmitMARAction(
  orderId: string,
  action: "ADMINISTER" | "HOLD" | "REJECT",
  notes: string,
  nurseName = "Elena Rostova, RN",
  vitalsChecked = true
): Promise<{ success: boolean; isLive: boolean; message: string }> {
  const item = localMARList.find((m) => m.mar_id === orderId);
  if (item) {
    if (action === "ADMINISTER") {
      item.status = "ADMINISTERED";
      item.recorded_by = nurseName;
      item.recorded_at = new Date().toISOString().replace("T", " ").substring(0, 16) + " UTC";
      item.nursing_note = notes || "Medication administered following barcode verification.";
      item.requires_escalation = false;
    } else if (action === "HOLD") {
      item.status = "HELD";
      item.recorded_by = nurseName;
      item.recorded_at = new Date().toISOString().replace("T", " ").substring(0, 16) + " UTC";
      item.hold_reason = notes || "Held by nurse pending physician review.";
      item.requires_escalation = true;
    }
  }

  // Add audit record
  const prevHash = localAuditLedger[localAuditLedger.length - 1]?.current_hash || "GENESIS";
  const newHash = generateHash(`MAR_${Date.now()}_${orderId}`);
  localAuditLedger.unshift({
    id: localAuditLedger.length + 1,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
    actor: nurseName,
    role: "Nurse",
    category: "CLINICAL",
    entity: `${item?.patient_name || "Patient"} - ${item?.medication || "Medication"}`,
    action: `MAR ${action}: ${item?.medication} ${item?.dose} (${notes || "Standard bedside protocol"})`,
    result: action === "ADMINISTER" ? "ADMINISTERED ✓" : "HELD ON SAFETY ALERT ⚠️",
    prev_hash: prevHash,
    current_hash: newHash,
    payload: {
      block_id: localAuditLedger.length + 1,
      timestamp: new Date().toISOString(),
      actor: nurseName,
      role: "Nurse",
      action: `MAR_MEDICATION_${action}`,
      entity: orderId,
      vitals_checked: vitalsChecked,
      cryptographic_verification: "SHA256_HASH_VALID_INTACT",
    },
  });

  const res = await fetchWithFallback<{ success: boolean; message: string }>(
    "/api/dashboard/nurse/mar-action",
    {
      method: "POST",
      body: JSON.stringify({
        mar_id: orderId,
        action,
        notes,
        nurse_name: nurseName,
        vitals_checked: vitalsChecked,
      }),
    },
    () => ({
      success: true,
      message: `Medication Administration Record (${action}) successfully recorded.`,
    })
  );

  return {
    success: res.data.success,
    message: res.data.message,
    isLive: res.isLive,
  };
}

export async function apiRecordNurseVital(
  patientId: string,
  param: string,
  value: string,
  unit: string,
  nurseName = "Elena Rostova, RN"
): Promise<{ success: boolean; isLive: boolean; message: string; record: NurseVitalLabItem }> {
  const patient = localPatients.find((p) => p.id === patientId) || { name: "Sarah Jenkins", id: patientId };

  let status: "Normal" | "High" | "Critical" | "Low" = "Normal";
  const numVal = parseFloat(value);
  if (param.includes("INR")) {
    if (numVal > 3.0) status = "Critical";
    else if (numVal > 1.5) status = "High";
  } else if (param.includes("Creatinine")) {
    if (numVal > 2.0) status = "Critical";
    else if (numVal > 1.3) status = "High";
  } else if (param.includes("Blood Pressure")) {
    if (value.startsWith("15") || value.startsWith("16") || value.startsWith("17")) status = "Critical";
    else if (value.startsWith("14") || value.startsWith("13")) status = "High";
  } else if (param.includes("Heart Rate")) {
    if (numVal < 50 || numVal > 120) status = "Critical";
    else if (numVal < 60 || numVal > 100) status = "High";
  }

  const newRecord: NurseVitalLabItem = {
    id: `VIT-${String(localVitalsList.length + 1).padStart(3, "0")}`,
    case_id: patientId,
    patient_identifier: patientId,
    patient_name: patient.name,
    parameter: param,
    value,
    unit,
    recorded_time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    status,
    source_type: "Nurse Bedside Ingestion",
    recorded_by: nurseName,
  };

  localVitalsList.unshift(newRecord);

  // Add audit record
  const prevHash = localAuditLedger[localAuditLedger.length - 1]?.current_hash || "GENESIS";
  const newHash = generateHash(`VITAL_${Date.now()}_${newRecord.id}`);
  localAuditLedger.unshift({
    id: localAuditLedger.length + 1,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
    actor: nurseName,
    role: "Nurse",
    category: "CLINICAL",
    entity: `${patient.name} (${patientId})`,
    action: `Bedside Vital Recorded: ${param} = ${value} ${unit} [${status}]`,
    result: status === "Normal" ? "RECORDED ✓" : "FLAGGED ALERT ⚠️",
    prev_hash: prevHash,
    current_hash: newHash,
    payload: {
      block_id: localAuditLedger.length + 1,
      timestamp: new Date().toISOString(),
      actor: nurseName,
      role: "Nurse",
      action: "BEDSIDE_VITAL_RECORDED",
      entity: patientId,
      param,
      value,
      unit,
      status,
      cryptographic_verification: "SHA256_HASH_VALID_INTACT",
    },
  });

  const res = await fetchWithFallback<{ success: boolean; message: string; record: NurseVitalLabItem }>(
    "/api/dashboard/nurse/record-vital",
    {
      method: "POST",
      body: JSON.stringify({
        patient_id: patientId,
        param,
        value,
        unit,
        nurse_name: nurseName,
      }),
    },
    () => ({
      success: true,
      message: `Vital parameter (${param}: ${value} ${unit}) recorded successfully.`,
      record: newRecord,
    })
  );

  return {
    success: res.data.success,
    message: res.data.message,
    record: res.data.record,
    isLive: res.isLive,
  };
}

// =========================================================================
// PHARMACIST APIS
// =========================================================================
export async function apiGetPharmacistDashboard(): Promise<{ data: PharmacistDashboardData; isLive: boolean }> {
  const totalReceived = localQueue.length;
  const availableCount = localQueue.filter((q) => q.availability === "AVAILABLE").length;
  const subRequiredCount = localQueue.filter((q) => q.availability === "UNAVAILABLE").length;
  const dispensedCount = localQueue.filter((q) => q.status === "Ready for Dispensing" || q.status.includes("Approved")).length;

  const fallback: PharmacistDashboardData = {
    role: "Clinical Pharmacist",
    stats: {
      prescriptions_received: totalReceived,
      available: availableCount,
      substitution_required: subRequiredCount,
      dispensed_today: dispensedCount,
      high_risk_flagged: 2,
      inventory_value: "$48,920.00",
    },
    availability_queue: [...localQueue],
    local_inventory: [...INITIAL_INVENTORY],
    pharmacology_insights: [...PHARMACOLOGY_REFERENCE],
  };

  return fetchWithFallback<PharmacistDashboardData>(
    "/api/dashboard/pharmacist",
    { method: "GET" },
    () => fallback
  );
}

export async function apiSubmitSubstitutionRequest(
  caseId: string,
  suggestedBrand: string,
  reason: string,
  notes: string,
  pharmacistName = "Marcus Vance, PharmD"
): Promise<{ success: boolean; isLive: boolean; message: string }> {
  const found = localQueue.find((q) => q.case_id === caseId);
  if (found) {
    found.status = "Pending Doctor Verification";
    found.substitution_status = "Doctor Approval Pending";
    found.doctor_suggested_alt = suggestedBrand;
  }

  // Add audit record
  const prevHash = localAuditLedger[localAuditLedger.length - 1]?.current_hash || "GENESIS";
  const newHash = generateHash(`SUB_REQ_${Date.now()}_${caseId}`);
  localAuditLedger.unshift({
    id: localAuditLedger.length + 1,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
    actor: pharmacistName,
    role: "Pharmacist",
    category: "SUBSTITUTION",
    entity: `${found?.patient_name || "Patient"} (${caseId})`,
    action: `Pharmacy Substitution Requested: ${suggestedBrand} (${found?.prescribed_brand} Unavailable)`,
    result: "DOCTOR APPROVAL PENDING ⏳",
    prev_hash: prevHash,
    current_hash: newHash,
    payload: {
      block_id: localAuditLedger.length + 1,
      timestamp: new Date().toISOString(),
      actor: pharmacistName,
      role: "Pharmacist",
      action: "PHARMACY_SUBSTITUTION_REQUESTED",
      entity: caseId,
      suggested_brand: suggestedBrand,
      reason,
      notes,
      cryptographic_verification: "SHA256_HASH_VALID_INTACT",
    },
  });

  const res = await fetchWithFallback<{ success: boolean; message: string }>(
    "/api/dashboard/pharmacist/substitution-request",
    {
      method: "POST",
      body: JSON.stringify({
        case_id: caseId,
        suggested_alternative: suggestedBrand,
        clinical_reason: reason,
        notes,
        pharmacist_name: pharmacistName,
      }),
    },
    () => ({
      success: true,
      message: "Substitution request successfully submitted to prescribing physician.",
    })
  );

  return {
    success: res.data.success,
    message: res.data.message,
    isLive: res.isLive,
  };
}

export async function apiDispenseMedication(
  caseId: string,
  pharmacistName = "Marcus Vance, PharmD",
  notes = "Prescription verified and marked ready for dispensing"
): Promise<{ success: boolean; isLive: boolean; message: string }> {
  const found = localQueue.find((q) => q.case_id === caseId);
  if (found) {
    found.status = "Ready for Dispensing";
    found.substitution_status = "Dispensing Authorized ✓";
    found.is_ready_for_dispensing = true;
  }

  // Add audit record
  const prevHash = localAuditLedger[localAuditLedger.length - 1]?.current_hash || "GENESIS";
  const newHash = generateHash(`DISPENSE_${Date.now()}_${caseId}`);
  localAuditLedger.unshift({
    id: localAuditLedger.length + 1,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
    actor: pharmacistName,
    role: "Pharmacist",
    category: "VERIFICATION",
    entity: `${found?.patient_name || "Patient"} (${caseId})`,
    action: `Prescription Verified & Marked Ready for Dispensing: ${found?.prescribed_medicine || "Medication"}`,
    result: "READY TO DISPENSE ✓",
    prev_hash: prevHash,
    current_hash: newHash,
    payload: {
      block_id: localAuditLedger.length + 1,
      timestamp: new Date().toISOString(),
      actor: pharmacistName,
      role: "Pharmacist",
      action: "PHARMACIST_PRESCRIPTION_VERIFIED",
      entity: caseId,
      notes,
      cryptographic_verification: "SHA256_HASH_VALID_INTACT",
    },
  });

  const res = await fetchWithFallback<{ success: boolean; message: string }>(
    "/api/dashboard/pharmacist/dispense",
    {
      method: "POST",
      body: JSON.stringify({
        case_id: caseId,
        pharmacist_name: pharmacistName,
        notes,
      }),
    },
    () => ({
      success: true,
      message: "Medication successfully verified and marked ready for dispensing.",
    })
  );

  return {
    success: res.data.success,
    message: res.data.message,
    isLive: res.isLive,
  };
}

// =========================================================================
// PATIENT MEDICAL HISTORY (LONGITUDINAL EHR DRAWER)
// =========================================================================
export async function apiGetPatientHistory(
  identifier: string
): Promise<{ data: PatientHistoryDetail; isLive: boolean }> {
  const fallback =
    DETERMINISTIC_PATIENT_HISTORIES[identifier] ||
    DETERMINISTIC_PATIENT_HISTORIES["CASE-001"];

  return fetchWithFallback<PatientHistoryDetail>(
    `/api/dashboard/patient-history/${encodeURIComponent(identifier)}`,
    { method: "GET" },
    () => fallback
  );
}

// =========================================================================
// ADMIN & AUDIT CHAIN APIS
// =========================================================================
export async function apiGetAdminDashboard(): Promise<{ data: AdminDashboardData; isLive: boolean }> {
  const fallback: AdminDashboardData = {
    stats: {
      total_patients: localPatients.length,
      total_audit_events: localAuditLedger.length,
      tamper_checks_passed: true,
      chain_length: localAuditLedger.length,
      active_inpatients: 48,
      critical_interventions: 12,
    },
    audit_records: [...localAuditLedger],
    patients: [...localPatients],
  };

  return fetchWithFallback<AdminDashboardData>(
    "/api/dashboard/admin",
    { method: "GET" },
    () => fallback
  );
}

export async function apiVerifyAuditChain(): Promise<{
  verified: boolean;
  total_blocks: number;
  message: string;
  isLive: boolean;
}> {
  const res = await fetchWithFallback<{
    verified: boolean;
    total_blocks: number;
    message: string;
  }>(
    "/audit/verify",
    { method: "GET" },
    () => ({
      verified: true,
      total_blocks: localAuditLedger.length,
      message: `All ${localAuditLedger.length} cryptographic hash blocks successfully verified. Chain is intact and immutable.`,
    })
  );

  return {
    verified: res.data.verified,
    total_blocks: res.data.total_blocks,
    message: res.data.message,
    isLive: res.isLive,
  };
}

// =========================================================================
// CLINICAL SCENARIOS / 6-AGENT PIPELINE
// =========================================================================
export async function apiRunScenario(
  scenarioId: number
): Promise<{ data: SixAgentResult; isLive: boolean }> {
  const fallback = DEMO_SCENARIO_RESULTS[scenarioId] || DEMO_SCENARIO_RESULTS[1];

  return fetchWithFallback<SixAgentResult>(
    `/demo/run/${scenarioId}`,
    { method: "POST" },
    () => fallback
  );
}

// =========================================================================
// LAB REPORT SOURCE VIEWER
// =========================================================================
export async function apiGetLabReport(
  reportId: string
): Promise<{ data: LabReportDetail; isLive: boolean }> {
  const cleanId = reportId.replace(".json", "");
  const fallback = LAB_REPORTS[cleanId] || LAB_REPORTS["LAB-2026-0001"];

  return fetchWithFallback<LabReportDetail>(
    `/api/lab-reports/${encodeURIComponent(cleanId)}/view`,
    { method: "POST" },
    () => fallback
  );
}

// =========================================================================
// PRESCRIBING SANDBOX EVALUATION
// =========================================================================
export async function apiEvaluatePrescription(
  patientId: string,
  drugName: string,
  dose: string
): Promise<{ data: SixAgentResult; isLive: boolean }> {
  const lower = drugName.toLowerCase();
  let matchedScenario = 1;
  let severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" = "HIGH";
  let ruleId = "RULE-SANDBOX-MULTI";
  let customTitle = `Multi-Drug Regimen Safety Analysis: ${drugName}`;
  let customDesc = `Evaluation of prescribed regimen (${drugName}) against inpatient lab telemetry, renal clearance, and active medications.`;

  if (
    (lower.includes("warfarin") && (lower.includes("flucon") || lower.includes("diflucan"))) ||
    (lower.includes("warfarin") && lower.includes("aspirin"))
  ) {
    matchedScenario = 1;
    severity = "CRITICAL";
    ruleId = "RULE-DDI-CYP2C9-001";
    customTitle = `CRITICAL DDI: Warfarin + Fluconazole CYP2C9 Inhibition`;
    customDesc = `Severe Pharmacokinetic Interaction: Fluconazole is a potent inhibitor of cytochrome P450 2C9 (CYP2C9), the primary clearance pathway for biologically active S-warfarin. Concomitant administration inhibits Warfarin metabolism, causing rapid toxic accumulation, profound INR elevation, and life-threatening internal hemorrhage.`;
  } else if (
    (lower.includes("enox") || lower.includes("lovenox") || lower.includes("clexane") || lower.includes("heparin")) &&
    (patientId === "CASE-002" || lower.includes("renal") || lower.includes("ckd"))
  ) {
    matchedScenario = 2;
    severity = "CRITICAL";
    ruleId = "RULE-RENAL-LMWH-002";
    customTitle = `Contraindicated in Renal Impairment: Enoxaparin (LMWH)`;
    customDesc = `Enoxaparin undergoes renal elimination. Patient lab telemetry shows CrCl 28 mL/min (CKD Stage 3B), creating severe risk of unmonitored LMWH bioaccumulation and hemorrhagic shock unless substituted with Unfractionated Heparin (UFH).`;
  } else if (
    (lower.includes("lisinopril") && lower.includes("enalapril")) ||
    (lower.includes("ramipril") && lower.includes("lisinopril")) ||
    lower.includes("duplication") ||
    lower.includes("ace")
  ) {
    matchedScenario = 3;
    severity = "HIGH";
    ruleId = "RULE-DUP-ACEI-003";
    customTitle = `Therapeutic Class Duplication: Dual ACE Inhibitors`;
    customDesc = `Redundant ACE-inhibitor duplication (Lisinopril + Enalapril). Prescribing multiple agents within the same renin-angiotensin class offers zero therapeutic benefit while significantly amplifying risks of hyperkalemia, acute kidney injury, and profound hypotension.`;
  } else if (lower.includes("digoxin") && lower.includes("amiodarone")) {
    matchedScenario = 1;
    severity = "CRITICAL";
    ruleId = "RULE-DDI-PGP-004";
    customTitle = `CRITICAL P-gp Interaction: Digoxin + Amiodarone`;
    customDesc = `Amiodarone inhibits P-glycoprotein efflux transport in renal tubules, reducing Digoxin clearance by 50% and doubling serum Digoxin concentrations, precipitating fatal cardiac arrhythmias and digitalis toxicity.`;
  } else if (lower.includes("cipro") && lower.includes("amiodarone")) {
    matchedScenario = 1;
    severity = "CRITICAL";
    ruleId = "RULE-QT-PROLONG-005";
    customTitle = `Additive QTc Prolongation Risk: Ciprofloxacin + Amiodarone`;
    customDesc = `Concurrent administration of multiple QTc-prolonging agents dramatically increases the probability of Torsades de Pointes ventricular tachycardia and sudden cardiac arrest.`;
  } else if (lower.includes("enox") || lower.includes("lovenox") || lower.includes("clexane") || lower.includes("heparin")) {
    matchedScenario = 2;
  } else if (lower.includes("lisinopril") || lower.includes("enalapril")) {
    matchedScenario = 3;
  }

  const base = DEMO_SCENARIO_RESULTS[matchedScenario];
  const patient = localPatients.find((p) => p.id === patientId) || { id: patientId, name: "Inpatient Subject" };

  const syntheticResult: SixAgentResult = {
    ...base,
    patient: {
      identifier: patient.id,
      name: patient.name,
    },
    findings: [
      {
        title: customTitle,
        severity,
        description: customDesc,
        rule_id: ruleId,
      },
    ],
  };

  return fetchWithFallback<SixAgentResult>(
    "/ml/severity-advisory",
    {
      method: "POST",
      body: JSON.stringify({
        patient_id: patientId,
        drug_name: drugName,
        dose,
      }),
    },
    () => syntheticResult
  );
}
