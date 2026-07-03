import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, ChevronRight, ClipboardList, Loader2 } from "lucide-react";

interface StudentSurveysTabProps {
  isLoadingSurveysPending: boolean;
  isLoadingSurveysResults: boolean;
  viewingSurvey: { type: 'custom' | 'diagnostic'; id?: string; data?: any } | null;
  setViewingSurvey: (v: { type: 'custom' | 'diagnostic'; id?: string; data?: any } | null) => void;
  pendingSurveys: any[];
  surveyResults: any[];
}

export function StudentSurveysTab({
  isLoadingSurveysPending,
  isLoadingSurveysResults,
  viewingSurvey,
  setViewingSurvey,
  pendingSurveys,
  surveyResults
}: StudentSurveysTabProps) {
  if (isLoadingSurveysPending || isLoadingSurveysResults) {
    return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (viewingSurvey && viewingSurvey.type !== 'diagnostic') {
    return (
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
            {!viewingSurvey.data.survey ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">Esta encuesta ha sido eliminada por el entrenador.</p>
            ) : viewingSurvey.data.survey?.questions?.length > 0 ? (
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
    );
  }

  return (
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
  );
}
