import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarClock } from "lucide-react";

export const RoutineActivitySidebar: React.FC = () => {
  return (
    <Card className="card-premium border-primary/20 bg-primary/5">
      <CardHeader className="p-6 pb-2 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <CalendarClock className="h-5 w-5" />
          </div>
          <CardTitle className="text-base uppercase tracking-tighter">Actividad</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Log de Cambios</Label>
          <div className="p-4 rounded-2xl bg-black/20 border border-white/5 max-h-[150px] overflow-y-auto text-[10px] font-mono leading-relaxed hide-scrollbar">
            <p className="opacity-40 italic">Iniciando seguimiento de cambios...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
