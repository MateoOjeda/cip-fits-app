import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusBadgeType =
  | "activo"
  | "pendiente"
  | "completado"
  | "pagado"
  | "error"
  | "al_fallo"
  | "dropset"
  | "piramide"
  | "global"
  | "default";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusBadgeType | string;
  label?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  className,
  status,
  label,
  ...props
}) => {
  const normStatus = String(status).toLowerCase();

  const config = React.useMemo(() => {
    switch (normStatus) {
      case "activo":
      case "pagado":
      case "completado":
      case "hecho":
        return {
          bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-none",
          text: label || (normStatus === "hecho" ? "Hecho" : normStatus === "pagado" ? "Pagado" : "Completado"),
        };
      case "pendiente":
      case "en_progreso":
        return {
          bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-none",
          text: label || "Pendiente",
        };
      case "error":
      case "inactivo":
      case "falto":
      case "al_fallo":
        return {
          bg: "bg-destructive/10 text-destructive border-none",
          text: label || (normStatus === "al_fallo" ? "Al Fallo" : normStatus === "falto" ? "Faltó" : "Inactivo"),
        };
      case "dropset":
      case "ds":
        return {
          bg: "bg-primary/10 text-primary border-none",
          text: label || "Drop Set",
        };
      case "piramide":
        return {
          bg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-none",
          text: label || "Pirámide",
        };
      case "global":
        return {
          bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-none",
          text: label || "Global",
        };
      default:
        return {
          bg: "bg-secondary/20 text-muted-foreground border-none",
          text: label || status,
        };
    }
  }, [normStatus, label, status]);

  return (
    <Badge
      className={cn(
        "shadow-none px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wide",
        config.bg,
        className
      )}
      {...props}
    >
      {config.text}
    </Badge>
  );
};

export { StatusBadge };
