import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";

export function StudentTransformationsTab() {
  return (
    <Card className="border border-border/40 bg-card/60 rounded-xl p-6 text-center">
      <Heart className="h-8 w-8 mx-auto text-pink-500 mb-3 opacity-70 animate-pulse" />
      <h3 className="text-sm font-bold text-foreground">Evolución Física y Galería</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
        Visualiza el cambio del alumno a través del tiempo mediante el registro de fotografías de frente, perfil y espalda.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2 max-w-md mx-auto">
        {["Frente", "Perfil", "Espalda"].map((type) => (
          <div key={type} className="aspect-[3/4] rounded-lg border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center p-2 text-center">
            <span className="text-[9px] font-bold text-muted-foreground">{type}</span>
            <span className="text-[8px] text-muted-foreground/60 mt-1 block">Sin imagen</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
