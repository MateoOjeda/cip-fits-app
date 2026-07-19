import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { EmptyState } from "@/components/ui/empty-state";
import { Target, Plus, Loader2, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import {
  Goal, GoalStatus, GoalPriority,
  addGoal, updateGoal, deleteGoal
} from "@/services/tracking";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<GoalStatus, { label: string; className: string }> = {
  en_progreso: { label: "En progreso", className: "bg-primary/10 text-primary border-primary/30" },
  logrado: { label: "Logrado ✓", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  abandonado: { label: "Abandonado", className: "bg-muted/40 text-muted-foreground border-border/40" },
};

const PRIORITY_CONFIG: Record<GoalPriority, { label: string; className: string }> = {
  alta: { label: "Alta", className: "text-destructive border-destructive/30 bg-destructive/10" },
  media: { label: "Media", className: "text-amber-500 border-amber-500/30 bg-amber-500/10" },
  baja: { label: "Baja", className: "text-muted-foreground border-border/40 bg-muted/30" },
};

const CATEGORIES = [
  "Fuerza", "Resistencia", "Pérdida de peso", "Ganancia muscular",
  "Flexibilidad", "Hábitos", "Rendimiento", "Salud general", "Otro"
];

interface Props {
  studentId: string;
  goals: Goal[];
  loading: boolean;
  onAdd: (g: Goal) => void;
  onUpdate: (id: string, data: Partial<Goal>) => void;
  onDelete: (id: string) => void;
}

export default function TrackingGoalsTab({
  studentId, goals, loading, onAdd, onUpdate, onDelete
}: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form
  const [goalText, setGoalText] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<GoalPriority>("media");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [targetDate, setTargetDate] = useState("");
  const [progressPct, setProgressPct] = useState(0);

  const handleSave = useCallback(async () => {
    if (!user || !goalText.trim() || !targetDate) return;
    setSaving(true);
    try {
      const data: Omit<Goal, "id"> = {
        trainer_id: user.uid,
        student_id: studentId,
        created_at: new Date().toISOString(),
        goal: goalText.trim(),
        category,
        priority,
        start_date: startDate,
        target_date: targetDate,
        progress_pct: progressPct,
        status: "en_progreso",
      };
      const id = await addGoal(data);
      onAdd({ id, ...data });
      toast.success("Objetivo creado");
      setGoalText(""); setCategory(CATEGORIES[0]); setPriority("media");
      setStartDate(new Date().toISOString().split("T")[0]); setTargetDate(""); setProgressPct(0);
    } catch {
      toast.error("Error al guardar el objetivo");
    } finally {
      setSaving(false);
    }
  }, [user, studentId, goalText, category, priority, startDate, targetDate, progressPct, onAdd]);

  const handleProgressUpdate = async (id: string, newPct: number) => {
    try {
      await updateGoal(id, { progress_pct: newPct });
      onUpdate(id, { progress_pct: newPct });
    } catch {
      toast.error("Error al actualizar progreso");
    }
  };

  const handleStatusChange = async (id: string, status: GoalStatus) => {
    try {
      await updateGoal(id, { status });
      onUpdate(id, { status });
      toast.success(STATUS_CONFIG[status].label);
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteGoal(id);
      onDelete(id);
      toast.success("Objetivo eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const active = goals.filter((g) => g.status === "en_progreso");
  const done = goals.filter((g) => g.status !== "en_progreso");

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
        <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Nuevo Objetivo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Objetivo *</Label>
            <Input
              placeholder="Ej: Levantar 100kg en sentadilla"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              className="h-9 text-xs border-border/50 bg-secondary/15"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Categoría</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/50 bg-secondary/15 text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Prioridad</Label>
              <div className="flex gap-2">
                {(["alta", "media", "baja"] as GoalPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 h-9 rounded-lg border text-[10px] font-bold transition-all",
                      priority === p
                        ? PRIORITY_CONFIG[p].className
                        : "border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Inicio</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs border-border/50 bg-secondary/15"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Fecha objetivo *</Label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-9 text-xs border-border/50 bg-secondary/15"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Progreso inicial</Label>
              <span className="text-xs font-bold text-primary">{progressPct}%</span>
            </div>
            <Slider
              min={0} max={100} step={5}
              value={[progressPct]}
              onValueChange={([v]) => setProgressPct(v)}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !goalText.trim() || !targetDate}
            className="w-full h-10 rounded-xl font-bold shadow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Target className="h-4 w-4 mr-2" />}
            {saving ? "Guardando..." : "Crear Objetivo"}
          </Button>
        </CardContent>
      </Card>

      {/* Goals list */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : goals.length === 0 ? (
        <EmptyState type="empty" title="Sin objetivos" description="Define metas concretas para este alumno." />
      ) : (
        <div className="space-y-3">
          {[...active, ...done].map((g) => {
            const prCfg = PRIORITY_CONFIG[g.priority];
            const stCfg = STATUS_CONFIG[g.status];
            return (
              <Card key={g.id} className={cn(
                "border bg-card/60 rounded-xl shadow-sm",
                g.status === "en_progreso" ? "border-border/40" : "border-border/20 opacity-70"
              )}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-snug">{g.goal}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {g.category && (
                          <Badge variant="outline" className="text-[9px]">{g.category}</Badge>
                        )}
                        <Badge variant="outline" className={cn("text-[9px] border", prCfg.className)}>
                          {prCfg.label}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[9px] border", stCfg.className)}>
                          {stCfg.label}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleDelete(g.id)}
                      disabled={deletingId === g.id}
                    >
                      {deletingId === g.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                      <span>Progreso</span>
                      <span className="font-bold text-primary">{g.progress_pct}%</span>
                    </div>
                    <Progress value={g.progress_pct} className="h-1.5" />
                    {g.status === "en_progreso" && (
                      <div className="flex gap-1 justify-end">
                        {[0, 25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleProgressUpdate(g.id, pct)}
                            className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded border transition-all",
                              g.progress_pct === pct
                                ? "bg-primary/15 border-primary/40 text-primary"
                                : "border-border/30 text-muted-foreground hover:bg-muted/40"
                            )}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dates & status actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[9px] text-muted-foreground">
                      {format(parseISO(g.start_date), "d MMM", { locale: es })} →{" "}
                      {format(parseISO(g.target_date), "d MMM yyyy", { locale: es })}
                    </p>
                    {g.status === "en_progreso" && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline" size="sm"
                          className="h-6 text-[9px] px-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => handleStatusChange(g.id, "logrado")}
                        >
                          ✓ Logrado
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="h-6 text-[9px] px-2 border-border/40 text-muted-foreground hover:bg-muted/40"
                          onClick={() => handleStatusChange(g.id, "abandonado")}
                        >
                          Abandonar
                        </Button>
                      </div>
                    )}
                    {g.status !== "en_progreso" && (
                      <Button
                        variant="outline" size="sm"
                        className="h-6 text-[9px] px-2 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => handleStatusChange(g.id, "en_progreso")}
                      >
                        Reactivar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
