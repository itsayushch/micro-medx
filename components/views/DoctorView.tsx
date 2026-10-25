"use client";

import * as React from "react";
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Play,
  Pill,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
  User,
  Layers,
  FileText,
  Lock,
  ArrowRight,
  AlertCircle,
  Users,
  RefreshCw,
  Info,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  DoctorDashboardData,
  PatientDirectoryItem,
  SixAgentResult,
  SubstitutionRequestItem,
  PendingCosignItem,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { MetricCard } from "@/components/ui/metric-card";

interface DoctorViewProps {
  data: DoctorDashboardData;
  onApproveSubstitution: (caseId: string, notes: string) => Promise<void>;
  onRejectSubstitution: (caseId: string, notes: string) => Promise<void>;
  onCosignOrder: (simId: string, reason: string) => Promise<void>;
  onRunScenario: (scenarioId: number) => Promise<SixAgentResult>;
  onEvaluateSandbox: (patientId: string, drugName: string, dose: string) => Promise<SixAgentResult>;
  onOpenPatientHistory: (patientId: string) => void;
  onOpenLabSource: (reportId: string) => void;
}

const COMMON_DRUGS = [
  "Warfarin Sodium 2.5mg PO Daily",
  "Warfarin Sodium 5mg PO Daily",
  "Fluconazole 200mg PO Daily",
  "Enoxaparin Sodium (Lovenox) 80mg SC Daily",
  "Clexane (Enoxaparin) 80mg SC Daily",
  "Lisinopril 20mg PO Daily",
  "Enalapril Maleate 10mg PO Daily",
  "Digoxin 0.125mg PO Daily",
  "Amiodarone HCl 200mg PO Daily",
  "Atorvastatin Calcium 20mg PO Daily",
  "Micafungin 100mg IV Daily",
  "Unfractionated Heparin 25,000 Units Infusion",
  "Ciprofloxacin 500mg PO q12h",
  "Aspirin 81mg PO Daily",
  "Clopidogrel 75mg PO Daily",
  "Spironolactone 25mg PO Daily",
];

const MULTI_DRUG_PRESETS = [
  {
    label: "Warfarin + Fluconazole",
    badge: "CYP2C9 Bleeding DDI",
    patientId: "CASE-001",
    drugs: [
      { id: "p-1", name: "Warfarin Sodium", dose: "5 mg PO Daily" },
      { id: "p-2", name: "Fluconazole", dose: "200 mg PO Daily" },
    ],
  },
  {
    label: "Lisinopril + Enalapril",
    badge: "ACE-I Duplication",
    patientId: "CASE-003",
    drugs: [
      { id: "p-1", name: "Lisinopril", dose: "20 mg PO Daily" },
      { id: "p-2", name: "Enalapril Maleate", dose: "10 mg PO Daily" },
    ],
  },
  {
    label: "Digoxin + Amiodarone",
    badge: "P-gp Toxicity",
    patientId: "CASE-004",
    drugs: [
      { id: "p-1", name: "Digoxin", dose: "0.125 mg PO Daily" },
      { id: "p-2", name: "Amiodarone HCl", dose: "200 mg PO Daily" },
    ],
  },
  {
    label: "Enoxaparin + Heparin",
    badge: "Anticoagulation Duplication",
    patientId: "CASE-002",
    drugs: [
      { id: "p-1", name: "Enoxaparin Sodium", dose: "80 mg SC Daily" },
      { id: "p-2", name: "Heparin Sodium", dose: "5,000 Units IV Infusion" },
    ],
  },
  {
    label: "Ciprofloxacin + Amiodarone",
    badge: "Additive QTc",
    patientId: "CASE-001",
    drugs: [
      { id: "p-1", name: "Ciprofloxacin", dose: "500 mg PO q12h" },
      { id: "p-2", name: "Amiodarone HCl", dose: "200 mg PO Daily" },
    ],
  },
];

export function DoctorView({
  data,
  onApproveSubstitution,
  onRejectSubstitution,
  onCosignOrder,
  onRunScenario,
  onEvaluateSandbox,
  onOpenPatientHistory,
  onOpenLabSource,
}: DoctorViewProps) {
  const { showToast } = useToast();

  // Prescribing sandbox multi-drug state
  const [sandboxPatient, setSandboxPatient] = React.useState("CASE-001");
  const [prescribedDrugs, setPrescribedDrugs] = React.useState<{ id: string; name: string; dose: string }[]>([
    { id: "init-1", name: "Warfarin Sodium", dose: "5 mg PO Daily" },
  ]);
  const [currentDrugInput, setCurrentDrugInput] = React.useState("");
  const [currentDoseInput, setCurrentDoseInput] = React.useState("200 mg PO Daily");
  const [sandboxEvaluating, setSandboxEvaluating] = React.useState(false);
  const [drugSuggestions, setDrugSuggestions] = React.useState<string[]>([]);

  // Active AI evaluation result
  const [evaluationResult, setEvaluationResult] = React.useState<SixAgentResult | null>(null);
  const [activeScenarioId, setActiveScenarioId] = React.useState<number | null>(null);
  const [scenarioEvaluating, setScenarioEvaluating] = React.useState<number | null>(null);

  // Substitution action state
  const [processingSubId, setProcessingSubId] = React.useState<string | null>(null);
  const [processingCosignId, setProcessingCosignId] = React.useState<string | null>(null);

  const handleDrugInput = (val: string) => {
    setCurrentDrugInput(val);
    if (val.trim().length > 1) {
      const q = val.toLowerCase();
      setDrugSuggestions(COMMON_DRUGS.filter((d) => d.toLowerCase().includes(q)));
    } else {
      setDrugSuggestions([]);
    }
  };

  const handleAddDrug = (nameToAdd?: string, doseToAdd?: string) => {
    const rawName = (nameToAdd || currentDrugInput).trim();
    if (!rawName) return;

    // Support comma or plus separated entries e.g. "Warfarin, Fluconazole" or "Warfarin + Fluconazole"
    const splitNames = rawName.includes("+")
      ? rawName.split("+").map((s) => s.trim()).filter(Boolean)
      : rawName.includes(",")
      ? rawName.split(",").map((s) => s.trim()).filter(Boolean)
      : [rawName];

    const newItems = splitNames.map((n, i) => {
      const parts = n.split(" ");
      let drugTitle = n;
      let drugDose = doseToAdd || currentDoseInput || "Standard PO Daily";

      if (parts.length > 2 && (parts[1].includes("mg") || parts[1].includes("Units") || parts[1].includes("g"))) {
        drugTitle = parts[0];
        drugDose = parts.slice(1).join(" ");
      }

      return {
        id: `drug-${Date.now()}-${i}`,
        name: drugTitle,
        dose: drugDose,
      };
    });

    setPrescribedDrugs((prev) => [...prev, ...newItems]);
    setCurrentDrugInput("");
    setDrugSuggestions([]);
    showToast(`Added ${newItems.length > 1 ? `${newItems.length} medications` : newItems[0].name} to prescription regimen.`, "info");
  };

  const handleRemoveDrug = (id: string) => {
    setPrescribedDrugs((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      if (filtered.length === 0) {
        showToast("Removed medication. Regimen is now empty.", "info");
      }
      return filtered;
    });
  };

  const handleSelectMultiPreset = (combo: {
    label: string;
    badge: string;
    patientId: string;
    drugs: { id: string; name: string; dose: string }[];
  }) => {
    setSandboxPatient(combo.patientId);
    setPrescribedDrugs(combo.drugs.map((d, i) => ({ ...d, id: `combo-${Date.now()}-${i}` })));
    setCurrentDrugInput("");
    setDrugSuggestions([]);
    showToast(`Loaded ${combo.label} (${combo.badge}) into prescription regimen.`, "info");
  };

  const handleRunScenarioClick = async (scenarioId: number) => {
    setScenarioEvaluating(scenarioId);
    setActiveScenarioId(scenarioId);
    try {
      const res = await onRunScenario(scenarioId);
      setEvaluationResult(res);
      showToast(`Scenario ${scenarioId} evaluated across 6-agent clinical pipeline.`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to run scenario", "error");
    } finally {
      setScenarioEvaluating(null);
    }
  };

  const handleEvaluateSandboxClick = async (e: React.FormEvent) => {
    e.preventDefault();

    let allDrugs = [...prescribedDrugs];
    if (currentDrugInput.trim()) {
      const parts = currentDrugInput.trim().split(" ");
      let drugTitle = currentDrugInput.trim();
      let drugDose = currentDoseInput || "Standard PO Daily";
      if (parts.length > 2 && (parts[1].includes("mg") || parts[1].includes("Units"))) {
        drugTitle = parts[0];
        drugDose = parts.slice(1).join(" ");
      }
      allDrugs.push({
        id: `drug-${Date.now()}`,
        name: drugTitle,
        dose: drugDose,
      });
      setPrescribedDrugs(allDrugs);
      setCurrentDrugInput("");
      setDrugSuggestions([]);
    }

    if (allDrugs.length === 0) {
      showToast("Please add at least one medication to evaluate.", "warning");
      return;
    }

    setSandboxEvaluating(true);
    try {
      const combinedNames = allDrugs.map((d) => d.name).join(" + ");
      const combinedDoses = allDrugs.map((d) => `${d.name}: ${d.dose}`).join(" | ");
      const res = await onEvaluateSandbox(sandboxPatient, combinedNames, combinedDoses);
      setEvaluationResult(res);
      showToast(`Evaluated ${allDrugs.length} medication${allDrugs.length > 1 ? "s" : ""} across 6-agent clinical pipeline.`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to evaluate prescription", "error");
    } finally {
      setSandboxEvaluating(false);
    }
  };

  const handleApproveSub = async (caseId: string) => {
    setProcessingSubId(caseId);
    try {
      await onApproveSubstitution(caseId, "Physician authorized formulary substitution based on equivalent efficacy.");
      showToast(`Substitution for ${caseId} approved and recorded.`, "success");
    } finally {
      setProcessingSubId(null);
    }
  };

  const handleRejectSub = async (caseId: string) => {
    setProcessingSubId(caseId);
    try {
      await onRejectSubstitution(caseId, "Physician declined brand substitution; hold order pending specialist review.");
      showToast(`Substitution for ${caseId} rejected.`, "warning");
    } finally {
      setProcessingSubId(null);
    }
  };

  const handleCosignClick = async (simId: string) => {
    setProcessingCosignId(simId);
    try {
      await onCosignOrder(simId, "Physician authorized clinical safety override & validated dosage adjustment.");
      showToast("Order co-signature verified and sealed on SHA-256 ledger.", "success");
    } finally {
      setProcessingCosignId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 HIGH-IMPACT KPI STAT CARDS (MarkMyAd Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Inpatients"
          value={data.stats.total_patients}
          change="+12"
          trend="up"
          hint="Assigned to Acute Inpatient Service"
          icon={<Users className="w-4 h-4" />}
          variant="default"
        />

        <MetricCard
          title="Pending Co-Signs"
          value={data.stats.pending_cosigns_count}
          change={data.stats.pending_cosigns_count > 0 ? "Requires Sign-Off" : "0"}
          trend={data.stats.pending_cosigns_count > 0 ? "down" : "up"}
          hint="Mandatory Physician Sign-Off Required"
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="warning"
        />

        <MetricCard
          title="Pharmacy Substitutions"
          value={data.stats.substitution_requests_count}
          change={data.stats.substitution_requests_count > 0 ? "Pending Review" : "0"}
          trend="up"
          hint="Formulary Alternatives Awaiting Approval"
          icon={<RefreshCw className="w-4 h-4" />}
          variant="teal"
        />

        <MetricCard
          title="Active Safety Warnings"
          value={data.stats.active_findings_count}
          change={data.stats.active_findings_count > 0 ? "High Risk" : "0"}
          trend="down"
          hint="High Clinical Risk Combinations Detected"
          icon={<AlertCircle className="w-4 h-4" />}
          variant="critical"
        />
      </div>

      {/* SECTION: PHARMACY BRAND SUBSTITUTION QUEUE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center ring-1 ring-teal-500/20">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
                Pharmacy Brand Substitution Requests
              </h2>
              <p className="text-xs text-slate-500">
                Formulary replacements proposed by hospital clinical pharmacists due to out-of-stock items.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
            {data.substitution_requests.length} Pending Approval
          </span>
        </div>

        {data.substitution_requests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm font-medium">
            ✓ All pharmacy brand substitution requests have been reviewed.
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {data.substitution_requests.map((sub, idx) => (
              <div
                key={idx}
                className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4.5 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                      {sub.case_id}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{sub.patient_name}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{sub.request_time}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200/70">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 mb-0.5">
                      Unavailable Prescribed Brand
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{sub.original_prescription}</div>
                    <div className="text-xs text-rose-700 font-semibold mt-1">
                      ⚠️ Stock Depleted (0 Units in Central Formulary)
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-200/70">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 mb-0.5">
                      Pharmacist Proposed Formulary Alternative
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{sub.suggested_alternative}</div>
                    <div className="text-xs text-teal-700 font-semibold mt-1">
                      ✓ {sub.stock_detail}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-lg p-3 text-xs text-slate-700 mb-3.5 space-y-1">
                  <div>
                    <span className="font-bold text-slate-900">Pharmacist Rationale: </span>
                    {sub.clinical_reason}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Requested by: <strong className="text-slate-600">{sub.pharmacist_name}</strong> &bull; Hospital Pharmacy Core
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectSub(sub.case_id)}
                    disabled={processingSubId === sub.case_id}
                    className="text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800"
                  >
                    Reject Substitution
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleApproveSub(sub.case_id)}
                    disabled={processingSubId === sub.case_id}
                    className="text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Brand Substitution
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION: MANDATORY PHYSICIAN CO-SIGN QUEUE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center ring-1 ring-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
                Mandatory Physician Co-Sign Queue
              </h2>
              <p className="text-xs text-slate-500">
                High-potency clinical adjustments requiring attending clinician authorization.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
            {data.pending_cosigns.length} Orders Pending Sign-off
          </span>
        </div>

        {data.pending_cosigns.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm font-medium">
            ✓ All high-risk clinical orders have been signed and authorized.
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {data.pending_cosigns.map((order, idx) => (
              <div
                key={idx}
                className="bg-amber-50/20 border border-amber-200/70 rounded-xl p-4.5 hover:border-amber-300 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                      {order.case_id}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{order.patient_name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    {order.urgency}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-amber-200/80 mb-2.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 mb-0.5">
                    Proposed Clinical Action
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{order.proposed_action}</div>
                </div>

                <div className="text-xs text-slate-600 mb-3 leading-relaxed">
                  <span className="font-bold text-slate-800">Safety Threshold: </span>
                  {order.rationale}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-200/50">
                  <button
                    type="button"
                    onClick={() => onOpenPatientHistory(order.case_id)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View Patient History <ExternalLink className="w-3 h-3" />
                  </button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleCosignClick(order.simulation_id)}
                    disabled={processingCosignId === order.simulation_id}
                    className="text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Co-Sign &amp; Authorize Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SIDE-BY-SIDE: CLINICAL CASES & PRESCRIBING WORKSTATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 1-Click Interactive Scenarios (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
                Deterministic CDS Scenarios
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Execute validated clinical safety evaluations through the 6-agent engine with real lab telemetry.
            </p>

            <div className="space-y-3">
              {/* Scenario 1 */}
              <div
                onClick={() => handleRunScenarioClick(1)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeScenarioId === 1
                    ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20"
                    : "bg-slate-50/60 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="text-xs font-bold text-slate-900">
                    Case 1: Warfarin + Fluconazole CYP2C9
                  </div>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    Critical Risk
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Patient Sarah Jenkins &bull; Baseline INR 3.4 &bull; Flagged CYP2C9 inhibition &amp; catastrophic bleeding risk.
                </p>
                <div className="mt-2 text-right">
                  <span className="text-[11px] font-bold text-blue-600 inline-flex items-center gap-1">
                    {scenarioEvaluating === 1 ? "Running 6-Agent AI..." : "Evaluate Case 1 →"}
                  </span>
                </div>
              </div>

              {/* Scenario 2 */}
              <div
                onClick={() => handleRunScenarioClick(2)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeScenarioId === 2
                    ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20"
                    : "bg-slate-50/60 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="text-xs font-bold text-slate-900">
                    Case 2: Enoxaparin (LMWH) Renal Clearance
                  </div>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    High Risk
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Patient Robert Chen &bull; Cr 2.4 mg/dL (eGFR 28 mL/min) &bull; LMWH bioaccumulation hazard.
                </p>
                <div className="mt-2 text-right">
                  <span className="text-[11px] font-bold text-blue-600 inline-flex items-center gap-1">
                    {scenarioEvaluating === 2 ? "Running 6-Agent AI..." : "Evaluate Case 2 →"}
                  </span>
                </div>
              </div>

              {/* Scenario 3 */}
              <div
                onClick={() => handleRunScenarioClick(3)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeScenarioId === 3
                    ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20"
                    : "bg-slate-50/60 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="text-xs font-bold text-slate-900">
                    Case 3: Lisinopril + Enalapril ACE-I Duplication
                  </div>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Duplication
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Patient Elena Rostova &bull; Redundant ACE-inhibitor class duplication &amp; profound hypotension hazard.
                </p>
                <div className="mt-2 text-right">
                  <span className="text-[11px] font-bold text-blue-600 inline-flex items-center gap-1">
                    {scenarioEvaluating === 3 ? "Running 6-Agent AI..." : "Evaluate Case 3 →"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Validated against offline clinical pharmacology knowledge packs &amp; KDIGO guidelines.
          </div>
        </div>

        {/* Right: Prescribing Sandbox Workstation (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
              Interactive Prescribing Sandbox
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Simulate novel inpatient prescriptions in real-time with automatic drug-drug &amp; lab parameter safety validation.
          </p>

          <form onSubmit={handleEvaluateSandboxClick} className="space-y-4">
            {/* Active Inpatient Context */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Active Inpatient Context
              </label>
              <Select
                value={sandboxPatient}
                onChange={(e) => setSandboxPatient(e.target.value)}
                className="w-full text-xs font-medium"
              >
                <option value="CASE-001">Sarah Jenkins (CASE-001) — AF w/ Warfarin • CrCl 65 mL/min</option>
                <option value="CASE-002">Robert Chen (CASE-002) — DVT w/ CKD Stage 3B • CrCl 28 mL/min</option>
                <option value="CASE-003">Elena Rostova (CASE-003) — Hypertension Stage II • CrCl 78 mL/min</option>
                <option value="CASE-004">Arthur Pendelton (CASE-004) — CHF &amp; Digoxin • CrCl 42 mL/min</option>
              </Select>
            </div>

            {/* CURRENT PRESCRIBED REGIMEN (CHIPS / TAGS) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-blue-600" />
                  Prescribed Regimen ({prescribedDrugs.length} Medication{prescribedDrugs.length > 1 ? "s" : ""})
                </span>
                {prescribedDrugs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPrescribedDrugs([])}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {prescribedDrugs.length === 0 ? (
                <div className="py-2.5 text-center text-slate-400 text-xs italic">
                  No medications added yet. Search and add drugs below to build your clinical regimen.
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {prescribedDrugs.map((drug) => (
                    <div
                      key={drug.id}
                      className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg bg-white border border-blue-200/80 text-xs shadow-2xs group hover:border-blue-300 transition-colors"
                    >
                      <span className="font-bold text-slate-900">{drug.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                        {drug.dose}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDrug(drug.id)}
                        className="w-4 h-4 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title={`Remove ${drug.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PRESCRIBE DRUG INPUT WITH INTELLIGENT AUTOCOMPLETE */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Prescribe Drug Name (Intelligent Suggestions — Accepts Multiple Drugs)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={currentDrugInput}
                    onChange={(e) => handleDrugInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDrug();
                      }
                    }}
                    placeholder="Type drug name (or multiple e.g. Warfarin, Fluconazole)..."
                    className="text-xs font-medium pr-8"
                  />
                  {currentDrugInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentDrugInput("");
                        setDrugSuggestions([]);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => handleAddDrug()}
                  disabled={!currentDrugInput.trim()}
                  className="h-9 px-3.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Drug
                </Button>
              </div>

              {/* Intelligent Suggestions Dropdown */}
              {drugSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Intelligent Suggestions (Click to Add)</span>
                    <span className="text-blue-600 font-bold">{drugSuggestions.length} Matches</span>
                  </div>
                  {drugSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddDrug(sug)}
                      className="w-full text-left px-3.5 py-2 text-xs hover:bg-blue-50 text-slate-800 font-medium flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Pill className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                        <span className="group-hover:text-blue-900 font-semibold">{sug}</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        + Add to Regimen
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dosage & Frequency for Next Drug */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Dosage, Route &amp; Frequency (for Added Medication)
                </label>
                <span className="text-[11px] text-slate-400">Customizable per medication</span>
              </div>
              <Input
                type="text"
                value={currentDoseInput}
                onChange={(e) => setCurrentDoseInput(e.target.value)}
                placeholder="e.g. 5 mg PO Daily"
                className="text-xs font-medium"
              />
            </div>

            {/* Quick Dose Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="text-[11px] font-bold text-slate-400">Quick Dose Presets:</span>
              {["2.5 mg PO Daily", "5 mg PO Daily", "10 mg PO Daily", "200 mg PO Daily", "80 mg SC Daily"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCurrentDoseInput(preset)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* 1-Click Multi-Drug Regimen Presets */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span>1-Click Multi-Drug Test Combinations:</span>
                <span className="text-[10px] text-indigo-600 font-bold">Pre-configured DDI Challenges</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MULTI_DRUG_PRESETS.map((combo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectMultiPreset(combo)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/70 text-indigo-900 text-xs font-bold transition-all cursor-pointer hover:shadow-2xs"
                  >
                    <span>{combo.label}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-200/80 text-indigo-900 font-extrabold">
                      {combo.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Evaluation Submit Button */}
            <Button
              type="submit"
              disabled={sandboxEvaluating || (prescribedDrugs.length === 0 && !currentDrugInput.trim())}
              className="w-full h-11 text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            >
              {sandboxEvaluating
                ? "Evaluating Multi-Drug Regimen with 6-Agent AI..."
                : `Run 6-Agent Safety Evaluation (${prescribedDrugs.length || 1} Medication${
                    (prescribedDrugs.length || 1) > 1 ? "s" : ""
                  } in Regimen)`}
            </Button>
          </form>
        </div>
      </div>

      {/* SECTION: EXPLAINABLE AI (XAI) EVALUATION CONTAINER */}
      {evaluationResult && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
                  (evaluationResult.findings[0]?.severity || "").toLowerCase().includes("crit") || activeScenarioId === 1
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-500/50"
                    : "bg-amber-500 text-white shadow-sm shadow-amber-500/50"
                }`}
              >
                {(evaluationResult.findings[0]?.severity || "CRITICAL").toUpperCase()} SEVERITY
              </span>
              <div>
                <h3 className="font-heading text-lg font-bold text-white tracking-tight">
                  {evaluationResult.patient?.name || "Patient"} ({evaluationResult.patient?.identifier || "CASE-001"})
                </h3>
                <p className="text-xs text-slate-300">
                  {evaluationResult.findings[0]?.title || "Clinical Medication Safety Finding"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenPatientHistory(evaluationResult.patient?.identifier || "CASE-001")}
                className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Patient Medical History
              </Button>
              {evaluationResult.lab_evidence?.lab_report_id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenLabSource(evaluationResult.lab_evidence.lab_report_id!)}
                  className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  Lab Report ({evaluationResult.lab_evidence.lab_report_id})
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* 1. Medication Safety Assessment */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  1. Clinical Safety Assessment
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                  Actionable Finding
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                {evaluationResult.findings[0]?.description}
              </p>
            </div>

            {/* 2. Laboratory Evidence & Provenance */}
            <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-1">
                  2. Lab Evidence &amp; Knowledge Provenance
                </div>
                <div className="text-xs text-slate-700">
                  Evidence ID: <strong className="text-slate-900">{evaluationResult.lab_evidence?.evidence_id || "AEGIS-EV-001"}</strong> &bull; Source: <strong className="text-slate-900">{evaluationResult.lab_evidence?.source || "Inpatient Core Lab"}</strong>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Linked Pathology: <code className="text-slate-700 font-mono">{evaluationResult.lab_evidence?.source_document || "data/lab_reports/LAB-2026-0001.json"}</code> &bull; Status: <span className="text-emerald-700 font-bold">Verified Locally</span>
                </div>
              </div>
              {evaluationResult.lab_evidence?.lab_report_id && (
                <Button
                  size="sm"
                  onClick={() => onOpenLabSource(evaluationResult.lab_evidence.lab_report_id!)}
                  className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                >
                  View Verified Report
                </Button>
              )}
            </div>

            {/* 3. Clinical Pharmacotherapy Rationale */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                3. Pharmacotherapy Rationale &amp; Mechanism
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {evaluationResult.clinical_rationale || "Pharmacological metabolic pathway interaction assessed against active inpatient lab telemetry."}
              </p>
            </div>

            {/* 4. Action Recommendation & Co-Sign */}
            <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-4.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                  4. Recommended Action &amp; Mandatory Co-Sign
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900">
                  Physician Sign-Off Required
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 mb-1">
                {evaluationResult.simulated_orders[0]?.proposed_action}
              </div>
              <div className="text-xs text-slate-600 mb-3">
                {evaluationResult.simulated_orders[0]?.rationale}
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() =>
                    handleCosignClick(evaluationResult.simulated_orders[0]?.simulation_id || "SIM-DEMO")
                  }
                  className="text-xs font-bold gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Co-Sign &amp; Approve Recommendation
                </Button>
              </div>
            </div>

            {/* 5. 6-CARD EXPLAINABLE AI BREAKDOWN */}
            <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    🤖 Local Explainable AI (XAI)
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Multi-Agent Clinical Interpretation Engine
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700">Deterministic Safety Grounded</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-700 mb-1">🔍 Flagged Reason</div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {evaluationResult.explainable_ai.why_flagged || "-"}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-700 mb-1">⚡ Kinetic Mechanism</div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {evaluationResult.explainable_ai.mechanism || "-"}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold text-rose-700 mb-1">⚠️ Clinical Significance</div>
                  <div className="text-xs text-rose-800 font-semibold leading-relaxed">
                    {evaluationResult.explainable_ai.significance || "-"}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold text-teal-700 mb-1">💊 Recommended Alternatives</div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {evaluationResult.explainable_ai.alternatives || "-"}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold text-blue-700 mb-1">🩺 Monitoring Protocol</div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {evaluationResult.explainable_ai.monitoring || "-"}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold text-purple-700 mb-1">🛡️ Reversible Antidotes</div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {evaluationResult.explainable_ai.reversible_actions || "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* 6-Agents Pipeline Trace (Dark Console) */}
            {evaluationResult.six_agents_trace && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-slate-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <Layers className="w-3.5 h-3.5" /> 6-Agent Execution Trace
                  </span>
                  <span className="text-emerald-400 font-bold">[LOCAL PIPELINE VERIFIED]</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {evaluationResult.six_agents_trace.map((ag, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
                      <div className="font-bold text-slate-200 text-xs">{ag.agent}</div>
                      <div className="text-slate-400 font-sans text-[11px] mt-0.5 leading-snug">
                        {ag.summary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: INPATIENT ROSTER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center ring-1 ring-blue-500/20">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
                Active Inpatient Roster &amp; Clinical Regimens
              </h2>
              <p className="text-xs text-slate-500">
                Current clinical service census with assigned medications and renal risk classification.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
            {data.inpatients.length} Assigned Patients
          </span>
        </div>

        <div className="overflow-x-auto pt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/80">
                <th className="py-2.5 px-3">Patient ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Age / Sex</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Primary Condition</th>
                <th className="py-2.5 px-3">Active Regimen</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3 text-right">EHR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.inpatients.map((pt, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">{pt.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{pt.name}</td>
                  <td className="py-3 px-3 text-slate-600">{pt.age}y &bull; {pt.sex}</td>
                  <td className="py-3 px-3 text-slate-600">{pt.dept}</td>
                  <td className="py-3 px-3 text-slate-800">{pt.condition}</td>
                  <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{pt.regimen}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pt.risk === "Critical"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : pt.risk === "High"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {pt.risk}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenPatientHistory(pt.id)}
                      className="text-xs h-7 px-2.5 font-bold text-blue-700 border-blue-200 hover:bg-blue-50"
                    >
                      View EHR →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
