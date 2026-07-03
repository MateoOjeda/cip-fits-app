import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Trash2, Loader2, Sparkles, Save } from "lucide-react";
import { toast } from "sonner";
import { type LinkedStudentProfile } from "@/hooks/useLinkedStudents";

interface CreateSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  students: LinkedStudentProfile[];
  createSurveyMutation: any;
  assignSurveyMutation: any;
}

export function CreateSurveyDialog({
  open,
  onOpenChange,
  user,
  students,
  createSurveyMutation,
  assignSurveyMutation,
}: CreateSurveyDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);

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
      
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="ghost" className="h-10 text-xs rounded-xl hover:bg-muted/15 font-semibold text-muted-foreground" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreateSubmit} disabled={creating} className="h-10 text-xs rounded-xl font-bold shadow-sm">
            {creating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Guardar Encuesta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
