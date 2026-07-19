import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Clock, Scale, TrendingDown } from "lucide-react";
import { Assessment, Injury, Goal } from "@/services/tracking";
import { differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ExerciseLogDay {
  log_date: string;
  completed: boolean;
}

interface Props {
  assessments: Assessment[];
  injuries: Injury[];
  goals: Goal[];
  exerciseLogs: ExerciseLogDay[];
  loading: boolean;
}

type AlertSeverity = "error" | "warning" | "info";

interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  icon: typeof AlertCircle;
}

const SEVERITY_CONFIG: Record<AlertSeverity, { border: string; bg: string; iconColor: string; badge: string }> = {
  error: {
    border: "border-destructive/30",
    bg: "bg-destructive/5",
    iconColor: "text-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/30",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    iconColor: "text-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  info: {
    border: "border-border/40",
    bg: "bg-card/40",
    iconColor: "text-primary",
    badge: "bg-primary/10 text-primary border-primary/30",
  },
};

function computeAlerts(
  assessments: Assessment[],
  injuries: Injury[],
  goals: Goal[],
  exerciseLogs: ExerciseLogDay[]
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // 1. Last training session
  const sortedLogs = [...exerciseLogs].sort((a, b) =>
    b.log_date.localeCompare(a.log_date)
  );
  const lastLogDate = sortedLogs[0]?.log_date;
  if (lastLogDate) {
    const daysSince = differenceInDays(now, parseISO(lastLogDate));
    if (daysSince >= 7) {
      alerts.push({
        id: "no_training_7d",
        severity: "error",
        title: "Sin entrenamiento (+7 días)",
        description: `Hace ${daysSince} días que no se registra actividad de entrenamiento.`,
        icon: AlertCircle,
      });
    } else if (daysSince >= 5) {
      alerts.push({
        id: "no_training_5d",
        severity: "warning",
        title: "Sin entrenamiento (+5 días)",
        description: `Hace ${daysSince} días sin registrar actividad. Considera hacer seguimiento.`,
        icon: Clock,
      });
    }
  } else {
    alerts.push({
      id: "no_training_ever",
      severity: "info",
      title: "Sin registros de entrenamiento",
      description: "El alumno no tiene ningún registro de ejercicios aún.",
      icon: AlertCircle,
    });
  }

  // 2. Adherence (last 30 logs)
  if (exerciseLogs.length >= 5) {
    const recent = sortedLogs.slice(0, 30);
    const completed = recent.filter((l) => l.completed).length;
    const rate = Math.round((completed / recent.length) * 100);
    if (rate < 60) {
      alerts.push({
        id: "low_adherence",
        severity: "warning",
        title: `Baja adherencia: ${rate}%`,
        description: "Menos del 60% de los ejercicios recientes fueron completados.",
        icon: TrendingDown,
      });
    }
  }

  // 3. Active injury with high pain
  const criticalInjuries = injuries.filter(
    (i) => i.status === "activa" && i.pain_level >= 7
  );
  criticalInjuries.forEach((inj) => {
    alerts.push({
      id: `injury_${inj.id}`,
      severity: "error",
      title: `Lesión crítica: ${inj.location}`,
      description: `Dolor ${inj.pain_level}/10 — lesión activa que requiere atención inmediata.`,
      icon: AlertTriangle,
    });
  });

  // 4. No weight recorded in last 30 days
  const lastAssessment = assessments[0];
  if (!lastAssessment) {
    alerts.push({
      id: "no_assessment",
      severity: "info",
      title: "Sin evaluaciones registradas",
      description: "No hay evaluaciones físicas para este alumno. Registra la primera.",
      icon: Scale,
    });
  } else {
    const daysSinceAssessment = differenceInDays(now, parseISO(lastAssessment.recorded_at));
    if (daysSinceAssessment >= 30) {
      alerts.push({
        id: "no_assessment_30d",
        severity: "warning",
        title: "Sin evaluación reciente",
        description: `Hace ${daysSinceAssessment} días sin nueva evaluación física.`,
        icon: Scale,
      });
    }
  }

  // 5. Overdue goals
  const overdueGoals = goals.filter((g) => {
    if (g.status !== "en_progreso") return false;
    return differenceInDays(now, parseISO(g.target_date)) > 0;
  });
  if (overdueGoals.length > 0) {
    alerts.push({
      id: "overdue_goals",
      severity: "warning",
      title: `${overdueGoals.length} objetivo(s) vencido(s)`,
      description: overdueGoals.map((g) => g.goal).join(", "),
      icon: AlertTriangle,
    });
  }

  return alerts.sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

export default function TrackingAlertsTab({
  assessments, injuries, goals, exerciseLogs, loading
}: Props) {
  const alerts = useMemo(
    () => computeAlerts(assessments, injuries, goals, exerciseLogs),
    [assessments, injuries, goals, exerciseLogs]
  );

  if (loading) {
    return (
      <Card className="border border-border/40 bg-card/60 rounded-xl">
        <CardContent className="py-12 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Todo en orden</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              No se detectaron alertas para este alumno.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const errors = alerts.filter((a) => a.severity === "error");
  const warnings = alerts.filter((a) => a.severity === "warning");
  const infos = alerts.filter((a) => a.severity === "info");

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-2">
        {errors.length > 0 && (
          <Badge variant="outline" className="gap-1.5 border-destructive/30 bg-destructive/10 text-destructive">
            <AlertCircle className="h-3 w-3" /> {errors.length} crítica{errors.length > 1 ? "s" : ""}
          </Badge>
        )}
        {warnings.length > 0 && (
          <Badge variant="outline" className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" /> {warnings.length} advertencia{warnings.length > 1 ? "s" : ""}
          </Badge>
        )}
        {infos.length > 0 && (
          <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10 text-primary">
            <Bell className="h-3 w-3" /> {infos.length} info
          </Badge>
        )}
      </div>

      {/* Alert cards */}
      <div className="space-y-3">
        {alerts.map((alert) => {
          const cfg = SEVERITY_CONFIG[alert.severity];
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-3.5 p-4 rounded-xl border",
                cfg.border, cfg.bg
              )}
            >
              <Icon className={cn("h-4.5 w-4.5 mt-0.5 shrink-0", cfg.iconColor)} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">{alert.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  {alert.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
