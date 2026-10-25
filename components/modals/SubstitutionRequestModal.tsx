"use client";

import * as React from "react";
import { Send, AlertTriangle, ArrowRight, Pill } from "lucide-react";
import { AvailabilityQueueItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SubstitutionRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AvailabilityQueueItem | null;
  onSubmit: (
    caseId: string,
    suggestedBrand: string,
    reason: string,
    notes: string
  ) => Promise<void>;
}

export function SubstitutionRequestModal({
  open,
  onOpenChange,
  item,
  onSubmit,
}: SubstitutionRequestModalProps) {
  const [selectedBrand, setSelectedBrand] = React.useState<string>("");
  const [reason, setReason] = React.useState<string>(
    "Original prescribed brand out-of-stock; suggested alternative is pharmaceutically and biologically equivalent."
  );
  const [notes, setNotes] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (item && item.available_alternatives && item.available_alternatives.length > 0) {
      setSelectedBrand(
        `${item.available_alternatives[0].brand_name} (${item.available_alternatives[0].generic_name}) ${item.available_alternatives[0].strength}`
      );
    } else if (item) {
      setSelectedBrand("Clexane (Enoxaparin Sodium) 80 mg / 0.8 mL");
    }
    setNotes("");
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    setSubmitting(true);
    try {
      await onSubmit(item.case_id, selectedBrand, reason, notes);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} maxWidthClass="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="bg-amber-50/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                {item.case_id}
              </span>
              <span className="text-xs text-amber-900 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Medication Substitution Request
              </span>
            </div>
            <DialogTitle className="mt-1 text-xl font-extrabold text-slate-900">
              Request Doctor Authorization: {item.patient_name}
            </DialogTitle>
            <div className="text-xs text-slate-600">
              Attending Physician: <strong className="text-slate-800">{item.prescribing_doctor}</strong>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4.5 overflow-y-auto max-h-[65vh]">
            {/* Comparison banner */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Prescription Comparison
              </div>
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg">
                  <div className="text-[11px] font-bold text-red-700 uppercase">Original Prescribed</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{item.prescribed_medicine}</div>
                  <div className="text-xs text-red-600 font-medium mt-1">Out of Stock (0 Available)</div>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase">Proposed Alternative</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                    <Pill className="h-4 w-4 text-emerald-600" />
                    {selectedBrand || "Select below"}
                  </div>
                  <div className="text-xs text-emerald-700 font-medium mt-1">Verified In-Stock Equivalent</div>
                </div>
              </div>
            </div>

            {/* Select Proposed Brand */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Suggested Formulary Alternative Brand *
              </label>
              <Select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                required
              >
                {item.available_alternatives && item.available_alternatives.length > 0 ? (
                  item.available_alternatives.map((alt, idx) => (
                    <option
                      key={idx}
                      value={`${alt.brand_name} (${alt.generic_name}) ${alt.strength}`}
                    >
                      {alt.brand_name} ({alt.generic_name}) — {alt.strength} [{alt.stock}]
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Clexane (Enoxaparin Sodium) 80 mg / 0.8 mL">
                      Clexane (Enoxaparin Sodium) 80 mg / 0.8 mL — 60 Syringes in Stock (Bin D-12)
                    </option>
                    <option value="Inhixa (Enoxaparin Sodium) 80 mg / 0.8 mL">
                      Inhixa (Enoxaparin Sodium) 80 mg / 0.8 mL — 45 Syringes in Stock (Bin D-14)
                    </option>
                  </>
                )}
              </Select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinical Rationale for Substitution *
              </label>
              <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="Original prescribed brand out-of-stock; suggested alternative is pharmaceutically and biologically equivalent.">
                  Prescribed brand out-of-stock; alternative is bioequivalent (Same active ingredient & strength)
                </option>
                <option value="Therapeutic substitution to hospital formulary contracted equivalent with verified safety profile.">
                  Formulary preferred brand equivalent with identical pharmacokinetic profile
                </option>
                <option value="Emergency stock shortage; physician approval requested for immediate dose fulfillment.">
                  Emergency stock exhaustion; urgent patient anticoagulation requirement
                </option>
              </Select>
            </div>

            {/* Pharmacist Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pharmacist Verification Notes
              </label>
              <Textarea
                placeholder="Enter pharmacist clinical observations, verification timestamps, or specific dispensing notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="bg-slate-50/90">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="gap-2 font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting Request..." : "Send Request to Doctor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
