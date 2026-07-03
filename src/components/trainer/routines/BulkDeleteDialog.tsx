import React from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => void;
  deleting: boolean;
}

export const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  deleting,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="card-premium border-destructive/20 max-w-sm rounded-[2rem]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">¿Confirmar Eliminación?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Se eliminarán <span className="font-bold text-destructive">{selectedCount}</span> registros permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="rounded-xl border-none hover:bg-white/5">Cerrar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleting}
            className="bg-destructive hover:bg-destructive/80 text-white rounded-xl shadow-lg shadow-destructive/20"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
