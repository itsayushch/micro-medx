"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import { NurseMARItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface MARDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: NurseMARItem | null;
  onAction: (orderId: string, action: "ADMINISTER" | "HOLD", notes: string) => Promise<void>;
}

export function MARDetailModal({ open, onOpenChange, item, onAction }: MARDetailModalProps) {
  if (!item) return null;

  return (
    <MARDetailDialog
      key={item.mar_id}
      open={open}
      onOpenChange={onOpenChange}
      item={item}
      onAction={onAction}
    />
  );
}

function MARDetailDialog({
  open,
  onOpenChange,
  item,
  onAction,
}: Required<MARDetailModalProps> & { item: NurseMARItem }) {
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submitAction = async (action: "ADMINISTER" | "HOLD") => {
    setSubmitting(true);
    try {
      await onAction(item.mar_id, action, notes || (action === "HOLD" ? "Medication administration held by nurse." : ""));
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
            <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{item.mar_id}</span>
            <Badge variant={item.status === "ADMINISTERED" ? "success" : item.status === "HELD" ? "critical" : "info"} className="gap-1 font-bold">
              {item.status === "ADMINISTERED" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {item.status === "HELD" && <AlertTriangle className="h-3.5 w-3.5" />}
              {item.status}
            </Badge>
          </div>
          <DialogTitle className="mt-1 text-xl font-bold text-slate-900">
            {item.patient_name} <span className="text-slate-400 font-normal">({item.patient_identifier})</span>
          </DialogTitle>
          <div className="text-xs text-slate-600">Ordering Doctor: <strong className="text-slate-800">{item.prescribing_doctor}</strong></div>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Medication record</div>
            <div className="text-lg font-black text-slate-900">{item.medication}</div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-blue-200 text-xs text-slate-700">
              <div>Dose: <strong className="text-slate-900">{item.dose}</strong></div>
              <div>Route: <strong className="text-slate-900">{item.route}</strong></div>
            </div>
          </div>

          {item.clinical_alert && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900"><strong>Clinical Safety Advisory:</strong> {item.clinical_alert}</div>
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            This backend records a medication event and notes. It does not verify a barcode, assess vital signs, or provide a scheduled administration record.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nursing note / reason for hold</label>
            <Textarea placeholder="Enter a note for this medication event..." value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter className="bg-slate-50">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="warning" onClick={() => void submitAction("HOLD")} disabled={submitting} className="gap-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white">
            <Ban className="h-4 w-4" /> Hold / Record
          </Button>
          <Button variant="success" onClick={() => void submitAction("ADMINISTER")} disabled={submitting} className="gap-1.5 font-bold">
            <CheckCircle2 className="h-4 w-4" /> {submitting ? "Recording..." : "Record Administered"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
