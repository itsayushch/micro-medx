"use client";

import * as React from "react";
import {
  ShieldCheck,
  Lock,
  Search,
  ChevronLeft,
  ChevronRight,
  Hash,
  Users,
  CheckCircle2,
  AlertTriangle,
  Activity,
  FileText,
  KeyRound,
  Database,
  Eye,
  Shield,
  Layers,
} from "lucide-react";
import { AdminDashboardData, AuditLedgerRecord, PatientDirectoryItem } from "@/lib/types";
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

interface AdminViewProps {
  data: AdminDashboardData;
  onVerifyChain: () => Promise<{ verified: boolean; total_blocks: number; message: string }>;
  onOpenAuditDetail: (record: AuditLedgerRecord) => void;
  onOpenPatientHistory: (patientId: string) => void;
}

export function AdminView({
  data,
  onVerifyChain,
  onOpenAuditDetail,
  onOpenPatientHistory,
}: AdminViewProps) {
  const { showToast } = useToast();

  const [patientPage, setPatientPage] = React.useState(1);
  const patientPageSize = 15;
  const [deptFilter, setDeptFilter] = React.useState("ALL");
  const [riskFilter, setRiskFilter] = React.useState("ALL");
  const [patientSearch, setPatientSearch] = React.useState("");

  const [auditPage, setAuditPage] = React.useState(1);
  const auditPageSize = 10;
  const [auditCategory, setAuditCategory] = React.useState("ALL");
  const [auditSearch, setAuditSearch] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [verification, setVerification] = React.useState<{ verified: boolean; total_blocks: number; message: string } | null>(null);

  const handleVerifyChainClick = async () => {
    setVerifying(true);
    try {
      const result = await onVerifyChain();
      setVerification(result);
      showToast(result.message, result.verified ? "success" : "error");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to verify chain", "error");
    } finally {
      setVerifying(false);
    }
  };

  const filteredPatients = React.useMemo(() => {
    let list = data.patients;
    if (deptFilter !== "ALL") {
      list = list.filter((p) => p.dept === deptFilter);
    }
    if (riskFilter !== "ALL") {
      list = list.filter((p) => p.risk === riskFilter);
    }
    if (patientSearch.trim()) {
      const q = patientSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.condition.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.patients, deptFilter, riskFilter, patientSearch]);

  const totalPatientPages = Math.ceil(filteredPatients.length / patientPageSize) || 1;
  const paginatedPatients = React.useMemo(() => {
    const start = (patientPage - 1) * patientPageSize;
    return filteredPatients.slice(start, start + patientPageSize);
  }, [filteredPatients, patientPage, patientPageSize]);

  const filteredAudit = React.useMemo(() => {
    let list = data.audit_records;
    if (auditCategory !== "ALL") {
      list = list.filter((r) => r.category === auditCategory);
    }
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.action.toLowerCase().includes(q) ||
          r.actor.toLowerCase().includes(q) ||
          r.entity.toLowerCase().includes(q) ||
          r.current_hash.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.audit_records, auditCategory, auditSearch]);

  const totalAuditPages = Math.ceil(filteredAudit.length / auditPageSize) || 1;
  const paginatedAudit = React.useMemo(() => {
    const start = (auditPage - 1) * auditPageSize;
    return filteredAudit.slice(start, start + auditPageSize);
  }, [filteredAudit, auditPage, auditPageSize]);

  return (
    <div className="space-y-6">
      {/* Backend-reported audit chain status */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 p-6 text-white shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 className="w-3 h-3" />
                Audit Chain Status
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {data.stats.tamper_checks_passed ? "Backend reports valid" : "Backend reports integrity issue"}
              </span>
            </div>

            <h2 className="font-heading text-2xl font-black text-white tracking-tight">
              Audit chain verification
            </h2>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              The records below come from the backend audit endpoint. Use verification to check the current chain state.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1">Records: {data.stats.total_audit_events}</span>
              <span className="flex items-center gap-1">No immutability guarantee is implied by this view</span>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            <Button
              onClick={handleVerifyChainClick}
              disabled={verifying}
              className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-5 text-xs shadow-md shadow-emerald-600/25"
            >
              <Lock className="w-4 h-4" />
              {verifying ? "Verifying Hash Blocks..." : "Verify Cryptographic Chain"}
            </Button>
            <div className="text-[11px] text-emerald-300 font-mono font-bold">
              {verification
                ? `${verification.verified ? "Verified" : "Integrity issue"} · ${verification.total_blocks} records`
                : `Last backend status: ${data.stats.tamper_checks_passed ? "valid" : "not verified"}`}
            </div>
          </div>
        </div>
      </div>

      {/* Backend-derived summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Patient Records"
          value={data.stats.total_patients}
          change="Backend count"
          trend="neutral"
          hint="Records returned by the backend"
          icon={<Users className="w-4 h-4" />}
          variant="default"
        />

        <MetricCard
          title="Audit Chain Check"
          value={data.stats.tamper_checks_passed ? "Valid" : "Issue reported"}
          change={verification ? `${verification.total_blocks} checked` : "Backend status"}
          trend={data.stats.tamper_checks_passed ? "up" : "neutral"}
          hint="Use Verify to check current chain state"
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="success"
        />

        <MetricCard
          title="Audit Records"
          value={data.stats.total_audit_events}
          change="Backend count"
          trend="neutral"
          hint="Recent records returned by the backend"
          icon={<Activity className="w-4 h-4" />}
          variant="teal"
        />

        <MetricCard
          title="Patients with High-Risk Findings"
          value={data.stats.critical_interventions}
          change="Current records"
          trend="neutral"
          hint="Derived from persisted patient risk summaries"
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="critical"
        />
      </div>

      {/* SECTION 1: Backend patient directory */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center ring-1 ring-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
                Enterprise Inpatient Census Directory
              </h2>
              <p className="text-xs text-slate-500">
                Complete cohort registry with clinical classification, admitting departments, and medication regimens.
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPatientPage(1);
              }}
              className="text-xs h-8 w-32"
            >
              <option value="ALL">All Wards</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Nephrology">Nephrology</option>
              <option value="Internal Med">Internal Med</option>
              <option value="ICU">ICU</option>
              <option value="Oncology">Oncology</option>
            </Select>

            <Select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPatientPage(1);
              }}
              className="text-xs h-8 w-28"
            >
              <option value="ALL">All Risk</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low</option>
              <option value="Not recorded">Not recorded</option>
            </Select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search census..."
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setPatientPage(1);
                }}
                className="h-8 text-xs pl-8 w-36"
              />
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-24">Patient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age / Sex</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Clinical Condition</TableHead>
                <TableHead>Active Regimen</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead className="text-right">EHR Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPatients.map((pt, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono font-bold text-blue-700">{pt.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{pt.name}</TableCell>
                  <TableCell className="text-slate-600">{pt.age == null ? "Age not recorded" : `${pt.age}y`} &bull; {pt.sex || "Not recorded"}</TableCell>
                  <TableCell className="text-slate-600">{pt.dept || "Not recorded"}</TableCell>
                  <TableCell className="text-slate-800">{pt.condition || "Not recorded"}</TableCell>
                  <TableCell className="text-slate-700 font-mono text-[11px]">{pt.regimen || "Not recorded"}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenPatientHistory(pt.id)}
                      className="text-xs h-7 px-2.5 font-bold text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer"
                    >
                      View EHR →
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <strong>{(patientPage - 1) * patientPageSize + 1}</strong> to{" "}
            <strong>{Math.min(patientPage * patientPageSize, filteredPatients.length)}</strong> of{" "}
            <strong>{filteredPatients.length}</strong> patients
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={patientPage <= 1}
              onClick={() => setPatientPage((p) => p - 1)}
              className="h-8 px-2.5 text-xs font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <span className="px-2 font-mono font-bold text-slate-700">
              {patientPage} / {totalPatientPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={patientPage >= totalPatientPages}
              onClick={() => setPatientPage((p) => p + 1)}
              className="h-8 px-2.5 text-xs font-bold"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 2: FORENSIC SHA-256 AUDIT LEDGER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center ring-1 ring-emerald-500/20">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
                Audit Events Returned by Backend
              </h2>
              <p className="text-xs text-slate-500">
                This table displays the recent audit records returned by the backend. It does not establish immutability by itself.
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={auditCategory}
              onChange={(e) => {
                setAuditCategory(e.target.value);
                setAuditPage(1);
              }}
              className="text-xs h-8 w-36"
            >
              <option value="ALL">All Categories</option>
              <option value="AUTHENTICATION">Authentication</option>
              <option value="CLINICAL EVENT">Clinical Events</option>
              <option value="SAFETY">Safety</option>
              <option value="RESOLUTION">Resolution</option>
              <option value="VERIFICATION">Verification</option>
              <option value="SUBSTITUTION">Substitutions</option>
              <option value="SYSTEM">System</option>
            </Select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search hash, actor..."
                value={auditSearch}
                onChange={(e) => {
                  setAuditSearch(e.target.value);
                  setAuditPage(1);
                }}
                className="h-8 text-xs pl-8 w-44"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-20">Block #</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Clinician Actor</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead className="font-mono">SHA-256 Hash</TableHead>
                <TableHead className="text-right">Block Inspector</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAudit.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-slate-400">No backend audit records match this filter.</TableCell>
                </TableRow>
              )}
              {paginatedAudit.map((rec, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono font-bold text-slate-900">
                    #{rec.payload?.block_id || rec.id || (auditPage - 1) * auditPageSize + idx + 1}
                  </TableCell>
                  <TableCell className="font-mono text-slate-500 text-[11px]">{rec.timestamp}</TableCell>
                  <TableCell>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {rec.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900">{rec.actor}</div>
                    <div className="text-[10px] text-slate-500">{rec.role}</div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-800">{rec.entity}</TableCell>
                  <TableCell>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
                      {rec.current_hash ? `${rec.current_hash.substring(0, 10)}...${rec.current_hash.substring(rec.current_hash.length - 6)}` : "Hash not provided"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenAuditDetail(rec)}
                      className="text-xs h-7 px-2.5 font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      Inspect Block
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Audit Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <strong>{(auditPage - 1) * auditPageSize + 1}</strong> to{" "}
            <strong>{Math.min(auditPage * auditPageSize, filteredAudit.length)}</strong> of{" "}
            <strong>{filteredAudit.length}</strong> blocks
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={auditPage <= 1}
              onClick={() => setAuditPage((p) => p - 1)}
              className="h-8 px-2.5 text-xs font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <span className="px-2 font-mono font-bold text-slate-700">
              {auditPage} / {totalAuditPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={auditPage >= totalAuditPages}
              onClick={() => setAuditPage((p) => p + 1)}
              className="h-8 px-2.5 text-xs font-bold"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
