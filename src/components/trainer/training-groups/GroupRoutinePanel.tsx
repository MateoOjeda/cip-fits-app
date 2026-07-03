import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Eye, Edit3 } from "lucide-react";
import type { GroupExercise } from "@/hooks/trainer/useTrainingGroups";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface GroupRoutinePanelProps {
  exercises: GroupExercise[];
  showInlineRoutine: boolean;
  setShowInlineRoutine: (show: boolean) => void;
  selectedGroupId: string | null;
  onNavigateToRoutine: () => void;
}

export const GroupRoutinePanel: React.FC<GroupRoutinePanelProps> = ({
  exercises,
  showInlineRoutine,
  setShowInlineRoutine,
  onNavigateToRoutine,
}) => {
  return (
    <Card className="border border-border/40 bg-card rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Dumbbell className="h-4.5 w-4.5 text-primary" />
          Rutina del Grupo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="flex-1 h-auto flex flex-col items-center justify-center gap-3 hover:bg-muted/10 border-border/50 bg-secondary/15 group py-6 rounded-2xl transition-all duration-200 hover:scale-[1.01]" onClick={() => setShowInlineRoutine(!showInlineRoutine)}>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center transition-transform">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-bold text-foreground text-center leading-tight">Vista Previa de Rutina</span>
          </Button>

          <Button variant="outline" className="flex-1 h-auto flex flex-col items-center justify-center gap-3 hover:bg-muted/10 border-border/50 bg-secondary/15 group py-6 rounded-2xl transition-all duration-200 hover:scale-[1.01]" onClick={onNavigateToRoutine}>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center transition-transform">
              <Edit3 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-bold text-foreground text-center leading-tight">Configurar Ejercicios</span>
          </Button>
        </div>

        {showInlineRoutine && (
          <div className="pt-5 border-t border-border/40 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Ejercicios por Día</h3>
            </div>
            {exercises.length === 0 ? (
              <div className="text-center py-8 space-y-2 border border-dashed rounded-xl bg-secondary/10 border-border/50">
                <Dumbbell className="h-6 w-6 mx-auto text-muted-foreground/35" />
                <p className="text-xs text-muted-foreground font-semibold">El grupo no tiene ejercicios cargados</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 hide-scrollbar">
                {DAYS.map((day) => {
                  const dayExs = exercises.filter((e) => e.day === day);
                  if (dayExs.length === 0) return null;
                  return (
                    <div key={day} className="space-y-2">
                      <Badge variant="outline" className="mb-1 border-primary/20 bg-primary/5 text-primary text-[8.5px] font-bold px-2 py-0.5 rounded">{day}</Badge>
                      <div className="space-y-1.5">
                        {dayExs.map((ex) => (
                          <div key={ex.id} className="flex items-center gap-2 p-3 rounded-xl bg-secondary/15 border border-border/30">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-foreground truncate">{ex.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                                {ex.body_part && <span className="text-primary font-bold">{ex.body_part} · </span>}
                                {ex.sets} × {ex.is_to_failure ? <span className="text-destructive font-bold">Al Fallo</span> : `${ex.reps} REPS`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
