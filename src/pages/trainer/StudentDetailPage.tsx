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
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from "@/components/ui/premium-card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TimelineCard } from "@/components/ui/timeline-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, CheckCircle, Apple, Loader2, Sparkles, Pencil, Archive, Users, ClipboardList, ChevronRight, AlertCircle, Clock, Mail, Phone, Target, TrendingUp, Heart, Info, Calendar } from "lucide-react";
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
import { addDays, differenceInDays } from "date-fns";


interface Exercise {
  id: string; name: string; sets: number; reps: number; weight: number; day: string; completed: boolean;
}

const LEVEL_LABELS: Record<string, string> = {
  principiante: "Inicial", intermedio: "Intermedio", avanzado: "Avanzado",
};
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

// --- SUBCOMPONENTE: StudentHeader ---
interface StudentHeaderProps {
  profile: any;
  paymentPaid: boolean;
  onPaymentToggle: (checked: boolean) => void;
  selectedEntrenamiento: string;
  selectedAlimentacion: string;
  editingPlans: boolean;
  setEditingPlans: (v: boolean) => void;
  navigate: any;
}

const LEVEL_LABELS_HEADER: Record<string, string> = {
  principiante: "Inicial", intermedio: "Intermedio", avanzado: "Avanzado",
};

export function StudentHeader({
  profile,
  paymentPaid,
  onPaymentToggle,
  selectedEntrenamiento,
  selectedAlimentacion,
  editingPlans,
  setEditingPlans,
  navigate
}: StudentHeaderProps) {
  const joinDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }) : "Reciente";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-6 shadow-sm">
      <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-3xl -z-10" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg shrink-0" onClick={() => navigate("/trainer/students")}>
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          
          <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md shrink-0">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
              {profile.avatar_initials || (profile.display_name || "??").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">{profile.display_name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn(
                "text-[9px] font-bold px-2 py-0.5 rounded-md border-none",
                paymentPaid ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
              )}>
                {paymentPaid ? "✓ Pago al día" : "✗ Pago Pendiente"}
              </Badge>
              
              {selectedEntrenamiento !== "none" && (
                <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border-none">
                  Entrenamiento: {LEVEL_LABELS_HEADER[selectedEntrenamiento] || selectedEntrenamiento}
                </Badge>
              )}

              {selectedAlimentacion !== "none" && (
                <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-none">
                  Nutrición: {LEVEL_LABELS_HEADER[selectedAlimentacion] || selectedAlimentacion}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3 inline text-primary" />
              Alumno desde el {joinDate}
            </p>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/40 px-3.5 py-1.5 rounded-xl border border-border/50 shadow-sm">
            <Label htmlFor="payment-switch-header" className="text-xs font-bold text-muted-foreground mr-1">
              Pago Registrado:
            </Label>
            <Switch 
              id="payment-switch-header" 
              checked={paymentPaid} 
              onCheckedChange={onPaymentToggle}
              className="data-[state=checked]:bg-emerald-500" 
            />
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-9 rounded-xl font-semibold text-xs border-border/60 hover:bg-muted/10 gap-1.5",
              editingPlans && "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15"
            )}
            onClick={() => setEditingPlans(!editingPlans)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Planificar
          </Button>
        </div>
      </div>
    </div>
  );
}


// --- SUBCOMPONENTE: StudentSidebar ---
interface StudentSidebarProps {
  profile: any;
  groupName?: string | null;
  selectedEntrenamiento: string;
  selectedAlimentacion: string;
}

export function StudentSidebar({
  profile,
  groupName,
  selectedEntrenamiento,
  selectedAlimentacion
}: StudentSidebarProps) {
  return (
    <Card className="border border-border/40 bg-card/40 rounded-2xl shadow-sm overflow-hidden h-fit">
      <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ficha de Datos Fijos</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Contact info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Email</p>
              <p className="text-xs font-semibold text-foreground truncate">{profile.email || "Sin registrar"}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Teléfono</p>
              <p className="text-xs font-semibold text-foreground truncate">{profile.phone || "Sin registrar"}</p>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-border/40 w-full" />

        {/* Physical Profile */}
        <div className="space-y-3">
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Métricas Físicas</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/30 border border-border/40 p-2 rounded-lg text-center">
                <span className="text-[9px] text-muted-foreground block">Peso inicial</span>
                <span className="text-xs font-bold text-foreground">{profile.weight ? `${profile.weight} kg` : "—"}</span>
              </div>
              <div className="bg-muted/30 border border-border/40 p-2 rounded-lg text-center">
                <span className="text-[9px] text-muted-foreground block">Edad</span>
                <span className="text-xs font-bold text-foreground">{profile.age ? `${profile.age} años` : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-border/40 w-full" />

        {/* Trainer & Group */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Grupo asignado</p>
              <p className="text-xs font-semibold text-foreground">{groupName || "Ninguno (Individual)"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Target className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Objetivos</p>
              <p className="text-xs font-semibold text-foreground">{profile.objective || "Acondicionamiento Físico"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


// --- SUBCOMPONENTE: StudentSummary ---
interface StudentSummaryProps {
  exercises: any[];
  profile: any;
  daysRemaining: number;
  hasPlan: boolean;
  pendingSurveysCount: number;
}

export function StudentSummary({
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

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("trainer_active_detail_tab") || "summary");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; planType: string; level: string } | null>(null);
  const [editingPlans, setEditingPlans] = useState(false);

  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [routineExercises, setRoutineExercises] = useState<any[]>([]);
  const [selectedDayTab, setSelectedDayTab] = useState<string>(() => localStorage.getItem("trainer_selected_routine_day") || DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);

  useEffect(() => {
    localStorage.setItem("trainer_active_detail_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("trainer_selected_routine_day", selectedDayTab);
  }, [selectedDayTab]);
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


  const { exercisesByDay, groupExercisesByDay } = useMemo(() => {
    const exercisesByDay: Record<string, Exercise[]> = {};
    const list = exercises || [];
    list.forEach((ex) => {
      if (!exercisesByDay[ex.day]) exercisesByDay[ex.day] = [];
      exercisesByDay[ex.day].push(ex);
    });

    const groupExercisesByDay: Record<string, any[]> = {};
    const groupList = groupExercises || [];
    groupList.forEach((ex) => {
      if (!groupExercisesByDay[ex.day]) groupExercisesByDay[ex.day] = [];
      groupExercisesByDay[ex.day].push(ex);
    });

    return { exercisesByDay, groupExercisesByDay };
  }, [exercises, groupExercises]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!profile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/trainer/students")} className="gap-2"><ArrowLeft className="h-4 w-4" /> Volver</Button>
        <p className="text-muted-foreground text-center">Alumno no encontrado</p>
      </div>
    );
  }

  const nextPaymentDate = routineNextChange 
    ? new Date(routineNextChange)
    : addDays(new Date(profile?.created_at || new Date()), 30);
  const daysRemaining = Math.max(0, differenceInDays(nextPaymentDate, new Date()));
  const hasPlan = selectedEntrenamiento !== "none" || selectedAlimentacion !== "none";

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* StudentHeader */}
      <StudentHeader 
        profile={profile}
        paymentPaid={paymentPaid}
        onPaymentToggle={handlePaymentToggle}
        selectedEntrenamiento={selectedEntrenamiento}
        selectedAlimentacion={selectedAlimentacion}
        editingPlans={editingPlans}
        setEditingPlans={setEditingPlans}
        navigate={navigate}
      />

      {/* Plan Assignment with edit lock */}
      {editingPlans && (
        <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm animate-in fade-in duration-200">
          <CardHeader className="pb-3 p-4 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Configurar Niveles de Plan</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {[
              { type: "entrenamiento", icon: Dumbbell, label: "Entrenamiento", selected: selectedEntrenamiento },
              { type: "nutricion", icon: Apple, label: "Alimentación", selected: selectedAlimentacion },
            ].map(({ type, icon: Icon, label, selected }) => (
              <div key={type} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/20 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold block">{label}</Label>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {selected !== "none" ? `Activo: ${LEVEL_LABELS[selected]}` : "Sin asignar"}
                    </span>
                  </div>
                </div>
                <Select value={selected} onValueChange={(val) => handlePlanChangeRequest(type, val)}>
                  <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin plan</SelectItem>
                    <SelectItem value="principiante">Inicial</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="avanzado">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* CRM Main Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        
        {/* Left Column: Fixed Sidebar metadata */}
        <StudentSidebar 
          profile={profile}
          groupName={groupMembershipQuery.data?.group_id ? "Rutina Grupal" : null}
          selectedEntrenamiento={selectedEntrenamiento}
          selectedAlimentacion={selectedAlimentacion}
        />

        {/* Right Column: Dynamic Tabs and Information panels */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            {(() => {
              const tabs = [
                { value: "summary", label: "Resumen" },
                { value: "routine", label: "Rutinas" },
                { value: "meals", label: "Comidas" },
                { value: "surveys", label: "Encuestas" },
                { value: "progress", label: "Progreso" },
                { value: "measurements", label: "Mediciones" },
                { value: "transformations", label: "Transformación" },
                { value: "diagnostic", label: "Diagnóstico" },
                { value: "history", label: "Historial" }
              ];
              
              return (
                <TabsList className="flex flex-wrap w-full bg-muted/40 border border-border/50 p-1 h-auto rounded-xl">
                  {tabs.map((tab) => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className="flex-1 min-w-[70px] text-[10px] py-1.5 px-2 transition-all data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg font-semibold"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              );
            })()}

            {/* TAB: Resumen */}
            <TabsContent value="summary" className="space-y-4 outline-none">
              <StudentSummary 
                exercises={exercises}
                profile={profile}
                daysRemaining={daysRemaining}
                hasPlan={hasPlan}
                pendingSurveysCount={pendingSurveys.length}
              />
            </TabsContent>

            {/* TAB: Rutinas */}
            <TabsContent value="routine" className="outline-none">
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
                        {exercisesByDay[selectedDayTab].map((ex) => (
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
            </TabsContent>

            {/* TAB: Comidas */}
            <TabsContent value="meals" className="outline-none">
              {studentId && <MealsTab studentId={studentId} nutritionLevel={selectedAlimentacion} readOnly={true} />}
            </TabsContent>

            {/* TAB: Encuestas */}
            <TabsContent value="surveys" className="outline-none">
              {isLoadingSurveysPending || isLoadingSurveysResults ? (
                <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : viewingSurvey && viewingSurvey.type !== 'diagnostic' ? (
                <div className="space-y-4">
                  <Button variant="ghost" size="sm" className="gap-2 text-xs font-bold text-muted-foreground" onClick={() => setViewingSurvey(null)}>
                    <ArrowLeft className="h-4 w-4" /> Volver a la lista
                  </Button>
                  
                  <Card className="border border-border/40 bg-card/60 rounded-xl shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{viewingSurvey.data.survey?.title || "Encuesta"}</CardTitle>
                        <Badge variant="outline" className="text-[8px] font-bold uppercase bg-primary/10 border-primary/20 text-primary">
                          {viewingSurvey.data.completed_at ? new Date(viewingSurvey.data.completed_at).toLocaleDateString() : "En progreso"}
                        </Badge>
                      </div>
                      {viewingSurvey.data.survey?.description && (
                        <p className="text-xs text-muted-foreground mt-1">{viewingSurvey.data.survey.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {viewingSurvey.data.survey?.questions?.length > 0 ? (
                        viewingSurvey.data.survey.questions.map((q: any, i: number) => {
                          const answer = viewingSurvey.data.answers?.find((a: any) => a.question_id === q.id);
                          return (
                            <div key={q.id} className="p-3 rounded-lg bg-secondary/10 border border-border/40 space-y-1.5">
                              <p className="text-xs font-bold text-foreground">
                                <span className="text-primary font-bold mr-1.5">{i + 1}.</span>
                                {q.question_text}
                              </p>
                              <p className="text-xs text-muted-foreground pl-4">
                                {answer?.answer_text || <span className="text-muted-foreground/60 italic">Sin respuesta del alumno</span>}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-muted-foreground italic text-center py-4">No hay respuestas cargadas para esta encuesta.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Encuestas Personalizadas</span>
                    <div className="h-[1px] w-full bg-border/50" />
                  </div>
                  
                  {[...pendingSurveys, ...surveyResults].length === 0 ? (
                    <EmptyState
                      type="empty"
                      title="Sin encuestas asignadas"
                      description="No hay encuestas personalizadas configuradas o asignadas para este alumno."
                      className="py-10"
                    />
                  ) : (
                    <div className="space-y-2">
                      {/* Pending Custom Surveys */}
                      {pendingSurveys.map((item: any) => (
                        <button 
                          key={item.id}
                          type="button"
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card/50 border border-border/40 hover:border-primary/20 hover:scale-[1.005] transition-all duration-200 text-left shadow-sm"
                          onClick={() => setViewingSurvey({ type: 'custom', id: item.id, data: item })}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                              <ClipboardList className="h-4.5 w-4.5 text-amber-500" />
                            </div>
                            <div>
                              <span className="text-xs font-bold block text-foreground leading-tight">{item.survey?.title || "Encuesta Personalizada"}</span>
                              <span className="text-[9.5px] text-muted-foreground mt-0.5 block">Asignada, esperando respuesta del alumno</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status="pendiente" className="scale-90" />
                            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                          </div>
                        </button>
                      ))}

                      {/* Completed Custom Surveys */}
                      {surveyResults.map((item: any) => (
                        <button 
                          key={item.id}
                          type="button"
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card/50 border border-border/40 hover:border-primary/20 hover:scale-[1.005] transition-all duration-200 text-left shadow-sm"
                          onClick={() => setViewingSurvey({ type: 'custom', id: item.id, data: item })}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                              <ClipboardList className="h-4.5 w-4.5 text-green-500" />
                            </div>
                            <div>
                              <span className="text-xs font-bold block text-foreground leading-tight">{item.survey?.title || "Encuesta Personalizada"}</span>
                              <span className="text-[9.5px] text-muted-foreground mt-0.5 block">
                                Completada el {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : "Recientemente"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status="completado" className="scale-90" />
                            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB: Progreso */}
            <TabsContent value="progress" className="space-y-4 outline-none">
              {studentId && (
                <div className="space-y-4">
                  <WeightProgressChart studentId={studentId} />
                  <ExerciseHistoryTab studentId={studentId} />
                </div>
              )}
            </TabsContent>

            {/* TAB: Mediciones */}
            <TabsContent value="measurements" className="outline-none">
              <Card className="border border-border/40 bg-card/60 rounded-xl p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-primary mb-3 opacity-70" />
                <h3 className="text-sm font-bold text-foreground">Registro de Mediciones Corporales</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  El alumno puede registrar sus mediciones periódicamente para graficar pliegues, perímetros musculares y porcentaje de grasa.
                </p>
                <div className="mt-4 flex justify-center gap-4">
                  <div className="text-center p-3 bg-secondary/20 border rounded-xl min-w-[100px]">
                    <span className="text-[9px] text-muted-foreground block">Peso Promedio</span>
                    <span className="text-xs font-bold text-foreground">{profile.weight ? `${profile.weight} kg` : "—"}</span>
                  </div>
                  <div className="text-center p-3 bg-secondary/20 border rounded-xl min-w-[100px]">
                    <span className="text-[9px] text-muted-foreground block">Altura</span>
                    <span className="text-xs font-bold text-foreground">{profile.height ? `${profile.height} cm` : "—"}</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* TAB: Transformación */}
            <TabsContent value="transformations" className="outline-none">
              <Card className="border border-border/40 bg-card/60 rounded-xl p-6 text-center">
                <Heart className="h-8 w-8 mx-auto text-pink-500 mb-3 opacity-70 animate-pulse" />
                <h3 className="text-sm font-bold text-foreground">Evolución Física y Galería</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Visualiza el cambio del alumno a través del tiempo mediante el registro de fotografías de frente, perfil y espalda.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 max-w-md mx-auto">
                  {["Frente", "Perfil", "Espalda"].map((type) => (
                    <div key={type} className="aspect-[3/4] rounded-lg border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center p-2 text-center">
                      <span className="text-[9px] font-bold text-muted-foreground">{type}</span>
                      <span className="text-[8px] text-muted-foreground/60 mt-1 block">Sin imagen</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* TAB: Diagnóstico */}
            <TabsContent value="diagnostic" className="outline-none">
              {studentId && <PersonalDiagnosticTab studentId={studentId} />}
            </TabsContent>

            {/* TAB: Historial */}
            <TabsContent value="history" className="space-y-4 outline-none">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambio de plan?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.level === "none"
                ? "Se desactivará el plan actual para este alumno de forma inmediata."
                : `Se actualizará el nivel a "${LEVEL_LABELS[confirmDialog?.level || ""] || confirmDialog?.level}". Los cambios se aplican de inmediato en la cuenta del alumno.`}
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
