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
  PairSeverityAdvisoryResult,
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
  onEvaluateSandbox: (drugName: string) => Promise<PairSeverityAdvisoryResult>;
  onOpenPatientHistory: (patientId: string) => void;
  onOpenLabSource: (reportId: string) => void;
}

const COMMON_DRUGS = [
  // Keep suggestions to model-recognized ingredient names. Dose and route are
  // entered separately and are not model features.
  "Warfarin",
  "Fluconazole",
  "Enoxaparin",
  "Lisinopril",
  "Enalapril",
  "Digoxin",
  "Amiodarone",
  "Atorvastatin",
  "Micafungin",
  "Heparin",
  "Ciprofloxacin",
  "Acetylsalicylic acid",
  "Clopidogrel",
  "Spironolactone",
];

const MODEL_NAME_ALIASES: Record<string, string> = {
  "enoxaparin sodium (lovenox) 80mg sc daily": "Enoxaparin",
  "clexane (enoxaparin) 80mg sc daily": "Enoxaparin",
  "enoxaparin sodium (lovenox)": "Enoxaparin",
  "clexane (enoxaparin)": "Enoxaparin",
};

function modelDrugName(name: string): string {
  const trimmed = name.trim();
  return MODEL_NAME_ALIASES[trimmed.toLocaleLowerCase().replace(/\s+/g, " ")] || trimmed;
}

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
  const [prescribedDrugs, setPrescribedDrugs] = React.useState<{ id: string; name: string; dose: string }[]>([]);
  const [currentDrugInput, setCurrentDrugInput] = React.useState("");
  const [currentDoseInput, setCurrentDoseInput] = React.useState("");
  const [sandboxEvaluating, setSandboxEvaluating] = React.useState(false);
  const [drugSuggestions, setDrugSuggestions] = React.useState<string[]>([]);

  // Active AI evaluation result
  const [evaluationResult, setEvaluationResult] = React.useState<SixAgentResult | null>(null);
  const [advisoryResult, setAdvisoryResult] = React.useState<PairSeverityAdvisoryResult | null>(null);
  const [activeScenarioId] = React.useState<number | null>(null);

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

    // Support comma or plus separated names without mixing dose/route text into the model input.
    const splitNames = rawName.includes("+")
      ? rawName.split("+").map((s) => s.trim()).filter(Boolean)
      : rawName.includes(",")
      ? rawName.split(",").map((s) => s.trim()).filter(Boolean)
      : [rawName];

    const newItems = splitNames.map((n, i) => {
      return {
        id: `drug-${Date.now()}-${i}`,
        name: n,
        dose: doseToAdd || currentDoseInput || "Dose not specified",
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

  const handleEvaluateSandboxClick = async (e: React.FormEvent) => {
    e.preventDefault();

    const allDrugs = [...prescribedDrugs];
    if (currentDrugInput.trim()) {
      allDrugs.push({
        id: `drug-${Date.now()}`,
        name: currentDrugInput.trim(),
        dose: currentDoseInput || "Dose not specified",
      });
      setPrescribedDrugs(allDrugs);
      setCurrentDrugInput("");
      setDrugSuggestions([]);
    }

    if (allDrugs.length !== 2) {
      showToast("The severity advisory accepts exactly two drug names.", "warning");
      return;
    }

    const modelNames = allDrugs.map((drug) => modelDrugName(drug.name));
    if (modelNames[0].toLocaleLowerCase() === modelNames[1].toLocaleLowerCase()) {
      showToast("Both entries refer to the same active ingredient. Choose two different drugs for a pair advisory.", "warning");
      return;
    }

    setSandboxEvaluating(true);
    try {
      const combinedNames = modelNames.join(" + ");
      const res = await onEvaluateSandbox(combinedNames);
      setAdvisoryResult(res);
      setEvaluationResult(null);
      showToast("Severity advisory received from the backend.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to evaluate prescription", "error");
    } finally {
      setSandboxEvaluating(false);
    }
  };

  const handleApproveSub = async (requestId: string) => {
    setProcessingSubId(requestId);
    try {
      await onApproveSubstitution(requestId, "Physician approved the substitution request.");
      showToast("Substitution decision recorded.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not record the decision.", "error");
    } finally {
      setProcessingSubId(null);
    }
  };

  const handleRejectSub = async (requestId: string) => {
    setProcessingSubId(requestId);
    try {
      await onRejectSubstitution(requestId, "Physician rejected the substitution request.");
      showToast("Substitution decision recorded.", "warning");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not record the decision.", "error");
    } finally {
      setProcessingSubId(null);
    }
  };

  const handleCosignClick = async (simId: string) => {
    setProcessingCosignId(simId);
    try {
      await onCosignOrder(simId, "Physician decision recorded after review.");
      showToast("Order decision recorded by the backend.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not record the co-sign.", "error");
    } finally {
      setProcessingCosignId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 HIGH-IMPACT KPI STAT CARDS (MarkMyAd Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Patient Records"
          value={data.stats.total_patients}
          change="Backend count"
          trend="neutral"
          hint="Patient records returned by the backend"
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
            {data.substitution_requests.filter((request) => request.status === "PENDING").length} Pending Approval
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
                      Inventory status is not tracked
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-200/70">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 mb-0.5">
                      Pharmacist Proposed Formulary Alternative
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{sub.suggested_alternative}</div>
                    <div className="text-xs text-teal-700 font-semibold mt-1">
                      {sub.stock_detail}
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
                  {sub.status === "PENDING" ? <><Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectSub(String(sub.request_id))}
                    disabled={processingSubId === String(sub.request_id)}
                    className="text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800"
                  >
                    Reject Substitution
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleApproveSub(String(sub.request_id))}
                    disabled={processingSubId === String(sub.request_id)}
                    className="text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Brand Substitution
                  </Button></> : <span className="text-xs font-semibold text-slate-600">Status: {sub.status}</span>}
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
        {/* Left: persisted findings (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-indigo-600" />
              <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
                Persisted Clinical Findings
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Findings recorded in the connected backend. Review the patient history for supporting records.
            </p>

            <div className="space-y-3">
              {data.active_findings.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500">No findings are recorded by the backend.</p> : data.active_findings.map((finding) => (
                <button key={finding.id} type="button" onClick={() => onOpenPatientHistory(finding.patient_id)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left hover:border-slate-300">
                  <div className="flex items-center justify-between gap-2"><strong className="text-xs text-slate-900">{finding.title}</strong><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">{finding.severity}</span></div>
                  <p className="mt-1 text-[11px] text-slate-600">{finding.description || "No description recorded."}</p>
                  <span className="mt-2 block text-[10px] font-mono text-slate-500">Patient record: {finding.patient_id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            This panel displays persisted records and does not create or validate clinical findings.
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
              Request a backend ML severity estimate for one drug pair. It does not determine whether the pair interacts or use patient context, dose, or route.
          </p>

          <form onSubmit={handleEvaluateSandboxClick} className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Advisory only: the model estimates severity only when an interaction is independently documented. It cannot establish interaction existence or clinical safety.
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
                Drug Name / Active Ingredient (Suggestions use known model names)
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

            {/* Evaluation Submit Button */}
            <Button
              type="submit"
              disabled={sandboxEvaluating || prescribedDrugs.length + (currentDrugInput.trim() ? 1 : 0) !== 2}
              className="w-full h-11 text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            >
              {sandboxEvaluating
                ? "Requesting backend estimate..."
                : `Get Pair Severity Advisory (${prescribedDrugs.length} Medication${
                    (prescribedDrugs.length || 1) > 1 ? "s" : ""
                  } in Regimen)`}
            </Button>
          </form>
        </div>
      </div>

      {advisoryResult && (
        <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Backend ML severity advisory</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{advisoryResult.advisory.drug_a} + {advisoryResult.advisory.drug_b}</h3>
              <p className="mt-1 text-sm text-slate-700">{advisoryResult.notice}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              {advisoryResult.advisory.display_severity} · {advisoryResult.advisory.display_severity_source}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">{advisoryResult.advisory.explanation_text}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {Object.entries(advisoryResult.advisory.probabilities).map(([label, probability]) => (
              <span key={label} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1">{label}: {(probability * 100).toFixed(1)}%</span>
            ))}
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-600">
            {advisoryResult.advisory.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
          </ul>
        </section>
      )}

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
                  onClick={() => {
                    const simulationId = evaluationResult.simulated_orders[0]?.simulation_id;
                    if (simulationId) void handleCosignClick(simulationId);
                  }}
                  disabled={!evaluationResult.simulated_orders[0]?.simulation_id || processingCosignId !== null}
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
            {/* {evaluationResult.six_agents_trace && (
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
            )} */}
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
                  <td className="py-3 px-3 text-slate-600">{pt.age == null ? "Age not recorded" : `${pt.age}y`} &bull; {pt.sex || "Not recorded"}</td>
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
