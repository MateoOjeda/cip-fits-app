import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FileText, Users, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { type CustomSurvey } from "@/services/surveys";

interface SurveyResultsDialogProps {
  resultsSurvey: CustomSurvey | null;
  onOpenChange: (open: boolean) => void;
  loadingResults: boolean;
  currentAssignments: any[];
  currentAnswers: any[];
}

export function SurveyResultsDialog({
  resultsSurvey,
  onOpenChange,
  loadingResults,
  currentAssignments,
  currentAnswers,
}: SurveyResultsDialogProps) {
  const [selectedResultStudent, setSelectedResultStudent] = useState<string | null>(null);

  useEffect(() => {
    if (resultsSurvey && currentAssignments.length > 0 && !selectedResultStudent) {
      setSelectedResultStudent(currentAssignments[0].student_id);
    }
  }, [resultsSurvey, currentAssignments, selectedResultStudent]);

  return (
    <Dialog open={!!resultsSurvey} onOpenChange={onOpenChange}>
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
                        {(assignment.student?.display_name || "Alumno").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-foreground">{assignment.student?.display_name || "Alumno sin Perfil"}</h3>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          Completado el {assignment.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : "—"} a las {assignment.completed_at ? new Date(assignment.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {resultsSurvey?.questions?.map((q: any, i: number) => {
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
  );
}
