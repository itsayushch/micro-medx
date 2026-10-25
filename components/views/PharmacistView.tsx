"use client";

import * as React from "react";
import {
  Pill,
  CheckCircle2,
  AlertTriangle,
  Package,
  Building,
  Search,
  Send,
  ShieldAlert,
  ArrowRight,
  Boxes,
  BadgeAlert,
  Layers,
} from "lucide-react";
import {
  AvailabilityQueueItem,
  PharmacistDashboardData,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PharmacistViewProps {
  data: PharmacistDashboardData;
  onOpenAvailabilityModal: (item: AvailabilityQueueItem) => void;
  onRequestSubstitutionModal: (item: AvailabilityQueueItem) => void;
  onOpenPatientHistory: (patientId: string) => void;
}

export function PharmacistView({
  data,
  onOpenAvailabilityModal,
  onRequestSubstitutionModal,
  onOpenPatientHistory,
}: PharmacistViewProps) {
  const [queueFilter, setQueueFilter] = React.useState<string>("ALL");
  const [queueSearch, setQueueSearch] = React.useState<string>("");
  const [inventorySearch, setInventorySearch] = React.useState<string>("");

  const filteredQueue = React.useMemo(() => {
    let list = data.availability_queue;
    if (queueFilter === "AVAILABLE") {
      list = list.filter((q) => q.availability === "AVAILABLE");
    } else if (queueFilter === "UNAVAILABLE" || queueFilter === "UNTRACKED") {
      list = list.filter((q) => q.availability === queueFilter);
    } else if (queueFilter === "READY_TO_DISPENSE") {
      list = list.filter((q) => q.is_ready_for_dispensing);
    }

    if (queueSearch.trim()) {
      const q = queueSearch.toLowerCase();
      list = list.filter(
        (item) =>
          item.patient_name.toLowerCase().includes(q) ||
          item.prescribed_medicine.toLowerCase().includes(q) ||
          item.case_id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.availability_queue, queueFilter, queueSearch]);

  const filteredInventory = React.useMemo(() => {
    let list = data.local_inventory;
    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.medication.toLowerCase().includes(q) ||
          inv.brand_name.toLowerCase().includes(q) ||
          inv.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.local_inventory, inventorySearch]);

  return (
    <div className="space-y-6">
      {/* 6 SUMMARY KPI CARDS (MarkMyAd Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Orders Received"
          value={data.stats.prescriptions_received}
          change="Backend count"
          trend="neutral"
          hint="Persisted orders returned by the backend"
          icon={<Package className="w-4 h-4" />}
          variant="default"
        />

        <MetricCard
          title="Inventory Availability"
          value={data.stats.available}
          change="Inventory status"
          trend="neutral"
          hint="Inventory is not represented in the database"
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="success"
        />

        <MetricCard
          title="Pending Doctor Review"
          value={data.stats.substitution_required}
          change="Substitution requests"
          trend="neutral"
          hint="Requests awaiting a doctor decision"
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="critical"
        />

        <MetricCard
          title="Dispensing Status"
          value={data.stats.dispensed_today}
          change="Not tracked"
          trend="neutral"
          hint="The connected database does not record dispensing events"
          icon={<Boxes className="w-4 h-4" />}
          variant="teal"
        />

        <MetricCard
          title="High-Risk Flags"
          value={data.stats.high_risk_flagged}
          change="Backend findings"
          trend={data.stats.high_risk_flagged > 0 ? "down" : "up"}
          hint="Clinical alert active"
          icon={<ShieldAlert className="w-4 h-4" />}
          variant="warning"
        />

        <MetricCard
          title="Inventory Value"
          value={data.stats.inventory_value}
          change="Not tracked"
          trend="neutral"
          hint="No inventory valuation is available"
          icon={<Building className="w-4 h-4" />}
          variant="purple"
        />
      </div>

      {/* SECTION 1: MEDICATION AVAILABILITY & FULFILLMENT QUEUE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center ring-1 ring-emerald-500/20">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
                Persisted Prescription Queue
              </h2>
              <p className="text-xs text-slate-500">
                Persisted prescriptions and substitution requests. Stock levels are not recorded in the connected database.
              </p>
            </div>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 text-xs font-semibold">
              {(["ALL", "AVAILABLE", "UNAVAILABLE", "UNTRACKED", "READY_TO_DISPENSE"] as const).map((filter) => {
                const isActive = queueFilter === filter;
                const labels: Record<string, string> = {
                  ALL: "All Cases",
                  AVAILABLE: "In Stock",
                  UNAVAILABLE: "Unavailable",
                  UNTRACKED: "Not tracked",
                  READY_TO_DISPENSE: "Ready to Dispense",
                };
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setQueueFilter(filter)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                    }`}
                  >
                    {labels[filter]}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search case, drug..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className="h-8 text-xs pl-8 w-44"
              />
            </div>
          </div>
        </div>

        {/* Queue Table */}
        <div className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-24">Case ID</TableHead>
                <TableHead>Patient / Demographics</TableHead>
                <TableHead>Prescribed Medicine</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Substitution State</TableHead>
                <TableHead>Ordering Clinician</TableHead>
                <TableHead className="text-right">Pharmacy Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No prescriptions match the selected availability filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredQueue.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono font-bold text-blue-700">{item.case_id}</TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900">{item.patient_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.age == null ? "Age not recorded" : `${item.age}y`} &bull; {item.sex || "Sex not recorded"} &bull; MRN: {item.mrn || "Not recorded"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-sm">{item.prescribed_medicine}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.strength} &bull; {item.formulation} &bull; {item.frequency}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.availability === "AVAILABLE"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : item.availability === "UNAVAILABLE"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {item.availability === "AVAILABLE" ? "Available" : item.availability === "UNAVAILABLE" ? "Unavailable" : "Not tracked"}
                      </span>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.available_qty_formatted}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.substitution_status.includes("Approved") || item.substitution_status.includes("No")
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : item.substitution_status.includes("Pending")
                            ? "bg-amber-100 text-amber-800 border border-amber-200 font-bold"
                            : "bg-rose-100 text-rose-800 font-bold"
                        }`}
                      >
                        {item.substitution_status}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">{item.prescribing_doctor || "Not recorded"}</TableCell>
                    <TableCell className="text-right">
                      {item.availability === "AVAILABLE" || item.is_ready_for_dispensing ? (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => onOpenAvailabilityModal(item)}
                          className="text-xs h-7.5 px-3 font-bold gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Review order
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => onRequestSubstitutionModal(item)}
                          className="text-xs h-7.5 px-3 font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-2xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Request prescriber review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* SECTION 2: HOSPITAL CENTRAL PHARMACY LOCAL INVENTORY */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center ring-1 ring-blue-500/20">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
                Hospital Central Pharmacy Formulary Inventory
              </h2>
              <p className="text-xs text-slate-500">
                Inventory, batch, and expiry data are not represented by the connected database schema.
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search formulary inventory..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="h-8 text-xs pl-8 w-48"
            />
          </div>
        </div>

        <div className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Generic Medication</TableHead>
                <TableHead>Brand Name</TableHead>
                <TableHead>Strength &amp; Formulation</TableHead>
                <TableHead>Stock on Hand</TableHead>
                <TableHead>Bin Location</TableHead>
                <TableHead>Batch / Lot</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-slate-400">
                    Inventory records are not available from the connected backend.
                  </TableCell>
                </TableRow>
              )}
              {filteredInventory.map((inv, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-bold text-slate-900">{inv.medication}</TableCell>
                  <TableCell className="font-semibold text-blue-800">{inv.brand_name}</TableCell>
                  <TableCell className="text-slate-600">
                    {inv.strength} ({inv.formulation})
                  </TableCell>
                  <TableCell>
                    <span className="font-black text-slate-900">{inv.stock}</span>{" "}
                    <span className="text-xs text-slate-500">{inv.unit}</span>
                    {inv.stock === 0 ? (
                      <span className="ml-2 inline-flex px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800">
                        OUT OF STOCK
                      </span>
                    ) : inv.stock < 50 ? (
                      <span className="ml-2 inline-flex px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800">
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="ml-2 inline-flex px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                        IN STOCK
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-slate-800">{inv.location}</TableCell>
                  <TableCell className="font-mono text-slate-500 text-[11px]">{inv.batch}</TableCell>
                  <TableCell className="font-mono text-slate-600 text-[11px]">{inv.expiry}</TableCell>
                  <TableCell className="font-bold text-slate-900 text-right">{inv.unit_price || "$1.20"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* SECTION 3: CLINICAL PHARMACOLOGY REFERENCE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center ring-1 ring-purple-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">
              Clinical Pharmacology Interactions &amp; Interventions Reference
            </h2>
            <p className="text-xs text-slate-500">
              Evidence-based interaction mechanisms and pharmacist intervention recommendations.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Combination</TableHead>
                <TableHead>Pharmacokinetic Mechanism</TableHead>
                <TableHead>Clinical Impact</TableHead>
                <TableHead>Pharmacist Action</TableHead>
                <TableHead className="text-right">Evidence ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pharmacology_insights.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-bold text-purple-900">{item.pair}</TableCell>
                  <TableCell className="text-slate-700 max-w-xs leading-relaxed">{item.mechanism}</TableCell>
                  <TableCell className="font-semibold text-rose-700 max-w-xs">{item.clinical_impact}</TableCell>
                  <TableCell className="text-emerald-800 font-semibold max-w-xs">{item.recommended_action}</TableCell>
                  <TableCell className="font-mono text-slate-500 text-[11px] text-right">{item.evidence_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
