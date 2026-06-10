import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dumbbell, CheckCircle, Users, Loader2, ClipboardEdit, Plus, Flame, CalendarCheck
} from "lucide-react";
import { toast } from "sonner";
import DailyLogDialog from "@/components/student/DailyLogDialog";
import RestTimer from "@/components/student/RestTimer";
import ExerciseVideoButton from "@/components/student/ExerciseVideoButton";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  day: string;
  completed: boolean;
  trainer_id: string;
  body_part?: string;
  is_to_failure?: boolean;
  isGroup?: boolean;
}

interface SetData {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

function getTodayDay(): string {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return days[new Date().getDay()];
}

export default function StudentRoutinesPage() {
  const { user } = useAuth();
  
  const today = getTodayDay();
  const [selectedDay, setSelectedDay] = useState<string>(today);
  const [activeTab, setActiveTab] = useState<string>("personal");
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [groupExercises, setGroupExercises] = useState<Exercise[]>([]);
  const [exerciseSets, setExerciseSets] = useState<Record<string, SetData[]>>({});
  
  const [loading, setLoading] = useState(true);
  const [hasGroupRoutine, setHasGroupRoutine] = useState(false);
  const [logExercise, setLogExercise] = useState<Exercise | null>(null);

  const fetchExercises = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const todayDate = new Date().toISOString().split("T")[0];

      // Fetch Personal Exercises
      const qEx = query(collection(db, "exercises"), where("student_id", "==", user.uid));
      const snapEx = await getDocs(qEx);
      const personalExs = snapEx.docs.map(d => ({ id: d.id, ...d.data(), isGroup: false } as Exercise));
      setExercises(personalExs);

      // Fetch Group Memberships
      const qMem = query(collection(db, "training_group_members"), where("student_id", "==", user.uid));
      const snapMem = await getDocs(qMem);
      
      let groupExs: Exercise[] = [];
      if (!snapMem.empty) {
        const groupId = snapMem.docs[0].data().group_id;
        const qGrpEx = query(collection(db, "group_exercises"), where("group_id", "==", groupId));
        const snapGrpEx = await getDocs(qGrpEx);
        
        if (!snapGrpEx.empty) {
          groupExs = snapGrpEx.docs.map(d => ({ 
            id: d.id, 
            ...d.data(),
            completed: false, // Will be overridden if log exists
            trainer_id: d.data().trainer_id || "",
            isGroup: true 
          } as Exercise));
          setGroupExercises(groupExs);
          setHasGroupRoutine(true);
        } else {
          setGroupExercises([]);
          setHasGroupRoutine(false);
        }
      } else {
        setGroupExercises([]);
        setHasGroupRoutine(false);
      }

      const allExercises = [...personalExs, ...groupExs];

      // Fetch logs for today to mark completions
      let weights: Record<string, string> = {};
      const completedLogIds = new Set<string>();
      if (allExercises.length > 0) {
        const qLogs = query(
          collection(db, "exercise_logs"),
          where("student_id", "==", user.uid),
          where("log_date", "==", todayDate)
        );
        const snapLogs = await getDocs(qLogs);
        snapLogs.forEach(d => {
          const data = d.data();
          if (data.actual_weight !== null) {
            weights[data.exercise_id] = String(data.actual_weight);
          }
          if (data.completed) {
            completedLogIds.add(data.exercise_id);
          }
        });
      }

      // Mark exercises as completed if there's a log for today
      const updatedExercises = personalExs.map(ex => {
        if (ex.day === today && completedLogIds.has(ex.id)) {
          return { ...ex, completed: true };
        }
        return ex;
      });
      const updatedGroupExercises = groupExs.map(ex => {
         if (ex.day === today && completedLogIds.has(ex.id)) {
           return { ...ex, completed: true };
         }
         return ex;
      });

      setExercises(updatedExercises);
      setGroupExercises(updatedGroupExercises);

      // Load Sets from localStorage
      const savedStateStr = localStorage.getItem(`routine_sets_${user.uid}_${todayDate}`);
      let savedState: Record<string, SetData[]> = {};
      if (savedStateStr) {
        try {
          savedState = JSON.parse(savedStateStr);
        } catch (e) {}
      }

      const newExerciseSets: Record<string, SetData[]> = {};
      allExercises.forEach((ex) => {
        if (savedState[ex.id]) {
           if (ex.completed && !savedState[ex.id].every(s => s.completed)) {
             newExerciseSets[ex.id] = savedState[ex.id].map(s => ({ ...s, completed: true }));
           } else {
             newExerciseSets[ex.id] = savedState[ex.id];
           }
        } else {
           const setsCount = ex.sets || 1;
           const defaultWeight = weights[ex.id] || ex.weight?.toString() || "";
           const sets: SetData[] = [];
           for (let i = 0; i < setsCount; i++) {
             sets.push({
               id: `${ex.id}-set-${i}`,
               weight: defaultWeight,
               reps: ex.reps?.toString() || "",
               completed: ex.completed,
             });
           }
           newExerciseSets[ex.id] = sets;
        }
      });

      setExerciseSets(newExerciseSets);
      localStorage.setItem(`routine_sets_${user.uid}_${todayDate}`, JSON.stringify(newExerciseSets));

    } catch (err) {
      console.error("Error fetching exercises:", err);
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "exercises"), where("student_id", "==", user.uid));
    const unsubscribe = onSnapshot(q, () => {
      fetchExercises();
    });
    window.addEventListener('storage', fetchExercises);
    return () => { 
      unsubscribe();
      window.removeEventListener('storage', fetchExercises);
    };
  }, [user, fetchExercises]);

  const saveExerciseProgress = async (exerciseId: string, sets: SetData[], markCompleted: boolean) => {
    const isGroup = groupExercises.some(e => e.id === exerciseId);
    const exercise = isGroup ? groupExercises.find(e => e.id === exerciseId) : exercises.find(e => e.id === exerciseId);
    
    if (!exercise || !user) return;

    try {
      const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0), 0);
      const currentSetsCount = sets.length;
      const todayDate = new Date().toISOString().split("T")[0];
      
      if (!isGroup) {
        await updateDoc(doc(db, "exercises", exerciseId), { completed: markCompleted });
        setExercises((prev) => prev.map((e) => (e.id === exerciseId ? { ...e, completed: markCompleted } : e)));
      } else {
        setGroupExercises((prev) => prev.map((e) => (e.id === exerciseId ? { ...e, completed: markCompleted } : e)));
      }

      if (markCompleted) {
        const logId = `${exercise.id}_${todayDate}`;
        await setDoc(doc(db, "exercise_logs", logId), {
          exercise_id: exercise.id,
          student_id: user.uid,
          trainer_id: exercise.trainer_id,
          log_date: todayDate,
          completed: true,
          actual_weight: maxWeight > 0 ? maxWeight : null,
          actual_sets: currentSetsCount,
          actual_reps: exercise.is_to_failure ? null : exercise.reps,
          created_at: new Date().toISOString()
        }, { merge: true });

        toast.success(`${exercise.name} completado`);
      }
    } catch (err) {
      console.error("Error saving exercise progress:", err);
      toast.error("Error al actualizar la base de datos");
    }
  };

  const handleSetComplete = async (exerciseId: string, setId: string, completed: boolean) => {
    setExerciseSets((prev) => {
      const next = { ...prev };
      next[exerciseId] = next[exerciseId].map(s => s.id === setId ? { ...s, completed } : s);
      const todayDate = new Date().toISOString().split("T")[0];
      localStorage.setItem(`routine_sets_${user?.uid}_${todayDate}`, JSON.stringify(next));
      
      const allCompleted = next[exerciseId].every(s => s.completed);
      
      const isGroup = groupExercises.some(e => e.id === exerciseId);
      const exercise = isGroup ? groupExercises.find(e => e.id === exerciseId) : exercises.find(e => e.id === exerciseId);
      
      if (exercise && allCompleted && !exercise.completed) {
        saveExerciseProgress(exerciseId, next[exerciseId], true).catch(console.error);
      } else if (exercise && !allCompleted && exercise.completed) {
        saveExerciseProgress(exerciseId, next[exerciseId], false).catch(console.error);
      }
      return next;
    });
  };

  const handleSetChange = (exerciseId: string, setId: string, field: "weight"|"reps", value: string) => {
    setExerciseSets((prev) => {
      const next = { ...prev };
      next[exerciseId] = next[exerciseId].map(s => s.id === setId ? { ...s, [field]: value } : s);
      const todayDate = new Date().toISOString().split("T")[0];
      localStorage.setItem(`routine_sets_${user?.uid}_${todayDate}`, JSON.stringify(next));
      return next;
    });
  };

  const handleAddSet = (exerciseId: string) => {
    setExerciseSets((prev) => {
      const next = { ...prev };
      const currentSets = next[exerciseId] || [];
      const lastSet = currentSets[currentSets.length - 1];
      next[exerciseId] = [...currentSets, {
        id: `${exerciseId}-set-${currentSets.length}-${Date.now()}`,
        weight: lastSet ? lastSet.weight : "",
        reps: lastSet ? lastSet.reps : "",
        completed: false
      }];
      const todayDate = new Date().toISOString().split("T")[0];
      localStorage.setItem(`routine_sets_${user?.uid}_${todayDate}`, JSON.stringify(next));
      
      const isGroup = groupExercises.some(e => e.id === exerciseId);
      const exercise = isGroup ? groupExercises.find(e => e.id === exerciseId) : exercises.find(e => e.id === exerciseId);
      
      if (exercise && exercise.completed) {
        saveExerciseProgress(exerciseId, next[exerciseId], false).catch(console.error);
      }
      
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const currentPersonalExs = exercises.filter(e => e.day === selectedDay);
  const currentGroupExs = groupExercises.filter(e => e.day === selectedDay);
  
  const allPersonalCompleted = currentPersonalExs.length > 0 && currentPersonalExs.every(e => e.completed);
  const allGroupCompleted = currentGroupExs.length > 0 && currentGroupExs.every(e => e.completed);

  const renderExercises = (exs: Exercise[], isGroup: boolean) => {
    if (exs.length === 0) {
      return (
        <Card className="card-glass border-white/5">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-muted-foreground">Día de descanso</h3>
            <p className="text-xs text-muted-foreground/60 mt-1">No tienes ejercicios programados para el {selectedDay.toLowerCase()}</p>
          </CardContent>
        </Card>
      );
    }

    // Group by body part (optional, as in original TodayRoutinePage)
    const grouped: Record<string, Exercise[]> = {};
    exs.forEach((ex) => {
      const key = ex.body_part || "General";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ex);
    });

    return (
      <div className="space-y-6">
        {Object.entries(grouped).map(([bodyPart, partExs]) => (
          <div key={bodyPart} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <Badge variant="outline" className={cn(
                "uppercase tracking-widest text-[9px] px-4 py-1",
                isGroup ? "border-accent/40 text-accent bg-accent/5" : "badge-info-tag"
              )}>
                {bodyPart}
              </Badge>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {partExs.map((exercise) => {
                const accentColor = isGroup ? "accent" : "primary";
                return (
                  <Card
                    key={exercise.id}
                    className={cn(
                      "card-premium border-border/40 bg-card transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col shadow-xl",
                      exercise.completed 
                        ? (isGroup ? "border-accent/40 bg-accent/5 opacity-90 shadow-accent/5" : "border-primary/40 bg-primary/5 opacity-90 shadow-primary/5") 
                        : (isGroup ? "hover:border-accent/20 hover:bg-card/90" : "hover:border-primary/20 hover:bg-card/90")
                    )}
                  >
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Header */}
                      <div className="bg-muted/40 p-5 flex items-center justify-between border-b border-border/40">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={cn(
                            "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                            exercise.completed 
                              ? (isGroup ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary") 
                              : "bg-muted/50 text-muted-foreground"
                          )}>
                            <Dumbbell className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className={cn(
                              "font-bold text-base leading-tight truncate cursor-pointer transition-colors",
                              exercise.completed && (isGroup ? "text-accent/80" : "text-primary/80"),
                              isGroup ? "hover:text-accent" : "hover:text-primary"
                            )} onClick={() => setLogExercise(exercise)}>
                              {exercise.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              {exercise.is_to_failure && (
                                <span className="text-[9px] font-black bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded uppercase tracking-tighter">
                                  Al fallo 🔥
                                </span>
                              )}
                              {exercise.completed && (
                                <span className={cn(
                                  "text-[9px] font-black border px-2 py-0.5 rounded uppercase tracking-tighter",
                                  isGroup ? "bg-accent/10 text-accent border-accent/20" : "bg-primary/10 text-primary border-primary/20"
                                )}>
                                  Listo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ExerciseVideoButton exerciseName={exercise.name} />
                          <Button 
                            size="icon" variant="ghost" 
                            className={cn(
                              "h-10 w-10 rounded-xl text-muted-foreground transition-all",
                              isGroup ? "hover:bg-accent/10 hover:text-accent" : "hover:bg-primary/10 hover:text-primary"
                            )}
                            onClick={() => setLogExercise(exercise)}
                          >
                            <ClipboardEdit className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      {/* Sets Table */}
                      <div className="p-5 flex-1">
                        <div className="grid grid-cols-[40px_1fr_1fr_50px] gap-3 px-2 mb-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">
                          <div className="text-center">SET</div>
                          <div className="text-center">KG</div>
                          <div className="text-center">REPS</div>
                          <div className="text-center">OK</div>
                        </div>

                        <div className="space-y-3">
                          {exerciseSets[exercise.id]?.map((set, idx) => (
                            <div 
                              key={set.id} 
                              className={cn(
                                "grid grid-cols-[40px_1fr_1fr_50px] items-center gap-3 p-1.5 rounded-2xl transition-all duration-300 border",
                                set.completed 
                                  ? (isGroup ? "bg-accent/5 border-accent/30" : "bg-primary/5 border-primary/30") 
                                  : "bg-muted/20 border-border/30 hover:bg-muted/40"
                              )}
                            >
                              <div className="text-xs font-black text-center text-muted-foreground/80">{idx + 1}</div>
                              <div>
                                <Input 
                                  type="number" step="0.5" 
                                  className="input-premium h-10 w-full text-center text-sm font-bold border-none bg-transparent hover:bg-muted/40 focus:bg-muted/60" 
                                  value={set.weight} 
                                  onChange={(e) => handleSetChange(exercise.id, set.id, "weight", e.target.value)} 
                                  placeholder="-" 
                                />
                              </div>
                              <div>
                                <Input 
                                  type="number" 
                                  className="input-premium h-10 w-full text-center text-sm font-bold border-none bg-transparent hover:bg-muted/40 focus:bg-muted/60" 
                                  value={set.reps} 
                                  onChange={(e) => handleSetChange(exercise.id, set.id, "reps", e.target.value)} 
                                  placeholder="-" 
                                />
                              </div>
                              <div className="flex justify-center">
                                <Checkbox 
                                  checked={set.completed} 
                                  onCheckedChange={(c) => handleSetComplete(exercise.id, set.id, !!c)} 
                                  className={cn(
                                    "h-7 w-7 rounded-lg transition-transform active:scale-90",
                                    isGroup 
                                      ? "data-[state=checked]:bg-accent data-[state=checked]:border-accent" 
                                      : "data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  )} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 flex justify-center">
                          <Button 
                            variant="ghost" size="sm" 
                            className={cn(
                              "btn-premium-outline h-10 px-6 rounded-full text-xs gap-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-all",
                              isGroup 
                                ? "hover:text-accent hover:border-accent hover:border-solid" 
                                : "hover:text-primary hover:border-primary hover:border-solid"
                            )}
                            onClick={() => handleAddSet(exercise.id)}
                          >
                            <Plus className="h-4 w-4" /> Añadir serie
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 pb-32 animate-in fade-in duration-750">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-3 relative z-10">
          <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tighter uppercase italic leading-none">
            Mi <span className="text-primary italic-none tracking-normal">Rutina</span>
          </h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full w-fit mx-auto sm:mx-0">
            <Dumbbell className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Entrenamiento</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        {hasGroupRoutine && (
          <div className="flex justify-center mb-6">
            <TabsList className="bg-card/50 border border-border/50 rounded-full p-1 h-auto shadow-inner">
              <TabsTrigger 
                value="personal" 
                className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
              >
                Rutina Personal
              </TabsTrigger>
              <TabsTrigger 
                value="group" 
                className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg transition-all"
              >
                Rutina Grupal
              </TabsTrigger>
            </TabsList>
          </div>
        )}

        {/* Week Day Selector */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-10">
          {DAYS.map((day, i) => {
            const isSelected = selectedDay === day;
            const isToday = day === today;
            // Count exercises for this day (total)
            const personalCount = exercises.filter(e => e.day === day).length;
            const groupCount = groupExercises.filter(e => e.day === day).length;
            const totalCount = personalCount + groupCount;
            
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "relative flex flex-col items-center justify-center h-16 sm:h-20 rounded-2xl text-sm font-black border transition-all duration-300 group active:scale-95",
                  isSelected
                    ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105 z-10"
                    : isToday
                      ? "bg-primary/10 border-primary/40 text-primary shadow-lg shadow-primary/5 hover:bg-primary/20"
                      : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                <span className={cn(
                  "text-[10px] sm:text-xs uppercase tracking-tighter mb-1 font-bold transition-colors",
                  isSelected ? "text-white" : isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {DAY_SHORT[i]}
                </span>
                
                {totalCount > 0 ? (
                  <div className={cn(
                    "flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-xl text-[9px] sm:text-[10px] font-black shadow-md transition-colors",
                    isSelected ? "bg-white text-primary" : "bg-primary text-white"
                  )}>
                    {totalCount}
                  </div>
                ) : (
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/30 mt-1" />
                )}
                {isToday && !isSelected && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Rest Timer */}
        <RestTimer />

        <TabsContent value="personal" className="focus-visible:outline-none animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-black uppercase tracking-tight">Rutina Personal</h2>
            <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
              {currentPersonalExs.filter(e => e.completed).length}/{currentPersonalExs.length} Completados
            </span>
          </div>
          
          {allPersonalCompleted && currentPersonalExs.length > 0 && (
            <Card className="card-premium border-primary/20 bg-primary/5 rounded-[2rem] py-6 mb-6 shadow-lg shadow-primary/5">
              <CardContent className="p-0 text-center space-y-2">
                <Flame className="h-8 w-8 text-primary mx-auto mb-2 animate-bounce" />
                <h3 className="text-lg font-black uppercase italic">¡Rutina Personal Finalizada!</h3>
              </CardContent>
            </Card>
          )}

          {renderExercises(currentPersonalExs, false)}
        </TabsContent>

        {hasGroupRoutine && (
          <TabsContent value="group" className="focus-visible:outline-none animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-black uppercase tracking-tight text-accent">Rutina de Grupo</h2>
              <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                {currentGroupExs.filter(e => e.completed).length}/{currentGroupExs.length} Completados
              </span>
            </div>

            {allGroupCompleted && currentGroupExs.length > 0 && (
              <Card className="card-premium border-accent/20 bg-accent/5 rounded-[2rem] py-6 mb-6 shadow-lg shadow-accent/5">
                <CardContent className="p-0 text-center space-y-2">
                  <Flame className="h-8 w-8 text-accent mx-auto mb-2 animate-bounce" />
                  <h3 className="text-lg font-black uppercase italic text-accent">¡Rutina Grupal Finalizada!</h3>
                </CardContent>
              </Card>
            )}

            {renderExercises(currentGroupExs, true)}
          </TabsContent>
        )}
      </Tabs>

      {logExercise && user && (
        <DailyLogDialog
          open={!!logExercise}
          onClose={() => { setLogExercise(null); fetchExercises(); }}
          exercise={logExercise}
          studentId={user.uid}
          trainerId={logExercise.trainer_id}
        />
      )}
    </div>
  );
}
