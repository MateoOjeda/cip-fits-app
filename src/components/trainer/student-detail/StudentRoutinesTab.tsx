import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Dumbbell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

interface StudentRoutinesTabProps {
  isLoadingRoutines: boolean;
  exercisesByDay: Record<string, any[]>;
  selectedDayTab: string;
  setSelectedDayTab: (day: string) => void;
}

export function StudentRoutinesTab({
  isLoadingRoutines,
  exercisesByDay,
  selectedDayTab,
  setSelectedDayTab
}: StudentRoutinesTabProps) {
  return (
    <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
      <CardHeader className="pb-3 border-b border-border/40 p-4 bg-muted/20">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4.5 w-4.5 text-primary" />
            Ejercicios de la Rutina Asignada
          </div>
          {isLoadingRoutines && <Loader2 className="h-4.5 w-4.5 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day, i) => {
            const count = exercisesByDay[day]?.length || 0;
            const isActive = selectedDayTab === day;
            return (
              <button 
                key={day} 
                onClick={() => setSelectedDayTab(day)}
                className={cn(
                  "flex flex-col items-center justify-center h-11 rounded-lg text-[10px] font-bold border transition-all transition-ds",
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : count > 0 
                      ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20" 
                      : "bg-secondary/30 border-border text-muted-foreground hover:bg-secondary/40"
                )}
              >
                <span>{DAY_SHORT[i]}</span>
                {count > 0 && <span className="text-[8px] font-bold mt-0.5">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="pt-1">
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">{selectedDayTab}</p>
          {(!exercisesByDay[selectedDayTab] || exercisesByDay[selectedDayTab].length === 0) ? (
            <div className="text-center py-10 border border-dashed rounded-lg bg-muted/10">
              <Dumbbell className="h-6 w-6 mx-auto text-muted-foreground/35 mb-2" />
              <p className="text-xs text-muted-foreground font-medium">Sin ejercicios programados para el {selectedDayTab}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {exercisesByDay[selectedDayTab].map((ex: any) => (
                <div key={ex.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/40">
                  <CheckCircle className={cn(
                    "h-4 w-4 flex-shrink-0 transition-colors",
                    ex.completed ? "text-emerald-500" : "text-muted-foreground/30"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-foreground">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ex.sets} series × {ex.reps} repeticiones · {ex.weight} kg</p>
                  </div>
                  {ex.completed && (
                    <Badge className="bg-emerald-500/15 border-none text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                      Realizado
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
