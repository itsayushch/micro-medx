"use client";

import * as React from "react";
import { Shield, ArrowRight, Lock, Phone, UserCheck, Stethoscope, Pill, Activity } from "lucide-react";
import { RoleType, UserSession } from "@/lib/types";
import { CLINICAL_PERSONAS } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AuthViewProps {
  onLogin: (role: RoleType, phone?: string, password?: string) => Promise<void>;
  onDirectEnter: (role: RoleType) => void;
}

export function AuthView({ onLogin, onDirectEnter }: AuthViewProps) {
  const [selectedRole, setSelectedRole] = React.useState<RoleType>("Doctor");
  const [phone, setPhone] = React.useState(CLINICAL_PERSONAS["Doctor"].phone);
  const [password, setPassword] = React.useState("demo123");
  const [loading, setLoading] = React.useState(false);

  const handlePersonaSelect = (role: RoleType) => {
    setSelectedRole(role);
    setPhone(CLINICAL_PERSONAS[role].phone);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(selectedRole, phone, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white font-black text-2xl shadow-lg shadow-blue-500/25 mb-2">
            M
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Micro <span className="text-blue-600">MedX</span>
          </h1>
          <p className="text-sm font-medium text-slate-600 max-w-md mx-auto">
            Clinical Decision Support, Pharmacist Fulfillment & Substitution, and SHA-256 Cryptographic Audit Ledger
          </p>
        </div>

        {/* 1-Click Clinician Persona Cards */}
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
            Select Clinician Demo Persona
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(CLINICAL_PERSONAS) as RoleType[]).map((role) => {
              const persona = CLINICAL_PERSONAS[role];
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handlePersonaSelect(role)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="text-2xl mb-1">{persona.avatar}</div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {persona.name}
                    </div>
                    <div className="text-[11px] font-semibold text-blue-600 mt-0.5">
                      {role}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {persona.phone}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form Box */}
        <Card className="shadow-lg border-slate-200/90 overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-600" />
              Sign in with Clinician Credentials
            </CardTitle>
            <CardDescription>
              Selected Workspace: <strong className="text-slate-800">{selectedRole}</strong> &bull; {CLINICAL_PERSONAS[selectedRole].name}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Clinical Role
                  </label>
                  <Select
                    value={selectedRole}
                    onChange={(e) => handlePersonaSelect(e.target.value as RoleType)}
                  >
                    <option value="Doctor">Doctor (Physician Workspace)</option>
                    <option value="Nurse">Nurse (MAR & Vitals Ingestion)</option>
                    <option value="Clinical Pharmacist">Clinical Pharmacist (Fulfillment)</option>
                    <option value="Administrator">Administrator (Audit & Integrity)</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Clinician Mobile / Dispatch Phone
                  </label>
                  <Input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password / PIN
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 font-bold h-10 gap-2 text-sm shadow-md shadow-blue-500/20"
                >
                  <UserCheck className="h-4 w-4" />
                  {loading ? "Authenticating Session..." : `Sign In as ${selectedRole}`}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onDirectEnter(selectedRole)}
                  className="h-10 text-xs font-bold gap-1 text-slate-700 hover:text-slate-900 border-slate-300"
                >
                  Instant Demo Bypass <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer features summary */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs text-slate-500 font-medium">
          <div className="p-2 rounded-lg bg-white border border-slate-200">
            <span className="font-bold text-slate-800">6-Agent Pipeline</span>
            <div className="text-[10px] text-slate-400">Deterministic + Explainable AI</div>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200">
            <span className="font-bold text-slate-800">Closed-Loop Rx</span>
            <div className="text-[10px] text-slate-400">Doctor &bull; Nurse &bull; Pharmacist</div>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200">
            <span className="font-bold text-slate-800">SHA-256 Ledger</span>
            <div className="text-[10px] text-slate-400">Tamper-Evident Hash Chain</div>
          </div>
        </div>
      </div>
    </div>
  );
}
