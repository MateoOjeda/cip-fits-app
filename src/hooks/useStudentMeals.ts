import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  addDoc, 
  deleteDoc,
  doc,
  limit
} from "firebase/firestore";

export interface Meal {
  id: string;
  title: string;
  content: string;
  meal_type: string;
  created_at: string;
}

export function useStudentMeals(studentId?: string, trainerId?: string) {
  const queryClient = useQueryClient();

  const mealsQuery = useQuery<Meal[]>({
    queryKey: ["studentMeals", studentId, trainerId],
    queryFn: async () => {
      if (!studentId) return [];
      
      let q = query(
        collection(db, "student_meals"),
        where("student_id", "==", studentId),
        orderBy("created_at", "desc")
      );

      if (trainerId && trainerId !== studentId) {
        q = query(
          collection(db, "student_meals"),
          where("student_id", "==", studentId),
          where("trainer_id", "==", trainerId),
          orderBy("created_at", "desc")
        );
      }

      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Meal));
    },
    enabled: !!studentId,
  });

  const nutritionLevelQuery = useQuery<string>({
    queryKey: ["nutritionLevel", studentId],
    queryFn: async () => {
      if (!studentId) return "principiante";
      const q = query(
        collection(db, "plan_levels"),
        where("student_id", "==", studentId),
        where("plan_type", "==", "nutricion"),
        where("unlocked", "==", true),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data().level;
      }
      return "principiante";
    },
    enabled: !!studentId,
  });

  const addMealMutation = useMutation({
    mutationFn: async (data: { title: string; ingredients: string; options: any[] }) => {
      if (!trainerId || !studentId) throw new Error("Missing trainer or student ID");
      const mealData = {
        ingredients: data.ingredients.trim(),
        options: data.options.filter(o => o.name.trim() || o.description.trim())
      };
      await addDoc(collection(db, "student_meals"), {
        trainer_id: trainerId,
        student_id: studentId,
        title: data.title.trim(),
        content: JSON.stringify(mealData),
        meal_type: "general",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentMeals", studentId, trainerId] });
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (mealId: string) => {
      await deleteDoc(doc(db, "student_meals", mealId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentMeals", studentId, trainerId] });
    },
  });

  return {
    meals: mealsQuery.data || [],
    isLoadingMeals: mealsQuery.isLoading,
    refetchMeals: mealsQuery.refetch,

    nutritionLevel: nutritionLevelQuery.data || "principiante",
    isLoadingNutritionLevel: nutritionLevelQuery.isLoading,
    refetchNutritionLevel: nutritionLevelQuery.refetch,

    addMeal: addMealMutation.mutateAsync,
    isAddingMeal: addMealMutation.isPending,

    deleteMeal: deleteMealMutation.mutateAsync,
    isDeletingMeal: deleteMealMutation.isPending,
  };
}
