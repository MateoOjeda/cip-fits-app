import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  className,
  title,
  description,
  actions,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40 mb-6",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-base font-bold text-foreground tracking-tight uppercase">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export { SectionHeader };
