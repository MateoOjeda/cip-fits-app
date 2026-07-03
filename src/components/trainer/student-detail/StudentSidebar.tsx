import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Target, Users } from "lucide-react";

interface StudentSidebarProps {
  profile: any;
  groupName?: string | null;
  selectedEntrenamiento: string;
  selectedAlimentacion: string;
}

export function StudentSidebar({
  profile,
  groupName,
  selectedEntrenamiento,
  selectedAlimentacion
}: StudentSidebarProps) {
  return (
    <Card className="border border-border/40 bg-card/40 rounded-2xl shadow-sm overflow-hidden h-fit">
      <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ficha de Datos Fijos</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Contact info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Email</p>
              <p className="text-xs font-semibold text-foreground truncate">{profile.email || "Sin registrar"}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Teléfono</p>
              <p className="text-xs font-semibold text-foreground truncate">{profile.phone || "Sin registrar"}</p>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-border/40 w-full" />

        {/* Physical Profile */}
        <div className="space-y-3">
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Métricas Físicas</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/30 border border-border/40 p-2 rounded-lg text-center">
                <span className="text-[9px] text-muted-foreground block">Peso inicial</span>
                <span className="text-xs font-bold text-foreground">{profile.weight ? `${profile.weight} kg` : "—"}</span>
              </div>
              <div className="bg-muted/30 border border-border/40 p-2 rounded-lg text-center">
                <span className="text-[9px] text-muted-foreground block">Edad</span>
                <span className="text-xs font-bold text-foreground">{profile.age ? `${profile.age} años` : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-border/40 w-full" />

        {/* Trainer & Group */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Grupo asignado</p>
              <p className="text-xs font-semibold text-foreground">{groupName || "Ninguno (Individual)"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Target className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Objetivos</p>
              <p className="text-xs font-semibold text-foreground">{profile.objective || "Acondicionamiento Físico"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
