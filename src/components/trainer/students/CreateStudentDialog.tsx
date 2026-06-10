import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input as UiInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";

interface CreateStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newStudentData: { name: string; weight: string; age: string };
  setNewStudentData: (data: { name: string; weight: string; age: string }) => void;
  onCreate: () => void;
  isCreating: boolean;
}

export function CreateStudentDialog({
  open,
  onOpenChange,
  newStudentData,
  setNewStudentData,
  onCreate,
  isCreating
}: CreateStudentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
          <DialogDescription>
            Crea un perfil para un alumno que aún no se ha registrado en la plataforma.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <UiInput
              id="name"
              placeholder="Ej: Juan Pérez"
              value={newStudentData.name}
              onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="age">Edad (Opcional)</Label>
              <UiInput
                id="age"
                type="number"
                placeholder="25"
                value={newStudentData.age}
                onChange={(e) => setNewStudentData({ ...newStudentData, age: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weight">Peso kg (Opcional)</Label>
              <UiInput
                id="weight"
                type="number"
                placeholder="75.5"
                value={newStudentData.weight}
                onChange={(e) => setNewStudentData({ ...newStudentData, weight: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={onCreate} disabled={isCreating || !newStudentData.name.trim()}>
            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Crear Alumno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
