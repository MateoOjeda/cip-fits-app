import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type LinkedStudentProfile } from "@/hooks/useLinkedStudents";
import { type CustomSurvey, removeSurveyAssignment } from "@/services/surveys";

interface AssignSurveyDialogProps {
  assignSurvey: CustomSurvey | null;
  onOpenChange: (open: boolean) => void;
  students: LinkedStudentProfile[];
  assignedStudentIds: string[];
  user: any;
  queryClient: any;
  assignSurveyMutation: any;
  removeAssignmentMutation: any;
}

export function AssignSurveyDialog({
  assignSurvey,
  onOpenChange,
  students,
  assignedStudentIds,
  user,
  queryClient,
  assignSurveyMutation,
  removeAssignmentMutation,
}: AssignSurveyDialogProps) {
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

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
        await Promise.all(
          students.map(student => removeSurveyAssignment(assignSurvey.id, student.user_id))
        );
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

  return (
    <Dialog open={!!assignSurvey} onOpenChange={onOpenChange}>
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
                        {(student.display_name || "Alumno").substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{student.display_name || "Alumno"}</span>
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
  );
}
