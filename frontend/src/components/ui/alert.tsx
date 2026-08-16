import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-sm border p-3.5 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-3.5 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-slate-50 text-slate-900 border-slate-200 border-l-4 border-l-slate-600",
        destructive:
          "bg-red-50/90 text-red-900 border-red-200 border-l-4 border-l-red-600 [&>svg]:text-red-600",
        warning:
          "bg-amber-50/90 text-amber-900 border-amber-200 border-l-4 border-l-amber-600 [&>svg]:text-amber-600",
        success:
          "bg-emerald-50/90 text-emerald-900 border-emerald-200 border-l-4 border-l-emerald-600 [&>svg]:text-emerald-600",
        info:
          "bg-indigo-50/90 text-indigo-900 border-indigo-200 border-l-4 border-l-indigo-600 [&>svg]:text-indigo-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs leading-relaxed opacity-90", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
