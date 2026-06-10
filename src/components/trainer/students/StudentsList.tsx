import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Plus, UserMinus } from "lucide-react";
import { StudentCard } from "@/components/trainer/StudentCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LinkedStudent } from "@/services/alumnos";

interface StudentsListProps {
  students: LinkedStudent[];
  isLoading: boolean;
  selectedStudentId: string | null;
  onSelect: (id: string) => void;
  onUnlink: (student: LinkedStudent) => void;
  unlinkingId: string | null;
  onCreateClick: () => void;
  itemVariants: any;
}

export function StudentsList({
  students,
  isLoading,
  selectedStudentId,
  onSelect,
  onUnlink,
  unlinkingId,
  onCreateClick,
  itemVariants
}: StudentsListProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="glass-panel overflow-hidden border-accent/20 rounded-2xl group">
        <CardHeader className="p-5 pb-3 bg-accent/5 backdrop-blur-md border-b border-white/5">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/10 rounded-lg text-accent">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="text-base text-accent font-display tracking-wide">
                Alumnos ({students.length})
              </CardTitle>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 px-2 text-accent hover:bg-accent/20 transition-colors rounded-lg" 
              onClick={onCreateClick}
            >
              <Plus className="h-4 w-4 mr-1" /> Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 overflow-y-auto max-h-[45vh] hide-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Sin alumnos vinculados</p>
            </div>
          ) : (
            <div className="space-y-1">
              {students.map((student) => (
                <StudentCard
                  key={student.user_id}
                  name={student.display_name}
                  avatarUrl={student.avatar_url}
                  avatarInitials={student.avatar_initials}
                  active={selectedStudentId === student.user_id}
                  onClick={() => onSelect(student.user_id)}
                  size="sm"
                  subtitle={
                    <>
                      <Badge variant="outline" className={cn(
                        "border-none shadow-sm shadow-black/20 text-[9px] px-1.5 h-4",
                        student.paymentStatus === "pagado" ? "badge-status-pagado" : "badge-status-pendiente"
                      )}>
                        {student.paymentStatus === "pagado" ? "✓" : "⏳"} {student.paymentStatus === "pagado" ? "Pagado" : "Pendiente"}
                      </Badge>
                      {student.groupName && (
                        <Badge className="badge-info-tag border-none shadow-sm shadow-black/20 text-[9px] px-1.5 h-4">
                          {student.groupName}
                        </Badge>
                      )}
                    </>
                  }
                  rightContent={
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors group/btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnlink(student);
                      }}
                      disabled={unlinkingId === student.user_id}
                      title="Remover alumno"
                    >
                      {unlinkingId === student.user_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                      )}
                    </Button>
                  }
                  className="mb-1"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
