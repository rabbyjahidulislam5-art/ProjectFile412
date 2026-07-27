import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      paid: "border-state-success/30 bg-state-success/10 text-state-success",
      pending: "border-state-warning/30 bg-state-warning/10 text-state-warning",
      overdue: "border-state-danger/30 bg-state-danger/10 text-state-danger",
      waived: "border-border-subtle bg-bg-elevated text-text-secondary",
      under_review: "border-state-warning/50 bg-transparent text-state-warning",
    },
  },
  defaultVariants: {
    variant: "pending",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
