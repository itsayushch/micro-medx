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
import { CLINICAL_PERSONAS } from "@/lib/mock-data";
import {
  apiCosignOrder,
  apiDispenseMedication,
  apiEvaluatePrescription,
  apiGetAdminDashboard,
  apiGetDoctorDashboard,
  apiGetLabReport,
  apiGetNurseDashboard,
  apiGetPatientHistory,
  apiGetPharmacistDashboard,
  apiRecordNurseVital,
  apiRunScenario,
  apiSubmitDoctorSubstitutionDecision,
  apiSubmitMARAction,
  apiSubmitSubstitutionRequest,
  apiVerifyAuditChain,
} from "@/lib/api";
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
  const { currentUser, activeRole, isAuthenticated, login, logout, switchRole } = useAuth();
  const { showToast } = useToast();

  const [isLiveApi, setIsLiveApi] = React.useState(true);

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

  const persona = CLINICAL_PERSONAS[activeRole] || CLINICAL_PERSONAS["Doctor"];

  // Fetch all dashboard datasets
  const loadAllDashboards = React.useCallback(async () => {
    try {
      const [docRes, nurseRes, pharmRes, adminRes] = await Promise.all([
        apiGetDoctorDashboard(),
        apiGetNurseDashboard(),
        apiGetPharmacistDashboard(),
        apiGetAdminDashboard(),
      ]);

      setDoctorData(docRes.data);
      setNurseData(nurseRes.data);
      setPharmacistData(pharmRes.data);
      setAdminData(adminRes.data);

      setIsLiveApi(docRes.isLive || nurseRes.isLive || pharmRes.isLive || adminRes.isLive);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAllDashboards();
  }, [loadAllDashboards]);

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

    switchRole(targetRole);
    showToast(`Switched to ${targetRole} Workspace`, "info");
  };

  const handleConfirmReAuth = async (targetRole: RoleType, phone: string, pass: string) => {
    try {
      const success = await login(targetRole, phone, pass);
      if (success) {
        setIsReAuthModalOpen(false);
        setPendingRoleSwitch(null);
        showToast(`Re-authenticated as ${targetRole}. Workspace unlocked.`, "success");
        await loadAllDashboards();
      }
    } catch {
      showToast("Authentication failed. Please verify passcode.", "error");
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
    try {
      const res = await apiGetPatientHistory(identifier);
      setSelectedPatientHistory(res.data);
      setIsHistoryDrawerOpen(true);
    } catch {
      showToast("Could not load patient medical record", "error");
    }
  };

  const handleOpenLabSource = async (reportId: string) => {
    try {
      const res = await apiGetLabReport(reportId);
      setSelectedLabReport(res.data);
      setIsLabModalOpen(true);
    } catch {
      showToast("Could not retrieve laboratory source evidence", "error");
    }
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
  const handleApproveDoctorSub = async (caseId: string, notes: string) => {
    await apiSubmitDoctorSubstitutionDecision(caseId, "APPROVED", notes, currentUser?.name);
    await loadAllDashboards();
  };

  const handleRejectDoctorSub = async (caseId: string, notes: string) => {
    await apiSubmitDoctorSubstitutionDecision(caseId, "REJECTED", notes, currentUser?.name);
    await loadAllDashboards();
  };

  const handleCosignOrder = async (simId: string, reason: string) => {
    await apiCosignOrder(simId, "approved", currentUser?.name, reason);
    await loadAllDashboards();
  };

  const handleDispenseMedication = async (caseId: string) => {
    await apiDispenseMedication(caseId, currentUser?.name);
    showToast(`Case ${caseId} marked ready for dispensing and sealed on SHA-256 ledger.`, "success");
    await loadAllDashboards();
  };

  const handleSubmitSubstitution = async (
    caseId: string,
    suggestedBrand: string,
    reason: string,
    notes: string
  ) => {
    await apiSubmitSubstitutionRequest(caseId, suggestedBrand, reason, notes, currentUser?.name);
    showToast(`Substitution request submitted to doctor for ${caseId}`, "success");
    await loadAllDashboards();
  };

  const handleMARAction = async (
    orderId: string,
    action: "ADMINISTER" | "HOLD" | "REJECT",
    notes: string,
    vitalsChecked: boolean
  ) => {
    await apiSubmitMARAction(orderId, action, notes, currentUser?.name, vitalsChecked);
    showToast(`Medication order ${orderId} documented as ${action}.`, "success");
    await loadAllDashboards();
  };

  const handleRecordVital = async (
    patientId: string,
    param: string,
    value: string,
    unit: string
  ) => {
    await apiRecordNurseVital(patientId, param, value, unit, currentUser?.name);
    await loadAllDashboards();
  };

  const handleVerifyChain = async () => {
    await apiVerifyAuditChain();
    await loadAllDashboards();
  };

  const handleRunScenario = async (scenarioId: number): Promise<SixAgentResult> => {
    const res = await apiRunScenario(scenarioId);
    await loadAllDashboards();
    return res.data;
  };

  const handleEvaluateSandbox = async (
    patientId: string,
    drugName: string,
    dose: string
  ): Promise<SixAgentResult> => {
    const res = await apiEvaluatePrescription(patientId, drugName, dose);
    await loadAllDashboards();
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
        onLogout={handleLogoutClick}
        onOpenPatientHistory={handleOpenPatientHistory}
        onVerifyChain={handleVerifyChain}
        doctorPendingCount={doctorData?.stats.pending_cosigns_count || 0}
        nurseDueCount={nurseData?.stats.medications_due || 0}
        pharmacistShortageCount={pharmacistData?.stats.substitution_required || 0}
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-poppins">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Offline CDS Verification Active
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-500" />
                  SHA-256 Merkle Chain Sealed
                </span>
              </div>

              <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-slate-900 font-poppins">
                {persona.greeting}
              </h1>

              <p className="text-sm text-slate-500 max-w-3xl leading-relaxed font-quicksand">
                {activeRole === "Doctor" &&
                  "Medication Safety & Prescribing Sandbox — Multi-drug interaction screening, deterministic risk evaluation, and co-signatures."}
                {activeRole === "Nurse" &&
                  "Inpatient Medication Administration Record (MAR), bedside barcode scan verification, and rapid vital telemetry ingestion."}
                {activeRole === "Clinical Pharmacist" &&
                  "Medication Fulfillment & Substitution — Real-time bin stock checks, equivalent brand alternatives, and physician verification."}
                {activeRole === "Administrator" &&
                  "Forensic SHA-256 Audit Trail — Cryptographic immutability checks, patient directory, and clinical governance."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPatientHistory("CASE-001")}
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
                Verify Ledger Chain
              </Button>
            </div>
          </div>

          {/* LOADING OR ROLE VIEW */}
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-r-transparent mb-3" />
              <div className="text-sm font-bold font-poppins">Initializing Clinical Workspaces &amp; Rules Engines...</div>
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
              <strong className="text-slate-800 font-bold font-poppins">Micro MedX</strong> &bull; Clinical Decision Support &amp; Forensic SHA-256 Ledger Console
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium font-mono text-slate-500">
              <span>6-Agent AI Pipeline</span>
              <span>&bull;</span>
              <span>Deterministic Core</span>
              <span>&bull;</span>
              <span className="text-emerald-600 font-bold">Ledger Sealed</span>
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
