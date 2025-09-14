import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 text-white",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80 text-white",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80 text-white",
        outline: "text-foreground",
      },
      appearance: {
        solid: "border-transparent",
        outline: "border",
        light: "border-transparent",
        stroke: "border",
      },
      size: {
        default: "px-3 py-2",
        sm: "px-2 py-1",
        lg: "px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
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
