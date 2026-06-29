import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LEVEL_LABELS } from "@/lib/planConstants";

interface PlanLevel {
  plan_type: string;
  level: string;
  unlocked: boolean;
}

interface PlanCardProps {
  label: string;
  description: string;
  icon: LucideIcon;
  planLevels: PlanLevel[];
  onClick: () => void;
}

export default function PlanCard({ label, description, icon: Icon, planLevels, onClick }: PlanCardProps) {
  const activeLevels = planLevels.filter((l) => l.unlocked);
  const hasActive = activeLevels.length > 0;

  return (
    <Card
      className="border border-border/50 bg-card hover:bg-muted/10 transition-all duration-200 cursor-pointer group rounded-xl shadow-sm"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground">{label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{description}</p>
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {hasActive ? (
              activeLevels.map((l) => (
                <Badge
                  key={l.level}
                  className="text-[9px] font-bold bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded-md"
                  variant="outline"
                >
                  {LEVEL_LABELS[l.level]} — Activo
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-[9px] font-bold bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-md">
                Sin plan asignado
              </Badge>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </CardContent>
    </Card>
  );
}
