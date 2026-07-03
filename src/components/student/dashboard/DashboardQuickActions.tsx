import React from "react";
import { cn } from "@/lib/utils";
import { Dumbbell, FileText, ArrowUpCircle, Apple } from "lucide-react";

interface QuickAction {
  label: string;
  path: string;
  icon: React.ElementType;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Ver Rutinas", path: "/student/routines", icon: Dumbbell, color: "text-primary bg-primary/10 border-primary/20 hover:bg-primary/15" },
  { label: "Ver Planes", path: "/student/plans", icon: FileText, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15" },
  { label: "Mi Progreso", path: "/student/progress", icon: ArrowUpCircle, color: "text-blue-500 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15" },
  { label: "Mis Comidas", path: "/student/meals", icon: Apple, color: "text-orange-500 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15" },
];

interface DashboardQuickActionsProps {
  onNavigate: (path: string) => void;
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Accesos Rápidos</span>
        <div className="h-[1px] w-full bg-border/50" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => onNavigate(action.path)}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-ds shadow-sm",
                action.color
              )}
            >
              <Icon className="h-5 w-5 mb-2" />
              <span className="text-xs font-bold">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
