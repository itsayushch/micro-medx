"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RoleType, UserSession } from "@/lib/types";
import {
  LogOut,
  RefreshCw,
  Shield,
  Stethoscope,
  HeartPulse,
  Pill,
  ShieldCheck,
  Activity,
  CheckCircle2,
  ChevronDown,
  Menu,
  Search,
  Bell,
  Command,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  activeRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  currentUser: UserSession | null;
  onLogout: () => void;
  isLiveApi: boolean;
  onRefresh?: () => void;
  onToggleSidebar?: () => void;
}

const ROLE_ICONS: Record<RoleType, React.ReactNode> = {
  Doctor: <Stethoscope className="w-3.5 h-3.5" />,
  Nurse: <HeartPulse className="w-3.5 h-3.5" />,
  "Clinical Pharmacist": <Pill className="w-3.5 h-3.5" />,
  Administrator: <ShieldCheck className="w-3.5 h-3.5" />,
};

const ROLE_COLORS: Record<RoleType, { badge: string; text: string; bg: string }> = {
  Doctor: { badge: "bg-blue-50 text-blue-700 border-blue-200", text: "text-blue-700", bg: "from-blue-600 to-indigo-600" },
  Nurse: { badge: "bg-teal-50 text-teal-700 border-teal-200", text: "text-teal-700", bg: "from-teal-600 to-emerald-600" },
  "Clinical Pharmacist": { badge: "bg-purple-50 text-purple-700 border-purple-200", text: "text-purple-700", bg: "from-purple-600 to-indigo-600" },
  Administrator: { badge: "bg-slate-100 text-slate-800 border-slate-300", text: "text-slate-800", bg: "from-slate-700 to-slate-900" },
};

export function Header({
  activeRole,
  onRoleChange,
  currentUser,
  onLogout,
  isLiveApi,
  onRefresh,
  onToggleSidebar,
}: HeaderProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [globalSearch, setGlobalSearch] = React.useState("");

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setTimeout(() => setRefreshing(false), 500);
    }
  };

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 py-2.5 transition-all shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Brand or Search */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Quick Search Bar */}
          <div className="relative hidden sm:block w-64 md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search patient, medication, case..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="h-8.5 pl-9 pr-12 text-xs bg-slate-50/80 border-slate-200/80 rounded-xl focus:bg-white font-quicksand"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
              <kbd className="text-[10px] font-mono px-1 py-0.2 bg-white rounded border border-slate-200 text-slate-400 shadow-3xs">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Center: Active Role Badge */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium font-quicksand">
            Active Workspace:
          </span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100/90 text-slate-900 border border-slate-200/80 shadow-3xs font-poppins">
            <span className={ROLE_COLORS[activeRole].text}>{ROLE_ICONS[activeRole]}</span>
            <span>{activeRole}</span>
          </div>
        </div>

        {/* Right Section: System Status & User Actions */}
        <div className="flex items-center gap-2.5">
          {/* Real-time Status Badge */}
          {/* <div className={`hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium shadow-3xs ${isLiveApi ? "bg-emerald-50/90 border-emerald-200/80 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
            <span className="relative flex h-2 w-2">
              {isLiveApi && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveApi ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            </span>
            <span className="font-bold text-[11px] tracking-tight font-poppins">
              {isLiveApi ? "REST API Connected" : "API unavailable"}
            </span>
          </div> */}

          {/* Refresh Action */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              title="Refresh Workspace Data"
              disabled={refreshing}
              className="w-8.5 h-8.5 rounded-xl border border-slate-200/90 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center shadow-3xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>
          )}

          {/* Clinician Profile Chip */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 shadow-3xs">
            <div
              className={`w-7 h-7 rounded-lg bg-gradient-to-br ${
                ROLE_COLORS[activeRole].bg
              } text-white font-black text-[11px] flex items-center justify-center shadow-xs shrink-0`}
            >
              {getInitials(currentUser?.name || activeRole)}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-900 leading-tight font-poppins">
                {currentUser?.name || "Authenticated user"}
              </div>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={onLogout}
            title="Sign Out"
            className="w-8.5 h-8.5 rounded-xl border border-slate-200/90 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center shadow-3xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
