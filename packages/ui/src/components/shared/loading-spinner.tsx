import { Loader2 } from "lucide-react";

import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  text,
  size = "md",
  className,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const spinner = (
    <div className="text-center">
      <Loader2
        className={cn(
          "text-primary mx-auto animate-spin",
          sizeClasses[size],
          className,
        )}
      />
      {text && <p className="text-muted-foreground mt-2">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
