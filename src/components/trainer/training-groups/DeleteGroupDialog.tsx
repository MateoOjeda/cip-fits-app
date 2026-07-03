import React from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { TrainingGroup } from "@/hooks/trainer/useTrainingGroups";

interface DeleteGroupDialogProps {
  deleteTarget: TrainingGroup | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting: boolean;
}

export const DeleteGroupDialog: React.FC<DeleteGroupDialogProps> = ({
  deleteTarget,
  onOpenChange,
  onConfirm,
  deleting,
}) => {
  return (
    <AlertDialog open={!!deleteTarget} onOpenChange={() => onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar grupo "{deleteTarget?.name}"?</AlertDialogTitle>
          <AlertDialogDescription>Se eliminarán todos los miembros y ejercicios del grupo. Esta acción no se puede deshacer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={deleting}>{deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
