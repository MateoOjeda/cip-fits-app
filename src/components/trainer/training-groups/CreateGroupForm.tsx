import React from "react";
import { PremiumCard, PremiumCardContent } from "@/components/ui/premium-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users, Loader2 } from "lucide-react";

interface CreateGroupFormProps {
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  creating: boolean;
  createGroup: () => void;
}

export const CreateGroupForm: React.FC<CreateGroupFormProps> = ({
  newGroupName,
  setNewGroupName,
  creating,
  createGroup,
}) => {
  return (
    <PremiumCard className="overflow-hidden">
      <PremiumCardContent className="p-5 space-y-3.5">
        <div className="space-y-1">
          <Label htmlFor="group-name-input" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Nuevo Grupo de Entrenamiento</Label>
          <p className="text-[10px] text-muted-foreground ml-0.5">Asigna un nombre descriptivo para identificar a tus alumnos grupales (ej: Principiantes Mañana, Fuerza Avanzado).</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Users className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-muted-foreground/60" />
            <Input
              id="group-name-input"
              placeholder="Nombre del grupo..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createGroup()}
              className="pl-11 h-12 text-xs border-border/50 bg-secondary/15 hover:bg-secondary/25 focus-visible:ring-primary/20"
            />
          </div>
          <Button onClick={createGroup} disabled={creating || !newGroupName.trim()} className="h-12 rounded-xl text-xs font-bold px-6 shadow-sm shrink-0">
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4.5 w-4.5 mr-1.5" />}
            Crear Grupo
          </Button>
        </div>
      </PremiumCardContent>
    </PremiumCard>
  );
};
