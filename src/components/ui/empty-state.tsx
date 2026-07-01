import * as React from "react";
import { AlertCircle, AlertTriangle, Database, WifiOff, FileX, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateType = "empty" | "no-results" | "error" | "network-error" | "firestore-error";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: EmptyStateType;
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  loadingAction?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  className,
  type = "empty",
  icon: CustomIcon,
  title,
  description,
  actionText,
  onAction,
  loadingAction = false,
  ...props
}) => {
  const Icon = React.useMemo(() => {
    if (CustomIcon) return CustomIcon;
    switch (type) {
      case "no-results":
        return FileX;
      case "network-error":
        return WifiOff;
      case "firestore-error":
        return Database;
      case "error":
        return AlertTriangle;
      case "empty":
      default:
        return AlertCircle;
    }
  }, [type, CustomIcon]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/50 rounded-2xl bg-secondary/5 min-h-[220px] select-none",
        className
      )}
      {...props}
    >
      <div className={cn(
        "p-3 rounded-full mb-3.5",
        type.includes("error") 
          ? "bg-destructive/10 text-destructive" 
          : "bg-secondary/20 text-muted-foreground/50"
      )}>
        <Icon className="h-6 w-6" />
      </div>
      
      <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1">
        {title}
      </h3>
      
      {description && (
        <p className="text-[10px] text-muted-foreground max-w-[280px] leading-relaxed mb-4">
          {description}
        </p>
      )}

      {actionText && onAction && (
        <Button
          size="sm"
          variant="outline"
          onClick={onAction}
          disabled={loadingAction}
          className="h-8 text-[10px] font-bold rounded-lg border-border hover:bg-muted/15"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

export { EmptyState };
