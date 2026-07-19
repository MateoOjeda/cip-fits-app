import { useState } from "react";
import { useLinkedStudents } from "@/hooks/useLinkedStudents";
import { useStudentTracking } from "@/hooks/useStudentTracking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, Loader2, ArrowLeft, Dumbbell, TrendingUp,
  ClipboardList, AlertTriangle, Target, StickyNote,
  CalendarDays, Bell, Activity
} from "lucide-react";
import { StudentCard } from "@/components/trainer/StudentCard";
import { cn } from "@/lib/utils";

// Lazy imports (but rendered in TabsContent so they only mount when visible)
import TrackingTrainingTab from "@/components/trainer/tracking/TrackingTrainingTab";
import TrackingProgressTab from "@/components/trainer/tracking/TrackingProgressTab";
import TrackingAssessmentTab from "@/components/trainer/tracking/TrackingAssessmentTab";
import TrackingInjuriesTab from "@/components/trainer/tracking/TrackingInjuriesTab";
import TrackingGoalsTab from "@/components/trainer/tracking/TrackingGoalsTab";
import TrackingNotesTab from "@/components/trainer/tracking/TrackingNotesTab";
import TrackingCalendarTab from "@/components/trainer/tracking/TrackingCalendarTab";
import TrackingAlertsTab from "@/components/trainer/tracking/TrackingAlertsTab";
import type { Assessment, Injury, Goal, TrackingNote } from "@/services/tracking";

const TABS = [
  { value: "training",   label: "Entrenamiento", icon: Dumbbell },
  { value: "progress",   label: "Progreso",      icon: TrendingUp },
  { value: "assessment", label: "Evaluación",    icon: ClipboardList },
  { value: "injuries",   label: "Lesiones",      icon: AlertTriangle },
  { value: "goals",      label: "Objetivos",     icon: Target },
  { value: "notes",      label: "Notas",         icon: StickyNote },
  { value: "calendar",   label: "Calendario",    icon: CalendarDays },
  { value: "alerts",     label: "Alertas",       icon: Bell },
] as const;

type TabValue = typeof TABS[number]["value"];

export default function TrackingPage() {
  const { students, loading: loadingStudents } = useLinkedStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("training");

  const student = students.find((s) => s.user_id === selectedStudentId) ?? null;

  const {
    assessments, injuries, goals, notes, exerciseLogs, loading,
    setAssessments, setInjuries, setGoals, setNotes,
  } = useStudentTracking(selectedStudentId);

  // Counts for alert badge
  const activeInjuries = injuries.filter((i) => i.status === "activa").length;

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setActiveTab("training");
  };

  const handleBack = () => {
    setSelectedStudentId(null);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loadingStudents) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // ── Empty state (no students linked) ──────────────────────────────────────
  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card className="card-glass">
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Vincula alumnos primero para ver su seguimiento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Student list view ──────────────────────────────────────────────────────
  if (!selectedStudentId) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => (
            <StudentCard
              key={s.user_id}
              name={s.display_name}
              avatarUrl={s.avatar_url}
              avatarInitials={s.avatar_initials}
              size="lg"
              onClick={() => handleSelectStudent(s.user_id)}
              subtitle={
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                  Ver seguimiento detallado
                </span>
              }
              className="border-border/40 hover:border-primary/30"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Student detail view ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 border border-primary/20 shrink-0">
            <AvatarImage src={student?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {student?.avatar_initials ?? (student?.display_name ?? "??").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate">{student?.display_name}</h1>
            <p className="text-[10px] text-muted-foreground">Seguimiento individual</p>
          </div>
        </div>
      </div>

      {/* Tab layout */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="flex flex-wrap w-full bg-muted/40 border border-border/50 p-1 h-auto rounded-xl">
          {TABS.map(({ value, label, icon: Icon }) => {
            const isBadged = value === "injuries" && activeInjuries > 0;
            return (
              <TabsTrigger
                key={value}
                value={value}
                className="flex-1 min-w-[70px] text-[10px] py-1.5 px-2 transition-all data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg font-semibold relative"
              >
                <span className="flex items-center gap-1 justify-center">
                  <Icon className="h-3 w-3" />
                  {label}
                  {isBadged && (
                    <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[8px] font-bold text-white flex items-center justify-center">
                      {activeInjuries}
                    </span>
                  )}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Entrenamiento */}
        <TabsContent value="training" className="space-y-4 outline-none mt-4">
          <TrackingTrainingTab studentId={selectedStudentId} />
        </TabsContent>

        {/* Progreso */}
        <TabsContent value="progress" className="space-y-4 outline-none mt-4">
          <TrackingProgressTab studentId={selectedStudentId} />
        </TabsContent>

        {/* Evaluación */}
        <TabsContent value="assessment" className="space-y-4 outline-none mt-4">
          <TrackingAssessmentTab
            studentId={selectedStudentId}
            assessments={assessments}
            loading={loading}
            onAdd={(a: Assessment) => setAssessments((prev) => [a, ...prev])}
            onDelete={(id: string) => setAssessments((prev) => prev.filter((x) => x.id !== id))}
          />
        </TabsContent>

        {/* Lesiones */}
        <TabsContent value="injuries" className="space-y-4 outline-none mt-4">
          <TrackingInjuriesTab
            studentId={selectedStudentId}
            injuries={injuries}
            loading={loading}
            onAdd={(i: Injury) => setInjuries((prev) => [i, ...prev])}
            onUpdate={(id: string, data: Partial<Injury>) =>
              setInjuries((prev) => prev.map((x) => x.id === id ? { ...x, ...data } : x))
            }
            onDelete={(id: string) => setInjuries((prev) => prev.filter((x) => x.id !== id))}
          />
        </TabsContent>

        {/* Objetivos */}
        <TabsContent value="goals" className="space-y-4 outline-none mt-4">
          <TrackingGoalsTab
            studentId={selectedStudentId}
            goals={goals}
            loading={loading}
            onAdd={(g: Goal) => setGoals((prev) => [g, ...prev])}
            onUpdate={(id: string, data: Partial<Goal>) =>
              setGoals((prev) => prev.map((x) => x.id === id ? { ...x, ...data } : x))
            }
            onDelete={(id: string) => setGoals((prev) => prev.filter((x) => x.id !== id))}
          />
        </TabsContent>

        {/* Notas */}
        <TabsContent value="notes" className="space-y-4 outline-none mt-4">
          <TrackingNotesTab
            studentId={selectedStudentId}
            notes={notes}
            loading={loading}
            onAdd={(n: TrackingNote) => setNotes((prev) => [n, ...prev])}
            onDelete={(id: string) => setNotes((prev) => prev.filter((x) => x.id !== id))}
          />
        </TabsContent>

        {/* Calendario */}
        <TabsContent value="calendar" className="space-y-4 outline-none mt-4">
          <TrackingCalendarTab
            assessments={assessments}
            exerciseLogs={exerciseLogs}
            loading={loading}
          />
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alerts" className="space-y-4 outline-none mt-4">
          <TrackingAlertsTab
            assessments={assessments}
            injuries={injuries}
            goals={goals}
            exerciseLogs={exerciseLogs}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold tracking-tight neon-text uppercase">
        Seguimiento
      </h1>
      <p className="text-muted-foreground text-sm mt-1">
        Selecciona un alumno para ver su seguimiento detallado
      </p>
    </div>
  );
}
