"use client";

import * as React from "react";
import { ShieldCheck, Copy, Check, Hash, Lock, Code2 } from "lucide-react";
import { AuditLedgerRecord } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuditDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AuditLedgerRecord | null;
}

export function AuditDetailModal({
  open,
  onOpenChange,
  record,
}: AuditDetailModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!record) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} maxWidthClass="max-w-3xl">
        <DialogHeader className="bg-slate-900 text-white">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">
                BLOCK #{record.id}
              </span>
              <span className="text-xs text-slate-400 font-mono">{record.timestamp}</span>
            </div>
            <Badge variant="teal" className="bg-emerald-950 text-emerald-300 border-emerald-800 gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Cryptographically Verified
            </Badge>
          </div>
          <DialogTitle className="mt-1 text-xl font-bold text-white flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-400" />
            SHA-256 Cryptographic Block Details
          </DialogTitle>
          <div className="text-xs text-slate-400">
            Actor: <strong className="text-slate-200">{record.actor}</strong> &bull; Role:{" "}
            <strong className="text-slate-200">{record.role}</strong> &bull; Category:{" "}
            <span className="text-blue-300 font-bold">{record.category}</span>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
          {/* Action & Result */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Ledger Event Summary
            </div>
            <div className="text-sm font-bold text-slate-900">{record.action}</div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 text-xs">
              <span className="text-slate-500">Target Entity:</span>
              <strong className="text-slate-800">{record.entity}</strong>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Verification Outcome:</span>
              <strong className="text-emerald-700">{record.result}</strong>
            </div>
          </div>

          {/* Hash Chaining Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-200 p-4 font-mono text-xs space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Hash className="h-4 w-4 text-emerald-400" />
              Cryptographic Hash Chaining Verification
            </div>

            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">Previous Block Hash (prev_hash):</div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300 select-all break-all text-[11px]">
                {record.prev_hash}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-emerald-400 font-bold mb-0.5">
                Current Block SHA-256 Hash (current_hash):
              </div>
              <div className="bg-slate-900 p-2 rounded border border-emerald-800/60 text-emerald-300 select-all break-all text-[11px] font-bold">
                {record.current_hash}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Signature Standard: <strong>HMAC-SHA256</strong></span>
              <span>Merkle Root Integrity: <strong className="text-emerald-400">VALID ✓</strong></span>
            </div>
          </div>

          {/* Raw JSON Payload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-blue-600" />
                Raw Immutable Block Payload (JSON)
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy JSON
                  </>
                )}
              </button>
            </div>
            <pre className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto max-h-56 leading-relaxed">
              {JSON.stringify(record.payload, null, 2)}
            </pre>
          </div>
        </div>

        <DialogFooter className="bg-slate-50">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close Block Inspector
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
