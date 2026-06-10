import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchLinkedStudents,
  fetchAvailableStudents,
  linkStudent,
  unlinkStudent,
  deleteStudentPermanently,
  updatePaymentStatus,
  updatePlanLevel,
  createStudentProfile,
  type LinkedStudent,
  type AvailableStudent,
} from "@/services/alumnos";

export function useStudentsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const trainerId = user?.uid;

  // -- QUERIES --

  const linkedStudentsQuery = useQuery<LinkedStudent[]>({
    queryKey: ["linkedStudents", trainerId],
    queryFn: () => fetchLinkedStudents(trainerId!),
    enabled: !!trainerId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const availableStudentsQuery = useQuery<AvailableStudent[]>({
    queryKey: ["availableStudents", trainerId],
    queryFn: () => fetchAvailableStudents(trainerId!),
    enabled: !!trainerId,
  });

  // -- MUTATIONS --

  const linkMutation = useMutation({
    mutationFn: (studentId: string) => linkStudent(trainerId!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedStudents", trainerId] });
      queryClient.invalidateQueries({ queryKey: ["availableStudents", trainerId] });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (studentId: string) => unlinkStudent(trainerId!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedStudents", trainerId] });
      queryClient.invalidateQueries({ queryKey: ["availableStudents", trainerId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (studentId: string) => deleteStudentPermanently(trainerId!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedStudents", trainerId] });
      queryClient.invalidateQueries({ queryKey: ["availableStudents", trainerId] });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ linkId, status }: { linkId: string; status: "pagado" | "pendiente" }) =>
      updatePaymentStatus(linkId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedStudents", trainerId] });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ linkId, field, value }: { linkId: string; field: "plan_entrenamiento" | "plan_alimentacion"; value: string }) =>
      updatePlanLevel(linkId, field, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedStudents", trainerId] });
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: (data: { name: string; weight?: number; age?: number }) =>
      createStudentProfile(trainerId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedStudents", trainerId] });
    },
  });

  return {
    // Estado y Datos
    linkedStudents: linkedStudentsQuery.data || [],
    isLoadingLinked: linkedStudentsQuery.isLoading,
    isRefetchingLinked: linkedStudentsQuery.isFetching,
    
    availableStudents: availableStudentsQuery.data || [],
    isLoadingAvailable: availableStudentsQuery.isLoading,

    // Acciones (Mutaciones)
    linkStudent: linkMutation.mutateAsync,
    isLinking: linkMutation.isPending,

    unlinkStudent: unlinkMutation.mutateAsync,
    isUnlinking: unlinkMutation.isPending,

    deleteStudent: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    updatePaymentStatus: updatePaymentMutation.mutateAsync,
    isUpdatingPayment: updatePaymentMutation.isPending,

    updatePlanLevel: updatePlanMutation.mutateAsync,
    isUpdatingPlan: updatePlanMutation.isPending,

    createStudentProfile: createProfileMutation.mutateAsync,
    isCreatingProfile: createProfileMutation.isPending,
  };
}
