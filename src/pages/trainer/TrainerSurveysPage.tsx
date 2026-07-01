import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTrainerSurveys, useSurveyDetails } from "@/hooks/useTrainerSurveys";
import { useLinkedStudents } from "@/hooks/useLinkedStudents";
import { type CustomSurvey, removeSurveyAssignment } from "@/services/surveys";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Users, FileText, CheckCircle, Eye, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle, PremiumCardFooter } from "@/components/ui/premium-card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { SectionHeader } from "@/components/ui/section-header";
import { FileText as FileTextIcon } from "lucide-react";

export default function TrainerSurveysPage() {
  const { user } = useAuth();
  const { students, loading: loadingStudents } = useLinkedStudents();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    surveys,
    isLoading: loading,
    createSurvey: createSurveyMutation,
    deleteSurvey: deleteSurveyMutation,
    assignSurvey: assignSurveyMutation,
    removeAssignment: removeAssignmentMutation
  } = useTrainerSurveys(user?.uid);

  // States for Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [assignSurvey, setAssignSurvey] = useState<CustomSurvey | null>(null);
  const [resultsSurvey, setResultsSurvey] = useState<CustomSurvey | null>(null);

  const [deleteSurveyId, setDeleteSurveyId] = useState<string | null>(null);

  // --- Create Survey Form State ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);

  // --- Assign Survey State ---
  const [assigning, setAssigning] = useState(false);
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // --- Results State ---
  const [selectedResultStudent, setSelectedResultStudent] = useState<string | null>(null);

  // Fetch active survey details (assignments & answers) Reactively
  const activeSurveyId = assignSurvey?.id || resultsSurvey?.id;
  const { 
    assignments, 
    answers, 
    isLoadingAssignments, 
    isLoadingAnswers 
  } = useSurveyDetails(activeSurveyId);

  // Computed variables to prevent showing stale cache data (Race Condition fix)
  const currentAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];
    if (assignments[0].survey_id !== activeSurveyId) return [];
    return assignments;
  }, [assignments, activeSurveyId]);

  const currentAnswers = useMemo(() => {
    if (!answers || answers.length === 0) return [];
    const hasCorrectSurveyId = assignments.length > 0 && assignments[0].survey_id === activeSurveyId;
    if (!hasCorrectSurveyId) return [];
    return answers;
  }, [answers, assignments, activeSurveyId]);

  const assignedStudentIds = useMemo(() => {
    return currentAssignments.map((a: any) => a.student_id);
  }, [currentAssignments]);

  const loadingResults = isLoadingAssignments || isLoadingAnswers;

  // Set default selected student when results open
  useEffect(() => {
    if (resultsSurvey && currentAssignments.length > 0 && !selectedResultStudent) {
      setSelectedResultStudent(currentAssignments[0].student_id);
    }
  }, [resultsSurvey, currentAssignments, selectedResultStudent]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question_text: "", question_type: "text", options: [] }]);
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleCreateSubmit = async () => {
    if (!title.trim()) return toast.error("El título es obligatorio");
    if (questions.length === 0) return toast.error("Agrega al menos una pregunta");
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question_text.trim()) return toast.error(`La pregunta ${i + 1} está vacía`);
      if (questions[i].question_type === "multiple_choice" && (!questions[i].options || questions[i].options.length === 0)) {
        return toast.error(`La pregunta ${i + 1} necesita opciones`);
      }
    }

    if (!user) return;
    setCreating(true);
    try {
      const newSurvey = await createSurveyMutation({
        title,
        description,
        questions,
        isGlobal
      });
      
      if (isGlobal) {
        if (students.length > 0) {
          await assignSurveyMutation({ surveyId: newSurvey.id, studentIds: students.map(s => s.user_id) });
          toast.success(`Encuesta global creada y asignada a ${students.length} alumnos`);
        } else {
          toast.success("Encuesta global creada (sin alumnos vinculados aún)");
        }
      } else {
        toast.success("Encuesta creada correctamente");
      }
      
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setQuestions([]);
      setIsGlobal(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Error al crear encuesta");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteSurveyId(id);
  };

  const confirmDelete = async () => {
    if (!deleteSurveyId) return;
    try {
      await deleteSurveyMutation(deleteSurveyId);
      toast.success("Encuesta eliminada");
    } catch {
      toast.error("Error al eliminar la encuesta");
    } finally {
      setDeleteSurveyId(null);
    }
  };

  // --- Assign Modal Handlers ---
  const openAssignModal = (survey: CustomSurvey) => {
    setAssignSurvey(survey);
  };

  const handleToggleAssign = async (studentId: string, isAssigned: boolean) => {
    if (!assignSurvey) return;
    setAssigningStudentId(studentId);
    try {
      if (isAssigned) {
        await removeAssignmentMutation({ surveyId: assignSurvey.id, studentId });
        toast.info("Asignación removida");
      } else {
        await assignSurveyMutation({ surveyId: assignSurvey.id, studentIds: [studentId] });
        toast.success("Encuesta asignada");
      }
    } catch {
      toast.error("Error al actualizar asignación");
    } finally {
      setAssigningStudentId(null);
    }
  };

  const handleAssignToAll = async (assign: boolean) => {
    if (!assignSurvey || !user) return;
    setAssigning(true);
    try {
      if (assign) {
        const studentIds = students.map(s => s.user_id);
        await assignSurveyMutation({ surveyId: assignSurvey.id, studentIds });
        toast.success("Asignado a todos los alumnos");
      } else {
        // Remove assignments in parallel directly through the service
        await Promise.all(
          students.map(student => removeSurveyAssignment(assignSurvey.id, student.user_id))
        );
        // Invalidate React Query cache once
        queryClient.invalidateQueries({ queryKey: ["surveyAssignments", assignSurvey.id] });
        students.forEach(student => {
          queryClient.invalidateQueries({ queryKey: ["studentPendingSurveys", student.user_id] });
        });
        toast.info("Asignaciones removidas para todos");
      }
    } catch {
      toast.error("Error al actualizar asignaciones masivas");
    } finally {
      setAssigning(false);
    }
  };

  // --- Results Modal Handlers ---
  const openResultsModal = (survey: CustomSurvey) => {
    setResultsSurvey(survey);
    setSelectedResultStudent(null);
  };

  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (survey.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <SectionHeader
        title="Encuestas de Seguimiento"
        description="Crea formularios personalizados y obtén feedback estructurado de tus alumnos."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5 h-10 rounded-xl text-xs font-semibold shadow-sm">
            <Plus className="h-4 w-4" /> Crear Encuesta
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PremiumCard className="hover:border-primary/20">
          <PremiumCardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
              <FileTextIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Encuestas</p>
              <h3 className="text-base font-bold text-foreground mt-0.5">{surveys.length} Creadas</h3>
            </div>
          </PremiumCardContent>
        </PremiumCard>

        <PremiumCard className="hover:border-blue-500/20">
          <PremiumCardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
              <StatusBadge status="global" label="Global" className="h-4.5 scale-90" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Encuestas Globales</p>
              <h3 className="text-base font-bold text-foreground mt-0.5">{surveys.filter(s => s.is_global).length} Disponibles</h3>
            </div>
          </PremiumCardContent>
        </PremiumCard>

        <PremiumCard className="hover:border-emerald-500/20">
          <PremiumCardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Alumnos Totales</p>
              <h3 className="text-base font-bold text-foreground mt-0.5">{students.length} Activos</h3>
            </div>
          </PremiumCardContent>
        </PremiumCard>
      </div>

      <DataToolbar
        searchPlaceholder="Buscar encuesta por título..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery("")}
        className="mb-4"
      />

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : filteredSurveys.length === 0 ? (
        <EmptyState
          type={searchQuery ? "no-results" : "empty"}
          title={searchQuery ? "Sin coincidencias" : "Sin encuestas"}
          description={
            searchQuery 
              ? `No se encontraron encuestas que coincidan con "${searchQuery}".`
              : "Todavía no has creado ninguna encuesta para tus alumnos."
          }
          actionText={searchQuery ? "Limpiar Búsqueda" : "Crear mi primera encuesta"}
          onAction={searchQuery ? () => setSearchQuery("") : () => setCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSurveys.map(survey => (
            <PremiumCard key={survey.id} className="flex flex-col hover:scale-[1.01]">
              <PremiumCardHeader className="pb-2 p-4">
                <PremiumCardTitle className="text-xs font-bold text-foreground line-clamp-1" title={survey.title}>{survey.title}</PremiumCardTitle>
                <CardDescription className="text-[11px] text-muted-foreground line-clamp-2 min-h-[32px] mt-0.5 leading-relaxed">{survey.description || "Sin descripción descriptiva"}</CardDescription>
              </PremiumCardHeader>
              <PremiumCardContent className="flex-1 pb-3 px-4">
                <div className="flex gap-2 items-center">
                  <StatusBadge status="default" label={`${survey.questions?.length || 0} Preguntas`} />
                  {survey.is_global && (
                    <StatusBadge status="global" label="Global" />
                  )}
                </div>
              </PremiumCardContent>
              <PremiumCardFooter className="pt-2 pb-3.5 px-4 flex justify-between gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8 text-[11px] font-bold rounded-lg border-border" onClick={() => openAssignModal(survey)}>
                  <Users className="h-3.5 w-3.5 text-muted-foreground" /> Asignar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8 text-[11px] font-bold rounded-lg border-border" onClick={() => openResultsModal(survey)}>
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" /> Resultados
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 transition-colors" onClick={() => handleDelete(survey.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </PremiumCardFooter>
            </PremiumCard>
          ))}
        </div>
      )}

      {/* CREATE SURVEY DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border border-border/40 bg-card/95 shadow-xl rounded-2xl">
          <DialogHeader className="space-y-1.5 pb-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <DialogTitle className="text-base font-bold">Nueva Encuesta de Seguimiento</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Define el título, descripción y preguntas para recopilar feedback de tus alumnos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Título de la Encuesta</Label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Ej: Encuesta de Hábitos Iniciales" 
                className="h-11 text-xs border-border/50 bg-secondary/15 hover:bg-secondary/25 focus-visible:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Descripción (Opcional)</Label>
              <Textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Instrucciones para tus alumnos (ej: Por favor responde con la mayor sinceridad posible)..." 
                className="resize-none text-xs border-border/50 bg-secondary/15 hover:bg-secondary/25 min-h-[80px]" 
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/20 bg-primary/5">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                  Asignación Global Automática
                </Label>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Se asignará automáticamente a todos tus alumnos actuales y nuevos que vincules en el futuro.
                </p>
              </div>
              <Switch checked={isGlobal} onCheckedChange={setIsGlobal} className="data-[state=checked]:bg-primary" />
            </div>
            
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <Label className="text-sm font-bold text-foreground">Preguntas del Formulario</Label>
                <Button variant="outline" size="sm" onClick={handleAddQuestion} className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-primary/30 text-primary hover:bg-primary/5">
                  <Plus className="h-3.5 w-3.5" /> Añadir Pregunta
                </Button>
              </div>
              
              {questions.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-xl bg-secondary/10 border-border/60">
                  <FileText className="h-7 w-7 mx-auto text-muted-foreground/35 mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">No has agregado ninguna pregunta todavía</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Haz clic en "Añadir Pregunta" para comenzar a configurar tu encuesta.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <Card key={idx} className="bg-card/40 border border-border/40 rounded-xl overflow-hidden shadow-sm relative group/card">
                      <CardContent className="p-4 space-y-3.5 relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" 
                          onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex flex-col sm:flex-row gap-4 items-start pr-8">
                          <div className="space-y-1.5 flex-1 w-full">
                            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Enunciado de la Pregunta {idx + 1}</Label>
                            <Input 
                              value={q.question_text} 
                              onChange={e => handleUpdateQuestion(idx, "question_text", e.target.value)} 
                              placeholder="Ej: ¿Qué alimentos consumes antes de entrenar?" 
                              className="h-10 text-xs bg-secondary/10"
                            />
                          </div>
                          <div className="space-y-1.5 w-full sm:w-[160px]">
                            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Tipo de Respuesta</Label>
                            <Select value={q.question_type} onValueChange={v => handleUpdateQuestion(idx, "question_type", v)}>
                              <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto Libre</SelectItem>
                                <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {q.question_type === "multiple_choice" && (
                          <div className="pt-2 pl-3 border-l-2 border-primary/30 space-y-1.5 animate-in slide-in-from-left-2">
                            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Opciones de Respuesta</Label>
                            <Input 
                              value={q.options ? q.options.join(", ") : ""} 
                              onChange={e => handleUpdateQuestion(idx, "options", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} 
                              placeholder="Ej: Sí, No, A veces (separadas por comas)" 
                              className="h-9 text-xs bg-secondary/10"
                            />
                            <p className="text-[9px] text-muted-foreground ml-0.5">Escribe las opciones que el alumno podrá elegir separadas por una coma.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border/40 flex items-center justify-end gap-2">
            <Button variant="ghost" className="h-10 text-xs rounded-xl hover:bg-muted/15 font-semibold text-muted-foreground" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSubmit} disabled={creating} className="h-10 text-xs rounded-xl font-bold shadow-sm">
              {creating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Guardar Encuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSIGN SURVEY DIALOG */}
      <Dialog open={!!assignSurvey} onOpenChange={(v) => !v && setAssignSurvey(null)}>
        <DialogContent className="max-w-md border border-border/40 bg-card/95 shadow-xl rounded-2xl">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-primary" />
              Asignar: {assignSurvey?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {students.length > 0 && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/5 border border-primary/20 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Asignar a todos los alumnos</div>
                <Switch 
                  checked={assignedStudentIds.length === students.length && students.length > 0} 
                  onCheckedChange={handleAssignToAll}
                  disabled={assigning}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            )}
            
            {students.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-7 w-7 mx-auto text-muted-foreground/35 mb-2" />
                <p className="text-xs text-muted-foreground font-semibold">No tienes alumnos vinculados</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 select-none hide-scrollbar">
                {students.map(student => {
                  const isAssigned = assignedStudentIds.includes(student.user_id);
                  const isProcessing = assigningStudentId === student.user_id;
 
                  return (
                    <div key={student.user_id} className={cn(
                      "flex items-center justify-between p-3 rounded-xl border border-border/40 bg-secondary/15 hover:bg-secondary/25 transition-all duration-200",
                      isProcessing && "opacity-60"
                    )}>
                      <div className="flex-1 text-xs font-semibold flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[10px] shrink-0">
                          {student.display_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{student.display_name}</span>
                        {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/60" />}
                      </div>
                      <div className="flex items-center gap-3">
                        {isAssigned && !isProcessing && (
                          <Badge variant="outline" className="border-none shadow-none text-[8.5px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">
                            Asignado
                          </Badge>
                        )}
                        <Switch 
                          checked={isAssigned} 
                          onCheckedChange={(c) => handleToggleAssign(student.user_id, isAssigned)} 
                          disabled={isProcessing}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* RESULTS DIALOG */}
      <Dialog open={!!resultsSurvey} onOpenChange={(v) => !v && setResultsSurvey(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border border-border/40 bg-card/95 shadow-xl rounded-2xl">
          <div className="p-5 border-b border-border/40 bg-muted/20 flex-shrink-0 flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-primary" />
              Resultados: {resultsSurvey?.title}
            </DialogTitle>
          </div>
          {loadingResults ? (
             <div className="p-6 flex-1 overflow-hidden"><LoadingSkeleton type="results" count={3} /></div>
          ) : (
            <div className="flex flex-1 overflow-hidden min-h-[500px]">
              {/* Sidebar filter */}
              <div className="w-[240px] border-r border-border/40 bg-secondary/15 flex flex-col hidden sm:flex shrink-0">
                <div className="p-3.5 border-b border-border/40 text-[9px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/10">
                  Alumnos Asignados
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1 hide-scrollbar">
                  {currentAssignments.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground p-3 italic">Sin asignaciones aún.</p>
                  ) : currentAssignments.map(a => (
                    <button 
                      key={a.id} 
                      type="button"
                      onClick={() => setSelectedResultStudent(a.student_id)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs transition-all duration-200 flex items-center justify-between",
                        selectedResultStudent === a.student_id 
                          ? "bg-primary/10 font-bold text-primary shadow-sm" 
                          : "hover:bg-secondary/25 text-muted-foreground hover:text-foreground font-semibold"
                      )}
                    >
                      <span className="truncate pr-2">{a.student?.display_name || "Alumno"}</span>
                      {a.completed 
                        ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> 
                        : <AlertCircle className="h-3.5 w-3.5 text-amber-500 opacity-60 shrink-0" />
                      }
                    </button>
                  ))}
                </div>
              </div>

              {/* Answers feed */}
              <div className="flex-1 overflow-y-auto p-6 bg-background hide-scrollbar">
                {!selectedResultStudent ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center max-w-xs mx-auto space-y-3">
                    <div className="p-3 bg-secondary/25 border border-border/40 rounded-full text-muted-foreground/45">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Ver Respuestas</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Selecciona uno de los alumnos asignados en la barra lateral para inspeccionar sus respuestas individuales.
                      </p>
                    </div>
                  </div>
                ) : (() => {
                  const assignment = currentAssignments.find(a => a.student_id === selectedResultStudent);
                  if (!assignment) return null;
                  
                  if (!assignment.completed) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center space-y-3">
                        <AlertCircle className="h-8 w-8 text-amber-500 animate-pulse" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Encuesta Pendiente</p>
                          <p className="text-[10px] text-muted-foreground">El alumno aún no ha completado las respuestas de este formulario.</p>
                        </div>
                      </div>
                    );
                  }

                  const studentAnswers = currentAnswers.filter(ans => ans.student_id === selectedResultStudent);
                  
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3.5 pb-4 border-b border-border/40">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-xs shrink-0">
                          {assignment.student?.display_name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-foreground">{assignment.student?.display_name}</h3>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            Completado el {new Date(assignment.completed_at).toLocaleDateString()} a las {new Date(assignment.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {resultsSurvey?.questions?.map((q, i) => {
                          const answer = studentAnswers.find(a => a.question_id === q.id);
                          return (
                            <div key={q.id} className="p-4 rounded-2xl bg-secondary/15 border border-border/40 space-y-3">
                              <div className="space-y-0.5">
                                <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Pregunta {i + 1}</p>
                                <p className="text-xs font-bold text-foreground leading-snug">{q.question_text}</p>
                              </div>
                              <div className="bg-card rounded-xl p-3.5 text-xs text-foreground/85 border border-border/50 shadow-inner leading-relaxed">
                                {answer ? answer.answer_text : <em className="text-muted-foreground/50 font-medium">Sin respuesta registrada</em>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE SURVEY DIALOG */}
      <AlertDialog open={!!deleteSurveyId} onOpenChange={(open) => !open && setDeleteSurveyId(null)}>
        <AlertDialogContent className="max-w-md border border-border/40 bg-card/95 shadow-xl rounded-2xl">
          <AlertDialogHeader className="pb-3 border-b border-border/40">
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Eliminar Encuesta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">
              ¿Estás seguro de que deseas eliminar esta encuesta? Esta acción es permanente, eliminará todas las asignaciones vinculadas a los alumnos y no se podrá deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 border-t border-border/40 flex justify-end gap-2">
            <AlertDialogCancel className="h-9 px-4 rounded-xl text-xs font-semibold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4 rounded-xl text-xs font-bold shadow-sm">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
