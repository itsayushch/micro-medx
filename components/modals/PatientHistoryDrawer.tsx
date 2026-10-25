"use client";

import * as React from "react";
import {
  FileText,
  Clock,
  AlertTriangle,
  Pill,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  ExternalLink,
} from "lucide-react";
import { PatientHistoryDetail } from "@/lib/types";
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PatientHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientData: PatientHistoryDetail | null;
  onViewLabSource?: (reportId: string) => void;
}

export function PatientHistoryDrawer({
  open,
  onOpenChange,
  patientData,
  onViewLabSource,
}: PatientHistoryDrawerProps) {
  if (!patientData) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} widthClass="max-w-4xl">
      <DrawerHeader onClose={() => onOpenChange(false)}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {patientData.case_id}
            </span>
            <span className="text-xs text-slate-500 font-medium">MRN: {patientData.mrn || "Not recorded"}</span>
            <span className="text-xs text-slate-500 font-medium">Blood: {patientData.blood_group || "Not recorded"}</span>
            <Badge variant="teal">Longitudinal EHR Record</Badge>
          </div>
          <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
            {patientData.name}
            <span className="text-base text-slate-500 font-normal">
              ({patientData.age == null ? "Age not recorded" : `${patientData.age}y`} &bull; {patientData.sex || "Sex not recorded"})
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
            <span>
              <strong>Conditions:</strong> {patientData.conditions_summary}
            </span>
            <span className="text-red-700 font-semibold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Allergies: {patientData.allergies_summary}
            </span>
          </div>
        </div>
      </DrawerHeader>

      <DrawerBody className="space-y-6">
        {/* 1. Longitudinal Timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            1. Longitudinal Clinical Timeline
          </div>
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-slate-200">
            {patientData.timeline?.map((item, idx) => (
              <div key={idx} className="relative flex items-start gap-4 pl-6">
                <div className="absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-mono">{item.date || "Not recorded"}</span>
                    <Badge variant="info" className="text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{item.event}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Actor: {item.actor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Medical Conditions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
            <Activity className="h-4 w-4 text-emerald-600" />
            2. Active Medical Diagnoses
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-2 px-3">Condition</th>
                  <th className="py-2 px-3">Diagnosed</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Clinical Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {patientData.medical_conditions?.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.condition}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{c.diagnosis_date || "Not recorded"}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="success" className="text-[10px]">{c.status}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Medication Regimens */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
            <Pill className="h-4 w-4 text-purple-600" />
            3. Active & Historical Pharmacotherapy
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-2 px-3">Medication</th>
                  <th className="py-2 px-3">Strength & Route</th>
                  <th className="py-2 px-3">Timeframe</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Prescriber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {patientData.medication_history?.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.medication}</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.strength} ({m.route})</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {m.start_date || "Not recorded"} &rarr; {m.end_date || "Ongoing / not recorded"}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={m.status.includes("Active") ? "success" : "warning"}
                        className="text-[10px]"
                      >
                        {m.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{m.prescribing_doctor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Laboratory History */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Activity className="h-4 w-4 text-blue-600" />
              4. Laboratory Evidence & Diagnostic Observations
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Test</th>
                  <th className="py-2 px-3">Result</th>
                  <th className="py-2 px-3">Reference Range</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {patientData.laboratory_history?.map((lab, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{lab.date}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{lab.test}</td>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900">
                      {lab.result} <span className="text-slate-500 font-normal">{lab.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{lab.reference_range}</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          lab.status.includes("Critical")
                            ? "critical"
                            : lab.status.includes("High") || lab.status.includes("Low")
                            ? "warning"
                            : "success"
                        }
                        className="text-[10px]"
                      >
                        {lab.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      {lab.source_report_id ? (
                        <button
                          onClick={() => onViewLabSource && onViewLabSource(lab.source_report_id!)}
                          className="text-blue-600 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                        >
                          {lab.source_report_id} <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Clinical Safety & Pharmacy Events */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              5. Clinical Safety Assessments
            </div>
            <div className="space-y-2">
              {patientData.clinical_assessments?.map((item, idx) => (
                <div key={idx} className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-amber-900">{item.assessment}</strong>
                    <Badge variant="critical" className="text-[10px]">{item.risk_level}</Badge>
                  </div>
                  <div className="text-slate-700 leading-relaxed">{item.recommendation}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Evaluated by: {item.doctor}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Pill className="h-4 w-4 text-blue-600" />
              6. Pharmacy Fulfillment Events
            </div>
            <div className="space-y-2">
              {patientData.pharmacy_events?.map((item, idx) => (
                <div key={idx} className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-blue-900">{item.medication}</strong>
                    <Badge variant="teal" className="text-[10px]">{item.dispensing_status}</Badge>
                  </div>
                  <div className="text-slate-700">Availability: {item.availability}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Doctor Verification: {item.doctor_verification}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Cryptographic Patient Audit Trail */}
        <div className="rounded-xl border border-slate-200 bg-slate-900 text-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              7. Patient-Scoped Audit Events
            </div>
            <Badge variant="teal" className="text-[10px] bg-emerald-950 text-emerald-300 border-emerald-800">
              Backend audit events
            </Badge>
          </div>
          <div className="space-y-2 font-mono text-xs">
            {patientData.audit_events?.map((ev, idx) => (
              <div key={idx} className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-slate-400 text-[11px]">{ev.timestamp} &bull; {ev.user_role}</div>
                  <div className="text-slate-200 font-sans font-bold">{ev.action}</div>
                  <div className="text-emerald-400 text-[11px]">Hash: {ev.audit_hash || "Not provided by backend"}</div>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-slate-700 text-slate-200 border-none shrink-0">
                  {ev.event_type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </DrawerBody>

      <DrawerFooter>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Close Medical Record
        </Button>
      </DrawerFooter>
    </Drawer>
  );
}
