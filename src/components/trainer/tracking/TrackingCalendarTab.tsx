import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Assessment } from "@/services/tracking";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, getDay, parseISO, isSameDay, addMonths, subMonths
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ExerciseLogDay {
  log_date: string;
  completed: boolean;
}

interface Props {
  assessments: Assessment[];
  exerciseLogs: ExerciseLogDay[];
  loading: boolean;
}

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

/**
 * Maps ISO date string YYYY-MM-DD to sets of events.
 * Events: "train_ok" | "train_miss" | "assessment"
 */
function buildDayMap(
  assessments: Assessment[],
  exerciseLogs: ExerciseLogDay[]
): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};

  const add = (date: string, event: string) => {
    if (!map[date]) map[date] = new Set();
    map[date].add(event);
  };

  // Exercise logs grouped by date — if ANY completed → train_ok, else train_miss
  const logsByDate: Record<string, boolean[]> = {};
  exerciseLogs.forEach((l) => {
    if (!logsByDate[l.log_date]) logsByDate[l.log_date] = [];
    logsByDate[l.log_date].push(l.completed);
  });
  Object.entries(logsByDate).forEach(([date, completions]) => {
    add(date, completions.some(Boolean) ? "train_ok" : "train_miss");
  });

  // Assessments
  assessments.forEach((a) => {
    add(a.recorded_at.split("T")[0], "assessment");
  });

  return map;
}

const EVENT_DOTS: Record<string, { color: string; title: string }> = {
  train_ok: { color: "bg-primary", title: "Entrenamiento completado" },
  train_miss: { color: "bg-destructive/60", title: "Entrenamiento incompleto" },
  assessment: { color: "bg-amber-500", title: "Evaluación registrada" },
};

export default function TrackingCalendarTab({ assessments, exerciseLogs, loading }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const dayMap = useMemo(
    () => buildDayMap(assessments, exerciseLogs),
    [assessments, exerciseLogs]
  );

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Pad to start on Monday (index 0 = Monday)
  const firstDow = (getDay(days[0]) + 6) % 7; // convert Sun=0 to Mon=0
  const blanks = Array(firstDow).fill(null);

  if (loading) {
    return (
      <Card className="border border-border/40 bg-card/60 rounded-xl">
        <CardContent className="py-12 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const totalDays = assessments.length + Object.keys(dayMap).length;
  if (totalDays === 0) {
    return <EmptyState type="empty" title="Sin datos de actividad" description="Registra actividad para ver el calendario." />;
  }

  return (
    <div className="space-y-4">
      <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((d) => subMonths(d, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-sm capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </CardTitle>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((d) => addMonths(d, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[9px] font-bold text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px">
            {blanks.map((_, i) => <div key={`blank-${i}`} />)}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const events = dayMap[key] ?? new Set<string>();
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={key}
                  className={cn(
                    "relative flex flex-col items-center py-1.5 rounded-lg transition-colors",
                    isToday && "bg-primary/10 ring-1 ring-primary/30",
                    !isSameMonth(day, currentMonth) && "opacity-30"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-bold",
                    isToday ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, "d")}
                  </span>
                  {events.size > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[24px]">
                      {Array.from(events).map((evt) => (
                        <span
                          key={evt}
                          title={EVENT_DOTS[evt]?.title}
                          className={cn("h-1.5 w-1.5 rounded-full", EVENT_DOTS[evt]?.color)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(EVENT_DOTS).map(([key, { color, title }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
            <span className="text-[10px] text-muted-foreground font-semibold">{title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
