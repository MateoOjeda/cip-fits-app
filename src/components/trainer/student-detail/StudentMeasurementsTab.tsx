import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface StudentMeasurementsTabProps {
  profile: any;
}

export function StudentMeasurementsTab({ profile }: StudentMeasurementsTabProps) {
  return (
    <Card className="border border-border/40 bg-card/60 rounded-xl p-6 text-center">
      <TrendingUp className="h-8 w-8 mx-auto text-primary mb-3 opacity-70" />
      <h3 className="text-sm font-bold text-foreground">Registro de Mediciones Corporales</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
        El alumno puede registrar sus mediciones periódicamente para graficar pliegues, perímetros musculares y porcentaje de grasa.
      </p>
      <div className="mt-4 flex justify-center gap-4">
        <div className="text-center p-3 bg-secondary/20 border rounded-xl min-w-[100px]">
          <span className="text-[9px] text-muted-foreground block">Peso Promedio</span>
          <span className="text-xs font-bold text-foreground">{profile.weight ? `${profile.weight} kg` : "—"}</span>
        </div>
        <div className="text-center p-3 bg-secondary/20 border rounded-xl min-w-[100px]">
          <span className="text-[9px] text-muted-foreground block">Altura</span>
          <span className="text-xs font-bold text-foreground">{profile.height ? `${profile.height} cm` : "—"}</span>
        </div>
      </div>
    </Card>
  );
}
