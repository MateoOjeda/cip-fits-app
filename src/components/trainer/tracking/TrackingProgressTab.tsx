import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, orderBy, limit
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendingUp, Award, BarChart3 } from "lucide-react";
import WeightProgressChart from "@/components/trainer/WeightProgressChart";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  studentId: string;
}

interface ExerciseLog {
  exercise_id: string;
  exercise_name?: string;
  actual_weight: number | null;
  actual_reps: number | null;
  actual_sets: number | null;
  log_date: string;
  completed: boolean;
}

interface PR {
  exerciseName: string;
  weight: number;
  date: string;
}

export default function TrackingProgressTab({ studentId }: Props) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "exercise_logs"),
          where("student_id", "==", studentId),
          where("trainer_id", "==", user.uid),
          orderBy("log_date", "desc"),
          limit(200)
        );
        const snap = await getDocs(q);
        setLogs(snap.docs.map((d) => d.data() as ExerciseLog));
      } catch (err) {
        console.error("Error fetching progress logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, studentId]);

  // Compute PRs: max weight per exercise
  const prs = useMemo<PR[]>(() => {
    const map = new Map<string, { weight: number; date: string; name: string }>();
    logs.forEach((log) => {
      if (!log.completed || !log.actual_weight || !log.exercise_id) return;
      const existing = map.get(log.exercise_id);
      if (!existing || log.actual_weight > existing.weight) {
        map.set(log.exercise_id, {
          weight: log.actual_weight,
          date: log.log_date,
          name: log.exercise_name || log.exercise_id,
        });
      }
    });
    return Array.from(map.values())
      .map((v) => ({ exerciseName: v.name, weight: v.weight, date: v.date }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);
  }, [logs]);

  // Weekly volume: sum(sets * reps * weight) grouped by week
  const weeklyVolume = useMemo(() => {
    const byWeek: Record<string, number> = {};
    logs.forEach((log) => {
      if (!log.completed || !log.actual_sets || !log.actual_reps || !log.actual_weight) return;
      const date = parseISO(log.log_date);
      // Get Monday of the week
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay() + 1);
      const key = format(d, "dd MMM", { locale: es });
      byWeek[key] = (byWeek[key] || 0) + (log.actual_sets * log.actual_reps * log.actual_weight);
    });
    return Object.entries(byWeek)
      .slice(0, 8)
      .reverse()
      .map(([week, volume]) => ({ week, volume: Math.round(volume) }));
  }, [logs]);

  if (loading) return <LoadingSkeleton type="list" count={4} />;

  return (
    <div className="space-y-6">
      {/* Weight evolution */}
      <WeightProgressChart studentId={studentId} />

      {/* Weekly volume */}
      <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Volumen Semanal (kg·reps)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyVolume.length === 0 ? (
            <EmptyState type="empty" title="Sin datos de volumen" description="Registra actividad para ver la progresión de volumen." />
          ) : (
            <div className="space-y-2">
              {weeklyVolume.map((w) => {
                const max = Math.max(...weeklyVolume.map((x) => x.volume));
                const pct = max > 0 ? (w.volume / max) * 100 : 0;
                return (
                  <div key={w.week} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-14 shrink-0">{w.week}</span>
                    <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-foreground w-16 text-right shrink-0">
                      {w.volume.toLocaleString()} kg
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Records */}
      <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Récords Personales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prs.length === 0 ? (
            <EmptyState type="empty" title="Sin récords" description="Completa ejercicios con peso registrado para ver PRs." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {prs.map((pr) => (
                <div
                  key={pr.exerciseName}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/10 border border-border/30"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{pr.exerciseName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(parseISO(pr.date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-bold ml-2 shrink-0">
                    {pr.weight} kg
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
