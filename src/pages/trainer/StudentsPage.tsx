import { useState } from "react";
import { motion } from "framer-motion";
import { useStudentsManager } from "@/hooks/useStudentsManager";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { LinkedStudent } from "@/services/alumnos";

import { StudentsList } from "@/components/trainer/students/StudentsList";
import { AvailableStudentsList } from "@/components/trainer/students/AvailableStudentsList";
import { StudentDetailPanel } from "@/components/trainer/students/StudentDetailPanel";
import { CreateStudentDialog } from "@/components/trainer/students/CreateStudentDialog";

export default function StudentsPage() {
  const {
    linkedStudents,
    isLoadingLinked,
    availableStudents,
    isLoadingAvailable,
    linkStudent,
    unlinkStudent,
    deleteStudent,
    isDeleting,
    createStudentProfile,
    isCreatingProfile
  } = useStudentsManager();

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // States for Modals/Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newStudentData, setNewStudentData] = useState({ name: "", weight: "", age: "" });
  const [deleteTarget, setDeleteTarget] = useState<LinkedStudent | null>(null);
  const [unlinkingTargetId, setUnlinkingTargetId] = useState<string | null>(null);
  const [linkingTargetId, setLinkingTargetId] = useState<string | null>(null);

  // Handlers
  const handleLink = async (studentId: string) => {
    setLinkingTargetId(studentId);
    try {
      await linkStudent(studentId);
      toast.success("Alumno vinculado correctamente");
    } catch {
      toast.error("Error al vincular alumno");
    } finally {
      setLinkingTargetId(null);
    }
  };

  const handleUnlink = async (student: LinkedStudent) => {
    setUnlinkingTargetId(student.user_id);
    try {
      await unlinkStudent(student.user_id);
      toast.success("Alumno removido correctamente");
      if (selectedStudentId === student.user_id) setSelectedStudentId(null);
    } catch {
      toast.error("Error al remover alumno");
    } finally {
      setUnlinkingTargetId(null);
    }
  };

  const handleCreateStudent = async () => {
    try {
      await createStudentProfile({
        name: newStudentData.name.trim(),
        weight: newStudentData.weight ? parseFloat(newStudentData.weight) : undefined,
        age: newStudentData.age ? parseInt(newStudentData.age) : undefined,
      });
      toast.success("Alumno creado y vinculado correctamente");
      setShowCreateDialog(false);
      setNewStudentData({ name: "", weight: "", age: "" });
    } catch {
      toast.error("Error al crear alumno");
    }
  };

  const confirmDeleteStudent = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStudent(deleteTarget.user_id);
      toast.success("Alumno eliminado permanentemente");
      if (selectedStudentId === deleteTarget.user_id) setSelectedStudentId(null);
    } catch {
      toast.error("Error al eliminar alumno");
    } finally {
      setDeleteTarget(null);
    }
  };

  const selectedStudent = linkedStudents.find((s) => s.user_id === selectedStudentId) || null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Panel del Entrenador</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona y supervisa a tus alumnos de forma eficiente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 min-h-[70vh] relative z-10">
        
        {/* LEFT COLUMN: Lists */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
          <StudentsList
            students={linkedStudents}
            isLoading={isLoadingLinked}
            selectedStudentId={selectedStudentId}
            onSelect={setSelectedStudentId}
            onUnlink={handleUnlink}
            unlinkingId={unlinkingTargetId}
            onCreateClick={() => setShowCreateDialog(true)}
            itemVariants={itemVariants}
          />

          <AvailableStudentsList
            students={availableStudents}
            isLoading={isLoadingAvailable}
            onLink={handleLink}
            linkingId={linkingTargetId}
            itemVariants={itemVariants}
          />
        </motion.div>

        {/* RIGHT COLUMN: Details */}
        <StudentDetailPanel 
          student={selectedStudent} 
          onDeleteClick={setDeleteTarget} 
        />

      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar alumno permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{deleteTarget?.display_name}</strong> de forma permanente?
              Esta acción eliminará todos los ejercicios, planes, registros y seguimiento asociados.
              <span className="block mt-2 font-semibold text-destructive">Esta acción no se puede deshacer.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStudent}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sí, eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Student Dialog */}
      <CreateStudentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        newStudentData={newStudentData}
        setNewStudentData={setNewStudentData}
        onCreate={handleCreateStudent}
        isCreating={isCreatingProfile}
      />

    </div>
  );
}
