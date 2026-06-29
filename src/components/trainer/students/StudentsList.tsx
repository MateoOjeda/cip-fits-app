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
      <Card className="border border-border/50 bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-4 border-b border-border/50 bg-muted/40">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                <Users className="h-4.5 w-4.5" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">
                Alumnos ({students.length})
              </CardTitle>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 px-2 text-primary hover:bg-primary/10 transition-colors rounded-lg text-xs font-semibold" 
              onClick={onCreateClick}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 overflow-y-auto max-h-[45vh] hide-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-7 w-7 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-xs text-muted-foreground font-medium">Sin alumnos vinculados</p>
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
                    <div className="flex gap-1.5 items-center mt-1 flex-wrap">
                      <Badge variant="outline" className={cn(
                        "border-none shadow-none text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                        student.paymentStatus === "pagado" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      )}>
                        {student.paymentStatus === "pagado" ? "✓" : "⏳"} {student.paymentStatus === "pagado" ? "Pagado" : "Pendiente"}
                      </Badge>
                      {student.groupName && (
                        <Badge className="border-none shadow-none bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          {student.groupName}
                        </Badge>
                      )}
                    </div>
                  }
                  rightContent={
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-lg group/btn"
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
                        <UserMinus className="h-4 w-4 group-hover/btn:scale-105 transition-transform" />
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
