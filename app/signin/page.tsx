"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  Lock,
  Phone,
  Stethoscope,
  HeartPulse,
  Pill,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { RoleType } from "@/lib/types";
import { DEMO_PASSWORD, DEMO_PHONE_BY_ROLE } from "@/lib/demo-credentials";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLE_ICONS: Record<RoleType, React.ReactNode> = {
  Doctor: <Stethoscope className="w-5 h-5" />,
  Nurse: <HeartPulse className="w-5 h-5" />,
  "Clinical Pharmacist": <Pill className="w-5 h-5" />,
  Administrator: <ShieldCheck className="w-5 h-5" />,
};

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { showToast } = useToast();

  const queryRole = searchParams.get("role") as RoleType | null;
  const isReAuth = Boolean(queryRole && (queryRole === "Nurse" || queryRole === "Doctor"));

  const supportedRoles: RoleType[] = ["Doctor", "Nurse", "Clinical Pharmacist", "Administrator"];
  const initialRole: RoleType = queryRole && supportedRoles.includes(queryRole) ? queryRole : "Doctor";

  const [selectedRole, setSelectedRole] = React.useState<RoleType>(initialRole);
  const [phone, setPhone] = React.useState<string>(DEMO_PHONE_BY_ROLE[initialRole]);
  const [password, setPassword] = React.useState<string>(DEMO_PASSWORD);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSelectRole = (role: RoleType) => {
    setSelectedRole(role);
    setPhone(DEMO_PHONE_BY_ROLE[role]);
    setErrorMsg(null);
  };

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await login(selectedRole, phone, password);
      showToast(`Signed in to ${selectedRole} workspace`, "success");
      router.push("/");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Sign-in failed. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-[520px]">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 shadow-xl shadow-blue-500/25 ring-1 ring-white/20 mb-3.5">
          <Shield className="w-7 h-7 text-white fill-white/20 stroke-[2.2]" />
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="font-heading text-2xl font-black tracking-tight text-white font-poppins">
            Micro
          </span>
          <span className="font-heading text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent font-poppins">
            MedX
          </span>
          <span className="ml-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
            v2.6
          </span>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-1 font-quicksand">
          Deterministic Medication Safety &amp; Forensic SHA-256 Clinical Governance
        </p>
      </div>

      {/* Role Transition Re-Authentication Banner if redirected */}
      {isReAuth && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs flex items-center gap-2.5 backdrop-blur-sm animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Role Transition Re-Authentication:</strong> Please authenticate to access the <strong>{queryRole}</strong> workspace.
          </span>
        </div>
      )}

      {/* Login Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-2xl shadow-black/40">
        {/* Role Selection Tabs */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center font-poppins">
            Select Demo Role
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["Doctor", "Nurse", "Clinical Pharmacist", "Administrator"] as RoleType[]).map((role) => {
              const isSelected = selectedRole === role;
              const shortTitle =
                role === "Clinical Pharmacist" ? "Pharm" : role === "Administrator" ? "Admin" : role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer gap-1.5 ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-500 text-blue-700 shadow-sm ring-2 ring-blue-500/20"
                      : "bg-slate-50/80 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className={isSelected ? "text-blue-600" : "text-slate-400"}>
                    {ROLE_ICONS[role]}
                  </span>
                  <span className="text-[11px]">{shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clinician Persona Summary Card
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
            {persona.name
              .replace(/Dr\.|RN|PharmD/g, "")
              .trim()
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">{persona.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{ROLE_BADGES[selectedRole].roleTag}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{persona.dept}</div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Verified
          </span>
        </div> */}

        {/* Credentials Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-poppins">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Mobile Number</span>
            </label>
            <Input
              type="tel"
              name="username"
              autoComplete="username"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 text-xs font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-poppins">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Clinical Passcode</span>
            </label>
            <Input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 text-xs font-medium"
              required
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs text-center font-semibold border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 space-y-2.5">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 text-xs font-bold tracking-wider uppercase bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 font-poppins cursor-pointer"
            >
              {submitting ? "Authenticating Clinician..." : `SIGN IN AS ${selectedRole.toUpperCase()}`}
            </Button>

            {/* <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => handleDirectBypass(selectedRole)}
              className="w-full h-9.5 text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300 gap-1.5 cursor-pointer font-poppins"
            >
              Instant 1-Click Launch <ArrowRight className="w-3.5 h-3.5" />
            </Button> */}
          </div>
        </form>

        {/* Security & System Architecture Footer */}
        {/* <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            REST API: 127.0.0.1:8000
          </span>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            Offline Resilient
          </span>
        </div> */}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-slate-950 relative overflow-hidden">
      {/* Ambient background glow and grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-600/15 blur-3xl pointer-events-none" />

      <React.Suspense fallback={<div className="text-white text-xs">Loading authentication terminal...</div>}>
        <SignInForm />
      </React.Suspense>
    </div>
  );
}
