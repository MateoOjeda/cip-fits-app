import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ClipboardList, Clock, Dumbbell, TrendingUp } from "lucide-react";

interface StudentSummaryProps {
  exercises: any[];
  profile: any;
  daysRemaining: number;
  hasPlan: boolean;
  pendingSurveysCount: number;
}

export function StudentSummaryTab({
  exercises,
  profile,
  daysRemaining,
  hasPlan,
  pendingSurveysCount
}: StudentSummaryProps) {
  const totalEx = exercises.length;
  const completedEx = exercises.filter(e => e.completed).length;
  const adherence = totalEx > 0 ? Math.round((completedEx / totalEx) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm hover:border-primary/20 transition-all transition-ds">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Adherencia Semanal</p>
              <h3 className="text-base font-bold text-foreground mt-0.5">{adherence}%</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm hover:border-emerald-500/20 transition-all transition-ds">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Ejercicios Realizados</p>
              <h3 className="text-base font-bold text-foreground mt-0.5">{completedEx} de {totalEx}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm hover:border-amber-500/20 transition-all transition-ds">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Encuestas Pendientes</p>
              <h3 className="text-base font-bold text-foreground mt-0.5">{pendingSurveysCount} pendientes</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cycle Remaining Card */}
      <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-[9px] font-bold">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Ciclo de Entrenamiento</span>
              </div>
              <h3 className="text-sm font-bold text-foreground mt-1">
                {daysRemaining} Días restantes
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Próxima re-planificación sugerida
              </p>
            </div>
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary shadow-sm">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          
          <div className="mt-4 w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${Math.max(0, Math.min(100, (daysRemaining / 30) * 100))}%` }} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
