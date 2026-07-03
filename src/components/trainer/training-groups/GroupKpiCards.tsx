import React from "react";
import { PremiumCard, PremiumCardContent } from "@/components/ui/premium-card";
import { Users, Dumbbell } from "lucide-react";
import type { GroupMember, GroupExercise, TrainingGroup } from "@/hooks/trainer/useTrainingGroups";

interface GroupKpiCardsProps {
  groups: TrainingGroup[];
  selectedGroup: TrainingGroup | null | undefined;
  members: GroupMember[];
  exercises: GroupExercise[];
}

export const GroupKpiCards: React.FC<GroupKpiCardsProps> = ({
  groups,
  selectedGroup,
  members,
  exercises,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <PremiumCard className="hover:border-primary/20">
        <PremiumCardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Grupos Creados</p>
            <h3 className="text-base font-bold text-foreground mt-0.5">{groups.length} Activos</h3>
          </div>
        </PremiumCardContent>
      </PremiumCard>

      <PremiumCard className="hover:border-blue-500/20">
        <PremiumCardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Miembros en Grupo</p>
            <h3 className="text-base font-bold text-foreground mt-0.5">
              {selectedGroup ? `${members.length} Integrantes` : "Sin seleccionar"}
            </h3>
          </div>
        </PremiumCardContent>
      </PremiumCard>

      <PremiumCard className="hover:border-emerald-500/20">
        <PremiumCardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Rutinas de Grupo</p>
            <h3 className="text-base font-bold text-foreground mt-0.5">
              {selectedGroup ? `${exercises.length} Ejercicios` : "Sin seleccionar"}
            </h3>
          </div>
        </PremiumCardContent>
      </PremiumCard>
    </div>
  );
};
