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
  const { currentUser, activeRole, isAuthenticated, sessionReady, login, logout, switchRole } = useAuth();
  const { showToast } = useToast();

  const [isLiveApi, setIsLiveApi] = React.useState(false);

  // Dashboards data
  const [doctorData, setDoctorData] = React.useState<DoctorDashboardData | null>(null);
  const [nurseData, setNurseData] = React.useState<NurseDashboardData | null>(null);
  const [pharmacistData, setPharmacistData] = React.useState<PharmacistDashboardData | null>(null);
  const [adminData, setAdminData] = React.useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dashboardError, setDashboardError] = React.useState<string | null>(null);

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

  // Request only the authenticated role's dashboard; nonmatching role routes
  // intentionally return 403 and are not needed by this workspace.
  const loadAllDashboards = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setDashboardError(null);
    try {
      setDoctorData(null); setNurseData(null); setPharmacistData(null); setAdminData(null);
      if (activeRole === "Doctor") { const result = await apiGetDoctorDashboard(); setDoctorData(result.data); setIsLiveApi(result.isLive); }
      else if (activeRole === "Nurse") { const result = await apiGetNurseDashboard(); setNurseData(result.data); setIsLiveApi(result.isLive); }
      else if (activeRole === "Clinical Pharmacist") { const result = await apiGetPharmacistDashboard(); setPharmacistData(result.data); setIsLiveApi(result.isLive); }
      else { const result = await apiGetAdminDashboard(); setAdminData(result.data); setIsLiveApi(result.isLive); }
    } catch (err) {
      setIsLiveApi(false);
      setDashboardError(err instanceof Error ? err.message : "Could not load dashboard from the backend.");
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
  const handleApproveDoctorSub = async (requestId: string, notes: string) => {
    const result = await apiSubmitDoctorSubstitutionDecision(requestId, "APPROVED", notes);
    if (!result.success) throw new Error(result.message || "The substitution decision was not recorded.");
    await loadAllDashboards();
  };

  const handleRejectDoctorSub = async (requestId: string, notes: string) => {
    const result = await apiSubmitDoctorSubstitutionDecision(requestId, "REJECTED", notes);
    if (!result.success) throw new Error(result.message || "The substitution decision was not recorded.");
    await loadAllDashboards();
  };

  const handleCosignOrder = async (simId: string, reason: string) => {
    const result = await apiCosignOrder(simId, "approved", currentUser?.name || "", reason);
    if (!result.success) throw new Error(result.message || "The co-sign decision was not recorded.");
    await loadAllDashboards();
  };

  const handleDispenseMedication = async (item: AvailabilityQueueItem) => {
    const result = await apiDispenseMedication(item, currentUser?.name || "", "Inventory and dispensing verification requested.");
    if (!result.success) throw new Error(result.message || "Dispensing verification was not recorded.");
    await loadAllDashboards();
  };

  const handleSubmitSubstitution = async (
    item: AvailabilityQueueItem,
    suggestedBrand: string,
    reason: string,
    notes: string,
    idempotencyKey: string
  ) => {
    const result = await apiSubmitSubstitutionRequest(item, suggestedBrand, reason, notes, idempotencyKey);
    if (!result.success) throw new Error(result.message || "The substitution request was not recorded.");
    showToast(result.message, "success");
    await loadAllDashboards();
  };

  const handleMARAction = async (
    orderId: string,
    action: "ADMINISTER" | "HOLD",
    notes: string
  ) => {
    const result = await apiSubmitMARAction(orderId, action, notes);
    if (!result.success) throw new Error(result.message || "The medication event was not recorded.");
    showToast(result.message, "success");
    await loadAllDashboards();
  };

  const handleRecordVital = async (
    patientId: string,
    param: string,
    value: string,
    unit: string
  ) => {
    await apiRecordNurseVital(patientId, param, value, unit);
    await loadAllDashboards();
  };

  const handleVerifyChain = async () => {
    const result = await apiVerifyAuditChain();
    await loadAllDashboards();
    return { verified: result.verified, total_blocks: result.total_blocks, message: result.message };
  };

  const handleRunScenario = async (scenarioId: number): Promise<SixAgentResult> => {
    const res = await apiRunScenario(scenarioId);
    await loadAllDashboards();
    return res.data;
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
                  "Persisted patient records, substitution requests, rule findings, and clinician review."}
                {activeRole === "Nurse" &&
                  "Persisted medication records, administration events, and laboratory observations."}
                {activeRole === "Clinical Pharmacist" &&
                  "Persisted prescription and substitution workflow. Inventory is untracked in the connected database."}
                {activeRole === "Administrator" &&
                  "Database-backed patient directory and audit-chain verification."}
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

          {/* LOADING OR ROLE VIEW */}
          {!sessionReady || (loading && !dashboardError) ? (
            <div className="p-12 text-center text-slate-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-r-transparent mb-3" />
              <div className="text-sm font-bold font-poppins">Initializing Clinical Workspaces &amp; Rules Engines...</div>
            </div>
          ) : dashboardError ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
              <strong>Backend data unavailable.</strong> {dashboardError}
              <button className="ml-3 underline" onClick={() => void loadAllDashboards()}>Retry</button>
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
              <strong className="text-slate-800 font-bold font-poppins">Micro MedX</strong> &bull; Clinical Decision Support connected to persisted backend records
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium font-mono text-slate-500">
              <span>Backend-connected workspace</span>
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
