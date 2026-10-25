import {
  AdminDashboardData,
  AvailabilityQueueItem,
  DoctorDashboardData,
  LabReportDetail,
  NurseDashboardData,
  NurseVitalLabItem,
  PatientHistoryDetail,
  PharmacistDashboardData,
  PairSeverityAdvisoryResult,
  RoleType,
  SixAgentResult,
  UserSession,
} from "./types";

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
 * Requests must use persisted backend state. Never substitute demo records on errors.
 */
async function fetchWithFallback<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T; isLive: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  try {
    const res = await fetch(fullUrl, {
      ...options,
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = payload?.detail || payload?.message || `Request failed (${res.status})`;
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
    isBackendReachable = true;
    return { data: payload as T, isLive: true };
  } catch (error) {
    isBackendReachable = false;
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// =========================================================================
// AUTHENTICATION APIS
// =========================================================================
export async function apiCheckSession(): Promise<{ user: UserSession | null; isLive: boolean }> {
  const res = await fetchWithFallback<{ authenticated: boolean; user: Record<string, unknown> | null }>(
    "/auth/session",
    { method: "GET" }
  );
  const user = res.data.authenticated && res.data.user ? mapUser(res.data.user) : null;
  return { user, isLive: res.isLive };
}

function mapUser(user: Record<string, unknown>): UserSession {
  return {
    user_id: Number(user.id),
    phone: String(user.phone_number || ""),
    name: String(user.full_name || ""),
    role: String(user.role) as RoleType,
    department: String(user.department || ""),
    is_authenticated: true,
  };
}

export async function apiLogin(
  phone: string,
  role: RoleType,
  password?: string
): Promise<{ user: UserSession; isLive: boolean }> {
  const res = await fetchWithFallback<{ user: Record<string, unknown> }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ phone_number: phone, password, role }),
    }
  );
  return { user: mapUser(res.data.user), isLive: res.isLive };
}

export async function apiLogout(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
    if (!response.ok) throw new Error("Sign out failed");
  } catch {
    // Ignore
  }
  return true;
}

export async function apiSwitchRole(role: RoleType): Promise<UserSession> {
  const res = await fetchWithFallback<{ user: Record<string, unknown> }>("/auth/switch-role", {
    method: "POST",
    body: JSON.stringify({ new_role: role }),
  });
  return mapUser(res.data.user);
}

// =========================================================================
// DOCTOR APIS
// =========================================================================
export async function apiGetDoctorDashboard(): Promise<{ data: DoctorDashboardData; isLive: boolean }> {
  const result = await fetchWithFallback<Record<string, any>>(
    "/api/dashboard/doctor",
    { method: "GET" }
  );
  const response = result.data;
  const data: DoctorDashboardData = {
    role: "Doctor",
    stats: response.stats,
    substitution_requests: (response.substitution_requests || []).map((request: any) => ({
      ...request,
      case_id: String(request.patient_identifier || request.patient_id || ""),
      request_id: Number(request.request_id),
      original_prescription: request.original_prescription || request.prescribed_medicine || "Not recorded",
      suggested_alternative: request.suggested_brand || "Not recorded",
      stock_detail: "Inventory is not recorded",
      request_time: request.request_date || "Not recorded",
      clinical_reason: request.reason || "",
      status: String(request.status || "pending").toUpperCase(),
    })),
    pending_cosigns: response.pending_cosigns || [],
    inpatients: (response.patients || []).map((patient: any) => ({
      id: String(patient.patient_identifier || ""),
      name: patient.name,
      age: null,
      sex: patient.sex || "Not recorded",
      dept: patient.department || "Not recorded",
      condition: patient.latest_finding || "Not recorded",
      regimen: (patient.active_medications || []).map((medication: any) => medication.name).join(", "),
      risk: "Not recorded",
      clinician: response.clinician || "Not recorded",
    })),
    active_findings: (response.findings || []).map((finding: any) => ({
      ...finding,
      id: String(finding.id),
      patient_id: String(finding.patient_id),
      patient_name: (response.patients || []).find((row: any) => row.id === finding.patient_id)?.name || "Not recorded",
      severity: String(finding.severity || "LOW").toUpperCase(),
    })),
  };
  return { data, isLive: result.isLive };
}

export async function apiSubmitDoctorSubstitutionDecision(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  notes: string
): Promise<{ success: boolean; isLive: boolean; message: string }> {
  const res = await fetchWithFallback<{ status: string; message: string }>(
    "/api/dashboard/doctor/substitution-decision",
    {
      method: "POST",
      body: JSON.stringify({
        request_id: Number(requestId),
        decision,
        doctor_notes: notes,
      }),
    }
  );

  return {
    success: res.data.status === decision.toLowerCase(),
    message: res.data.message,
    isLive: res.isLive,
  };
}

export async function apiCosignOrder(
  simulationId: string,
  action: "approved" | "rejected",
  doctorName: string,
  reason: string
): Promise<{ success: boolean; isLive: boolean; message: string }> {
  const res = await fetchWithFallback<{ status: string; message: string }>(
    `/simulated-orders/${encodeURIComponent(simulationId)}/cosign`,
    {
      method: "POST",
      body: JSON.stringify({
        cosigned_by: doctorName,
        decision: action,
        clinical_notes: reason,
      }),
    }
  );

  return {
    success: res.data.status === `cosigned_${action}`,
    message: res.data.message,
    isLive: res.isLive,
  };
}

// =========================================================================
// NURSE APIS
// =========================================================================
export async function apiGetNurseDashboard(): Promise<{ data: NurseDashboardData; isLive: boolean }> {
  const res = await fetchWithFallback<Record<string, any>>(
    "/api/dashboard/nurse",
    { method: "GET" }
  );
  const raw = res.data;
  const data: NurseDashboardData = {
    role: "Nurse",
    stats: {
      ...raw.stats,
      medications_due: raw.mar_schedule_available ? raw.stats.medications_due ?? null : null,
    },
    mar_schedule: (raw.mar_schedule || []).map((row: any) => ({
      ...row,
      status: String(row.status || "NOT_RECORDED").toUpperCase(),
      scheduled_time: row.scheduled_time || "Not scheduled",
    })),
    vitals_labs: (raw.vitals_labs || []).map((lab: any) => ({
      ...lab, id: String(lab.id), case_id: lab.patient_identifier || "", recorded_by: lab.recorded_by || "Not recorded",
      status: "RECORDED",
    })),
    patients: raw.patients || [],
    mar_schedule_available: Boolean(raw.mar_schedule_available),
    mar_schedule_note: raw.mar_schedule_note || "",
  };
  return { data, isLive: res.isLive };
}

export async function apiSubmitMARAction(
  orderId: string,
  action: "ADMINISTER" | "HOLD",
  notes: string
): Promise<{ success: boolean; isLive: boolean; message: string }> {
  const res = await fetchWithFallback<{ status: string; message: string }>(
    "/api/dashboard/nurse/mar-action",
    {
      method: "POST",
      body: JSON.stringify({
        mar_id: orderId,
        action,
        notes,
        hold_reason: action === "HOLD" ? notes : undefined,
      }),
    }
  );

  return {
    success: res.data.status === "ADMINISTERED" || res.data.status === "HELD",
    message: res.data.message,
    isLive: res.isLive,
  };
}

export async function apiRecordNurseVital(
  patientId: string,
  param: string,
  value: string,
  unit: string
): Promise<{ success: boolean; isLive: boolean; message: string; record: NurseVitalLabItem }> {
  const res = await fetchWithFallback<{ status: string; record: NurseVitalLabItem; message?: string }>(
    "/api/dashboard/nurse/record-vital",
    {
      method: "POST",
      body: JSON.stringify({
        case_id: patientId,
        parameter: param,
        value,
        unit,
      }),
    }
  );

  return {
    success: res.data.status === "RECORDED",
    message: res.data.message || "Measurement saved to the patient record.",
    record: res.data.record,
    isLive: res.isLive,
  };
}

// =========================================================================
// PHARMACIST APIS
// =========================================================================
export async function apiGetPharmacistDashboard(): Promise<{ data: PharmacistDashboardData; isLive: boolean }> {
  const res = await fetchWithFallback<Record<string, any>>(
    "/api/dashboard/pharmacist",
    { method: "GET" }
  );
  const raw = res.data;
  const data: PharmacistDashboardData = {
    role: "Clinical Pharmacist",
    stats: {
      prescriptions_received: raw.stats.prescriptions_received,
      available: raw.stats.inventory_tracked ? raw.stats.available : "Not tracked",
      substitution_required: raw.stats.doctor_approval_pending || 0,
      dispensed_today: raw.stats.inventory_tracked ? raw.stats.ready_for_dispensing : "Not tracked",
      high_risk_flagged: (raw.pharmacology_insights || []).filter((item: any) => ["high", "critical", "major"].includes(String(item.severity).toLowerCase())).length,
      inventory_value: "Not tracked",
    },
    availability_queue: (raw.availability_queue || []).map((item: any) => ({
      ...item,
      case_id: String(item.case_id || ""),
      patient_id: Number(item.patient_id),
      order_id: Number(item.order_id),
      medication_id: Number(item.medication_id),
      prescribed_brand: item.prescribed_brand || "Not recorded",
      mrn: item.mrn || "Not recorded",
      age: item.age ?? null,
      sex: item.sex || "Not recorded",
      strength: item.strength || "Not recorded",
      formulation: item.formulation || "Not recorded",
      availability: item.availability === "AVAILABLE" || item.availability === "UNAVAILABLE" ? item.availability : "UNTRACKED",
      available_quantity: item.available_quantity ?? null,
      substitution_status: item.substitution_status || item.status || "Not recorded",
      available_alternatives: [],
      action: "",
    })),
    local_inventory: [],
    pharmacology_insights: (raw.pharmacology_insights || []).map((item: any) => ({
      pair: item.pair || item.title || "Persisted finding",
      mechanism: item.mechanism || item.description || "",
      clinical_impact: item.clinical_impact || item.severity || "Not assessed",
      recommended_action: item.recommended_action || item.action || "Not recorded",
      evidence_source: item.evidence_source || "Not recorded",
      evidence_id: item.evidence_id || "",
      provenance: item.provenance || "",
    })),
  };
  return { data, isLive: res.isLive };
}

export async function apiSubmitSubstitutionRequest(
  item: AvailabilityQueueItem,
  suggestedBrand: string,
  reason: string,
  notes: string,
  idempotencyKey: string
): Promise<{ success: boolean; isLive: boolean; message: string }> {
  if (!Number.isInteger(item.patient_id) || !Number.isInteger(item.order_id) || !Number.isInteger(item.medication_id)) {
    throw new Error("This order is missing persisted backend references and cannot be submitted.");
  }
  const res = await fetchWithFallback<{ status: string; message: string }>(
    "/api/dashboard/pharmacist/substitution-request",
    {
      method: "POST",
      body: JSON.stringify({
        patient_id: item.patient_id,
        order_id: item.order_id,
        medication_id: item.medication_id,
        idempotency_key: idempotencyKey,
        suggested_brand: suggestedBrand,
        reason,
        pharmacist_notes: notes,
      }),
    }
  );

  return {
    success: res.data.status === "pending",
    message: res.data.message,
    isLive: res.isLive,
  };
}

export async function apiDispenseMedication(
  item: AvailabilityQueueItem,
  pharmacistName: string,
  notes: string
): Promise<{ success: boolean; isLive: boolean; message: string }> {
  const res = await fetchWithFallback<{ success: boolean; message: string }>(
    "/api/dashboard/pharmacist/dispense",
    {
      method: "POST",
      body: JSON.stringify({
        case_id: item.case_id,
        patient_id: item.patient_id,
        patient_identifier: item.patient_identifier,
        patient_name: item.patient_name,
        medication: item.prescribed_medicine,
        strength: item.strength,
        route: item.route,
        formulation: item.formulation,
        frequency: item.frequency,
        pharmacist_name: pharmacistName,
        notes,
      }),
    }
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
  return fetchWithFallback<PatientHistoryDetail>(
    `/api/dashboard/patient-history/${encodeURIComponent(identifier)}`,
    { method: "GET" }
  );
}

// =========================================================================
// ADMIN & AUDIT CHAIN APIS
// =========================================================================
export async function apiGetAdminDashboard(): Promise<{ data: AdminDashboardData; isLive: boolean }> {
  const res = await fetchWithFallback<Record<string, any>>(
    "/api/dashboard/admin",
    { method: "GET" }
  );
  const raw = res.data;
  const chain = raw.audit_chain || {};
  const data: AdminDashboardData = {
    stats: {
      total_patients: (raw.patients || []).length,
      total_audit_events: chain.total_records ?? 0,
      tamper_checks_passed: chain.is_valid === true,
      chain_length: chain.total_records ?? 0,
      active_inpatients: (raw.patients || []).length,
      critical_interventions: (raw.patients || []).filter((patient: any) =>
        ["CRITICAL", "MAJOR", "HIGH"].includes(String(patient.risk || "").toUpperCase())
      ).length,
    },
    audit_records: (chain.recent_records || []).map((record: any) => ({
      id: record.id, timestamp: record.timestamp, actor: record.actor || "Not recorded",
      role: "", category: String(record.category || "AUDIT").toUpperCase(), entity: record.entity || "",
      action: record.action || record.event_type || "", result: record.result || "",
      prev_hash: record.prev_hash || "", current_hash: record.hash || "",
      payload: record.payload || {},
    })),
    patients: (raw.patients || []).map((patient: any) => ({
      id: patient.patient_identifier, name: patient.name,
      age: patient.date_of_birth ? calculateAge(patient.date_of_birth) : null,
      sex: patient.sex || "Not recorded",
      dept: patient.department || "Not recorded", condition: patient.latest_finding || "Not recorded",
      regimen: (patient.active_medications || []).join(", "),
      risk: ["CRITICAL", "MAJOR", "HIGH"].includes(String(patient.risk).toUpperCase()) ? "High" :
        String(patient.risk).toUpperCase() === "MODERATE" ? "Moderate" :
        String(patient.risk).toUpperCase() === "MINOR" ? "Low" : "Not recorded",
      clinician: "Not recorded",
    })),
  };
  return { data, isLive: res.isLive };
}

function calculateAge(dateOfBirth: string): number | null {
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export async function apiVerifyAuditChain(): Promise<{
  verified: boolean;
  total_blocks: number;
  message: string;
  isLive: boolean;
}> {
  const res = await fetchWithFallback<{
    is_valid: boolean;
    total_records: number;
    message: string;
  }>("/audit/verify-chain", { method: "GET" });

  return {
    verified: res.data.is_valid,
    total_blocks: res.data.total_records,
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
  return fetchWithFallback<SixAgentResult>(
    `/demo/run/${scenarioId}`,
    { method: "POST" }
  );
}

// =========================================================================
// LAB REPORT SOURCE VIEWER
// =========================================================================
export async function apiGetLabReport(
  reportId: string
): Promise<{ data: LabReportDetail; isLive: boolean }> {
  const cleanId = reportId.replace(".json", "");

  return fetchWithFallback<LabReportDetail>(
    `/api/lab-reports/${encodeURIComponent(cleanId)}/view`,
    { method: "POST" }
  );
}

// =========================================================================
// PRESCRIBING SANDBOX EVALUATION
// =========================================================================
export async function apiEvaluatePrescription(
  patientId: string,
  drugName: string,
  dose: string
): Promise<{ data: PairSeverityAdvisoryResult; isLive: boolean }> {
  void patientId;
  void dose;
  const pair = drugName.split("+").map((name) => name.trim()).filter(Boolean);
  if (pair.length !== 2) throw new Error("The severity advisory accepts exactly two drug names.");
  return fetchWithFallback<PairSeverityAdvisoryResult>(
    "/ml/severity-advisory",
    {
      method: "POST",
      body: JSON.stringify({
        drug_a: pair[0],
        drug_b: pair[1],
        interaction_documented: false,
      }),
    }
  );
}
