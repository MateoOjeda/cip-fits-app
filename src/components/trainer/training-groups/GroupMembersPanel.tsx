import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, UserPlus, X } from "lucide-react";
import type { GroupMember } from "@/hooks/trainer/useTrainingGroups";

interface LinkedStudent {
  user_id: string;
  display_name: string;
}

interface GroupMembersPanelProps {
  groupName: string;
  members: GroupMember[];
  students: LinkedStudent[];
  showAddMembers: boolean;
  setShowAddMembers: (show: boolean) => void;
  availableStudentsForGroup: LinkedStudent[];
  selectedStudentIds: Set<string>;
  toggleStudentSelection: (id: string) => void;
  addMembers: () => void;
  removeMember: (id: string) => void;
  loadingDetail: boolean;
}

export const GroupMembersPanel: React.FC<GroupMembersPanelProps> = ({
  groupName,
  members,
  students,
  showAddMembers,
  setShowAddMembers,
  availableStudentsForGroup,
  selectedStudentIds,
  toggleStudentSelection,
  addMembers,
  removeMember,
}) => {
  return (
    <Card className="border border-border/40 bg-card rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-primary" />
            Miembros de "{groupName}"
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
                          {(s.display_name || "Alumno").substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-foreground">{s.display_name || "Alumno"}</span>
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
  );
};
