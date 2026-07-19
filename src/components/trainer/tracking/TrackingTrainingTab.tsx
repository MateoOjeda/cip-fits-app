import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dumbbell, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import ExerciseHistoryTab from "@/components/trainer/ExerciseHistoryTab";
import WeightProgressChart from "@/components/trainer/WeightProgressChart";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

interface Props {
  studentId: string;
}

interface AdherenceStat {
  total: number;
  completed: number;
  missed: number;
  rate: number;
}

export default function TrackingTrainingTab({ studentId }: Props) {
  const { user } = useAuth();
  const [stat, setStat] = useState<AdherenceStat | null>(null);
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
          limit(100)
        );
        const snap = await getDocs(q);
        const logs = snap.docs.map((d) => d.data());
        const total = logs.length;
        const completed = logs.filter((l) => l.completed).length;
        setStat({
          total,
          completed,
          missed: total - completed,
          rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        });
      } catch (err) {
        console.error("Error fetching training adherence:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, studentId]);

  if (loading) return <LoadingSkeleton type="list" count={3} />;

  return (
    <div className="space-y-6">
      {/* Adherence KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Adherencia", value: `${stat?.rate ?? 0}%`, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
          { label: "Completadas", value: stat?.completed ?? 0, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Incompletas", value: stat?.missed ?? 0, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
          { label: "Total Logs", value: stat?.total ?? 0, color: "text-muted-foreground", bg: "bg-muted/30 border-border/40" },
        ].map((kpi) => (
          <Card key={kpi.label} className={`border ${kpi.bg} bg-card/60 rounded-xl shadow-sm`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase tracking-wide">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weight chart */}
      <WeightProgressChart studentId={studentId} />

      {/* Exercise Logs */}
      <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            Historial de Ejercicios
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <ExerciseHistoryTab studentId={studentId} />
        </CardContent>
      </Card>
    </div>
  );
}
