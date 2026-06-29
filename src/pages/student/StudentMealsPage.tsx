import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Loader2 } from "lucide-react";
import MealsTab from "@/components/trainer/MealsTab";
import { useStudentMeals } from "@/hooks/useStudentMeals";

export default function StudentMealsPage() {
  const { user } = useAuth();
  const { nutritionLevel, isLoadingNutritionLevel: loading } = useStudentMeals(user?.uid);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Mi Plan de Alimentación</h1>
          <p className="text-sm text-muted-foreground mt-1">Sigue tu dieta personalizada y consulta tus opciones de comida</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full w-fit">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Nutrición</span>
        </div>
      </div>

      {user && (
        <MealsTab studentId={user.uid} nutritionLevel={nutritionLevel} readOnly={true} />
      )}
    </div>
  );
}
