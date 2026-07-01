import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from "@/components/ui/premium-card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, UserMinus } from "lucide-react";
import { StudentCard } from "@/components/trainer/StudentCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DataToolbar } from "@/components/ui/data-toolbar";
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
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem("trainer_students_search") || "");

  useEffect(() => {
    localStorage.setItem("trainer_students_search", searchTerm);
  }, [searchTerm]);

  const filteredStudents = students.filter(student =>
    student.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div variants={itemVariants}>
      <PremiumCard className="overflow-hidden">
        <PremiumCardHeader className="p-0 border-none bg-transparent">
          <DataToolbar
            searchPlaceholder="Buscar alumno activo..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            onSearchClear={() => setSearchTerm("")}
            primaryActionText="Nuevo Alumno"
            onPrimaryAction={onCreateClick}
            className="border-none shadow-none mb-0 bg-transparent rounded-none p-4 pb-2"
          />
        </PremiumCardHeader>
        
        <PremiumCardContent className="p-4 pt-1 overflow-y-auto max-h-[45vh] hide-scrollbar">
          {isLoading ? (
            <LoadingSkeleton type="list" count={4} />
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              type={searchTerm ? "no-results" : "empty"}
              title={searchTerm ? "Sin coincidencias" : "Sin alumnos"}
              description={
                searchTerm 
                  ? `No se encontraron alumnos activos que coincidan con "${searchTerm}".`
                  : "Aún no tienes alumnos vinculados en tu cuenta de entrenador."
              }
            />
          ) : (
            <div className="space-y-1">
              {filteredStudents.map((student) => (
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
                      <StatusBadge
                        status={student.paymentStatus === "pagado" ? "pagado" : "pendiente"}
                        label={student.paymentStatus === "pagado" ? "✓ Pagado" : "⏳ Pendiente"}
                      />
                      {student.groupName && (
                        <StatusBadge
                          status="default"
                          label={student.groupName}
                          className="bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        />
                      )}
                    </div>
                  }
                  rightContent={
                    <Button
                      variant="ghost" 
                      size="icon"
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
                  className="mb-1 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                />
              ))}
            </div>
          )}
        </PremiumCardContent>
      </PremiumCard>
    </motion.div>
  );
}
