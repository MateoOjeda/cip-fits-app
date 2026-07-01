import * as React from "react";
import { cn } from "@/lib/utils";
import { PremiumCard } from "@/components/ui/premium-card";

export interface TimelineCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isLast?: boolean;
  isFirst?: boolean;
  dateText?: string;
  icon?: React.ReactNode;
}

const TimelineCard: React.FC<TimelineCardProps> = ({
  className,
  children,
  isLast = false,
  isFirst = false,
  dateText,
  icon,
  ...props
}) => {
  return (
    <div className={cn("relative pl-7 md:pl-9 pb-5 last:pb-0", className)} {...props}>
      {/* Line connector */}
      {!isLast && (
        <div className="absolute left-3.5 md:left-4.5 top-8 bottom-0 w-0.5 bg-border/40 pointer-events-none" />
      )}
      
      {/* Node Icon */}
      <div className="absolute left-1 md:left-2 top-1.5 h-6.5 w-6.5 rounded-full border border-border/40 bg-background flex items-center justify-center shrink-0 shadow-sm z-10 text-muted-foreground/75">
        {icon}
      </div>

      <div className="space-y-2">
        {dateText && (
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
            {dateText}
          </div>
        )}
        <PremiumCard className="p-4 bg-card/65 backdrop-blur-md">
          {children}
        </PremiumCard>
      </div>
    </div>
  );
};

export { TimelineCard };
