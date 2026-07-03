import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const LEVEL_LABELS: Record<string, string> = {
  principiante: "Inicial",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

interface StudentHistoryTabProps {
  routineAssignmentDate: string | null;
  routineNextChange: string | null;
  handleUpdateCycleDates: (start: string | null, end: string | null) => void;
  archivedRoutines: any[];
  expandedRoutine: string | null;
  handleExpandRoutine: (id: string) => void;
  routineExercises: any[];
}

export function StudentHistoryTab({
  routineAssignmentDate,
  routineNextChange,
  handleUpdateCycleDates,
  archivedRoutines,
  expandedRoutine,
  handleExpandRoutine,
  routineExercises
}: StudentHistoryTabProps) {
  return (
    <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
      <CardHeader className="pb-3 border-b border-border/40 p-4 bg-muted/20">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial de Rutinas Archivadas</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Cycle dates modification form */}
        <div className="bg-secondary/20 p-3 rounded-lg border border-border/40 space-y-3">
          <Label className="text-xs font-bold text-foreground block">Ajuste de Ciclo Activo</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start-date-input" className="text-[9px] text-muted-foreground uppercase font-bold mb-1 block">Fecha de inicio</Label>
              <Input 
                id="start-date-input"
                type="date" 
                className="h-8 text-xs" 
                value={routineAssignmentDate ? new Date(routineAssignmentDate).toISOString().split('T')[0] : ""} 
                onChange={(e) => handleUpdateCycleDates(e.target.value || null, routineNextChange)}
              />
            </div>
            <div>
              <Label htmlFor="end-date-input" className="text-[9px] text-muted-foreground uppercase font-bold mb-1 block">Fecha de vencimiento</Label>
              <Input 
                id="end-date-input"
                type="date" 
                className="h-8 text-xs" 
                value={routineNextChange ? new Date(routineNextChange).toISOString().split('T')[0] : ""} 
                onChange={(e) => handleUpdateCycleDates(routineAssignmentDate, e.target.value || null)}
              />
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-border/40 w-full" />

        {archivedRoutines.length === 0 ? (
          <EmptyState
            type="empty"
            title="Sin rutinas archivadas"
            description="No hay rutinas anteriores o archivadas en el historial de este alumno."
            className="py-8"
          />
        ) : (
          <div className="space-y-2.5">
            {archivedRoutines.map((r: any) => (
              <div key={r.id} className="border border-border/40 rounded-2xl p-4 bg-card/40 hover:border-primary/20 transition-all duration-200 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Rutina de {LEVEL_LABELS[r.level] || r.level}
                    </p>
                    <p className="text-[9.5px] text-muted-foreground mt-0.5 font-semibold">
                      Asignada el {new Date(r.assigned_at).toLocaleDateString()} · {r.completed_count || 0} entrenamientos
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[9px] font-bold text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-lg px-3"
                    onClick={() => handleExpandRoutine(r.id)}
                  >
                    {expandedRoutine === r.id ? "Ocultar" : "Ver Ejercicios"}
                  </Button>
                </div>

                {expandedRoutine === r.id && (
                  <div className="mt-4 pt-3.5 border-t border-border/40 space-y-1.5 animate-in fade-in duration-200">
                    {routineExercises.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic text-center py-2">Cargando lista de ejercicios...</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5">
                        {routineExercises.map((ex: any) => (
                          <div key={ex.id} className="flex justify-between items-center text-[10px] p-2.5 bg-secondary/15 border border-border/30 rounded-xl">
                            <span className="font-semibold text-foreground/85">{ex.name}</span>
                            <span className="text-muted-foreground font-bold">{ex.sets}×{ex.reps} · {ex.weight}kg</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
