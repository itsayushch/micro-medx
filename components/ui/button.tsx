import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 active:bg-blue-800",
        secondary:
          "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs",
        outline:
          "border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 active:bg-emerald-800",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-500/20 active:bg-red-800",
        warning:
          "bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-500/20 active:bg-amber-800",
        ghost:
          "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
        link:
          "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7.5 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
