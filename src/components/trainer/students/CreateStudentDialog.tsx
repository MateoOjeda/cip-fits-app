import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input as UiInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, User, Calendar, Flame, Sparkles } from "lucide-react";

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
      <DialogContent className="sm:max-w-[440px] border border-border/40 bg-card/95 shadow-lg rounded-2xl overflow-hidden">
        <DialogHeader className="space-y-1.5 pb-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <DialogTitle className="text-base font-bold">Registrar Nuevo Alumno</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Crea una cuenta temporal para un alumno. Su perfil se vinculará automáticamente al ingresar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Nombre Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground/60" />
              <UiInput
                id="name"
                placeholder="Ej: Juan Pérez"
                value={newStudentData.name}
                onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                className="pl-10 h-11 text-xs border-border/50 bg-secondary/25 hover:bg-secondary/30 focus-visible:ring-primary/20"
              />
            </div>
            <p className="text-[10px] text-muted-foreground ml-0.5">El nombre será visible en tu listado de alumnos vinculados.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Edad (Opcional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground/60" />
                <UiInput
                  id="age"
                  type="number"
                  placeholder="25"
                  value={newStudentData.age}
                  onChange={(e) => setNewStudentData({ ...newStudentData, age: e.target.value })}
                  className="pl-10 h-11 text-xs border-border/50 bg-secondary/25 hover:bg-secondary/30 focus-visible:ring-primary/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Peso (Opcional)</Label>
              <div className="relative">
                <Flame className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground/60" />
                <UiInput
                  id="weight"
                  type="number"
                  placeholder="75.5 kg"
                  value={newStudentData.weight}
                  onChange={(e) => setNewStudentData({ ...newStudentData, weight: e.target.value })}
                  className="pl-10 h-11 text-xs border-border/50 bg-secondary/25 hover:bg-secondary/30 focus-visible:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border/40 flex items-center gap-2 justify-end">
          <Button variant="ghost" className="h-10 text-xs rounded-xl hover:bg-muted/15 font-semibold text-muted-foreground" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={onCreate} disabled={isCreating || !newStudentData.name.trim()} className="h-10 text-xs rounded-xl font-bold shadow-sm">
            {isCreating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
            Registrar Alumno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
