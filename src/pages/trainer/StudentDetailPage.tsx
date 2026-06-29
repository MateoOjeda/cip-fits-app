import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchStudentProfile, type StudentProfile } from "@/services/alumnos";
import { updatePlanAssignment } from "@/services/planes";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
} from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDiagnostic } from "@/hooks/useDiagnostic";
import { useStudentSurveys } from "@/hooks/useStudentSurveys";
import { useStudentRoutines } from "@/hooks/useStudentRoutines";
import { fetchRoutineExercises } from "@/services/routineManager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, CheckCircle, Apple, Loader2, Sparkles, Pencil, Archive, Users, ClipboardList, ChevronRight, AlertCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import PersonalDiagnosticTab from "@/components/trainer/PersonalDiagnosticTab";

import WeightProgressChart from "@/components/trainer/WeightProgressChart";
import ExerciseHistoryTab from "@/components/trainer/ExerciseHistoryTab";
import MealsTab from "@/components/trainer/MealsTab";
import { setRoutineCycleDates } from "@/services/rutinas";
import { toast } from "sonner";


interface Exercise {
  id: string; name: string; sets: number; reps: number; weight: number; day: string; completed: boolean;
}

const LEVEL_LABELS: Record<string, string> = {
  principiante: "Inicial", intermedio: "Intermedio", avanzado: "Avanzado",
};
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("weight");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; planType: string; level: string } | null>(null);
  const [editingPlans, setEditingPlans] = useState(false);

  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [routineExercises, setRoutineExercises] = useState<any[]>([]);
  const [selectedDayTab, setSelectedDayTab] = useState<string>(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [viewingSurvey, setViewingSurvey] = useState<{ type: 'custom' | 'diagnostic', id?: string, data?: any } | null>(null);

  // 1. Fetch Student Profile
  const studentProfileQuery = useQuery({
    queryKey: ["studentProfile", studentId],
    queryFn: () => fetchStudentProfile(studentId!),
    enabled: !!studentId,
  });
  const profile = studentProfileQuery.data || null;

  // 2. Fetch Trainer Student Link
  const trainerStudentLinkQuery = useQuery({
    queryKey: ["trainerStudentLink", user?.uid, studentId],
    queryFn: async () => {
      const qLink = query(collection(db, "trainer_students"), where("trainer_id", "==", user?.uid), where("student_id", "==", studentId));
      const snapLink = await getDocs(qLink);
      return snapLink.empty ? null : { id: snapLink.docs[0].id, ...snapLink.docs[0].data() as any };
    },
    enabled: !!user?.uid && !!studentId,
  });
  const linkId = trainerStudentLinkQuery.data?.id || "";
  const paymentPaid = trainerStudentLinkQuery.data?.payment_status === "pagado";

  // 3. Fetch Plan Levels
  const planLevelsQuery = useQuery({
    queryKey: ["planLevels", user?.uid, studentId],
    queryFn: async () => {
      const qLevels = query(collection(db, "plan_levels"), where("trainer_id", "==", user?.uid), where("student_id", "==", studentId));
      const snapLevels = await getDocs(qLevels);
      return snapLevels.docs.map(d => d.data() as any);
    },
    enabled: !!user?.uid && !!studentId,
  });
  const pls = planLevelsQuery.data || [];
  const activeE = pls.find((p: any) => p.plan_type === "entrenamiento" && p.unlocked);
  const activeA = pls.find((p: any) => p.plan_type === "nutricion" && p.unlocked);
  const selectedEntrenamiento = activeE ? activeE.level : "none";
  const selectedAlimentacion = activeA ? activeA.level : "none";

  // 4. Fetch Group Routine Membership
  const groupMembershipQuery = useQuery({
    queryKey: ["groupMembership", studentId],
    queryFn: async () => {
      const qGroupMembers = query(collection(db, "training_group_members"), where("student_id", "==", studentId));
      const snapGroupMembers = await getDocs(qGroupMembers);
      return snapGroupMembers.empty ? null : snapGroupMembers.docs[0].data();
    },
    enabled: !!studentId,
  });
  const groupId = groupMembershipQuery.data?.group_id;
  const hasGroupRoutine = !!groupId;

  // 5. Fetch Group Exercises
  const groupExercisesQuery = useQuery({
    queryKey: ["groupExercises", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const qGroupExercises = query(collection(db, "group_exercises"), where("group_id", "==", groupId));
      const snapGroupEx = await getDocs(qGroupExercises);
      return snapGroupEx.docs.map(d => ({ id: d.id, ...d.data() as any }));
    },
    enabled: !!groupId,
  });
  const groupExercises = groupExercisesQuery.data || [];

  // 6. Hook useStudentRoutines
  const {
    exercises,
    routineNextChange,
    routineAssignmentDate,
    archivedRoutines,
    isLoading: isLoadingRoutines,
  } = useStudentRoutines(user?.uid, studentId);

  // 7. Hook useStudentSurveys
  const {
    pendingSurveys,
    surveyResults,
    isLoadingPending: isLoadingSurveysPending,
    isLoadingResults: isLoadingSurveysResults,
  } = useStudentSurveys(studentId);

  // 8. Hook useDiagnostic
  const {
    diagnosticData,
    isLoading: isLoadingDiagnostic,
  } = useDiagnostic(studentId);

  const diagnosticStatus = useMemo(() => {
    if (diagnosticData) {
      return { 
        completed: true, 
        date: diagnosticData.updated_at || diagnosticData.created_at 
      };
    }
    return { completed: false, date: null };
  }, [diagnosticData]);

  const loading = studentProfileQuery.isLoading || trainerStudentLinkQuery.isLoading || planLevelsQuery.isLoading;

  const handleExpandRoutine = async (routineId: string) => {
    if (expandedRoutine === routineId) {
      setExpandedRoutine(null);
      setRoutineExercises([]);
      return;
    }
    setExpandedRoutine(routineId);
    try {
      const exs = await fetchRoutineExercises(routineId);
      setRoutineExercises(exs);
    } catch (err) {
      console.error("Error fetching routine exercises:", err);
    }
  };

  const togglePaymentMutation = useMutation({
    mutationFn: async (checked: boolean) => {
      if (!linkId) return;
      await updateDoc(doc(db, "trainer_students", linkId), { 
        payment_status: checked ? "pagado" : "pendiente",
        updated_at: new Date().toISOString()
      });
    },
    onSuccess: (_, checked) => {
      queryClient.invalidateQueries({ queryKey: ["trainerStudentLink", user?.uid, studentId] });
      toast.success(checked ? "Marcado como pagado" : "Marcado como pendiente");
    },
    onError: () => {
      toast.error("No se pudo actualizar el estado de pago.");
    }
  });

  const handlePaymentToggle = (checked: boolean) => {
    togglePaymentMutation.mutate(checked);
  };

  const updatePlanMutation = useMutation({
    mutationFn: async ({ planType, level }: { planType: string; level: string }) => {
      await updatePlanAssignment(user!.uid, studentId!, planType, level);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["planLevels", user?.uid, studentId] });
      queryClient.invalidateQueries({ queryKey: ["linkedStudents", user?.uid] });
      toast.success(variables.level === "none" ? "Plan desactivado" : `Plan actualizado a ${LEVEL_LABELS[variables.level] || variables.level}`);
    },
    onError: () => {
      toast.error("Error al actualizar el plan");
    }
  });

  const handlePlanChangeRequest = (planType: string, level: string) => {
    setConfirmDialog({ open: true, planType, level });
  };

  const handlePlanChangeConfirm = async () => {
    if (!confirmDialog) return;
    const { planType, level } = confirmDialog;
    setConfirmDialog(null);
    updatePlanMutation.mutate({ planType, level });
  };

  const updateCycleMutation = useMutation({
    mutationFn: async ({ start, end }: { start: string | null; end: string | null }) => {
      await setRoutineCycleDates(user!.uid, studentId!, start, end);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routineData", user?.uid, studentId] });
      toast.success("Ciclo de rutina actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar las fechas del ciclo");
    }
  });

  const handleUpdateCycleDates = (start: string | null, end: string | null) => {
    updateCycleMutation.mutate({ start, end });
  };


  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!profile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/trainer/students")} className="gap-2"><ArrowLeft className="h-4 w-4" /> Volver</Button>
        <p className="text-muted-foreground text-center">Alumno no encontrado</p>
      </div>
    );
  }

  const { exercisesByDay, groupExercisesByDay } = useMemo(() => {
    const exercisesByDay: Record<string, Exercise[]> = {};
    exercises.forEach((ex) => {
      if (!exercisesByDay[ex.day]) exercisesByDay[ex.day] = [];
      exercisesByDay[ex.day].push(ex);
    });

    const groupExercisesByDay: Record<string, any[]> = {};
    groupExercises.forEach((ex) => {
      if (!groupExercisesByDay[ex.day]) groupExercisesByDay[ex.day] = [];
      groupExercisesByDay[ex.day].push(ex);
    });

    return { exercisesByDay, groupExercisesByDay };
  }, [exercises, groupExercises]);

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => navigate("/trainer/students")}><ArrowLeft className="h-4.5 w-4.5" /></Button>
          <Avatar className="h-12 w-12 border border-border/50 shadow-sm">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
              {profile.avatar_initials || (profile.display_name || "??").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{profile.display_name}</h1>
            <Badge variant="outline" className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${paymentPaid ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
              {paymentPaid ? "✓ Pagado" : "✗ Pendiente"}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/40 px-3.5 py-2 rounded-xl border border-border/50">
          <Label htmlFor="payment-switch-header" className="text-xs font-semibold text-muted-foreground mr-1">
            Pago:
          </Label>
          <Switch 
            id="payment-switch-header" 
            checked={paymentPaid} 
            onCheckedChange={handlePaymentToggle}
            className="data-[state=checked]:bg-emerald-500" 
          />
        </div>
      </div>

      {/* Plan Assignment with edit lock */}
      <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Asignación de Planes</CardTitle>
            <Button variant="ghost" size="icon" className={`h-8 w-8 ${editingPlans ? "text-primary" : "text-muted-foreground"}`} onClick={() => setEditingPlans(!editingPlans)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              { type: "entrenamiento", icon: Dumbbell, label: "Entrenamiento", selected: selectedEntrenamiento },
              { type: "nutricion", icon: Apple, label: "Alimentación", selected: selectedAlimentacion },
            ]
            .filter(({ selected }) => editingPlans || selected !== "none")
            .map(({ type, icon: Icon, label, selected }) => (
              <div key={type} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-semibold">{label}</Label>
                  <p className="text-xs mt-0.5">
                    {selected !== "none"
                      ? <Badge variant="outline" className="text-[10px] bg-green-500/15 text-green-500 border-green-500/30">{LEVEL_LABELS[selected]} — Activo</Badge>
                      : <span className="text-[10px] text-destructive">Sin plan asignado</span>}
                  </p>
                </div>
                {editingPlans && (
                  <Select value={selected} onValueChange={(val) => handlePlanChangeRequest(type, val)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin plan</SelectItem>
                      <SelectItem value="principiante">Inicial</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>






      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {exercises.length > 0 ? Math.round((exercises.filter((e) => e.completed).length / exercises.length) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Completitud</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{exercises.filter((e) => e.completed).length}/{exercises.length}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Ejercicios</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{profile.weight ? `${profile.weight}` : "—"}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Peso actual (kg)</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {(() => {
          const tabs = [
            { value: "weight", icon: "📈", label: "Peso" },
            { value: "meals", icon: "🍽️", label: "Comidas" },
            { value: "routine", icon: "🏋️", label: "Rutina" },
            ...(hasGroupRoutine ? [{ value: "group_routine", icon: "👥", label: "Grupo" }] : []),
            { value: "surveys", icon: <ClipboardList className="h-4 w-4" />, label: "Seguimiento" },
          ];
          
          return (
            <TabsList 
              className={`grid w-full bg-muted/60 border border-border/50 p-1 h-auto min-h-[52px] rounded-xl`}
              style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
            >
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value} 
                  className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 transition-all shadow-none data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg min-w-0"
                >
                  <div className="text-base sm:text-lg h-5 flex items-center justify-center">{tab.icon}</div>
                  <span className={`text-[9px] sm:text-[10px] truncate w-full text-center ${activeTab === tab.value ? "font-bold text-primary" : "text-muted-foreground"}`}>
                    {tab.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          );
        })()}

        <TabsContent value="weight">
          {studentId && (
            <div className="space-y-4">
              <WeightProgressChart studentId={studentId} />
              <ExerciseHistoryTab studentId={studentId} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="meals">
          {studentId && <MealsTab studentId={studentId} nutritionLevel={selectedAlimentacion} readOnly={true} />}
        </TabsContent>

        <TabsContent value="routine">
          <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40 p-4">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Rutina Asignada
                </div>
                {loadingHistory && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((day, i) => {
                  const count = exercisesByDay[day]?.length || 0;
                  const isActive = selectedDayTab === day;
                  return (
                    <button 
                      key={day} 
                      onClick={() => setSelectedDayTab(day)}
                      className={`flex flex-col items-center justify-center h-12 rounded-lg text-xs font-bold border transition-all ${
                        isActive 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                          : count > 0 
                            ? "bg-primary/10 border-primary/30 text-primary" 
                            : "bg-secondary/30 border-border text-muted-foreground"
                      }`}
                    >
                      <span className="text-[11px]">{DAY_SHORT[i]}</span>
                      {count > 0 && <span className="text-[9px] mt-0.5">{count}</span>}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">{selectedDayTab}</p>
                {(!exercisesByDay[selectedDayTab] || exercisesByDay[selectedDayTab].length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-8 bg-secondary/10 rounded-lg border border-dashed border-border">
                    Sin ejercicios para el {selectedDayTab}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {exercisesByDay[selectedDayTab].map((ex) => (
                      <div key={ex.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <CheckCircle className={`h-4 w-4 flex-shrink-0 ${ex.completed ? "text-primary" : "text-muted-foreground/30"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ex.name}</p>
                          <p className="text-[10px] text-muted-foreground">{ex.sets}×{ex.reps} · {ex.weight}kg</p>
                        </div>
                        {ex.completed && <Badge className="bg-primary/20 text-primary text-[10px] py-0 px-1 border-0">Hecho</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="group_routine">
          {hasGroupRoutine && (
            <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Rutina de Grupo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((day, i) => {
                    const count = groupExercisesByDay[day]?.length || 0;
                    const isActive = selectedDayTab === day;
                    return (
                      <button 
                        key={day} 
                        onClick={() => setSelectedDayTab(day)}
                        className={`flex flex-col items-center justify-center h-12 rounded-lg text-xs font-bold border transition-all ${
                          isActive 
                            ? "bg-accent text-accent-foreground border-accent shadow-sm" 
                            : count > 0 
                              ? "bg-accent/10 border-accent/30 text-accent" 
                              : "bg-secondary/30 border-border text-muted-foreground"
                        }`}
                      >
                        <span className="text-[11px]">{DAY_SHORT[i]}</span>
                        {count > 0 && <span className="text-[9px] mt-0.5">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <p className="text-xs font-semibold text-accent mb-3 uppercase tracking-wider">{selectedDayTab}</p>
                  {(!groupExercisesByDay[selectedDayTab] || groupExercisesByDay[selectedDayTab].length === 0) ? (
                    <p className="text-sm text-muted-foreground text-center py-8 bg-secondary/10 rounded-lg border border-dashed border-border">
                      Sin ejercicios grupales para el {selectedDayTab}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {groupExercisesByDay[selectedDayTab].map((ex) => (
                        <div key={ex.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                          <div className="h-4 w-4 flex-shrink-0 bg-accent/20 rounded-full flex items-center justify-center">
                            <Dumbbell className="h-2.5 w-2.5 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ex.name}</p>
                            <p className="text-[10px] text-muted-foreground">{ex.sets}×{ex.reps} {ex.weight ? `· ${ex.weight}kg` : ""}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0 border-accent/40 text-accent">
                            Grupal
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>


        <TabsContent value="surveys">
          {loadingHistory ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : viewingSurvey ? (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2" onClick={() => setViewingSurvey(null)}>
                <ArrowLeft className="h-4 w-4" /> Volver a la lista
              </Button>
              
              {viewingSurvey.type === 'diagnostic' ? (
                <PersonalDiagnosticTab studentId={studentId} />
              ) : (
                <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{viewingSurvey.data.survey?.title || "Encuesta"}</CardTitle>
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                        {viewingSurvey.data.completed_at ? new Date(viewingSurvey.data.completed_at).toLocaleDateString() : "En progreso"}
                      </Badge>
                    </div>
                    {viewingSurvey.data.survey?.description && (
                      <p className="text-xs text-muted-foreground">{viewingSurvey.data.survey.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {viewingSurvey.data.survey?.questions?.length > 0 ? (
                      viewingSurvey.data.survey.questions.map((q: any, i: number) => {
                        const answer = viewingSurvey.data.answers?.find((a: any) => a.question_id === q.id);
                        return (
                          <div key={q.id} className="p-3 rounded-lg bg-secondary/20 border border-border/50 space-y-1.5">
                            <p className="text-sm font-medium">
                              <span className="text-primary font-bold mr-1.5">{i + 1}.</span>
                              {q.question_text}
                            </p>
                            <p className="text-sm text-foreground/80 pl-4">
                              {answer?.answer_text || <span className="text-muted-foreground italic">Sin respuesta</span>}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground italic text-center py-4">No hay respuestas detalladas para esta encuesta o se encuentra pendiente.</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold mb-1 px-1">Seguimiento y Encuestas</h3>
              
              {/* Diagnóstico Inicial */}
              <button 
                type="button"
                className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/40 transition-colors text-left"
                onClick={() => setViewingSurvey({ type: 'diagnostic' })}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold">Diagnóstico de Cambio Personal</span>
                    <span className="text-[10px] text-muted-foreground">
                      {diagnosticStatus.completed && diagnosticStatus.date ? `Completada el ${new Date(diagnosticStatus.date).toLocaleDateString()}` : "Evaluación inicial de hábitos"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={diagnosticStatus.completed ? "outline" : "secondary"} className={diagnosticStatus.completed ? "bg-green-500/10 text-green-500 border-green-500/20 text-[10px]" : "bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px]"}>
                    {diagnosticStatus.completed ? "Completada" : "Pendiente"}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>

              {/* Encuestas Personalizadas */}
              {[...pendingSurveys, ...surveyResults].length === 0 ? (
                <div className="py-8 text-center border rounded-xl border-dashed">
                  <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground italic">No hay encuestas personalizadas asignadas.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Pending Surveys */}
                  {pendingSurveys.map((item: any) => (
                    <button 
                      key={item.id}
                      type="button"
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/40 transition-colors text-left"
                      onClick={() => setViewingSurvey({ type: 'custom', id: item.id, data: item })}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <ClipboardList className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-semibold">{item.survey?.title || "Encuesta Personalizada"}</span>
                          <span className="text-[10px] text-muted-foreground">Asignada recientemente</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px]">
                          Pendiente
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}

                  {/* Completed Surveys */}
                  {surveyResults.map((item: any) => (
                    <button 
                      key={item.id}
                      type="button"
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/40 transition-colors text-left"
                      onClick={() => setViewingSurvey({ type: 'custom', id: item.id, data: item })}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <ClipboardList className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-semibold">{item.survey?.title || "Encuesta Personalizada"}</span>
                          <span className="text-[10px] text-muted-foreground">
                            Completada el {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : "Recientemente"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">
                          Completada
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar plan?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.level === "none"
                ? "Se desactivará el plan actual para este alumno."
                : `Se cambiará el nivel a "${LEVEL_LABELS[confirmDialog?.level || ""] || confirmDialog?.level}". Los cambios se aplican inmediatamente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePlanChangeConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
