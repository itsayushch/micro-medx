import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-blue-50 text-blue-700 border border-blue-200",
        secondary:
          "bg-slate-100 text-slate-700 border border-slate-200",
        critical:
          "bg-red-50 text-red-700 border border-red-200 font-bold",
        warning:
          "bg-amber-50 text-amber-800 border border-amber-200 font-bold",
        success:
          "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold",
        info:
          "bg-sky-50 text-sky-800 border border-sky-200",
        teal:
          "bg-teal-50 text-teal-800 border border-teal-200",
        outline:
          "text-slate-700 border border-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
