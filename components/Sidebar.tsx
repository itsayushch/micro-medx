"use client";

import * as React from "react";
import {
  Stethoscope,
  HeartPulse,
  Pill,
  ShieldCheck,
  Shield,
  Users,
  Activity,
  Hash,
  Lock,
  LogOut,
  X,
  Server,
  Cpu,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { RoleType, UserSession } from "@/lib/types";
import { CLINICAL_PERSONAS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  currentUser: UserSession | null;
  onLogout: () => void;
  onOpenPatientHistory?: (patientId: string) => void;
  onVerifyChain?: () => void;
  doctorPendingCount?: number;
  nurseDueCount?: number;
  pharmacistShortageCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

const WORKSPACES: {
  role: RoleType;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
}[] = [
  {
    role: "Doctor",
    label: "Doctor Workstation",
    sublabel: "Prescribing & CDS",
    icon: Stethoscope,
    color: "text-blue-600",
    activeColor: "bg-blue-50 text-blue-700 border-blue-200/80 ring-1 ring-blue-500/20",
  },
  {
    role: "Nurse",
    label: "Nurse eMAR Station",
    sublabel: "Bedside Administration",
    icon: HeartPulse,
    color: "text-teal-600",
    activeColor: "bg-teal-50 text-teal-700 border-teal-200/80 ring-1 ring-teal-500/20",
  },
  {
    role: "Clinical Pharmacist",
    label: "Pharmacy & Formulary",
    sublabel: "Fulfillment & Subs",
    icon: Pill,
    color: "text-purple-600",
    activeColor: "bg-purple-50 text-purple-700 border-purple-200/80 ring-1 ring-purple-500/20",
  },
  {
    role: "Administrator",
    label: "Admin & Audit Ledger",
    sublabel: "Forensic Governance",
    icon: ShieldCheck,
    color: "text-slate-800",
    activeColor: "bg-slate-100 text-slate-900 border-slate-300 ring-1 ring-slate-400/20",
  },
];

const ROLE_GRADIENTS: Record<RoleType, string> = {
  Doctor: "from-blue-600 to-indigo-600",
  Nurse: "from-teal-600 to-emerald-600",
  "Clinical Pharmacist": "from-purple-600 to-indigo-600",
  Administrator: "from-slate-700 to-slate-900",
};

export function Sidebar({
  activeRole,
  onRoleChange,
  currentUser,
  onLogout,
  onOpenPatientHistory,
  onVerifyChain,
  doctorPendingCount = 0,
  nurseDueCount = 0,
  pharmacistShortageCount = 0,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const currentPersona = CLINICAL_PERSONAS[activeRole] || CLINICAL_PERSONAS["Doctor"];

  const getInitials = (name: string) => {
    return name
      .replace(/Dr\.|RN|PharmD/g, "")
      .trim()
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <aside
      className={cn(
        "w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-xs",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Top Brand Header */}
      <div className="p-4.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 shadow-md shadow-blue-500/25 flex items-center justify-center text-white ring-1 ring-white/30">
            <Shield className="w-4.5 h-4.5 fill-white/20 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-base font-extrabold tracking-tight text-slate-900 font-poppins">
                Micro
              </span>
              <span className="font-heading text-base font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-poppins">
                MedX
              </span>
              <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">
                v2.6
              </span>
            </div>
            <div className="text-[10px] font-medium text-slate-400 tracking-tight font-quicksand">
              Clinical Safety &amp; Audit Suite
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Section 1: Workspaces */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-poppins">
            Clinical Workspaces
          </p>
          <div className="space-y-1">
            {WORKSPACES.map((ws) => {
              const isActive = activeRole === ws.role;
              const Icon = ws.icon;

              let badgeContent: React.ReactNode = null;
              if (ws.role === "Doctor" && doctorPendingCount > 0) {
                badgeContent = (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                    {doctorPendingCount}
                  </span>
                );
              } else if (ws.role === "Nurse" && nurseDueCount > 0) {
                badgeContent = (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">
                    {nurseDueCount}
                  </span>
                );
              } else if (ws.role === "Clinical Pharmacist" && pharmacistShortageCount > 0) {
                badgeContent = (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800">
                    {pharmacistShortageCount}
                  </span>
                );
              } else if (ws.role === "Administrator") {
                badgeContent = (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                    Valid
                  </span>
                );
              }

              return (
                <button
                  key={ws.role}
                  type="button"
                  onClick={() => {
                    onRoleChange(ws.role);
                    if (onClose) onClose();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer border border-transparent font-medium group",
                    isActive
                      ? ws.activeColor
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                        isActive ? "bg-white shadow-2xs" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5", isActive ? ws.color : "text-slate-500")} />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold leading-tight font-poppins">{ws.label}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate font-quicksand">
                        {ws.sublabel}
                      </div>
                    </div>
                  </div>

                  {badgeContent}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Clinical Tools */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-poppins">
            Clinical Telemetry &amp; Tools
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (onOpenPatientHistory) onOpenPatientHistory("CASE-001");
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-left font-quicksand"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>Patient EHR Dossier</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onVerifyChain) onVerifyChain();
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-left font-quicksand"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>SHA-256 Ledger Verifier</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">100% OK</span>
            </button>
          </div>
        </div>

        {/* Section 3: Telemetry Engine Box */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-poppins">
              CDS Telemetry Engine
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-[11px] font-medium text-slate-700 flex items-center justify-between">
            <span>REST API:</span>
            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
              127.0.0.1:8000
            </span>
          </div>
          <div className="text-[11px] font-medium text-slate-700 flex items-center justify-between">
            <span>Audit State:</span>
            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
              Immutable SHA-256
            </span>
          </div>
        </div>
      </div>

      {/* Bottom User Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-8 h-8 rounded-lg bg-gradient-to-br text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0",
                ROLE_GRADIENTS[activeRole]
              )}
            >
              {getInitials(currentUser?.name || currentPersona.name)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate leading-tight font-poppins">
                {currentUser?.name || currentPersona.name}
              </div>
              <div className="text-[10px] font-medium text-slate-500 truncate font-quicksand">
                {activeRole} &bull; St. Jude
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Sign Out Session"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
