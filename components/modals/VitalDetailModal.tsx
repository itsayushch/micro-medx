"use client";

import * as React from "react";
import { Activity, Clock, ShieldCheck, UserCheck, AlertTriangle } from "lucide-react";
import { NurseVitalLabItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VitalDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vital: NurseVitalLabItem | null;
}

export function VitalDetailModal({
  open,
  onOpenChange,
  vital,
}: VitalDetailModalProps) {
  if (!vital) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} maxWidthClass="max-w-xl">
        <DialogHeader className="bg-slate-50">
          <div className="flex items-center justify-between pr-8">
            <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {vital.id}
            </span>
            <Badge
              variant={
                vital.status === "Critical"
                  ? "critical"
                  : vital.status === "High" || vital.status === "Low"
                  ? "warning"
                  : "success"
              }
              className="gap-1 font-bold"
            >
              {vital.status}
            </Badge>
          </div>
          <DialogTitle className="mt-1 text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            {vital.parameter} Observation
          </DialogTitle>
          <div className="text-xs text-slate-600">
            Patient: <strong className="text-slate-900">{vital.patient_name}</strong> &bull; MRN / Case:{" "}
            <span className="font-mono">{vital.patient_identifier}</span>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Main Value Display */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recorded Clinical Value
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {vital.value}{" "}
              <span className="text-base font-normal text-slate-500">{vital.unit}</span>
            </div>
            {vital.reference_range && (
              <div className="text-xs text-slate-500 mt-2">
                Standard Physiological Reference Range:{" "}
                <strong className="text-slate-800">{vital.reference_range} {vital.unit}</strong>
              </div>
            )}
          </div>

          {/* Details breakdown */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-slate-500 mt-0.5" />
              <div>
                <div className="text-slate-500 font-medium">Recorded Time</div>
                <div className="font-bold text-slate-900 mt-0.5">{vital.recorded_time} Today</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-start gap-2.5">
              <UserCheck className="h-4 w-4 text-slate-500 mt-0.5" />
              <div>
                <div className="text-slate-500 font-medium">Recorded By</div>
                <div className="font-bold text-slate-900 mt-0.5">{vital.recorded_by}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
            <div className="text-slate-500 font-medium mb-1">Acquisition Source / Instrument</div>
            <div className="font-bold text-slate-900">{vital.source_type}</div>
          </div>

          {vital.status !== "Normal" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Clinical Flag:</strong> This value deviates from normal hospital inpatient thresholds and is flagged for physician review.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="bg-slate-50">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
