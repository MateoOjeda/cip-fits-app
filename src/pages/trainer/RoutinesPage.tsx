import { useRoutines } from "@/hooks/trainer/useRoutines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MealsTab from "@/components/trainer/MealsTab";
import { StudentCard } from "@/components/trainer/StudentCard";
import { Dumbbell, Loader2, CalendarClock, Users, ArrowLeft } from "lucide-react";

import { RoutineKpiCards } from "@/components/trainer/routines/RoutineKpiCards";
import { DaySelector } from "@/components/trainer/routines/DaySelector";
import { MuscleConfigCard } from "@/components/trainer/routines/MuscleConfigCard";
import { ExerciseFormCard } from "@/components/trainer/routines/ExerciseFormCard";
import { ExerciseListPanel } from "@/components/trainer/routines/ExerciseListPanel";
import { BulkDeleteDialog } from "@/components/trainer/routines/BulkDeleteDialog";
import { RoutineActivitySidebar } from "@/components/trainer/routines/RoutineActivitySidebar";

export default function RoutinesPage() {
  const {
    isGroupMode,
    activeTab,
    setActiveTab,
    students,
    loadingStudents,
    student,
    selectedStudent,
    setSelectedStudent,
    groupName,
    exercises,
    loadingExercises,
    selectedDay,
    setSelectedDay,
    dayConfigs,
    currentDayConfig,
    combinedBodyPart,
    availableExercises,
    form,
    setForm,
    biSerieEnabled,
    setBiSerieEnabled,
    biForm,
    setBiForm,
    selectedIds,
    setSelectedIds,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleting,
    nutritionLevel,
    parentExercises,
    childByParent,
    handleSaveDayConfig,
    handleAdd,
    handleRemove,
    handleBulkDelete,
    toggleSelect,
    handleBackToList,
  } = useRoutines();

  if (loadingStudents && !isGroupMode) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!isGroupMode && students.length === 0) {
    return (
      <div className="max-w-4xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
        <div className="border-b border-border/50 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Creador de Rutinas</h1>
          <p className="text-sm text-muted-foreground mt-1">Asigna ejercicios a tus alumnos</p>
        </div>
        <Card className="border border-border/50 bg-card rounded-xl shadow-sm">
          <CardContent className="p-8 text-center">
            <Dumbbell className="h-8 w-8 mx-auto text-muted-foreground/45 mb-2.5" />
            <p className="text-xs text-muted-foreground font-medium">Primero vincula alumnos en la sección "Mis Alumnos".</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* Header section with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div className="flex items-center gap-4">
          {(selectedStudent || isGroupMode) && (
            <Button
              variant="ghost" size="icon"
              onClick={handleBackToList}
              className="h-9 w-9 rounded-lg"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
              {isGroupMode ? `Rutina de Grupo: ${groupName}` : "Crear Rutina"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {isGroupMode ? "Gestión de ejercicios colectivos" : "Configuración personalizada de entrenamiento"}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs superiores de Rutinas */}
      {(selectedStudent || isGroupMode) && (
        <RoutineKpiCards
          exercises={exercises}
          selectedDay={selectedDay}
          combinedBodyPart={combinedBodyPart}
        />
      )}

      {!isGroupMode && !selectedStudent ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => (
            <StudentCard
              key={s.user_id}
              name={s.display_name}
              avatarUrl={s.avatar_url}
              avatarInitials={s.avatar_initials}
              size="lg"
              onClick={() => setSelectedStudent(s.user_id)}
              subtitle={<span className="text-[10px] text-muted-foreground uppercase tracking-tight">Gestionar rutina</span>}
              className="border-border/40 hover:border-primary/30"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[70vh]">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-border/50 bg-card rounded-xl shadow-sm overflow-hidden">
              <CardHeader className="p-4 border-b border-border/50 bg-muted/40">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                      <Dumbbell className="h-4.5 w-4.5" />
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground">Configuración de Rutina</CardTitle>
                  </div>
                  {!isGroupMode && selectedStudent && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold rounded-md px-2 py-0.5 shadow-none">
                      Alumno: {students.find(s => s.user_id === selectedStudent)?.display_name || "Cargando..."}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  {!isGroupMode && (
                    <TabsList className="grid grid-cols-2 bg-secondary/50 max-w-md w-full rounded-xl p-1">
                      <TabsTrigger value="entrenamiento" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Dumbbell className="w-4 h-4 mr-2" />Entrenamiento
                      </TabsTrigger>
                      <TabsTrigger value="alimentacion" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <CalendarClock className="w-4 h-4 mr-2" />Alimentación
                      </TabsTrigger>
                    </TabsList>
                  )}

                  <TabsContent value="entrenamiento" className="space-y-8 mt-0">
                    {/* Day selector */}
                    <DaySelector
                      exercises={exercises}
                      dayConfigs={dayConfigs}
                      selectedDay={selectedDay}
                      onSelectDay={setSelectedDay}
                      onClearSelection={() => setSelectedIds(new Set())}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: MUSCULAR CONFIG & FORM */}
                      <div className="space-y-6">
                        <MuscleConfigCard
                          selectedDay={selectedDay}
                          currentDayConfig={currentDayConfig}
                          onSaveDayConfig={handleSaveDayConfig}
                        />

                        <ExerciseFormCard
                          form={form}
                          setForm={setForm}
                          biSerieEnabled={biSerieEnabled}
                          setBiSerieEnabled={setBiSerieEnabled}
                          biForm={biForm}
                          setBiForm={setBiForm}
                          availableExercises={availableExercises}
                          currentDayConfig={currentDayConfig}
                          onAdd={handleAdd}
                        />
                      </div>

                      {/* Right: EXERCISE LIST */}
                      <div className="space-y-6">
                        <ExerciseListPanel
                          selectedDay={selectedDay}
                          combinedBodyPart={combinedBodyPart}
                          parentExercises={parentExercises}
                          childByParent={childByParent}
                          selectedIds={selectedIds}
                          toggleSelect={toggleSelect}
                          onRemove={handleRemove}
                          onBulkDeleteRequest={() => setShowDeleteConfirm(true)}
                          deleting={deleting}
                          loading={loadingExercises}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {!isGroupMode && (
                    <TabsContent value="alimentacion" className="mt-0">
                      {selectedStudent ? (
                        <MealsTab studentId={selectedStudent} nutritionLevel={nutritionLevel} />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                          <Users className="h-16 w-16" />
                          <p className="text-lg font-medium">Selecciona un alumno primero</p>
                        </div>
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidemenu - Actions */}
          <div className="lg:col-span-4 space-y-6">
            <RoutineActivitySidebar />
          </div>
        </div>
      )}

      {/* AlertDialog */}
      <BulkDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        selectedCount={selectedIds.size}
        onConfirm={handleBulkDelete}
        deleting={deleting}
      />
    </div>
  );
}
