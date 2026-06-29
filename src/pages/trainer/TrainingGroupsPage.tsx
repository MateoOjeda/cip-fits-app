import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLinkedStudents } from "@/hooks/useLinkedStudents";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Users, Loader2, Dumbbell, UserPlus, X, Eye, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface TrainingGroup { id: string; name: string; trainer_id: string; created_at: string; }
interface GroupMember { id: string; group_id: string; student_id: string; created_at?: string; }
interface GroupExercise { 
  id: string; 
  group_id: string; 
  trainer_id: string;
  name: string; 
  sets: number; 
  reps: number; 
  weight: number; 
  day: string; 
  body_part?: string; 
  is_to_failure: boolean; 
  is_dropset?: boolean;
  is_piramide?: boolean;
  pyramid_reps?: string | null;
  exercise_type?: string;
  created_at?: string;
}

export default function TrainingGroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { students, loading: loadingStudents } = useLinkedStudents();
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [exercises, setExercises] = useState<GroupExercise[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<TrainingGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showInlineRoutine, setShowInlineRoutine] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "training_groups"), 
        where("trainer_id", "==", user.uid), 
        orderBy("created_at", "desc")
      );
      const snap = await getDocs(q);
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingGroup)));
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const fetchGroupDetail = useCallback(async (groupId: string) => {
    if (!user) return;
    setLoadingDetail(true);
    
    try {
      // 1. Fetch Members
      const qMembers = query(collection(db, "training_group_members"), where("group_id", "==", groupId));
      const membersSnap = await getDocs(qMembers).catch(err => {
        console.error("Error fetching group members:", err);
        return { docs: [] };
      });
      setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() } as GroupMember)));

      // 2. Fetch Exercises
      const qExercises = query(collection(db, "group_exercises"), where("group_id", "==", groupId));
      const exercisesSnap = await getDocs(qExercises).catch(err => {
        console.error("Error fetching group exercises:", err);
        return { docs: [] };
      });

      const rawExercises = exercisesSnap.docs.map(d => ({ id: d.id, ...d.data() } as GroupExercise));
      const sortedExercises = [...rawExercises].sort((a, b) => {
        const indexA = DAYS.indexOf(a.day);
        const indexB = DAYS.indexOf(b.day);
        if (indexA !== indexB) return indexA - indexB;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });
      setExercises(sortedExercises);
    } catch (err) {
      console.error("Error fetching group details:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupDetail(selectedGroupId);
    } else {
      setMembers([]);
      setExercises([]);
    }
    setShowInlineRoutine(false);
  }, [selectedGroupId, fetchGroupDetail]);

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "training_groups"), {
        name: newGroupName.trim(),
        trainer_id: user.uid,
        created_at: new Date().toISOString()
      });
      setNewGroupName("");
      toast.success("Grupo creado");
      fetchGroups();
    } catch (err) {
      toast.error("Error al crear grupo");
    } finally {
      setCreating(false);
    }
  };

  const deleteGroup = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // 1. Delete group document
      await deleteDoc(doc(db, "training_groups", deleteTarget.id));

      // 2. Delete members
      const qM = query(collection(db, "training_group_members"), where("group_id", "==", deleteTarget.id));
      const snapM = await getDocs(qM);
      const batchM = writeBatch(db);
      snapM.docs.forEach(d => batchM.delete(d.ref));
      await batchM.commit();

      // 3. Delete group exercises
      const qE = query(collection(db, "group_exercises"), where("group_id", "==", deleteTarget.id));
      const snapE = await getDocs(qE);
      const batchE = writeBatch(db);
      snapE.docs.forEach(d => batchE.delete(d.ref));
      await batchE.commit();

      toast.success("Grupo eliminado");
      setSelectedGroupId(null);
      fetchGroups();
    } catch (err) {
      toast.error("Error al eliminar grupo");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId); else next.add(studentId);
      return next;
    });
  };

  const addMembers = async () => {
    if (!selectedGroupId || selectedStudentIds.size === 0 || !user) return;
    setLoadingDetail(true);
    try {
      const studentIds = Array.from(selectedStudentIds);
      const batch = writeBatch(db);
      
      for (const studentId of studentIds) {
        const memberRef = doc(collection(db, "training_group_members"));
        batch.set(memberRef, {
          group_id: selectedGroupId,
          student_id: studentId,
          created_at: new Date().toISOString()
        });
      }
      
      await batch.commit();

      // Clone group exercises to students' exercise collections
      for (const studentId of studentIds) {
        // Find group exercises
        const qExs = query(collection(db, "group_exercises"), where("group_id", "==", selectedGroupId));
        const exsSnap = await getDocs(qExs);
        
        for (const exDoc of exsSnap.docs) {
          const exData = exDoc.data();
          await addDoc(collection(db, "exercises"), {
            trainer_id: user.uid,
            student_id: studentId,
            name: exData.name,
            sets: exData.sets,
            reps: exData.reps,
            weight: exData.weight || 0,
            day: exData.day,
            body_part: exData.body_part || "",
            is_to_failure: exData.is_to_failure || false,
            is_dropset: exData.is_dropset || false,
            is_piramide: exData.is_piramide || false,
            pyramid_reps: exData.pyramid_reps || null,
            exercise_type: exData.exercise_type || "NORMAL",
            completed: false,
            created_at: new Date().toISOString()
          });
        }
      }

      toast.success(`${studentIds.length} alumno(s) agregado(s). Rutinas grupales asignadas.`);
      setSelectedStudentIds(new Set());
      setShowAddMembers(false);
      await fetchGroupDetail(selectedGroupId);
    } catch (err) {
      toast.error("Error al agregar miembros y asignar rutinas");
    } finally {
      setLoadingDetail(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await deleteDoc(doc(db, "training_group_members", memberId));
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Miembro eliminado del grupo");
    } catch (err) {
      toast.error("Error al eliminar miembro");
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const memberStudentIds = new Set(members.map((m) => m.student_id));
  const availableStudentsForGroup = students.filter((s) => !memberStudentIds.has(s.user_id));

  if (loading || loadingStudents) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Grupos de Entrenamiento</h1>
          <p className="text-sm text-muted-foreground mt-1">Crea grupos y asigna rutinas colectivas de forma eficiente</p>
        </div>
      </div>

      <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input placeholder="Nombre del grupo (ej: Principiantes Mañana)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createGroup()} className="flex-1 text-xs" />
            <Button onClick={createGroup} disabled={creating || !newGroupName.trim()} size="sm" className="gap-1.5 text-xs font-semibold"><Plus className="h-4 w-4" /> Crear Grupo</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Mis Grupos</h2>
          {groups.length === 0 ? (
            <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/45 mb-2.5" />
                <p className="text-xs text-muted-foreground font-medium">Sin grupos creados</p>
              </CardContent>
            </Card>
          ) : groups.map((g) => (
            <Card 
              key={g.id} 
              className={cn(
                "cursor-pointer transition-all duration-200 rounded-xl shadow-sm",
                selectedGroupId === g.id 
                  ? "bg-primary/5 border-primary/30" 
                  : "bg-card border-border/50 hover:bg-muted/10"
              )} 
              onClick={() => setSelectedGroupId(g.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="font-semibold text-xs text-foreground">{g.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md" onClick={(e) => { e.stopPropagation(); setDeleteTarget(g); }}><Trash2 className="h-3.5 w-3.5" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedGroup ? (
          <div className="lg:col-span-2 space-y-4">
            {loadingDetail ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : (
              <>
                <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
                  <CardHeader className="p-4 border-b border-border/50 bg-muted/40">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Users className="h-4.5 w-4.5 text-primary" />
                        Miembros de "{selectedGroup.name}"
                      </CardTitle>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-semibold rounded-lg" onClick={() => setShowAddMembers(!showAddMembers)}>
                        {showAddMembers ? <X className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                        {showAddMembers ? "Cerrar" : "Agregar"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4">
                    {showAddMembers && (
                      <div className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-3">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Seleccionar alumnos</p>
                        {availableStudentsForGroup.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Todos tus alumnos ya están en este grupo</p>
                        ) : (
                          <>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {availableStudentsForGroup.map((s) => (
                                <label key={s.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                                  <Checkbox checked={selectedStudentIds.has(s.user_id)} onCheckedChange={() => toggleStudentSelection(s.user_id)} />
                                  <span className="text-xs font-semibold text-foreground">{s.display_name}</span>
                                </label>
                              ))}
                            </div>
                            <Button size="sm" onClick={addMembers} disabled={selectedStudentIds.size === 0} className="gap-1.5 h-8 text-xs font-semibold rounded-lg mt-2"><UserPlus className="h-3.5 w-3.5" /> Agregar ({selectedStudentIds.size})</Button>
                          </>
                        )}
                      </div>
                    )}
                    {members.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6 italic">Sin alumnos vinculados en este grupo</p>
                    ) : (
                      <div className="space-y-2">
                        {members.map((m) => {
                          const student = students.find((s) => s.user_id === m.student_id);
                          return (
                            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
                              <span className="text-xs font-semibold text-foreground">{student?.display_name || m.student_id}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md" onClick={() => removeMember(m.id)}><X className="h-3.5 w-3.5" /></Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-border/50 bg-card rounded-xl shadow-sm overflow-hidden">
                  <CardHeader className="p-4 border-b border-border/50 bg-muted/40">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Dumbbell className="h-4.5 w-4.5 text-primary" />
                        Rutina del Grupo
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button variant="outline" className="flex-1 h-auto flex flex-col items-center justify-center gap-3 hover:bg-muted/10 border-border/60 group py-6 rounded-xl" onClick={() => setShowInlineRoutine(!showInlineRoutine)}>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center transition-transform">
                          <Eye className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-foreground text-center leading-tight">Ver rutina del grupo</span>
                      </Button>

                      <Button variant="outline" className="flex-1 h-auto flex flex-col items-center justify-center gap-3 hover:bg-muted/10 border-border/60 group py-6 rounded-xl" onClick={() => navigate(`/trainer/routines/group/${selectedGroupId}`)}>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center transition-transform">
                          <Edit3 className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-foreground text-center leading-tight">Editar rutina del grupo</span>
                      </Button>
                    </div>

                    {showInlineRoutine && (
                      <div className="pt-5 border-t border-border animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">Vista previa de la rutina</h3>
                        </div>
                        {exercises.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4 bg-muted/30 border border-dashed rounded-lg">Sin ejercicios asignados al grupo</p>
                        ) : (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                            {DAYS.map((day) => {
                              const dayExs = exercises.filter((e) => e.day === day);
                              if (dayExs.length === 0) return null;
                              return (
                                <div key={day} className="space-y-2">
                                  <Badge variant="outline" className="mb-1 border-primary/20 bg-primary/5 text-primary text-[9px] font-bold px-2 py-0.5 rounded-md">{day}</Badge>
                                  {dayExs.map((ex) => (
                                    <div key={ex.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-xs text-foreground">{ex.name}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                          {ex.body_part && <span className="text-primary font-semibold">{ex.body_part} · </span>}
                                          {ex.sets} × {ex.is_to_failure ? <span className="text-amber-500 font-semibold">Al Fallo</span> : ex.reps}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center py-16 border border-dashed border-border/50 rounded-xl bg-muted/20">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Selecciona un grupo para ver su detalle</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminarán todos los miembros y ejercicios del grupo. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteGroup} disabled={deleting}>{deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
