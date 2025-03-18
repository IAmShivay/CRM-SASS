import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "accent" | "white";
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

export function Loader({
  size = "md",
  variant = "primary",
  className,
  fullScreen = false,
  text
}: LoaderProps) {
  // Size mappings
  const sizeMap = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  // Color mappings
  const colorMap = {
    primary: "border-primary border-t-transparent",
    secondary: "border-secondary border-t-transparent",
    accent: "border-accent border-t-transparent",
    white: "border-white border-t-transparent",
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center",
    fullScreen ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50" : "",
    className
  );

  return (
    <div className={containerClasses}>
      <div
        className={cn(
          "animate-spin rounded-full",
          sizeMap[size],
          colorMap[variant]
        )}
      />
      {text && (
        <p className="mt-2 text-sm font-medium text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
}

export function LoadingOverlay({ isLoading, children, text }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-md z-10">
          <Loader text={text} />
        </div>
      )}
    </div>
  );
}
