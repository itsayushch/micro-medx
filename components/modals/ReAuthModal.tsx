"use client";

import * as React from "react";
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Stethoscope,
  HeartPulse,
  KeyRound,
  CheckCircle2,
  LogIn,
  AlertCircle,
  Shield,
} from "lucide-react";
import { RoleType } from "@/lib/types";
import { CLINICAL_PERSONAS } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromRole: RoleType;
  toRole: RoleType;
  onConfirmReAuth: (role: RoleType, phone: string, pass: string) => Promise<void>;
  onRedirectToSignIn: (role: RoleType) => void;
}

const ROLE_ICONS: Record<RoleType, React.ReactNode> = {
  Doctor: <Stethoscope className="w-4 h-4 text-blue-600" />,
  Nurse: <HeartPulse className="w-4 h-4 text-teal-600" />,
  "Clinical Pharmacist": <Shield className="w-4 h-4 text-purple-600" />,
  Administrator: <Shield className="w-4 h-4 text-slate-700" />,
};

const ROLE_GRADIENTS: Record<RoleType, string> = {
  Doctor: "from-blue-600 to-indigo-600",
  Nurse: "from-teal-600 to-emerald-600",
  "Clinical Pharmacist": "from-purple-600 to-indigo-600",
  Administrator: "from-slate-700 to-slate-900",
};

export function ReAuthModal({
  open,
  onOpenChange,
  fromRole,
  toRole,
  onConfirmReAuth,
  onRedirectToSignIn,
}: ReAuthModalProps) {
  const targetPersona = CLINICAL_PERSONAS[toRole] || CLINICAL_PERSONAS["Nurse"];
  const sourcePersona = CLINICAL_PERSONAS[fromRole] || CLINICAL_PERSONAS["Doctor"];

  const [phone, setPhone] = React.useState<string>(targetPersona.phone);
  const [password, setPassword] = React.useState<string>("ClinicalAccess2026!");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Sync phone when toRole changes
  React.useEffect(() => {
    if (open) {
      setPhone(targetPersona.phone);
      setPassword("ClinicalAccess2026!");
      setErrorMsg(null);
    }
  }, [open, toRole, targetPersona.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg("Please enter your clinical password or PIN.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await onConfirmReAuth(toRole, phone, password);
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoPasscode = () => {
    setPassword("ClinicalAccess2026!");
    setErrorMsg(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} maxWidthClass="max-w-xl">
        <DialogHeader className="bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              Role Transition Security Check
            </span>
            <span className="text-xs text-slate-400 font-mono">21 CFR Part 11</span>
          </div>

          <DialogTitle className="mt-1.5 text-lg font-bold text-white flex items-center gap-2 font-poppins">
            <Lock className="h-5 w-5 text-amber-400" />
            Clinical Re-Login Required
          </DialogTitle>

          <p className="text-xs text-slate-300 leading-relaxed font-quicksand">
            Switching clinical scopes between <strong>{fromRole}</strong> and <strong>{toRole}</strong> requires explicit clinician re-authentication to maintain audit integrity on the cryptographic ledger.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Visual Role Transition Flow */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                {ROLE_ICONS[fromRole]}
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Scope</div>
                <div className="font-bold text-slate-800">{sourcePersona.name} ({fromRole})</div>
              </div>
            </div>

            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 shrink-0">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>

            <div className="flex items-center gap-2.5 text-right">
              <div>
                <div className="text-[10px] uppercase font-bold text-teal-600 tracking-wider">Target Scope</div>
                <div className="font-bold text-slate-900">{targetPersona.name} ({toRole})</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                {ROLE_ICONS[toRole]}
              </div>
            </div>
          </div>

          {/* Clinician Profile Card */}
          <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-4 flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${ROLE_GRADIENTS[toRole]} text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0`}
            >
              {targetPersona.name
                .replace(/Dr\.|RN|PharmD/g, "")
                .trim()
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-sm text-slate-900 truncate">
                  {targetPersona.name}
                </span>
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {toRole}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">{targetPersona.roleTitle} &bull; Clinical Scope</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Ward: {targetPersona.dept} &bull; Clinical ID: {toRole === "Nurse" ? "RN-88412" : "MD-44901"}
              </div>
            </div>
          </div>

          {/* Credentials Inputs */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-poppins">
                Clinician Phone / Identifier
              </label>
              <Input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                required
                className="text-xs font-mono font-medium h-9.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                  Clinical Passcode / PIN
                </label>
                <button
                  type="button"
                  onClick={handleUseDemoPasscode}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                >
                  Insert Demo Passcode
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passcode or PIN"
                  required
                  className="text-xs font-medium h-9.5 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 text-[11px] text-slate-500 flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Pre-filled with master clinical credentials (<code>ClinicalAccess2026!</code>). Click below to authorize switch.
            </span>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onRedirectToSignIn(toRole)}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 h-9.5 cursor-pointer order-2 sm:order-1"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              Sign In with Other User
            </Button>

            <div className="flex items-center gap-2 ml-auto w-full sm:w-auto order-1 sm:order-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 h-9.5 cursor-pointer flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white h-9.5 px-4 shadow-sm cursor-pointer flex-1 sm:flex-initial gap-1.5 font-poppins"
              >
                <Lock className="w-3.5 h-3.5" />
                {loading ? "Verifying..." : `Re-Login as ${toRole}`}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
