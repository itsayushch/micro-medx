"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
} from "@/lib/types";
import {
  apiEvaluatePrescription,
  apiGetDoctorDashboard,
} from "@/lib/api";
import { DETERMINISTIC_PATIENT_HISTORIES, DEMO_SCENARIO_RESULTS, LAB_REPORTS } from "@/lib/mock-data";
import {
  MOCK_ADMIN_DASHBOARD,
  MOCK_DOCTOR_DASHBOARD,
  MOCK_NURSE_DASHBOARD,
  MOCK_PHARMACIST_DASHBOARD,
} from "@/lib/dashboard-mocks";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  HeartPulse,
  Pill,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Cpu,
  Clock,
  CheckCircle2,
  Lock,
  Activity,
  Layers,
  Users,
} from "lucide-react";
import { DoctorView } from "@/components/views/DoctorView";
import { NurseView } from "@/components/views/NurseView";
import { PharmacistView } from "@/components/views/PharmacistView";
import { AdminView } from "@/components/views/AdminView";
import { MedicationAvailabilityModal } from "@/components/modals/MedicationAvailabilityModal";
import { SubstitutionRequestModal } from "@/components/modals/SubstitutionRequestModal";
import { PatientHistoryDrawer } from "@/components/modals/PatientHistoryDrawer";
import { AuditDetailModal } from "@/components/modals/AuditDetailModal";
import { LabSourceModal } from "@/components/modals/LabSourceModal";
import { MARDetailModal } from "@/components/modals/MARDetailModal";
import { VitalDetailModal } from "@/components/modals/VitalDetailModal";
import { ReAuthModal } from "@/components/modals/ReAuthModal";

function DashboardApp() {
  const router = useRouter();
  const { currentUser, activeRole, isAuthenticated, sessionReady, login, logout, switchRole } = useAuth();
  const { showToast } = useToast();

  const [isLiveApi, setIsLiveApi] = React.useState(false);

  // Dashboards data
  const [doctorData, setDoctorData] = React.useState<DoctorDashboardData | null>(null);
  const [nurseData, setNurseData] = React.useState<NurseDashboardData | null>(null);
  const [pharmacistData, setPharmacistData] = React.useState<PharmacistDashboardData | null>(null);
  const [adminData, setAdminData] = React.useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Re-Authentication on Role Transition (Doctor <-> Nurse)
  const [pendingRoleSwitch, setPendingRoleSwitch] = React.useState<{ from: RoleType; to: RoleType } | null>(null);
  const [isReAuthModalOpen, setIsReAuthModalOpen] = React.useState(false);

  // MarkMyAd-style Mobile Sidebar Toggle
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Modals state
  const [selectedAvailItem, setSelectedAvailItem] = React.useState<AvailabilityQueueItem | null>(null);
  const [isAvailModalOpen, setIsAvailModalOpen] = React.useState(false);

  const [selectedSubItem, setSelectedSubItem] = React.useState<AvailabilityQueueItem | null>(null);
  const [isSubModalOpen, setIsSubModalOpen] = React.useState(false);

  const [selectedPatientHistory, setSelectedPatientHistory] = React.useState<PatientHistoryDetail | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = React.useState(false);

  const [selectedAuditRecord, setSelectedAuditRecord] = React.useState<AuditLedgerRecord | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = React.useState(false);

  const [selectedLabReport, setSelectedLabReport] = React.useState<LabReportDetail | null>(null);
  const [isLabModalOpen, setIsLabModalOpen] = React.useState(false);

  const [selectedMARItem, setSelectedMARItem] = React.useState<NurseMARItem | null>(null);
  const [isMARModalOpen, setIsMARModalOpen] = React.useState(false);

  const [selectedVitalItem, setSelectedVitalItem] = React.useState<NurseVitalLabItem | null>(null);
  const [isVitalModalOpen, setIsVitalModalOpen] = React.useState(false);

  const roleGreeting: Record<RoleType, string> = {
    Doctor: "Clinical Review Workspace",
    Nurse: "Patient Monitoring Workspace",
    "Clinical Pharmacist": "Pharmacy Review Workspace",
    Administrator: "System Governance Workspace",
  };
  const dossierPatientIdentifier = doctorData?.inpatients[0]?.id ||
    nurseData?.patients?.[0]?.patient_identifier ||
    pharmacistData?.availability_queue[0]?.patient_identifier ||
    adminData?.patients[0]?.id || "";

  // Only persisted clinical findings are live. Everything else in the role
  // dashboards is intentionally demo data for the hackathon MVP.
  const loadAllDashboards = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setDoctorData(MOCK_DOCTOR_DASHBOARD);
    setNurseData(MOCK_NURSE_DASHBOARD);
    setPharmacistData(MOCK_PHARMACIST_DASHBOARD);
    setAdminData(MOCK_ADMIN_DASHBOARD);
    if (activeRole !== "Doctor") {
      setIsLiveApi(false);
      setLoading(false);
      return;
    }
    try {
      const result = await apiGetDoctorDashboard();
      setDoctorData({
        ...MOCK_DOCTOR_DASHBOARD,
        active_findings: result.data.active_findings,
        stats: { ...MOCK_DOCTOR_DASHBOARD.stats, active_findings_count: result.data.active_findings.length },
      });
      setIsLiveApi(result.isLive);
    } catch {
      // Dashboard demo data remains available when the findings service is offline.
      setIsLiveApi(false);
    } finally {
      setLoading(false);
    }
  }, [activeRole, isAuthenticated]);

  React.useEffect(() => {
    let cancelled = false;
    if (!sessionReady) return;
    if (!isAuthenticated) { router.replace("/signin"); return; }
    const timer = window.setTimeout(() => {
      if (!cancelled) void loadAllDashboards();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [sessionReady, isAuthenticated, loadAllDashboards, router]);

  const handleLogoutClick = async () => {
    await logout();
    showToast("Signed out from clinical session.", "info");
    router.push("/signin");
  };

  const isDoctorNurseSwitch = (from: RoleType, to: RoleType) => {
    return (from === "Doctor" && to === "Nurse") || (from === "Nurse" && to === "Doctor");
  };

  const handleRoleSwitchRequest = (targetRole: RoleType) => {
    if (targetRole === activeRole) return;

    // Rule: While switching between docs and nurses, ask user to relogin!
    if (isDoctorNurseSwitch(activeRole, targetRole)) {
      setPendingRoleSwitch({ from: activeRole, to: targetRole });
      setIsReAuthModalOpen(true);
      return;
    }

    void switchRole(targetRole).then(() => {
      showToast(`Switched to ${targetRole} Workspace`, "info");
    }).catch((error) => showToast(error instanceof Error ? error.message : "Role switch failed", "error"));
  };

  const handleConfirmReAuth = async (targetRole: RoleType, phone: string, pass: string) => {
    const success = await login(targetRole, phone, pass);
    if (success) {
      setIsReAuthModalOpen(false);
      setPendingRoleSwitch(null);
      showToast(`Re-authenticated as ${targetRole}.`, "success");
    }
  };

  const handleRedirectToSignIn = async (targetRole: RoleType) => {
    setIsReAuthModalOpen(false);
    setPendingRoleSwitch(null);
    await logout();
    router.push(`/signin?role=${encodeURIComponent(targetRole)}`);
  };

  // Modal open handlers
  const handleOpenPatientHistory = async (identifier: string) => {
    const history = Object.values(DETERMINISTIC_PATIENT_HISTORIES).find(
      (item) => item.case_id === identifier || item.patient_identifier === identifier,
    );
    if (!history) { showToast("No demo history is available for this record.", "info"); return; }
    setSelectedPatientHistory(history);
    setIsHistoryDrawerOpen(true);
  };

  const handleOpenLabSource = async (reportId: string) => {
    const report = LAB_REPORTS[reportId];
    if (!report) { showToast("No demo lab report is available.", "info"); return; }
    setSelectedLabReport(report);
    setIsLabModalOpen(true);
  };

  const handleOpenAvailabilityModal = (item: AvailabilityQueueItem) => {
    setSelectedAvailItem(item);
    setIsAvailModalOpen(true);
  };

  const handleRequestSubstitutionModal = (item: AvailabilityQueueItem) => {
    setSelectedSubItem(item);
    setIsSubModalOpen(true);
  };

  const handleOpenAuditDetail = (record: AuditLedgerRecord) => {
    setSelectedAuditRecord(record);
    setIsAuditModalOpen(true);
  };

  const handleOpenMARModal = (item: NurseMARItem) => {
    setSelectedMARItem(item);
    setIsMARModalOpen(true);
  };

  const handleOpenVitalModal = (item: NurseVitalLabItem) => {
    setSelectedVitalItem(item);
    setIsVitalModalOpen(true);
  };

  // Async action handlers
  const handleApproveDoctorSub = async (requestId: string, notes: string) => {
    setDoctorData((current) => current ? { ...current, substitution_requests: current.substitution_requests.map((item) =>
      String(item.request_id) === requestId ? { ...item, status: "APPROVED" } : item) } : current);
    showToast(`Demo request approved${notes ? " with notes" : ""}; no backend record was changed.`, "info");
  };

  const handleRejectDoctorSub = async (requestId: string, notes: string) => {
    setDoctorData((current) => current ? { ...current, substitution_requests: current.substitution_requests.map((item) =>
      String(item.request_id) === requestId ? { ...item, status: "REJECTED" } : item) } : current);
    showToast(`Demo request rejected${notes ? " with notes" : ""}; no backend record was changed.`, "info");
  };

  const handleCosignOrder = async (simId: string, reason: string) => {
    void simId; void reason;
    showToast("Demo co-sign recorded for this screen only; no backend record was changed.", "info");
  };

  const handleDispenseMedication = async (item: AvailabilityQueueItem) => {
    void item;
    showToast("Demo dispensing action only; no medication was dispensed or backend record changed.", "info");
  };

  const handleSubmitSubstitution = async (
    item: AvailabilityQueueItem,
    suggestedBrand: string,
    reason: string,
    notes: string,
    idempotencyKey: string
  ) => {
    void item; void suggestedBrand; void reason; void notes; void idempotencyKey;
    showToast("Demo substitution request only; it was not sent to or saved by the backend.", "info");
  };

  const handleMARAction = async (
    orderId: string,
    action: "ADMINISTER" | "HOLD",
    notes: string
  ) => {
    void orderId; void action; void notes;
    showToast("Demo MAR action only; no medication event was saved.", "info");
  };

  const handleRecordVital = async (
    patientId: string,
    param: string,
    value: string,
    unit: string
  ) => {
    void patientId; void param; void value; void unit;
    showToast("Demo vital entry only; it was not saved to a patient record.", "info");
  };

  const handleVerifyChain = async () => {
    return { verified: false, total_blocks: MOCK_ADMIN_DASHBOARD.stats.total_audit_events, message: "No live audit-chain verification was performed; displayed ledger is static demo data." };
  };

  const handleRunScenario = async (scenarioId: number): Promise<SixAgentResult> => {
    const result = DEMO_SCENARIO_RESULTS[scenarioId];
    if (!result) throw new Error("No static demo scenario is available for that selection.");
    return result;
  };

  const handleEvaluateSandbox = async (drugName: string) => {
    const res = await apiEvaluatePrescription("", drugName, "");
    return res.data;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern MarkMyAd-style App Sidebar */}
      <Sidebar
        activeRole={activeRole}
        onRoleChange={handleRoleSwitchRequest}
        currentUser={currentUser}
        patientIdentifier={dossierPatientIdentifier}
        onLogout={handleLogoutClick}
        onOpenPatientHistory={handleOpenPatientHistory}
        onVerifyChain={handleVerifyChain}
        doctorPendingCount={doctorData?.stats.pending_cosigns_count || 0}
        nurseDueCount={nurseData?.stats.medications_due || 0}
        pharmacistShortageCount={pharmacistData?.stats.substitution_required || 0}
        isLiveApi={isLiveApi}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col h-screen min-w-0 overflow-hidden">
        <Header
          activeRole={activeRole}
          onRoleChange={handleRoleSwitchRequest}
          currentUser={currentUser}
          onLogout={handleLogoutClick}
          isLiveApi={isLiveApi}
          onRefresh={loadAllDashboards}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Workspace Hero Header */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 font-poppins">
                  <Activity className="w-3 h-3 text-blue-600" />
                  {activeRole} Active Service
                </span>
              </div>

              <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-slate-900 font-poppins">
                {roleGreeting[activeRole]}
              </h1>

              <p className="text-sm text-slate-500 max-w-3xl leading-relaxed font-quicksand">
                {activeRole === "Doctor" &&
                  "Demo workspace with live persisted clinical findings and the interactive severity advisory."}
                {activeRole === "Nurse" &&
                  "Static demo workspace. Medication records, administration events, and observations are examples only."}
                {activeRole === "Clinical Pharmacist" &&
                  "Static demo workspace. Prescription, substitution, and inventory records are examples only."}
                {activeRole === "Administrator" &&
                  "Static demo workspace. Directory and audit-chain content are examples; no live verification is performed."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => dossierPatientIdentifier && handleOpenPatientHistory(dossierPatientIdentifier)}
                disabled={!dossierPatientIdentifier}
                className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 gap-1.5 h-9 font-poppins cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Patient Dossier
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleVerifyChain}
                className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1.5 h-9 font-poppins cursor-pointer shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Verify Audit Chain
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-900">
            Demo mode: dashboard workflows and records are static examples. Only persisted clinical findings and the severity sandbox use the backend.
          </div>

          {/* LOADING OR ROLE VIEW */}
          {!sessionReady || loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-r-transparent mb-3" />
              <div className="text-sm font-bold font-poppins">Loading demo workspace and persisted findings...</div>
            </div>
          ) : (
            <>
              {activeRole === "Doctor" && doctorData && (
                <DoctorView
                  data={doctorData}
                  onApproveSubstitution={handleApproveDoctorSub}
                  onRejectSubstitution={handleRejectDoctorSub}
                  onCosignOrder={handleCosignOrder}
                  onRunScenario={handleRunScenario}
                  onEvaluateSandbox={handleEvaluateSandbox}
                  onOpenPatientHistory={handleOpenPatientHistory}
                  onOpenLabSource={handleOpenLabSource}
                />
              )}

              {activeRole === "Nurse" && nurseData && (
                <NurseView
                  data={nurseData}
                  onOpenMARModal={handleOpenMARModal}
                  onOpenVitalModal={handleOpenVitalModal}
                  onRecordVital={handleRecordVital}
                  onOpenPatientHistory={handleOpenPatientHistory}
                />
              )}

              {activeRole === "Clinical Pharmacist" && pharmacistData && (
                <PharmacistView
                  data={pharmacistData}
                  onOpenAvailabilityModal={handleOpenAvailabilityModal}
                  onRequestSubstitutionModal={handleRequestSubstitutionModal}
                  onOpenPatientHistory={handleOpenPatientHistory}
                />
              )}

              {activeRole === "Administrator" && adminData && (
                <AdminView
                  data={adminData}
                  onVerifyChain={handleVerifyChain}
                  onOpenAuditDetail={handleOpenAuditDetail}
                  onOpenPatientHistory={handleOpenPatientHistory}
                />
              )}
            </>
          )}

          {/* Modern Clean Footer */}
          <footer className="pt-4 pb-2 border-t border-slate-200/60 text-xs text-slate-400 flex flex-wrap justify-between items-center gap-2">
            <div>
              <strong className="text-slate-800 font-bold font-poppins">Micro MedX</strong> &bull; Demo workspace with limited backend MVP features
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium font-mono text-slate-500">
              <span>{isLiveApi ? "Findings and severity sandbox connected" : "Demo data; live findings unavailable"}</span>
            </div>
          </footer>
        </main>
      </div>

      {/* ALL 7 RICH MODALS & DRAWERS */}
      <MedicationAvailabilityModal
        open={isAvailModalOpen}
        onOpenChange={setIsAvailModalOpen}
        item={selectedAvailItem}
        onDispense={handleDispenseMedication}
        onRequestSubstitution={handleRequestSubstitutionModal}
      />

      <SubstitutionRequestModal
        open={isSubModalOpen}
        onOpenChange={setIsSubModalOpen}
        item={selectedSubItem}
        onSubmit={handleSubmitSubstitution}
      />

      <PatientHistoryDrawer
        open={isHistoryDrawerOpen}
        onOpenChange={setIsHistoryDrawerOpen}
        patientData={selectedPatientHistory}
        onViewLabSource={handleOpenLabSource}
      />

      <AuditDetailModal
        open={isAuditModalOpen}
        onOpenChange={setIsAuditModalOpen}
        record={selectedAuditRecord}
      />

      <LabSourceModal
        open={isLabModalOpen}
        onOpenChange={setIsLabModalOpen}
        report={selectedLabReport}
      />

      <MARDetailModal
        open={isMARModalOpen}
        onOpenChange={setIsMARModalOpen}
        item={selectedMARItem}
        onAction={handleMARAction}
      />

      <VitalDetailModal
        open={isVitalModalOpen}
        onOpenChange={setIsVitalModalOpen}
        vital={selectedVitalItem}
      />

      {pendingRoleSwitch && (
        <ReAuthModal
          open={isReAuthModalOpen}
          onOpenChange={(open) => {
            setIsReAuthModalOpen(open);
            if (!open) {
              setPendingRoleSwitch(null);
            }
          }}
          fromRole={pendingRoleSwitch.from}
          toRole={pendingRoleSwitch.to}
          onConfirmReAuth={handleConfirmReAuth}
          onRedirectToSignIn={handleRedirectToSignIn}
        />
      )}
    </div>
  );
}

export default function Home() {
  return <DashboardApp />;
}
