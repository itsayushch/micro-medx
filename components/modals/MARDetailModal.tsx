"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, QrCode, ShieldCheck, HeartPulse, Clock, Ban } from "lucide-react";
import { NurseMARItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface MARDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: NurseMARItem | null;
  onAction: (
    orderId: string,
    action: "ADMINISTER" | "HOLD" | "REJECT",
    notes: string,
    vitalsChecked: boolean
  ) => Promise<void>;
}

export function MARDetailModal({
  open,
  onOpenChange,
  item,
  onAction,
}: MARDetailModalProps) {
  const [barcodeScanned, setBarcodeScanned] = React.useState(true);
  const [vitalsVerified, setVitalsVerified] = React.useState(true);
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setNotes("");
    setBarcodeScanned(true);
    setVitalsVerified(true);
  }, [item]);

  if (!item) return null;

  const handleAdminister = async () => {
    setSubmitting(true);
    try {
      await onAction(item.mar_id, "ADMINISTER", notes, vitalsVerified);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHold = async () => {
    setSubmitting(true);
    try {
      await onAction(item.mar_id, "HOLD", notes || "Medication administration held by nurse.", vitalsVerified);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} maxWidthClass="max-w-2xl">
        <DialogHeader className="bg-slate-50">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {item.mar_id}
              </span>
              <span className="text-xs text-slate-500 font-medium">Scheduled: {item.scheduled_time}</span>
            </div>
            <Badge
              variant={
                item.status === "ADMINISTERED"
                  ? "success"
                  : item.status === "HELD"
                  ? "critical"
                  : "info"
              }
              className="gap-1 font-bold"
            >
              {item.status === "ADMINISTERED" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {item.status === "HELD" && <AlertTriangle className="h-3.5 w-3.5" />}
              {item.status}
            </Badge>
          </div>
          <DialogTitle className="mt-1 text-xl font-bold text-slate-900">
            {item.patient_name} <span className="text-slate-400 font-normal">({item.patient_identifier})</span>
          </DialogTitle>
          <div className="text-xs text-slate-600">
            Ordering Doctor: <strong className="text-slate-800">{item.prescribing_doctor}</strong>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4.5 overflow-y-auto max-h-[65vh]">
          {/* Medication details box */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              Medication To Administer
            </div>
            <div className="text-lg font-black text-slate-900">
              {item.medication}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-blue-200 text-xs text-slate-700">
              <div>
                Dose: <strong className="text-slate-900">{item.dose}</strong>
              </div>
              <div>
                Route: <strong className="text-slate-900">{item.route}</strong>
              </div>
            </div>
          </div>

          {/* Clinical Alert if present */}
          {item.clinical_alert && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900">
                <strong className="font-bold">Clinical Safety Advisory:</strong>{" "}
                {item.clinical_alert}
              </div>
            </div>
          )}

          {/* Barcode & Vitals Verification Checks */}
          <div className="space-y-2.5">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Patient & Medication 2D Barcode Scan</div>
                  <div className="text-xs text-slate-500">Verified against patient wristband identifier</div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-700">
                <input
                  type="checkbox"
                  checked={barcodeScanned}
                  onChange={(e) => setBarcodeScanned(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                Scanned & Matched ✓
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Patient Vital Signs Cross-Check</div>
                  <div className="text-xs text-slate-500">Vitals & recent lab values assessed before dose</div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-blue-700">
                <input
                  type="checkbox"
                  checked={vitalsVerified}
                  onChange={(e) => setVitalsVerified(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                Parameters Cleared ✓
              </label>
            </div>
          </div>

          {/* Nurse notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nursing Administration Notes / Reason for Hold
            </label>
            <Textarea
              placeholder="Record patient tolerance, site of injection, vitals observed, or reason for safety hold..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="bg-slate-50">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleHold}
            disabled={submitting}
            className="gap-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Ban className="h-4 w-4" />
            Hold Medication
          </Button>
          <Button
            variant="success"
            onClick={handleAdminister}
            disabled={submitting || !barcodeScanned}
            className="gap-1.5 font-bold"
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? "Documenting..." : "Confirm Administration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
