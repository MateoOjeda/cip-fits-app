import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Plus } from "lucide-react";
import { StudentCard } from "@/components/trainer/StudentCard";
import type { AvailableStudent } from "@/services/alumnos";

interface AvailableStudentsListProps {
  students: AvailableStudent[];
  isLoading: boolean;
  onLink: (id: string) => void;
  linkingId: string | null;
  itemVariants: any;
}

export function AvailableStudentsList({
  students,
  isLoading,
  onLink,
  linkingId,
  itemVariants
}: AvailableStudentsListProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border border-border/50 bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-4 border-b border-border/50 bg-muted/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
              <Users className="h-4.5 w-4.5" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground">
              Disponibles ({students.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3 overflow-y-auto max-h-[40vh] hide-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-7 w-7 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-xs text-muted-foreground font-medium">No hay alumnos disponibles</p>
            </div>
          ) : (
            <div className="space-y-1">
              {students.map((student) => (
                <StudentCard
                  key={student.user_id}
                  name={student.display_name}
                  avatarUrl={student.avatar_url}
                  avatarInitials={student.avatar_initials}
                  size="sm"
                  rightContent={
                    <Button
                      size="sm" variant="outline"
                      className="gap-1 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 flex-shrink-0 h-8 px-3 rounded-lg text-xs font-semibold"
                      disabled={linkingId === student.user_id}
                      onClick={() => onLink(student.user_id)}
                    >
                      {linkingId === student.user_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Agregar
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
