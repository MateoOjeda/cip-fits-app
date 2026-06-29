import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, ClipboardList, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MealOption {
  name: string;
  description: string;
}

interface MealCardProps {
  title: string;
  ingredients?: string;
  options?: MealOption[];
  date?: string;
  className?: string;
}

export function MealCard({ title, ingredients, options, date, className }: MealCardProps) {
  return (
    <Card className={cn(
      "border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden",
      className
    )}>
      <CardHeader className="relative p-5 pb-2">
        <div className="absolute top-0 right-0 p-4 opacity-[0.02]">
          <Utensils className="h-20 w-20 -rotate-12" />
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
            <Utensils className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              {title}
            </CardTitle>
            {date && (
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Planificado para {date}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-3 space-y-5">
        {/* Ingredients Section */}
        {ingredients && (
          <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 border border-border/40 relative overflow-hidden transition-colors">
            <div className="flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Ingredientes</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap pl-1">
              {ingredients}
            </p>
          </div>
        )}

        {/* Options / Preparation Section */}
        {options && options.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 px-1">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Variantes / Preparación</span>
            </div>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="relative pl-5 py-0.5 group">
                  <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-primary/20 rounded-full" />
                  <div className="absolute left-[-3px] top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      {opt.name}
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary/60" />
                    </h5>
                    {opt.description && (
                      <p className="text-xs text-muted-foreground leading-normal pl-0.5">
                        {opt.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!ingredients && (!options || options.length === 0)) && (
          <div className="flex flex-col items-center justify-center py-6 opacity-45">
             <Info className="h-6 w-6 mb-2" />
             <p className="text-xs font-semibold uppercase tracking-wider text-center">Sin detalles adicionales</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
