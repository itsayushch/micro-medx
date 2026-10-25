"use client";

import * as React from "react";
import { Activity, BookOpenCheck, CircleAlert, ClipboardCheck, Info, LoaderCircle, Pill, SearchCheck, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DDI_REVIEW_DRUGS, findDdiRuleExample, getDdiReviewPartners, type DdiReviewDrug } from "@/lib/ddi-rule-examples";

type ReviewStep = {
  title: string;
  status: string;
  detail: string;
  icon: React.ReactNode;
  medicationExample?: { medication: string; dose: string; qualifiers: string; source: string; url: string };
};

interface DeterministicDdiReviewProps {
  onReviewComplete: (pair: [DdiReviewDrug, DdiReviewDrug]) => void;
}

export function DeterministicDdiReview({ onReviewComplete }: DeterministicDdiReviewProps) {
  const [drugA, setDrugA] = React.useState<DdiReviewDrug | "">("");
  const [drugB, setDrugB] = React.useState<DdiReviewDrug | "">("");
  const [reviewedPair, setReviewedPair] = React.useState<[DdiReviewDrug, DdiReviewDrug] | null>(null);
  const [completedStages, setCompletedStages] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);
  const [hasRun, setHasRun] = React.useState(false);
  const [showResult, setShowResult] = React.useState(false);

  const evidence = reviewedPair ? findDdiRuleExample(reviewedPair[0], reviewedPair[1]) : undefined;
  const availablePartners = drugA ? getDdiReviewPartners(drugA) : [];
  const hasWarfarinAspirinPair = reviewedPair?.includes("Warfarin") && reviewedPair.includes("Aspirin");
  const medicationExample = hasWarfarinAspirinPair ? {
    medication: "Apixaban",
    dose: "5 mg by mouth twice daily",
    qualifiers: "FDA-labeled example for stroke prevention in eligible adults with nonvalvular atrial fibrillation. The label gives 2.5 mg twice daily when at least 2 apply: age ≥80 years, weight ≤60 kg, or serum creatinine ≥1.5 mg/dL. Not recommended with prosthetic heart valves; this does not automatically replace aspirin or remove bleeding risk. A prescriber must assess indication, renal/hepatic function, interactions, and any transition from warfarin.",
    source: "FDA ELIQUIS (apixaban) prescribing information",
    url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/202155s039s040lbl.pdf",
  } : undefined;
  const resolution = medicationExample
    ? "For a hypothetical, eligible adult with nonvalvular atrial fibrillation only: apixaban 5 mg by mouth twice daily; 2.5 mg twice daily if at least 2 FDA dose-reduction criteria apply. It does not automatically replace aspirin. A prescriber must determine whether this option fits and manage any change from warfarin."
    : evidence?.outcome === "warning"
      ? "Ask the prescriber or pharmacist to review the combination and whether an indication-appropriate alternative is suitable. Do not stop or switch therapy based on this screen."
    : evidence
      ? "No treatment change is suggested by this review. Confirm the full medication list and patient-specific risks with a pharmacist or prescriber; this result is not a safety clearance."
      : "Choose one of the listed pairings so this review can show a supported result.";
  const steps: ReviewStep[] = reviewedPair ? [
    {
      title: "1. Medication Pair Intake",
      status: "Input received",
      detail: `The review received ${reviewedPair[0]} + ${reviewedPair[1]}. It analyzes only the selected medicine names and does not read a patient record or prescription.`,
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
    {
      title: "2. Medication Name Matching",
      status: "Names matched",
      detail: "Both selected generic names are matched against the supported rule set. Brand, dose, route, age, allergies, and organ function are not evaluated.",
      icon: <SearchCheck className="h-4 w-4" />,
    },
    {
      title: "3. Source Rule Lookup",
      status: evidence?.outcome === "warning" ? "Warning source matched" : evidence ? "Study result matched" : "Not assessed",
      detail: evidence
        ? `${evidence.summary} ${evidence.context}`
        : "This pair is outside the four source-checked examples. Select a supported pairing; no safety conclusion is available.",
      icon: <BookOpenCheck className="h-4 w-4" />,
    },
    {
      title: "4. Alternative Medication Discussion",
      status: medicationExample ? "Illustrative option available" : evidence?.outcome === "warning" ? "Indication needed" : "No change suggested",
      detail: medicationExample
        ? "For a hypothetical nonvalvular atrial fibrillation scenario only, this is an example anticoagulant option to discuss—not a recommendation for this pair or a replacement for aspirin."
        : evidence?.outcome === "warning"
        ? "A specific substitute and dose cannot be selected without knowing the treatment indication. Ask the prescriber or pharmacist to choose an appropriate alternative; do not change therapy based on this demo."
        : "This study-specific result does not call for an alternative. Do not change therapy based only on this screen.",
      icon: <Pill className="h-4 w-4" />,
      medicationExample,
    },
    {
      title: "5. Explainable Review Logic",
      status: evidence ? "Source and match shown" : "Not assessed",
      detail: "The result comes from an explicit exact-pair lookup against four source-reviewed examples. This screen does not run an AI model or use patient-level data; the selected pair and linked source explain the result.",
      icon: <Info className="h-4 w-4" />,
    },
    {
      title: "6. Clinician Review",
      status: "Review required",
      detail: "A clinician reviews the cited source alongside the patient’s complete record and decides what action, if any, is appropriate. This review does not change a medication order.",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
  ] : [];

  React.useEffect(() => {
    if (!isRunning) return;
    const timer = window.setTimeout(() => {
      const nextStage = Math.min(completedStages + 1, steps.length);
      setCompletedStages(nextStage);
      if (nextStage === steps.length) {
        setIsRunning(false);
        setShowResult(true);
      }
    }, 420);
    return () => window.clearTimeout(timer);
  }, [completedStages, isRunning, steps.length]);

  const runRuleReview = () => {
    if (!drugA || !drugB || drugA === drugB) return;
    const pair: [DdiReviewDrug, DdiReviewDrug] = [drugA, drugB];
    setReviewedPair(pair);
    onReviewComplete(pair);
    setHasRun(true);
    setShowResult(false);
    setCompletedStages(0);
    setIsRunning(true);
  };

  return (
    <section className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="mb-1 flex items-center gap-2">
        <Activity className="h-4 w-4 text-blue-600" />
        <h2 className="font-heading text-base font-bold tracking-tight text-slate-900">DDI Rule Review</h2>
      </div>
      <p className="mb-4 text-xs text-slate-500">A source-linked deterministic review across six clinical safety stages.</p>


      <div className="mb-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">Example medicines</p>
        <div className="flex flex-wrap gap-2">
          {DDI_REVIEW_DRUGS.map((drug) => (
            <span key={drug} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{drug}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
        <label className="text-xs font-semibold text-slate-700">
          Medicine A
          <Select className="mt-1" value={drugA} onChange={(event) => {
            const nextDrug = event.target.value as DdiReviewDrug | "";
            setDrugA(nextDrug);
            if (!nextDrug || !findDdiRuleExample(nextDrug, drugB)) setDrugB("");
          }}>
            <option value="">Select a medicine</option>
            {DDI_REVIEW_DRUGS.map((drug) => <option key={drug} value={drug}>{drug}</option>)}
          </Select>
        </label>
        <span className="hidden pb-2 text-sm text-slate-400 sm:block">+</span>
        <label className="text-xs font-semibold text-slate-700">
          Medicine B
          <Select className="mt-1" value={drugB} disabled={!drugA} onChange={(event) => setDrugB(event.target.value as DdiReviewDrug | "")}>
            <option value="">Select a medicine</option>
            {availablePartners.map((drug) => <option key={drug} value={drug}>{drug}</option>)}
          </Select>
        </label>
        <Button type="button" disabled={!drugA || !drugB || drugA === drugB || isRunning} className="h-9 bg-blue-600 text-xs font-bold text-white hover:bg-blue-700" onClick={runRuleReview}>
          {isRunning ? <><LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />Reviewing sources…</> : "Run rule review"}
        </Button>
      </div>
      {drugA && drugB && drugA === drugB && <p className="mt-2 text-xs text-rose-700">Choose two different medicines.</p>}

      {hasRun ? <div className="mt-5" aria-live="polite">
        <div className="mb-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>{isRunning ? "Applying source rules" : "Rule review progress"}</span>
          <span>{completedStages} / {steps.length} stages</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Rule review progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={completedStages}>
          <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${(completedStages / steps.length) * 100}%` }} />
        </div>
        <div className="space-y-2">
          {steps.map((step, index) => {
            const complete = index < completedStages;
            const active = isRunning && index === completedStages;
            return (
            <article key={step.title} className={`rounded-xl border p-3 transition-all duration-300 ${active ? "border-blue-300 bg-blue-50/70 shadow-sm" : complete ? "border-slate-200 bg-slate-50" : "border-slate-100 bg-white opacity-70"}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 ${complete || active ? "text-blue-600" : "text-slate-400"}`}>{active ? <LoaderCircle className="h-4 w-4 animate-spin" /> : step.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{step.title}</h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">{active ? "Checking" : complete ? step.status : "Queued"}</span>
                  </div>
                  {(complete || active) && <p className="mt-1 text-xs leading-relaxed text-slate-600">{active ? "Matching the selected pair against the source-linked rule set…" : step.detail}</p>}
                  {complete && step.medicationExample && (
                    <div className="mt-2 rounded-lg border border-indigo-200 bg-white p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-800">Example to discuss · not a prescription</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900">{step.medicationExample.medication} · {step.medicationExample.dose}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{step.medicationExample.qualifiers}</p>
                      <a className="mt-1 inline-block text-[11px] font-semibold text-blue-700 underline" href={step.medicationExample.url} target="_blank" rel="noreferrer">{step.medicationExample.source}</a>
                    </div>
                  )}
                  {complete && step.title.startsWith("3.") && evidence && (
                    <a className="mt-1 inline-block text-[11px] font-semibold text-blue-700 underline" href={evidence.url} target="_blank" rel="noreferrer">
                      {evidence.source}
                    </a>
                  )}
                </div>
              </div>
            </article>
          );})}
        </div>
      </div> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">Select two medicines and run the review to see the source match and six review stages.</div>}

      {showResult && reviewedPair && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowResult(false);
        }}>
          <section className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl ${evidence?.outcome === "warning" ? "border-rose-200 bg-rose-50" : evidence ? "border-sky-200 bg-sky-50" : "border-amber-200 bg-amber-50"}`} role="alertdialog" aria-modal="true" aria-labelledby="ddi-review-result-title" aria-describedby="ddi-review-result-description">
            <div className="flex items-start gap-4">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${evidence?.outcome === "warning" ? "bg-rose-100 text-rose-700" : evidence ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-800"}`}>
                {evidence?.outcome === "warning" ? <CircleAlert className="h-7 w-7" /> : <Info className="h-7 w-7" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wide ${evidence?.outcome === "warning" ? "text-rose-800" : evidence ? "text-sky-800" : "text-amber-800"}`}>
                      {evidence?.outcome === "warning" ? "Warning identified" : evidence ? "No warning identified in reviewed study" : "Not assessed"}
                </p>
                    <h3 id="ddi-review-result-title" className="mt-1 text-xl font-bold text-slate-900">{reviewedPair[0]} + {reviewedPair[1]}</h3>
                  </div>
                  <button type="button" onClick={() => setShowResult(false)} aria-label="Close result" className="rounded-lg p-1 text-slate-500 hover:bg-white/70 hover:text-slate-900">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div id="ddi-review-result-description" className="mt-4 rounded-xl border border-white/80 bg-white/75 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Resolution</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{resolution}</p>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button type="button" className="ml-auto bg-slate-900 text-white hover:bg-slate-800" onClick={() => setShowResult(false)}>Close</Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
