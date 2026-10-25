"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastItem["type"], title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const showToast = React.useCallback(
    (message: string, type: ToastItem["type"] = "success", title?: string) => {
      const id = "toast_" + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl transition-all duration-200 animate-in slide-in-from-bottom-3",
              toast.type === "success" && "bg-white border-emerald-200 text-slate-800",
              toast.type === "error" && "bg-white border-red-200 text-slate-800",
              toast.type === "warning" && "bg-white border-amber-200 text-slate-800",
              toast.type === "info" && "bg-white border-blue-200 text-slate-800"
            )}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            )}
            {toast.type === "warning" && (
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            {toast.type === "info" && (
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              {toast.title && (
                <div className="text-xs font-bold text-slate-900 mb-0.5">
                  {toast.title}
                </div>
              )}
              <div className="text-xs text-slate-600 leading-relaxed font-medium">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 rounded p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
