import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRoutineData,
  saveDayConfig as saveDayConfigService,
  addExercise as addExerciseService,
  removeExercise as removeExerciseService,
  bulkRemoveExercises as bulkRemoveExercisesService,
  logTrainerChange as logTrainerChangeService,
  addBiSerieChild as addBiSerieChildService,
  removeBiSerieChild as removeBiSerieChildService,
  autoUpdateRoutineCycle as autoUpdateRoutineCycleService,
  type Exercise,
  type DayConfig,
} from "@/services/rutinas";
import {
  getOrCreateActiveRoutine,
  archiveActiveRoutine,
  fetchStudentRoutines,
  fetchArchivedRoutines,
  fetchRoutineExercises,
  linkExercisesToRoutine,
  assignGroupRoutineToStudent,
} from "@/services/routineManager";

export function useStudentRoutines(trainerId?: string, studentId?: string) {
  const queryClient = useQueryClient();

  const routineDataQuery = useQuery({
    queryKey: ["routineData", trainerId, studentId],
    queryFn: () => fetchRoutineData(trainerId!, studentId!),
    enabled: !!trainerId && !!studentId,
  });

  const archivedRoutinesQuery = useQuery({
    queryKey: ["archivedRoutines", trainerId, studentId],
    queryFn: () => fetchArchivedRoutines(trainerId!, studentId!),
    enabled: !!trainerId && !!studentId,
  });

  const saveDayConfigMutation = useMutation({
    mutationFn: ({ day, body_part_1, body_part_2 }: { day: string; body_part_1: string; body_part_2: string }) =>
      saveDayConfigService(trainerId!, studentId!, day, body_part_1, body_part_2),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routineData", trainerId, studentId] });
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: (exercise: Omit<Exercise, "id">) => addExerciseService(exercise as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routineData", trainerId, studentId] });
    },
  });

  const removeExerciseMutation = useMutation({
    mutationFn: (exerciseId: string) => removeExerciseService(exerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routineData", trainerId, studentId] });
    },
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: (exerciseIds: string[]) => bulkRemoveExercisesService(exerciseIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routineData", trainerId, studentId] });
    },
  });

  const logChangeMutation = useMutation({
    mutationFn: (message: string) => logTrainerChangeService(trainerId!, studentId!, message),
  });

  const addBiSerieChildMutation = useMutation({
    mutationFn: ({ parentId, child }: { parentId: string; child: Omit<Exercise, "id"> }) =>
      addBiSerieChildService(parentId, child as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routineData", trainerId, studentId] });
    },
  });

  const removeBiSerieChildMutation = useMutation({
    mutationFn: (childId: string) => removeBiSerieChildService(childId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routineData", trainerId, studentId] });
    },
  });

  const autoUpdateCycleMutation = useMutation({
    mutationFn: () => autoUpdateRoutineCycleService(trainerId!, studentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routineData", trainerId, studentId] });
    },
  });

  const assignGroupRoutineMutation = useMutation({
    mutationFn: (groupId: string) => assignGroupRoutineToStudent(trainerId!, studentId!, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routineData", trainerId, studentId] });
    },
  });

  return {
    exercises: routineDataQuery.data?.exercises || [],
    dayConfigs: routineDataQuery.data?.dayConfigs || {},
    routineNextChange: routineDataQuery.data?.routineNextChange || null,
    routineAssignmentDate: routineDataQuery.data?.routineAssignmentDate || null,
    activeRoutineId: routineDataQuery.data?.activeRoutineId || null,
    isLoading: routineDataQuery.isLoading,
    isRefetching: routineDataQuery.isFetching,
    refetchRoutineData: routineDataQuery.refetch,

    archivedRoutines: archivedRoutinesQuery.data || [],
    isLoadingArchived: archivedRoutinesQuery.isLoading,
    refetchArchived: archivedRoutinesQuery.refetch,

    saveDayConfig: saveDayConfigMutation.mutateAsync,
    isSavingDayConfig: saveDayConfigMutation.isPending,

    addExercise: addExerciseMutation.mutateAsync,
    isAddingExercise: addExerciseMutation.isPending,

    removeExercise: removeExerciseMutation.mutateAsync,
    isRemovingExercise: removeExerciseMutation.isPending,

    bulkRemoveExercises: bulkRemoveMutation.mutateAsync,
    isBulkRemoving: bulkRemoveMutation.isPending,

    logTrainerChange: logChangeMutation.mutateAsync,

    addBiSerieChild: addBiSerieChildMutation.mutateAsync,
    isAddingBiSerie: addBiSerieChildMutation.isPending,

    removeBiSerieChild: removeBiSerieChildMutation.mutateAsync,
    isRemovingBiSerie: removeBiSerieChildMutation.isPending,

    autoUpdateRoutineCycle: autoUpdateCycleMutation.mutateAsync,
    isUpdatingCycle: autoUpdateCycleMutation.isPending,

    assignGroupRoutine: assignGroupRoutineMutation.mutateAsync,
    isAssigningGroupRoutine: assignGroupRoutineMutation.isPending,
  };
}

export function useRoutineExercises(routineId?: string) {
  const query = useQuery({
    queryKey: ["routineExercises", routineId],
    queryFn: () => fetchRoutineExercises(routineId!),
    enabled: !!routineId,
  });

  return {
    exercises: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
