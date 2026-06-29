import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTrainerSurveys, useSurveyDetails } from "@/hooks/useTrainerSurveys";
import { useLinkedStudents } from "@/hooks/useLinkedStudents";
import { type CustomSurvey } from "@/services/surveys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Users, FileText, CheckCircle, Eye, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function TrainerSurveysPage() {
  const { user } = useAuth();
  const { students, loading: loadingStudents } = useLinkedStudents();

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

  // --- Create Survey Form State ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);

  // --- Assign Survey State ---
  const [assigning, setAssigning] = useState(false);
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);

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

  const assignedStudentIds = useMemo(() => {
    return assignments.map((a: any) => a.student_id);
  }, [assignments]);

  const loadingResults = isLoadingAssignments || isLoadingAnswers;

  // Set default selected student when results open
  useEffect(() => {
    if (resultsSurvey && assignments.length > 0 && !selectedResultStudent) {
      setSelectedResultStudent(assignments[0].student_id);
    }
  }, [resultsSurvey, assignments, selectedResultStudent]);

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
    if (!confirm("¿Seguro de que deseas eliminar esta encuesta?")) return;
    try {
      await deleteSurveyMutation(id);
      toast.success("Encuesta eliminada");
    } catch {
      toast.error("Error al eliminar la encuesta");
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
        for (const student of students) {
          await removeAssignmentMutation({ surveyId: assignSurvey.id, studentId: student.user_id });
        }
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

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Encuestas de Seguimiento</h1>
          <p className="text-sm text-muted-foreground mt-1">Crea formularios personalizados y obtén feedback estructurado de tus alumnos.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 h-10 rounded-xl text-xs font-semibold shadow-sm">
          <Plus className="h-4 w-4" /> Crear Encuesta
        </Button>
      </div>

      {surveys.length === 0 ? (
        <Card className="border border-border/50 border-dashed text-center p-12 bg-card rounded-xl">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/45 mb-3" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Sin encuestas</h3>
          <p className="text-xs text-muted-foreground mt-1">Todavía no has creado ninguna encuesta para tus alumnos.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map(survey => (
            <Card key={survey.id} className="border border-border/50 bg-card rounded-xl shadow-sm flex flex-col overflow-hidden">
              <CardHeader className="pb-3 p-4">
                <CardTitle className="text-sm font-bold text-foreground line-clamp-1" title={survey.title}>{survey.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground line-clamp-2 min-h-[36px]">{survey.description || "Sin descripción"}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-2 px-4">
                <div className="flex gap-2 items-center">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded-md shadow-none">
                    {survey.questions?.length || 0} Preguntas
                  </Badge>
                  {survey.is_global && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md shadow-none">
                      Global
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-3 px-4 flex justify-between gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8 text-xs font-semibold rounded-lg" onClick={() => openAssignModal(survey)}>
                  <Users className="h-3.5 w-3.5" /> Asignar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8 text-xs font-semibold rounded-lg" onClick={() => openResultsModal(survey)}>
                  <Eye className="h-3.5 w-3.5" /> Resultados
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0" onClick={() => handleDelete(survey.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE SURVEY DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Encuesta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título de la Encuesta</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Encuesta Inicial Mensual" />
            </div>
            <div className="space-y-2">
              <Label>Descripción (Opcional)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Instrucciones para tus alumnos..." className="resize-none" />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/20 bg-primary/5">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Encuesta Global</Label>
                <p className="text-[10px] text-muted-foreground">Se asignará automáticamente a todos tus alumnos registrados.</p>
              </div>
              <Switch checked={isGlobal} onCheckedChange={setIsGlobal} />
            </div>
            
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Preguntas</Label>
                <Button variant="outline" size="sm" onClick={handleAddQuestion} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Añadir Pregunta
                </Button>
              </div>
              
              {questions.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-lg bg-secondary/20">
                  <p className="text-sm text-muted-foreground">Agrega preguntas para comenzar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <Card key={idx} className="bg-secondary/10 border-border">
                      <CardContent className="p-4 space-y-3 relative">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="flex gap-4 items-start pr-8">
                          <div className="space-y-1.5 flex-1">
                            <Label className="text-xs text-muted-foreground">Pregunta {idx + 1}</Label>
                            <Input value={q.question_text} onChange={e => handleUpdateQuestion(idx, "question_text", e.target.value)} placeholder="¿Cuántos días a la semana entrenas?" />
                          </div>
                          <div className="space-y-1.5 w-[160px]">
                            <Label className="text-xs text-muted-foreground">Tipo</Label>
                            <Select value={q.question_type} onValueChange={v => handleUpdateQuestion(idx, "question_type", v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto Libre</SelectItem>
                                <SelectItem value="multiple_choice">Opciones</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {q.question_type === "multiple_choice" && (
                          <div className="pt-2 pl-2 border-l border-primary/30 space-y-2">
                            <Label className="text-xs text-muted-foreground">Opciones (separadas por coma)</Label>
                            <Input 
                              value={q.options ? q.options.join(", ") : ""} 
                              onChange={e => handleUpdateQuestion(idx, "options", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} 
                              placeholder="1 día, 2 días, 3 días..." 
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSubmit} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Encuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSIGN SURVEY DIALOG */}
      <Dialog open={!!assignSurvey} onOpenChange={(v) => !v && setAssignSurvey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar: {assignSurvey?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {students.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="text-xs font-bold uppercase text-primary tracking-wider">Asignar a todos</div>
                <Switch 
                  checked={assignedStudentIds.length === students.length && students.length > 0} 
                  onCheckedChange={handleAssignToAll}
                  disabled={assigning}
                />
              </div>
            )}
            
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">No tienes alumnos vinculados.</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {students.map(student => {
                  const isAssigned = assignedStudentIds.includes(student.user_id);
                  const isProcessing = assigningStudentId === student.user_id;

                  return (
                    <div key={student.user_id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-secondary/15 transition-opacity" style={{ opacity: isProcessing ? 0.6 : 1 }}>
                      <div className="flex-1 font-medium text-xs flex items-center gap-2">
                        {student.display_name}
                        {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {isAssigned && !isProcessing && <Badge variant="outline" className="text-[9px] font-bold bg-green-500/10 text-green-700 border-green-500/20 px-2 py-0.5 rounded-md shadow-none">Asignado</Badge>}
                        <Switch 
                          checked={isAssigned} 
                          onCheckedChange={(c) => handleToggleAssign(student.user_id, isAssigned)} 
                          disabled={isProcessing}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="p-6 border-b border-border bg-card">
            <DialogTitle>Resultados: {resultsSurvey?.title}</DialogTitle>
          </div>
          {loadingResults ? (
             <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="flex flex-1 overflow-hidden min-h-[500px]">
              {/* Sidebar filter */}
              <div className="w-[250px] border-r border-border bg-card/50 flex flex-col hidden sm:flex">
                <div className="p-3 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Alumnos Asignados
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                  {assignments.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">Sin asignaciones aún.</p>
                  ) : assignments.map(a => (
                    <button 
                      key={a.id} 
                      onClick={() => setSelectedResultStudent(a.student_id)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${selectedResultStudent === a.student_id ? "bg-primary/10 font-bold text-primary" : "hover:bg-secondary/50 text-muted-foreground font-semibold"}`}
                    >
                      <span className="truncate">{a.student?.display_name || "Alumno"}</span>
                      {a.completed ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-500 opacity-70" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Answers feed */}
              <div className="flex-1 overflow-y-auto p-6 bg-background">
                {!selectedResultStudent ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center max-w-sm mx-auto">
                    <Users className="h-8 w-8 mb-3 opacity-30" />
                    <p className="text-xs font-semibold uppercase tracking-wider">Respuestas</p>
                    <p className="text-xs mt-1 text-muted-foreground">Selecciona un alumno para ver sus respuestas</p>
                  </div>
                ) : (() => {
                  const assignment = assignments.find(a => a.student_id === selectedResultStudent);
                  if (!assignment) return null;
                  
                  if (!assignment.completed) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                        <AlertCircle className="h-8 w-8 mb-3 text-amber-500 opacity-80" />
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Encuesta Pendiente</p>
                        <p className="text-xs text-muted-foreground mt-1">El alumno aún no ha completado el formulario.</p>
                      </div>
                    );
                  }

                  const studentAnswers = answers.filter(ans => ans.student_id === selectedResultStudent);
                  
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm">
                          {assignment.student?.display_name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{assignment.student?.display_name}</h3>
                          <p className="text-[10px] text-muted-foreground">
                            Completado el {new Date(assignment.completed_at).toLocaleDateString()} a las {new Date(assignment.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {resultsSurvey?.questions?.map((q, i) => {
                          const answer = studentAnswers.find(a => a.question_id === q.id);
                          return (
                            <div key={q.id} className="p-4 rounded-xl bg-secondary/15 border border-border/50">
                              <p className="text-[9px] font-bold text-primary uppercase tracking-wider mb-1">Pregunta {i + 1}</p>
                              <p className="text-xs font-semibold mb-3 text-foreground">{q.question_text}</p>
                              <div className="bg-card rounded-lg p-3 text-xs text-foreground/80 border border-border/50 shadow-inner">
                                {answer ? answer.answer_text : <em className="opacity-50">Sin respuesta</em>}
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
    </div>
  );
}
