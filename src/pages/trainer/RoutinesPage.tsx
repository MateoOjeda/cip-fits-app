import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLinkedStudents } from "@/hooks/useLinkedStudents";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  setDoc,
  writeBatch
} from "firebase/firestore";
import {
  fetchRoutineData,
  saveDayConfig as saveDayConfigService,
  addExercise as addExerciseService,
  removeExercise as removeExerciseService,
  bulkRemoveExercises,
  logTrainerChange,
  addBiSerieChild,
  removeBiSerieChild,
  EXERCISE_TYPES,
  type Exercise,
  type DayConfig,
  type ExerciseType,
  autoUpdateRoutineCycle,
} from "@/services/rutinas";
import { getOrCreateActiveRoutine, linkExercisesToRoutine } from "@/services/routineManager";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from "@/components/ui/premium-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MealsTab from "@/components/trainer/MealsTab";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Dumbbell, Loader2, CalendarClock, Clock, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { StudentCard } from "@/components/trainer/StudentCard";
import { BODY_PARTS, EXERCISES_BY_BODY_PART, type BodyPart } from "@/lib/exercisesByBodyPart";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

export default function RoutinesPage() {
  const { user } = useAuth();
  const { studentId: urlStudentId, groupId: urlGroupId } = useParams<{ studentId?: string; groupId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get("tab") || "entrenamiento";

  const isGroupMode = !!urlGroupId;
  const { students, loading: loadingStudents } = useLinkedStudents();
  const [groupName, setGroupName] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [selectedDay, setSelectedDay] = useState("Lunes");
  const [dayConfigs, setDayConfigs] = useState<Record<string, DayConfig>>({});
  const [routineNextChange, setRoutineNextChange] = useState<string | null>(null);
  const [routineAssignmentDate, setRoutineAssignmentDate] = useState<string | null>(null);
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", sets: "", reps: "",
    isToFailure: false, isDropset: false, isPiramide: false, pyramidReps: "",
    exerciseType: "NORMAL" as ExerciseType,
  });
  const [biSerieEnabled, setBiSerieEnabled] = useState(false);
  const [biForm, setBiForm] = useState({
    name: "", reps: "",
    isToFailure: false, isDropset: false,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nutritionLevel, setNutritionLevel] = useState<string>("none");

  // In group mode, fetch group name
  useEffect(() => {
    if (isGroupMode && urlGroupId && user) {
      getDoc(doc(db, "training_groups", urlGroupId))
        .then((snap) => { if (snap.exists()) setGroupName(snap.data().name); });
    }
  }, [isGroupMode, urlGroupId, user]);

  useEffect(() => {
    if (isGroupMode) return;
    if (students.length > 0 && !selectedStudent) {
      if (urlStudentId && students.some(s => s.user_id === urlStudentId)) {
        setSelectedStudent(urlStudentId);
      }
    }
  }, [students, selectedStudent, urlStudentId, isGroupMode]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    if (isGroupMode && urlGroupId) {
      // Group mode: fetch group_exercises
      setLoadingExercises(true);
      try {
        const qEx = query(collection(db, "group_exercises"), where("group_id", "==", urlGroupId));
        const qDay = query(collection(db, "routine_day_config"), where("student_id", "==", urlGroupId));

        const [exSnap, daySnap] = await Promise.all([
          getDocs(qEx),
          getDocs(qDay)
        ]);

        const groupExercises = exSnap.docs.map((d: any) => ({
          id: d.id,
          ...d.data(),
          student_id: urlGroupId,
          completed: false,
          parent_exercise_id: d.data().parent_exercise_id || null,
          exercise_type: d.data().exercise_type || "NORMAL",
        })) as Exercise[];
        setExercises(groupExercises);

        const dc: Record<string, DayConfig> = {};
        daySnap.docs.forEach((d) => {
          const data = d.data();
          dc[data.day] = { day: data.day, body_part_1: data.body_part_1 || "", body_part_2: data.body_part_2 || "" };
        });
        setDayConfigs(dc);
        setRoutineNextChange(null);
        setSelectedIds(new Set());
      } catch (err) {
        console.error("Error fetching group data:", err);
      } finally {
        setLoadingExercises(false);
      }
      return;
    }

    if (!selectedStudent) return;
    setLoadingExercises(true);
    try {
      const data = await fetchRoutineData(user.uid, selectedStudent);

      const qLink = query(collection(db, "trainer_students"), where("trainer_id", "==", user.uid), where("student_id", "==", selectedStudent));
      const linkSnap = await getDocs(qLink);

      if (!linkSnap.empty) {
        setNutritionLevel(linkSnap.docs[0].data().plan_alimentacion || "none");
      } else {
        setNutritionLevel("none");
      }

      setExercises(data.exercises);
      setDayConfigs(data.dayConfigs);
      setRoutineNextChange(data.routineNextChange);
      setRoutineAssignmentDate(data.routineAssignmentDate);
      setActiveRoutineId(data.routineId || null);
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Error fetching routine data:", err);
    } finally {
      setLoadingExercises(false);
    }
  }, [user, selectedStudent, isGroupMode, urlGroupId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentDayConfig = dayConfigs[selectedDay] || { day: selectedDay, body_part_1: "", body_part_2: "" };
  const bodyPart1 = currentDayConfig.body_part_1 as BodyPart;
  const bodyPart2 = currentDayConfig.body_part_2 as BodyPart;
  const availableExercises = [
    ...(bodyPart1 ? EXERCISES_BY_BODY_PART[bodyPart1] || [] : []),
    ...(bodyPart2 && bodyPart2 !== bodyPart1 ? EXERCISES_BY_BODY_PART[bodyPart2] || [] : []),
  ];
  const combinedBodyPart = [currentDayConfig.body_part_1, currentDayConfig.body_part_2].filter(Boolean).join(" y ");

  const handleSaveDayConfig = async (field: "body_part_1" | "body_part_2", value: string) => {
    if (!user) return;
    const targetId = isGroupMode ? urlGroupId! : selectedStudent;
    if (!targetId) return;
    const updated = { ...currentDayConfig, [field]: value === "none" ? "" : value };
    setDayConfigs((prev) => ({ ...prev, [selectedDay]: updated }));
    await saveDayConfigService(user.uid, targetId, selectedDay, updated.body_part_1, updated.body_part_2);
    if (!isGroupMode) {
      await autoUpdateRoutineCycle(user.uid, selectedStudent);
      fetchData();
    }
  };

  const validatePyramidReps = (value: string): boolean => {
    if (!value.trim()) return false;
    return /^\d+(-\d+)*$/.test(value.trim());
  };

  const handleAdd = async () => {
    if (!user) return;
    const targetId = isGroupMode ? urlGroupId! : selectedStudent;
    if (!targetId) return;
    if (!form.name || !form.sets || !currentDayConfig.body_part_1) {
      toast.error("Selecciona el grupo muscular del día y completa los campos");
      return;
    }
    if (form.isPiramide) {
      if (!validatePyramidReps(form.pyramidReps)) {
        toast.error("Formato de pirámide inválido. Usa números separados por guiones (ej: 12-10-8-10-12)");
        return;
      }
    } else if (!form.isToFailure && !form.reps) {
      toast.error("Completa las repeticiones o activa 'Al Fallo'");
      return;
    }
    if (biSerieEnabled) {
      if (!biForm.name) {
        toast.error("Selecciona el ejercicio para la Bi Serie");
        return;
      }
      if (!biForm.isToFailure && !biForm.reps) {
        toast.error("Completa las repeticiones de Bi Serie o activa 'Al Fallo'");
        return;
      }
    }

    const repsDisplay = form.isPiramide ? form.pyramidReps : (form.isToFailure ? "Al Fallo" : form.reps);

    try {
      if (isGroupMode) {
        // Group mode: insert into group_exercises
        const exerciseType = form.isToFailure ? "AL_FALLO" : form.isDropset ? "DROP_SET" : form.isPiramide ? "PIRAMIDE" : "NORMAL";
        const parentDocRef = await addDoc(collection(db, "group_exercises"), {
          group_id: urlGroupId!,
          trainer_id: user.uid,
          name: form.name,
          sets: parseInt(form.sets),
          reps: form.isToFailure || form.isPiramide ? 0 : parseInt(form.reps),
          weight: 0,
          day: selectedDay,
          body_part: combinedBodyPart || currentDayConfig.body_part_1,
          is_to_failure: form.isToFailure,
          is_dropset: form.isDropset,
          is_piramide: form.isPiramide,
          pyramid_reps: form.isPiramide ? form.pyramidReps.trim() : null,
          exercise_type: exerciseType,
          created_at: new Date().toISOString()
        });

        if (biSerieEnabled) {
          await addDoc(collection(db, "group_exercises"), {
            group_id: urlGroupId!,
            trainer_id: user.uid,
            name: biForm.name,
            sets: parseInt(form.sets),
            reps: biForm.isToFailure ? 0 : parseInt(biForm.reps),
            weight: 0,
            day: selectedDay,
            body_part: combinedBodyPart || currentDayConfig.body_part_1,
            is_to_failure: biForm.isToFailure,
            is_dropset: biForm.isDropset,
            is_piramide: false,
            pyramid_reps: null,
            exercise_type: "BI_SERIE",
            parent_exercise_id: parentDocRef.id,
            created_at: new Date().toISOString()
          });
        }
      } else {
        // Student mode
        const routine = await getOrCreateActiveRoutine(user.uid, "ALUMNO", selectedStudent);
        const exerciseType = form.isToFailure ? "AL_FALLO" : form.isDropset ? "DROP_SET" : form.isPiramide ? "PIRAMIDE" : "NORMAL";
        const newId = await addExerciseService({
          trainer_id: user.uid,
          student_id: selectedStudent,
          name: form.name,
          sets: parseInt(form.sets),
          reps: form.isToFailure || form.isPiramide ? 0 : parseInt(form.reps),
          weight: 0,
          day: selectedDay,
          body_part: combinedBodyPart || currentDayConfig.body_part_1,
          is_to_failure: form.isToFailure,
          is_dropset: form.isDropset,
          is_piramide: form.isPiramide,
          pyramid_reps: form.isPiramide ? form.pyramidReps.trim() : null,
          exercise_type: exerciseType,
          routine_id: routine.id,
        });

        try {
          // Ya no necesitamos actualizar el routine_id porque se lo pasamos al crear
        } catch (err) {
          console.error("Error linking to routine:", err);
        }

        await logTrainerChange(user.uid, selectedStudent, "exercise_added",
          `Nuevo ejercicio: ${form.name} (${form.sets}×${repsDisplay} - ${selectedDay} - ${combinedBodyPart})`,
          newId || undefined
        );

        if (biSerieEnabled && newId) {
          await addExerciseService({
            trainer_id: user.uid,
            student_id: selectedStudent,
            name: biForm.name,
            sets: parseInt(form.sets),
            reps: biForm.isToFailure ? 0 : parseInt(biForm.reps),
            weight: 0,
            day: selectedDay,
            body_part: combinedBodyPart || currentDayConfig.body_part_1,
            is_to_failure: biForm.isToFailure,
            is_dropset: biForm.isDropset,
            is_piramide: false,
            pyramid_reps: null,
            exercise_type: "BI_SERIE",
            parent_exercise_id: newId,
            routine_id: routine.id,
          });
        }
      }
      
      if (!isGroupMode) {
        await autoUpdateRoutineCycle(user.uid, selectedStudent);
      }

      toast.success(biSerieEnabled ? "Ejercicio + Bi Serie agregados" : "Ejercicio agregado");
      setForm({ name: "", sets: "", reps: "", isToFailure: false, isDropset: false, isPiramide: false, pyramidReps: "", exerciseType: "NORMAL" });
      setBiForm({ name: "", reps: "", isToFailure: false, isDropset: false });
      setBiSerieEnabled(false);
      fetchData();
    } catch (err: any) {
      console.error("DEBUG ERROR ADDING EXERCISE:", err);
      toast.error("Error: " + (err.message || "al agregar ejercicio"));
    }
  };

  const handleRemove = async (exerciseId: string) => {
    if (!user) return;
    const exercise = exercises.find((e) => e.id === exerciseId);
    try {
      if (isGroupMode) {
        await deleteDoc(doc(db, "group_exercises", exerciseId));
      } else {
        await removeExerciseService(exerciseId);
        if (exercise) {
          await logTrainerChange(user.uid, selectedStudent, "exercise_removed",
            `Ejercicio eliminado: ${exercise.name} (${exercise.day})`, exerciseId
          );
        }
        await autoUpdateRoutineCycle(user.uid, selectedStudent);
      }
      fetchData();
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      if (isGroupMode) {
        const batch = writeBatch(db);
        ids.forEach(id => batch.delete(doc(db, "group_exercises", id)));
        await batch.commit();
      } else {
        await bulkRemoveExercises(ids);
        for (const id of ids) {
          const ex = exercises.find((e) => e.id === id);
          await logTrainerChange(user.uid, selectedStudent, "exercise_removed",
            `Ejercicio eliminado: ${ex?.name || "?"} (${ex?.day || "?"})`, id
          );
        }
        await autoUpdateRoutineCycle(user.uid, selectedStudent);
      }
      toast.success(`${ids.length} ejercicio(s) eliminado(s)`);
      fetchData();
    } catch (err) {
      toast.error("Error al eliminar ejercicios");
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };


  const student = students.find((s) => s.user_id === selectedStudent);
  const parentExercises = exercises.filter((e) => e.day === selectedDay && !e.parent_exercise_id);
  const childExercises = exercises.filter((e) => e.day === selectedDay && e.parent_exercise_id);
  const childByParent = new Map<string, Exercise>();
  childExercises.forEach((c) => { if (c.parent_exercise_id) childByParent.set(c.parent_exercise_id, c); });

  const handleToggleBiSerie = async (ex: Exercise) => {
    if (!user) return;
    const targetId = isGroupMode ? urlGroupId : selectedStudent;
    if (!targetId) return;
    const hasChild = childByParent.has(ex.id);
    try {
      if (hasChild) {
        if (isGroupMode) {
          const childEx = childByParent.get(ex.id);
          if (childEx) await deleteDoc(doc(db, "group_exercises", childEx.id));
        } else {
          await removeBiSerieChild(ex.id);
        }
        toast.success("Bi Serie eliminada");
      } else {
        if (isGroupMode) {
          await addDoc(collection(db, "group_exercises"), {
            group_id: urlGroupId!,
            trainer_id: user.uid,
            name: "Bi Serie",
            sets: ex.sets,
            reps: ex.reps,
            weight: 0,
            day: ex.day,
            body_part: ex.body_part,
            is_to_failure: false,
            is_dropset: false,
            is_piramide: false,
            pyramid_reps: null,
            exercise_type: "BI_SERIE",
            parent_exercise_id: ex.id,
            created_at: new Date().toISOString()
          });
        } else {
          await addBiSerieChild(ex, user.uid, selectedStudent);
        }
        toast.success("Bi Serie agregada");
      }
      
      if (!isGroupMode) {
        await autoUpdateRoutineCycle(user.uid, selectedStudent);
      }

      fetchData();
    } catch { toast.error("Error al modificar Bi Serie"); }
  };

  if (loadingStudents && !isGroupMode) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!isGroupMode && students.length === 0) {
    return (
      <div className="max-w-4xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
        <div className="border-b border-border/50 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Creador de Rutinas</h1>
          <p className="text-sm text-muted-foreground mt-1">Asigna ejercicios a tus alumnos</p>
        </div>
        <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
          <CardContent className="p-8 text-center">
            <Dumbbell className="h-8 w-8 mx-auto text-muted-foreground/45 mb-2.5" />
            <p className="text-xs text-muted-foreground font-medium">Primero vincula alumnos en la sección "Mis Alumnos".</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleBackToList = () => {
    setSelectedStudent("");
    if (urlStudentId) {
      navigate("/trainer/routines", { replace: true });
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* Header section with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div className="flex items-center gap-4">
          {(selectedStudent || isGroupMode) && (
            <Button
              variant="ghost" size="icon"
              onClick={handleBackToList}
              className="h-9 w-9 rounded-lg"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
              {isGroupMode ? `Rutina de Grupo: ${groupName}` : "Crear Rutina"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {isGroupMode ? "Gestión de ejercicios colectivos" : "Configuración personalizada de entrenamiento"}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs superiores de Rutinas */}
      {(selectedStudent || isGroupMode) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PremiumCard className="hover:border-primary/20">
            <PremiumCardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Ejercicios</p>
                <h3 className="text-base font-bold text-foreground mt-0.5">{exercises.length} Cargados</h3>
              </div>
            </PremiumCardContent>
          </PremiumCard>

          <PremiumCard className="hover:border-blue-500/20">
            <PremiumCardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Ejercicios del {selectedDay}</p>
                <h3 className="text-base font-bold text-foreground mt-0.5">{exercises.filter(e => e.day === selectedDay).length} Programados</h3>
              </div>
            </PremiumCardContent>
          </PremiumCard>

          <PremiumCard className="hover:border-emerald-500/20">
            <PremiumCardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Músculos ({selectedDay})</p>
                <h3 className="text-base font-bold text-foreground mt-0.5 truncate">{combinedBodyPart || "No definidos"}</h3>
              </div>
            </PremiumCardContent>
          </PremiumCard>
        </div>
      )}

      {!isGroupMode && !selectedStudent ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => (
            <StudentCard
              key={s.user_id}
              name={s.display_name}
              avatarUrl={s.avatar_url}
              avatarInitials={s.avatar_initials}
              size="lg"
              onClick={() => setSelectedStudent(s.user_id)}
              subtitle={<span className="text-[10px] text-muted-foreground uppercase tracking-tight">Gestionar rutina</span>}
              className="border-border/40 hover:border-primary/30"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[70vh]">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-border/50 bg-card rounded-xl shadow-sm overflow-hidden">
              <CardHeader className="p-4 border-b border-border/50 bg-muted/40">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                      <Dumbbell className="h-4.5 w-4.5" />
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground">Configuración de Rutina</CardTitle>
                  </div>
                  {!isGroupMode && selectedStudent && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold rounded-md px-2 py-0.5 shadow-none">
                      Alumno: {students.find(s => s.user_id === selectedStudent)?.display_name || "Cargando..."}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-6">
                  {!isGroupMode && (
                    <TabsList className="grid grid-cols-2 bg-secondary/50 max-w-md w-full rounded-xl p-1">
                      <TabsTrigger value="entrenamiento" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Dumbbell className="w-4 h-4 mr-2" />Entrenamiento
                      </TabsTrigger>
                      <TabsTrigger value="alimentacion" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <CalendarClock className="w-4 h-4 mr-2" />Alimentación
                      </TabsTrigger>
                    </TabsList>
                  )}

                  <TabsContent value="entrenamiento" className="space-y-8 mt-0">
                    {/* Day selector */}
                    <div className="grid grid-cols-7 gap-2">
                      {DAYS.map((day, i) => {
                        const count = exercises.filter((e) => e.day === day).length;
                        const dc = dayConfigs[day];
                        const isActive = selectedDay === day;
                        return (
                          <button
                            key={day}
                            onClick={() => { setSelectedDay(day); setSelectedIds(new Set()); }}
                            className={cn(
                              "relative flex flex-col items-center justify-center w-full h-16 rounded-2xl text-xs font-bold transition-all border-2",
                              isActive
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105 z-10"
                                : "bg-card/40 text-muted-foreground border-border/50 hover:border-primary/40 hover:bg-card/60"
                            )}
                          >
                            <span className="text-[11px] sm:text-xs">{DAY_SHORT[i]}</span>
                            {count > 0 && <span className={cn("text-[10px] mt-0.5", isActive ? "text-primary-foreground" : "text-primary")}>{count}</span>}
                            {dc?.body_part_1 && (
                              <span className={cn(
                                "text-[8px] mt-0.5 truncate max-w-[45px] uppercase tracking-tighter opacity-70",
                                isActive ? "text-primary-foreground" : "text-muted-foreground"
                              )}>
                                {dc.body_part_1.slice(0, 5)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: MUSCULAR CONFIG & FORM */}
                      <div className="space-y-6">
                        {/* Configuración muscular del día */}
                        <Card className="border border-border/40 bg-card/60 rounded-2xl shadow-sm overflow-hidden">
                          <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-primary" />
                              Músculos a Entrenar ({selectedDay})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Grupo Principal</Label>
                                <Select value={currentDayConfig.body_part_1 || "none"} onValueChange={(v) => handleSaveDayConfig("body_part_1", v)}>
                                  <SelectTrigger className="h-10 border-border/50 bg-secondary/15 hover:bg-secondary/25 text-xs"><SelectValue placeholder="Primario" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">— Ninguno —</SelectItem>
                                    {BODY_PARTS.map((bp) => <SelectItem key={bp} value={bp}>{bp}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Grupo Secundario</Label>
                                <Select value={currentDayConfig.body_part_2 || "none"} onValueChange={(v) => handleSaveDayConfig("body_part_2", v)}>
                                  <SelectTrigger className="h-10 border-border/50 bg-secondary/15 hover:bg-secondary/25 text-xs"><SelectValue placeholder="Secundario" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">— Ninguno —</SelectItem>
                                    {BODY_PARTS.filter((bp) => bp !== currentDayConfig.body_part_1).map((bp) => (
                                      <SelectItem key={bp} value={bp}>{bp}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Formulario de Nuevo Ejercicio */}
                        <Card className="border border-border/40 bg-card/60 rounded-2xl shadow-sm overflow-hidden">
                          <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <Dumbbell className="h-4.5 w-4.5 text-primary" />
                              Configurar Ejercicio
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Selección de Ejercicio</Label>
                              {availableExercises.length > 0 ? (
                                <Select value={form.name} onValueChange={(v) => setForm({ ...form, name: v })}>
                                  <SelectTrigger className="h-11 border-border/50 bg-secondary/15 hover:bg-secondary/25 text-xs"><SelectValue placeholder="Seleccionar ejercicio..." /></SelectTrigger>
                                  <SelectContent>
                                    {availableExercises.map((ex) => <SelectItem key={ex} value={ex}>{ex}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  placeholder={currentDayConfig.body_part_1 ? "Escribir nombre del ejercicio..." : "Primero asigna un grupo muscular arriba"}
                                  value={form.name}
                                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                                  className="h-11 border-border/50 bg-secondary/15 text-xs"
                                  disabled={!currentDayConfig.body_part_1}
                                />
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Series</Label>
                                <Input type="number" placeholder="4" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} className="h-11 border-border/50 bg-secondary/15 text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Repeticiones</Label>
                                <Input
                                  type={form.isToFailure ? "text" : "number"}
                                  placeholder={form.isToFailure ? "Al Fallo" : "12"}
                                  value={form.isToFailure || form.isPiramide ? "" : form.reps}
                                  onChange={(e) => setForm({ ...form, reps: e.target.value })}
                                  className="h-11 border-border/50 bg-secondary/15 text-xs"
                                  disabled={form.isToFailure || form.isPiramide}
                                />
                              </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/40 space-y-3.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Configuraciones Avanzadas</Label>
                              </div>
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-card/40 border border-border/30 hover:bg-card/60 transition-all">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-foreground">Al Fallo</span>
                                    <span className="text-[9px] text-muted-foreground">Llevar la serie al límite muscular</span>
                                  </div>
                                  <Switch
                                    checked={form.isToFailure}
                                    onCheckedChange={(checked) => setForm({
                                      ...form,
                                      isToFailure: checked,
                                      reps: checked ? "" : form.reps,
                                      isDropset: checked ? false : form.isDropset,
                                      isPiramide: checked ? false : form.isPiramide
                                    })}
                                    className="data-[state=checked]:bg-primary"
                                  />
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-card/40 border border-border/30 hover:bg-card/60 transition-all">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-foreground">Drop Set</span>
                                    <span className="text-[9px] text-muted-foreground">Reducir peso tras llegar al fallo</span>
                                  </div>
                                  <Switch
                                    checked={form.isDropset}
                                    onCheckedChange={(checked) => setForm({
                                      ...form,
                                      isDropset: checked,
                                      isToFailure: checked ? false : form.isToFailure,
                                      isPiramide: checked ? false : form.isPiramide
                                    })}
                                    className="data-[state=checked]:bg-primary"
                                  />
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-card/40 border border-border/30 hover:bg-card/60 transition-all">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-foreground">Pirámide</span>
                                    <span className="text-[9px] text-muted-foreground">Subir peso y bajar repeticiones</span>
                                  </div>
                                  <Switch
                                    checked={form.isPiramide}
                                    onCheckedChange={(checked) => setForm({
                                      ...form,
                                      isPiramide: checked,
                                      pyramidReps: checked ? form.pyramidReps : "",
                                      isToFailure: checked ? false : form.isToFailure,
                                      isDropset: checked ? false : form.isDropset
                                    })}
                                    className="data-[state=checked]:bg-primary"
                                  />
                                </div>
                              </div>
                              {form.isPiramide && (
                                <div className="pt-1.5 animate-in slide-in-from-top-2">
                                  <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5 mb-1 block">Esquema de Repeticiones</Label>
                                  <Input
                                    placeholder="Ej: 12-10-8-6"
                                    value={form.pyramidReps}
                                    onChange={(e) => setForm({ ...form, pyramidReps: e.target.value })}
                                    className="text-xs h-9 bg-card/50"
                                  />
                                </div>
                              )}
                            </div>

                            {/* BI SERIE Section */}
                            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-primary tracking-wider uppercase">Vincular Bi Serie</span>
                                  <span className="text-[9px] text-muted-foreground">Agregar un ejercicio continuo sin descanso</span>
                                </div>
                                <Switch checked={biSerieEnabled} onCheckedChange={(checked) => {
                                  setBiSerieEnabled(checked);
                                  if (!checked) setBiForm({ name: "", reps: "", isToFailure: false, isDropset: false });
                                }} className="data-[state=checked]:bg-primary" />
                              </div>

                              {biSerieEnabled && (
                                <div className="space-y-4 pl-3.5 border-l-2 border-primary/30 animate-in slide-in-from-left-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Ejercicio Complementario</Label>
                                    {availableExercises.length > 0 ? (
                                      <Select value={biForm.name} onValueChange={(v) => setBiForm({ ...biForm, name: v })}>
                                        <SelectTrigger className="h-10 border-border/50 bg-card/60 text-xs"><SelectValue placeholder="Ejercicio..." /></SelectTrigger>
                                        <SelectContent>
                                          {availableExercises.map((ex) => <SelectItem key={ex} value={ex}>{ex}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input placeholder="Escribir nombre..." value={biForm.name} onChange={(e) => setBiForm({ ...biForm, name: e.target.value })} className="h-10 border-border/50 bg-card/60 text-xs" />
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Repeticiones</Label>
                                      <Input type="number" value={biForm.reps} onChange={(e) => setBiForm({ ...biForm, reps: e.target.value })} className="h-10 border-border/50 bg-card/60 text-xs" disabled={biForm.isToFailure} />
                                    </div>
                                    <div className="flex flex-col gap-2 justify-end pb-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold text-muted-foreground">Al Fallo</span>
                                        <Switch checked={biForm.isToFailure} onCheckedChange={(checked) => setBiForm({ ...biForm, isToFailure: checked, reps: checked ? "" : biForm.reps })} className="scale-75 origin-right data-[state=checked]:bg-primary" />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold text-muted-foreground">Drop Set</span>
                                        <Switch checked={biForm.isDropset} onCheckedChange={(checked) => setBiForm({ ...biForm, isDropset: checked })} className="scale-75 origin-right data-[state=checked]:bg-primary" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <Button onClick={handleAdd} className="w-full h-11 rounded-xl font-bold shadow-sm mt-2" disabled={!currentDayConfig.body_part_1}>
                              <Plus className="h-4.5 w-4.5 mr-1.5" /> Agregar Ejercicio
                            </Button>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right: EXERCISE LIST */}
                      <div className="space-y-6">
                        <PremiumCard className="overflow-hidden">
                          <PremiumCardHeader className="p-4 border-b border-border/40 bg-muted/20">
                            <div className="flex items-center justify-between gap-4">
                              <PremiumCardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <div className="p-1 bg-primary/10 rounded-md">
                                  <Dumbbell className="h-4 w-4 text-primary" />
                                </div>
                                Ejercicios del {selectedDay}
                                {combinedBodyPart && (
                                  <StatusBadge
                                    status="activo"
                                    label={combinedBodyPart}
                                    className="ml-1.5"
                                  />
                                )}
                              </PremiumCardTitle>
                              {selectedIds.size > 0 && (
                                <Button
                                  variant="destructive" 
                                  size="sm"
                                  className="h-8 px-3 rounded-lg text-xs font-semibold"
                                  onClick={() => setShowDeleteConfirm(true)}
                                  disabled={deleting}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Borrar ({selectedIds.size})
                                </Button>
                              )}
                            </div>
                          </PremiumCardHeader>
                          <PremiumCardContent className="p-4 overflow-y-auto max-h-[700px] hide-scrollbar">
                            {loadingExercises ? (
                              <LoadingSkeleton type="list" count={4} />
                            ) : parentExercises.length === 0 ? (
                              <EmptyState
                                type="empty"
                                title="Sin ejercicios programados"
                                description="Configura los músculos del día y completa el formulario de la izquierda para añadir tu primer ejercicio."
                              />
                            ) : (
                              <div className="grid grid-cols-1 gap-3">
                                {parentExercises.map((ex) => {
                                  const child = childByParent.get(ex.id);
                                  const isSelected = selectedIds.has(ex.id);
                                  return (
                                    <div key={ex.id} className="group/item space-y-1.5">
                                      <div className={cn(
                                        "flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 border",
                                        isSelected
                                          ? "bg-primary/5 border-primary/30 shadow-sm"
                                          : "bg-secondary/15 border-border/50 hover:bg-secondary/25 hover:border-border/60 hover:scale-[1.01]"
                                      )}>
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() => toggleSelect(ex.id)}
                                          className="h-4.5 w-4.5 rounded-md border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-xs text-foreground tracking-tight truncate">{ex.name}</p>
                                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-muted-foreground font-semibold">
                                            <span className="text-primary font-bold">{ex.sets || "-"} SERIES</span>
                                            <span className="opacity-40">·</span>
                                            <span className={cn(ex.is_to_failure || ex.is_piramide ? "text-destructive" : "text-foreground/80")}>
                                              {ex.is_piramide && ex.pyramid_reps ? ex.pyramid_reps : ex.is_to_failure ? "AL FALLO" : `${ex.reps} REPS`}
                                            </span>
                                            {ex.is_dropset && (
                                              <>
                                                <span className="opacity-40">·</span>
                                                <StatusBadge status="dropset" className="h-4 py-0" />
                                              </>
                                            )}
                                            {ex.is_piramide && (
                                              <>
                                                <span className="opacity-40">·</span>
                                                <StatusBadge status="piramide" className="h-4 py-0" />
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost" size="icon"
                                          className="h-8.5 w-8.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all duration-200"
                                          onClick={() => handleRemove(ex.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>

                                      {child && (
                                        <div className="ml-7 mt-0.5 flex items-center gap-3.5 p-3 rounded-xl bg-primary/5 border border-primary/10 shadow-sm animate-in slide-in-from-left-2 relative">
                                          <div className="absolute left-[-16px] top-[-8px] bottom-1/2 w-4 border-l-2 border-b-2 border-primary/20 rounded-bl-lg pointer-events-none" />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <p className="font-bold text-[11px] text-primary uppercase tracking-wide truncate">{child.name}</p>
                                              <StatusBadge status="global" label="BI SERIE" className="h-3.5 py-0" />
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold">
                                              <span className="text-muted-foreground">{child.sets || "-"} SETS</span>
                                              <span className="text-muted-foreground/40">·</span>
                                              <span className={child.is_to_failure ? "text-destructive" : "text-muted-foreground"}>
                                                {child.is_to_failure ? "AL FALLO" : `${child.reps} REPS`}
                                              </span>
                                              {child.is_dropset && <StatusBadge status="dropset" label="DS" className="h-3 py-0 px-1" />}
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost" size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md opacity-45 hover:opacity-100 transition-opacity shrink-0"
                                            onClick={() => handleRemove(child.id)}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </PremiumCardContent>
                        </PremiumCard>
                      </div>
                    </div>
                  </TabsContent>

                  {!isGroupMode && (
                    <TabsContent value="alimentacion" className="mt-0">
                      {selectedStudent ? (
                        <MealsTab studentId={selectedStudent} nutritionLevel={nutritionLevel} />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                          <Users className="h-16 w-16" />
                          <p className="text-lg font-medium">Selecciona un alumno primero</p>
                        </div>
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidemenu - Actions */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="card-premium border-primary/20 bg-primary/5">
              <CardHeader className="p-6 pb-2 border-b border-primary/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base uppercase tracking-tighter">Actividad</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Log de Cambios</Label>
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5 max-h-[150px] overflow-y-auto text-[10px] font-mono leading-relaxed hide-scrollbar">
                    <p className="opacity-40 italic">Iniciando seguimiento de cambios...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* AlertDialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="card-premium border-destructive/20 max-w-sm rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Se eliminarán <span className="font-bold text-destructive">{selectedIds.size}</span> registros permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl border-none hover:bg-white/5">Cerrar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/80 text-white rounded-xl shadow-lg shadow-destructive/20"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
