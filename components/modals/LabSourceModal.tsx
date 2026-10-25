"use client";

import * as React from "react";
import { Activity, ShieldCheck, FileCheck, Building2, Calendar, FileText } from "lucide-react";
import { LabReportDetail } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LabSourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: LabReportDetail | null;
}

export function LabSourceModal({
  open,
  onOpenChange,
  report,
}: LabSourceModalProps) {
  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} maxWidthClass="max-w-3xl">
        <DialogHeader className="bg-slate-50">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {report.lab_report_id}
              </span>
              <span className="text-xs text-slate-500 font-medium">Case: {report.case_id}</span>
            </div>
            <Badge variant="teal" className="gap-1 font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              Verified Laboratory Document
            </Badge>
          </div>
          <DialogTitle className="mt-1 text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            {report.category}
          </DialogTitle>
          <div className="text-xs text-slate-600">
            Patient: <strong className="text-slate-900">{report.patient_name}</strong> &bull; Indication:{" "}
            <span className="text-slate-700 italic">{report.clinical_indication}</span>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4.5 overflow-y-auto max-h-[65vh]">
          {/* Facility & Metadata Box */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-start gap-2.5">
              <Building2 className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800">Laboratory Facility</div>
                <div className="text-slate-600 mt-0.5">{report.laboratory_facility}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Specimen: Whole Blood EDTA</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800">Timestamps & Validation</div>
                <div className="text-slate-600 mt-0.5">Drawn: {report.collection_date}</div>
                <div className="text-emerald-700 font-semibold mt-0.5">Reported: {report.report_date}</div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-blue-600" />
              Diagnostic Test Results & Reference Intervals
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold bg-slate-50/50">
                  <th className="py-2.5 px-4">Test Name</th>
                  <th className="py-2.5 px-4">Result</th>
                  <th className="py-2.5 px-4">Reference Range</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Clinical Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {report.results?.map((res, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{res.test_name}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">
                      {res.result} <span className="text-xs text-slate-500 font-normal">{res.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{res.reference_range}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          res.status.includes("Critical") || res.status.includes("High")
                            ? "critical"
                            : res.status.includes("Low")
                            ? "warning"
                            : "success"
                        }
                        className="text-[10px]"
                      >
                        {res.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed">
                      {res.clinical_significance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Provenance and Checksum */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-mono flex items-center justify-between text-slate-600">
            <div>
              Source: <code>{report.source_document}</code>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
              SHA-256: {report.sha256_checksum.slice(0, 16)}...
            </div>
          </div>
        </div>

        <DialogFooter className="bg-slate-50">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
