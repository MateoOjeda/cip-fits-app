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
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from "@/components/ui/premium-card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { SectionHeader } from "@/components/ui/section-header";
import { SearchInput } from "@/components/ui/search-input";
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
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem("trainer_groups_search") || "");
  const [creating, setCreating] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => localStorage.getItem("trainer_selected_group_id"));

  useEffect(() => {
    localStorage.setItem("trainer_groups_search", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedGroupId) {
      localStorage.setItem("trainer_selected_group_id", selectedGroupId);
    } else {
      localStorage.removeItem("trainer_selected_group_id");
    }
  }, [selectedGroupId]);
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

  if (loading || loadingStudents) {
    return (
      <div className="max-w-6xl mx-auto pb-24 space-y-6">
        <LoadingSkeleton type="details" />
      </div>
    );
  }

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <SectionHeader
        title="Grupos de Entrenamiento"
        description="Crea grupos y asigna rutinas colectivas de forma eficiente."
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PremiumCard className="hover:border-primary/20">
          <PremiumCardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Grupos Creados</p>
              <h3 className="text-base font-bold text-foreground mt-0.5">{groups.length} Activos</h3>
            </div>
          </PremiumCardContent>
        </PremiumCard>

        <PremiumCard className="hover:border-blue-500/20">
          <PremiumCardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Miembros en Grupo</p>
              <h3 className="text-base font-bold text-foreground mt-0.5">
                {selectedGroup ? `${members.length} Integrantes` : "Sin seleccionar"}
              </h3>
            </div>
          </PremiumCardContent>
        </PremiumCard>

        <PremiumCard className="hover:border-emerald-500/20">
          <PremiumCardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Rutinas de Grupo</p>
              <h3 className="text-base font-bold text-foreground mt-0.5">
                {selectedGroup ? `${exercises.length} Ejercicios` : "Sin seleccionar"}
              </h3>
            </div>
          </PremiumCardContent>
        </PremiumCard>
      </div>

      <PremiumCard className="overflow-hidden">
        <PremiumCardContent className="p-5 space-y-3.5">
          <div className="space-y-1">
            <Label htmlFor="group-name-input" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Nuevo Grupo de Entrenamiento</Label>
            <p className="text-[10px] text-muted-foreground ml-0.5">Asigna un nombre descriptivo para identificar a tus alumnos grupales (ej: Principiantes Mañana, Fuerza Avanzado).</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Users className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-muted-foreground/60" />
              <Input 
                id="group-name-input"
                placeholder="Nombre del grupo..." 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && createGroup()} 
                className="pl-11 h-12 text-xs border-border/50 bg-secondary/15 hover:bg-secondary/25 focus-visible:ring-primary/20" 
              />
            </div>
            <Button onClick={createGroup} disabled={creating || !newGroupName.trim()} className="h-12 rounded-xl text-xs font-bold px-6 shadow-sm shrink-0">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4.5 w-4.5 mr-1.5" />} 
              Crear Grupo
            </Button>
          </div>
        </PremiumCardContent>
      </PremiumCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Mis Grupos ({filteredGroups.length})</h2>
            <div className="px-1">
              <SearchInput
                placeholder="Buscar grupo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery("")}
                className="h-8.5 rounded-lg"
              />
            </div>
          </div>
          {filteredGroups.length === 0 ? (
            <EmptyState
              type={searchQuery ? "no-results" : "empty"}
              title={searchQuery ? "Sin coincidencias" : "Sin grupos"}
              description={searchQuery ? "No se encontraron grupos que coincidan." : "No tienes grupos creados."}
              className="py-6 min-h-[150px]"
            />
          ) : filteredGroups.map((g) => (
            <PremiumCard 
              key={g.id} 
              className={cn(
                "cursor-pointer transition-all duration-200 rounded-2xl border shadow-sm hover:scale-[1.01]",
                selectedGroupId === g.id 
                  ? "bg-primary/5 border-primary/30 shadow-md" 
                  : "bg-card border-border/40 hover:bg-muted/10"
              )} 
              onClick={() => setSelectedGroupId(g.id)}
            >
              <PremiumCardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/25">
                    <Users className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="font-bold text-xs text-foreground truncate max-w-[150px]">{g.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" 
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(g); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </PremiumCardContent>
            </PremiumCard>
          ))}
        </div>

        {selectedGroup ? (
          <div className="lg:col-span-2 space-y-4">
            {loadingDetail ? (
              <div className="p-4 border border-border/40 bg-card rounded-2xl"><LoadingSkeleton type="list" count={2} /></div>
            ) : (
              <>
                <Card className="border border-border/40 bg-card rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Users className="h-4.5 w-4.5 text-primary" />
                        Miembros de "{selectedGroup.name}"
                      </CardTitle>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-[10px] font-bold rounded-lg border-border" onClick={() => setShowAddMembers(!showAddMembers)}>
                        {showAddMembers ? <X className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                        {showAddMembers ? "Cerrar" : "Agregar Miembros"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    {showAddMembers && (
                      <div className="p-4 rounded-xl border border-border/40 bg-muted/25 space-y-3.5 animate-in slide-in-from-top-2">
                        <div className="space-y-0.5">
                          <Label className="text-[9px] font-bold text-primary uppercase tracking-wider block">Vincular Alumnos al Grupo</Label>
                          <p className="text-[10px] text-muted-foreground">Selecciona los alumnos para integrarlos y sincronizar rutinas grupales.</p>
                        </div>
                        {availableStudentsForGroup.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground italic py-2">Todos tus alumnos ya están en este grupo.</p>
                        ) : (
                          <div className="space-y-3">
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 hide-scrollbar">
                              {availableStudentsForGroup.map((s) => (
                                <label key={s.user_id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-card/60 hover:bg-muted/10 cursor-pointer select-none">
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[9px]">
                                      {s.display_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-semibold text-foreground">{s.display_name}</span>
                                  </div>
                                  <Checkbox 
                                    checked={selectedStudentIds.has(s.user_id)} 
                                    onCheckedChange={() => toggleStudentSelection(s.user_id)} 
                                    className="h-4.5 w-4.5 rounded-md border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                </label>
                              ))}
                            </div>
                            <Button size="sm" onClick={addMembers} disabled={selectedStudentIds.size === 0} className="gap-1.5 h-8.5 text-xs font-bold rounded-lg mt-2 w-full sm:w-auto"><UserPlus className="h-3.5 w-3.5" /> Confirmar e Integrar ({selectedStudentIds.size})</Button>
                          </div>
                        )}
                      </div>
                    )}
                    {members.length === 0 ? (
                      <div className="text-center py-8 space-y-2">
                        <Users className="h-7 w-7 mx-auto text-muted-foreground/35" />
                        <p className="text-xs text-muted-foreground font-semibold">El grupo no tiene miembros vinculados</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 hide-scrollbar">
                        {members.map((m) => {
                          const student = students.find((s) => s.user_id === m.student_id);
                          return (
                            <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-secondary/15 hover:bg-secondary/25 transition-all duration-200">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[9px] shrink-0 border border-primary/20">
                                  {(student?.display_name || m.student_id).substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">{student?.display_name || m.student_id}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" 
                                onClick={() => removeMember(m.id)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-border/40 bg-card rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Dumbbell className="h-4.5 w-4.5 text-primary" />
                      Rutina del Grupo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button variant="outline" className="flex-1 h-auto flex flex-col items-center justify-center gap-3 hover:bg-muted/10 border-border/50 bg-secondary/15 group py-6 rounded-2xl transition-all duration-200 hover:scale-[1.01]" onClick={() => setShowInlineRoutine(!showInlineRoutine)}>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center transition-transform">
                          <Eye className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-foreground text-center leading-tight">Vista Previa de Rutina</span>
                      </Button>

                      <Button variant="outline" className="flex-1 h-auto flex flex-col items-center justify-center gap-3 hover:bg-muted/10 border-border/50 bg-secondary/15 group py-6 rounded-2xl transition-all duration-200 hover:scale-[1.01]" onClick={() => navigate(`/trainer/routines/group/${selectedGroupId}`)}>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center transition-transform">
                          <Edit3 className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-foreground text-center leading-tight">Configurar Ejercicios</span>
                      </Button>
                    </div>

                    {showInlineRoutine && (
                      <div className="pt-5 border-t border-border/40 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Ejercicios por Día</h3>
                        </div>
                        {exercises.length === 0 ? (
                          <div className="text-center py-8 space-y-2 border border-dashed rounded-xl bg-secondary/10 border-border/50">
                            <Dumbbell className="h-6 w-6 mx-auto text-muted-foreground/35" />
                            <p className="text-xs text-muted-foreground font-semibold">El grupo no tiene ejercicios cargados</p>
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 hide-scrollbar">
                            {DAYS.map((day) => {
                              const dayExs = exercises.filter((e) => e.day === day);
                              if (dayExs.length === 0) return null;
                              return (
                                <div key={day} className="space-y-2">
                                  <Badge variant="outline" className="mb-1 border-primary/20 bg-primary/5 text-primary text-[8.5px] font-bold px-2 py-0.5 rounded">{day}</Badge>
                                  <div className="space-y-1.5">
                                    {dayExs.map((ex) => (
                                      <div key={ex.id} className="flex items-center gap-2 p-3 rounded-xl bg-secondary/15 border border-border/30">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-xs text-foreground truncate">{ex.name}</p>
                                          <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                                            {ex.body_part && <span className="text-primary font-bold">{ex.body_part} · </span>}
                                            {ex.sets} × {ex.is_to_failure ? <span className="text-destructive font-bold">Al Fallo</span> : `${ex.reps} REPS`}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
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
