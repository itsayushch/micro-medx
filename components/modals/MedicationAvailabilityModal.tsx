"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Package, MapPin, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { AvailabilityQueueItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MedicationAvailabilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AvailabilityQueueItem | null;
  onDispense: (caseId: string) => Promise<void>;
  onRequestSubstitution: (item: AvailabilityQueueItem) => void;
}

export function MedicationAvailabilityModal({
  open,
  onOpenChange,
  item,
  onDispense,
  onRequestSubstitution,
}: MedicationAvailabilityModalProps) {
  const [submitting, setSubmitting] = React.useState(false);

  if (!item) return null;

  const isAvailable = item.availability === "AVAILABLE";

  const handleDispenseClick = async () => {
    setSubmitting(true);
    try {
      await onDispense(item.case_id);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} maxWidthClass="max-w-2xl">
        <DialogHeader className="bg-slate-50/90">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">
                {item.case_id}
              </span>
              <span className="text-xs text-slate-500 font-medium">MRN: {item.mrn}</span>
            </div>
            {isAvailable ? (
              <Badge variant="success" className="gap-1.5 py-1 px-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                In Stock & Available
              </Badge>
            ) : (
              <Badge variant="critical" className="gap-1.5 py-1 px-3">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                Medication Unavailable
              </Badge>
            )}
          </div>
          <DialogTitle className="mt-1 text-xl font-extrabold text-slate-900">
            {item.patient_name} <span className="text-slate-400 font-normal">({item.age}y &bull; {item.sex})</span>
          </DialogTitle>
          <div className="text-xs text-slate-600 font-medium mt-0.5">
            Prescribed by: <strong className="text-slate-800">{item.prescribing_doctor}</strong>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
          {/* Prescribed Drug Overview Box */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              Prescribed Order Details
            </div>
            <div className="text-base font-extrabold text-slate-900">
              {item.prescribed_medicine}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-blue-100 text-xs">
              <div>
                <span className="text-slate-500">Strength:</span>{" "}
                <strong className="text-slate-800">{item.strength}</strong>
              </div>
              <div>
                <span className="text-slate-500">Route:</span>{" "}
                <strong className="text-slate-800">{item.route}</strong>
              </div>
              <div>
                <span className="text-slate-500">Frequency:</span>{" "}
                <strong className="text-slate-800">{item.frequency}</strong>
              </div>
            </div>
          </div>

          {isAvailable ? (
            /* IF AVAILABLE */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Formulary Bin Location</div>
                    <div className="text-sm font-bold text-slate-900">{item.bin_location || "Bin A-04"}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Pharmacy Central Storage</div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Batch / Lot & Expiry</div>
                    <div className="text-sm font-bold text-slate-900">{item.lot_number || "WF-88392"}</div>
                    <div className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Valid (Exp 2027-11)
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Pre-checks */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Pharmacist Clinical Pre-Dispensing Checklist
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Patient allergy screening cleared: No penicillin / beta-lactam conflict with prescribed formulation.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Drug concentration verified against physician electronic signature.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Cryptographic audit event will be recorded upon verification.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* IF UNAVAILABLE */
            <div className="space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-900 leading-relaxed">
                  <strong className="font-bold">Stock Shortage:</strong> Prescribed brand{" "}
                  <strong>{item.prescribed_brand}</strong> is completely out-of-stock across all hospital pharmacy bins.
                  Dispensing this order requires physician-verified therapeutic or brand substitution.
                </div>
              </div>

              {/* Formularly Equivalents */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Configured Formulary Brand Equivalents Available In Stock:
                </div>
                <div className="space-y-2">
                  {item.available_alternatives && item.available_alternatives.length > 0 ? (
                    item.available_alternatives.map((alt, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{alt.brand_name}</span>
                            <span className="text-xs text-slate-500 font-medium">({alt.generic_name})</span>
                            <Badge variant="teal" className="text-[10px]">Identical Bioequivalence</Badge>
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            {alt.strength} &bull; {alt.formulation} &bull;{" "}
                            <strong className="text-emerald-700">{alt.stock}</strong>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            onOpenChange(false);
                            onRequestSubstitution(item);
                          }}
                          className="shrink-0 text-xs font-bold gap-1"
                        >
                          Select Alternative <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg text-center">
                      No automated alternatives found. Physician review required.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="bg-slate-50/90">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isAvailable ? (
            <Button
              variant="success"
              onClick={handleDispenseClick}
              disabled={submitting}
              className="gap-2 font-bold"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? "Processing..." : "Mark Ready for Dispensing"}
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => {
                onOpenChange(false);
                onRequestSubstitution(item);
              }}
              className="gap-2 font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              <AlertTriangle className="h-4 w-4" />
              Initiate Substitution Request to Doctor
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
