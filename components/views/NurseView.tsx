"use client";

import * as React from "react";
import {
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  QrCode,
  Eye,
  AlertCircle,
  FileCheck,
  ShieldAlert,
} from "lucide-react";
import { NurseDashboardData, NurseMARItem, NurseVitalLabItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { MetricCard } from "@/components/ui/metric-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NurseViewProps {
  data: NurseDashboardData;
  onOpenMARModal: (item: NurseMARItem) => void;
  onOpenVitalModal: (item: NurseVitalLabItem) => void;
  onRecordVital: (patientId: string, param: string, value: string, unit: string) => Promise<void>;
  onOpenPatientHistory: (patientId: string) => void;
}

const PARAMETER_UNITS: Record<string, string> = {
  "Blood Pressure": "mmHg",
  "Heart Rate": "bpm",
  "SpO₂": "%",
  "Respiratory Rate": "breaths/min",
  "Temperature": "°F",
  "Serum Creatinine": "mg/dL",
  "eGFR (CKD-EPI)": "mL/min",
  "Potassium (K+)": "mEq/L",
  "Prothrombin Time (INR)": "ratio",
  "Blood Glucose": "mg/dL",
};

export function NurseView({
  data,
  onOpenMARModal,
  onOpenVitalModal,
  onRecordVital,
  onOpenPatientHistory,
}: NurseViewProps) {
  const { showToast } = useToast();

  const [marFilter, setMarFilter] = React.useState<"ALL" | "DUE" | "ADMINISTERED" | "HELD">("ALL");
  const [marSearch, setMarSearch] = React.useState("");

  const [selectedPatientId, setSelectedPatientId] = React.useState("");
  const patientId = data.patients?.some((patient) => patient.patient_identifier === selectedPatientId)
    ? selectedPatientId
    : data.patients?.[0]?.patient_identifier || "";
  const [param, setParam] = React.useState("Blood Pressure");
  const [value, setValue] = React.useState("");
  const [unit, setUnit] = React.useState("mmHg");
  const [recording, setRecording] = React.useState(false);

  const [vitalsFilter, setVitalsFilter] = React.useState<string>("ALL");

  const handleParamChange = (newParam: string) => {
    setParam(newParam);
    setUnit(PARAMETER_UNITS[newParam] || "");
    setValue("");
  };

  const handleRecordVitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    setRecording(true);
    try {
      await onRecordVital(patientId, param, value, unit);
      showToast(`${param} recorded for ${patientId}: ${value} ${unit}`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to record vital", "error");
    } finally {
      setRecording(false);
    }
  };

  const filteredMAR = React.useMemo(() => {
    let list = data.mar_schedule;
    if (marFilter !== "ALL") {
      list = list.filter((m) => m.status === marFilter);
    }
    if (marSearch.trim()) {
      const q = marSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.patient_name.toLowerCase().includes(q) ||
          m.medication.toLowerCase().includes(q) ||
          m.patient_identifier.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.mar_schedule, marFilter, marSearch]);

  const filteredVitals = React.useMemo(() => {
    let list = data.vitals_labs;
    if (vitalsFilter !== "ALL") {
      list = list.filter((v) => v.status === vitalsFilter);
    }
    return list;
  }, [data.vitals_labs, vitalsFilter]);

  return (
    <div className="space-y-6">
      {/* 5 NURSE STAT KPI CARDS (MarkMyAd Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <MetricCard
          title="Medications Due"
          value={data.stats.medications_due ?? "Not scheduled"}
          change={data.stats.medications_due === null ? "Schedule unavailable" : `${data.stats.medications_due} due`}
          trend="neutral"
          hint="No administration schedule is stored"
          icon={<Clock className="w-4 h-4" />}
          variant="warning"
        />

        <MetricCard
          title="Recorded Administered"
          value={data.stats.medications_administered}
          change="Persisted events"
          trend="neutral"
          hint="The API does not filter these records by date"
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="success"
        />

        <MetricCard
          title="Held on Safety Alert"
          value={data.stats.medications_held}
          change={data.stats.medications_held > 0 ? "Physician Hold" : "0"}
          trend={data.stats.medications_held > 0 ? "down" : "up"}
          hint="Physician hold active"
          icon={<ShieldAlert className="w-4 h-4" />}
          variant="critical"
        />

        <MetricCard
          title="Vitals Recorded"
          value={data.stats.vitals_recorded}
          change="Persisted records"
          trend="neutral"
          hint="Bedside observations"
          icon={<HeartPulse className="w-4 h-4" />}
          variant="teal"
        />

        <MetricCard
          title="Attention Required"
          value={data.stats.attention_required}
          change={data.stats.attention_required > 0 ? "Flagged" : "Normal"}
          trend={data.stats.attention_required > 0 ? "down" : "up"}
          hint="High-severity findings returned by the backend"
          icon={<AlertCircle className="w-4 h-4" />}
          variant="default"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* SECTION 1: MEDICATION ADMINISTRATION RECORD (MAR) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center ring-1 ring-teal-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
                eMAR — Electronic Medication Administration Record
              </h2>
              <p className="text-xs text-slate-500">
                Medication records are persisted, but this database does not contain a timed administration schedule or barcode-validation state.
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold">
              {(["ALL", "DUE", "ADMINISTERED", "HELD"] as const).map((status) => {
                const isActive = marFilter === status;
                const labels: Record<string, string> = {
                  ALL: "All Orders",
                  DUE: "Due Now",
                  ADMINISTERED: "Administered",
                  HELD: "Held",
                };
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setMarFilter(status)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                    }`}
                  >
                    {labels[status]}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search patient, medication..."
                value={marSearch}
                onChange={(e) => setMarSearch(e.target.value)}
                className="h-8 text-xs pl-8 w-48"
              />
            </div>
          </div>
        </div>

        {/* MAR Schedule Table */}
        <div className="pt-4">
          {!data.mar_schedule_available && data.mar_schedule_note && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {data.mar_schedule_note} Medication records below are not administration instructions.
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-24">Time</TableHead>
                <TableHead>Patient / ID</TableHead>
                <TableHead>Medication &amp; Dose</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Admin Status</TableHead>
                <TableHead>Prescriber</TableHead>
                <TableHead className="text-right">Bedside Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMAR.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No medication administration records match the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMAR.map((m, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono font-bold text-slate-900">{m.scheduled_time}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="font-bold text-blue-700 hover:underline disabled:text-slate-900 disabled:no-underline"
                        onClick={() => onOpenPatientHistory(m.patient_identifier)}
                        disabled={!m.patient_identifier}
                      >
                        {m.patient_name || "Not recorded"}
                      </button>
                      <div className="text-[11px] font-mono text-slate-400">{m.patient_identifier}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-sm">{m.medication}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{m.dose}</div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-semibold">{m.route}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          m.status === "ADMINISTERED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : m.status === "DUE"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : m.status === "HELD"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {m.status === "ADMINISTERED" && <CheckCircle2 className="w-3 h-3" />}
                        {m.status === "HELD" && <AlertTriangle className="w-3 h-3" />}
                        {m.status}
                      </span>
                      {m.clinical_alert && (
                        <div className="text-[10px] text-rose-700 font-bold mt-1">
                          ⚠️ {m.clinical_alert}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">{m.prescribing_doctor}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={m.status === "DUE" ? "default" : "secondary"}
                        onClick={() => onOpenMARModal(m)}
                        disabled={!data.mar_schedule_available}
                        className={`text-xs h-7.5 px-3 font-bold gap-1.5 shadow-2xs cursor-pointer ${
                          m.status === "DUE" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        {data.mar_schedule_available ? (m.status === "DUE" ? "Administer" : "Review") : "View record"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* SECTION 2: RAPID INPATIENT LAB & VITALS TELEMETRY INGESTION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center ring-1 ring-teal-500/20">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
              Rapid Bedside Vitals &amp; Telemetry Ingestion
            </h2>
            <p className="text-xs text-slate-500">
              Persist a bedside measurement to the selected patient record. Values are not automatically clinically classified.
            </p>
          </div>
        </div>

        <form onSubmit={handleRecordVitalSubmit} className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Inpatient
              </label>
              <Select value={patientId} onChange={(e) => setSelectedPatientId(e.target.value)} className="text-xs" required>
                <option value="">Select a patient</option>
                {(data.patients || []).map((patient) => <option key={patient.patient_identifier} value={patient.patient_identifier}>{patient.name} ({patient.patient_identifier})</option>)}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinical Parameter
              </label>
              <Select value={param} onChange={(e) => handleParamChange(e.target.value)} className="text-xs">
                {Object.keys(PARAMETER_UNITS).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Observed Telemetry Value
              </label>
              <Input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 120/80 or 3.4"
                required
                className="text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Engineering Unit
              </label>
              <Input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. mmHg"
                required
                className="text-xs font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button
              type="submit"
              disabled={recording || !patientId}
              className="text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white gap-2 h-9.5 px-4 shadow-sm"
            >
              <Activity className="w-3.5 h-3.5" />
              {recording ? "Recording..." : "Record Inpatient Vital & Ingest"}
            </Button>
          </div>
        </form>
      </div>

      {/* SECTION 3: INPATIENT VITALS & OBSERVATIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center ring-1 ring-blue-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
                Inpatient Vitals &amp; Laboratory Observations
              </h2>
              <p className="text-xs text-slate-500">
                Audited bedside readings linked to patient medical records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Severity:</span>
            <select
              aria-label="Severity Filter"
              value={vitalsFilter}
              onChange={(e) => setVitalsFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1 text-slate-800"
            >
              <option value="ALL">All Observations</option>
              <option value="Critical">Critical Alerts Only</option>
              <option value="High">Elevated / High</option>
              <option value="Normal">Normal Range</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Recorded Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Parameter</TableHead>
                <TableHead>Observed Value</TableHead>
                <TableHead>Reference Range</TableHead>
                <TableHead>Clinical Status</TableHead>
                <TableHead>Source Instrument</TableHead>
                <TableHead className="text-right">Inspection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVitals.map((v, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-slate-500">{v.recorded_time}</TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900">{v.patient_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{v.patient_identifier}</div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">{v.parameter}</TableCell>
                  <TableCell className="font-black text-slate-900 text-sm">
                    {v.value} <span className="text-xs font-normal text-slate-500">{v.unit}</span>
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-[11px]">{v.reference_range || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === "Critical"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : v.status === "High" || v.status === "Low"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {v.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">{v.source_type}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenVitalModal(v)}
                      className="text-xs h-7 px-2.5 font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      Inspect Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
