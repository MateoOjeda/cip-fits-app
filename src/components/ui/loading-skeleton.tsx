import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SkeletonType = "card" | "list" | "table" | "results" | "details";

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: SkeletonType;
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  type = "card",
  count = 3,
  ...props
}) => {
  const items = Array.from({ length: count });

  if (type === "list") {
    return (
      <div className={cn("space-y-2.5", className)} {...props}>
        {items.map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3.5 border border-border/30 rounded-2xl bg-card/45 animate-pulse">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full bg-secondary/35" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-28 bg-secondary/35" />
                <Skeleton className="h-2 w-16 bg-secondary/35" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 bg-secondary/35 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className={cn("border border-border/40 rounded-2xl overflow-hidden bg-card/65 animate-pulse", className)} {...props}>
        <div className="h-10 bg-muted/20 border-b border-border/40 flex items-center px-4 gap-4">
          <Skeleton className="h-3.5 w-1/5 bg-secondary/35" />
          <Skeleton className="h-3.5 w-1/5 bg-secondary/35" />
          <Skeleton className="h-3.5 w-1/5 bg-secondary/35" />
          <Skeleton className="h-3.5 w-1/5 bg-secondary/35" />
          <Skeleton className="h-3.5 w-1/5 bg-secondary/35" />
        </div>
        <div className="p-3 space-y-2">
          {items.map((_, i) => (
            <div key={i} className="h-11 flex items-center px-2 gap-4 border-b border-border/20 last:border-none">
              <Skeleton className="h-3 w-1/4 bg-secondary/30" />
              <Skeleton className="h-3 w-1/6 bg-secondary/30" />
              <Skeleton className="h-3 w-1/6 bg-secondary/30" />
              <Skeleton className="h-3 w-1/6 bg-secondary/30" />
              <Skeleton className="h-3 w-1/12 bg-secondary/30" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "results") {
    return (
      <div className={cn("flex overflow-hidden min-h-[450px] border border-border/40 rounded-2xl bg-card/65 animate-pulse", className)} {...props}>
        <div className="w-[240px] border-r border-border/40 bg-secondary/10 p-3 space-y-2 hidden sm:block shrink-0">
          <Skeleton className="h-3 w-20 bg-secondary/35 mb-4" />
          {items.map((_, i) => (
            <Skeleton key={i} className="h-9 w-full bg-secondary/30 rounded-xl" />
          ))}
        </div>
        <div className="flex-1 p-6 space-y-6 bg-background">
          <div className="flex items-center gap-3.5 pb-4 border-b border-border/40">
            <Skeleton className="h-10 w-10 rounded-full bg-secondary/35" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 bg-secondary/35" />
              <Skeleton className="h-2 w-24 bg-secondary/35" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-secondary/15 space-y-3">
              <Skeleton className="h-3 w-28 bg-secondary/35" />
              <Skeleton className="h-9 w-full bg-card border border-border/30 rounded-xl" />
            </div>
            <div className="p-4 rounded-2xl bg-secondary/15 space-y-3">
              <Skeleton className="h-3 w-28 bg-secondary/35" />
              <Skeleton className="h-9 w-full bg-card border border-border/30 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "details") {
    return (
      <div className={cn("space-y-4 animate-pulse", className)} {...props}>
        <div className="flex items-center gap-4 p-4 border border-border/40 bg-card/65 rounded-2xl">
          <Skeleton className="h-14 w-14 rounded-full bg-secondary/35" />
          <div className="space-y-2">
            <Skeleton className="h-4.5 w-44 bg-secondary/35" />
            <Skeleton className="h-3 w-28 bg-secondary/35" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 bg-card border border-border/40 rounded-2xl" />
          <Skeleton className="h-24 bg-card border border-border/40 rounded-2xl" />
          <Skeleton className="h-24 bg-card border border-border/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)} {...props}>
      {items.map((_, i) => (
        <div key={i} className="border border-border/40 bg-card/65 rounded-2xl p-4.5 space-y-3 shadow-sm animate-pulse">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-3/4 bg-secondary/35" />
            <Skeleton className="h-2.5 w-1/2 bg-secondary/35" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-16 bg-secondary/35 rounded" />
            <Skeleton className="h-5 w-12 bg-secondary/35 rounded" />
          </div>
          <div className="flex gap-2 pt-4 border-t border-border/20">
            <Skeleton className="h-8 w-1/2 bg-secondary/35 rounded-lg" />
            <Skeleton className="h-8 w-1/2 bg-secondary/35 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export { LoadingSkeleton };
