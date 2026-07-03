import { useTrainingGroups } from "@/hooks/trainer/useTrainingGroups";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { SearchInput } from "@/components/ui/search-input";
import { GroupCard } from "@/components/trainer/training-groups/GroupCard";
import { GroupKpiCards } from "@/components/trainer/training-groups/GroupKpiCards";
import { CreateGroupForm } from "@/components/trainer/training-groups/CreateGroupForm";
import { GroupMembersPanel } from "@/components/trainer/training-groups/GroupMembersPanel";
import { GroupRoutinePanel } from "@/components/trainer/training-groups/GroupRoutinePanel";
import { DeleteGroupDialog } from "@/components/trainer/training-groups/DeleteGroupDialog";

export default function TrainingGroupsPage() {
  const {
    groups,
    loading,
    newGroupName,
    setNewGroupName,
    searchQuery,
    setSearchQuery,
    creating,
    selectedGroupId,
    setSelectedGroupId,
    members,
    exercises,
    loadingDetail,
    showAddMembers,
    setShowAddMembers,
    selectedStudentIds,
    toggleStudentSelection,
    deleteTarget,
    setDeleteTarget,
    deleting,
    showInlineRoutine,
    setShowInlineRoutine,
    selectedGroup,
    availableStudentsForGroup,
    filteredGroups,
    createGroup,
    deleteGroup,
    addMembers,
    removeMember,
    navigate,
    students,
  } = useTrainingGroups();

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <SectionHeader
        title="Grupos de Entrenamiento"
        description="Crea grupos y asigna rutinas colectivas de forma eficiente."
      />

      {/* KPI Cards Grid */}
      <GroupKpiCards
        groups={groups}
        selectedGroup={selectedGroup}
        members={members}
        exercises={exercises}
      />

      {/* Create Group Form */}
      <CreateGroupForm
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        creating={creating}
        createGroup={createGroup}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Mis Grupos ({filteredGroups.length})</h2>
            <div className="px-1">
              <SearchInput
                placeholder="Buscar grupo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery("")}
                className="h-8.5 rounded-lg"
              />
            </div>
          </div>
          {filteredGroups.length === 0 ? (
            <EmptyState
              type={searchQuery ? "no-results" : "empty"}
              title={searchQuery ? "Sin coincidencias" : "Sin grupos"}
              description={searchQuery ? "No se encontraron grupos que coincidan." : "No tienes grupos creados."}
              className="py-6 min-h-[150px]"
            />
          ) : filteredGroups.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                selected={selectedGroupId === g.id}
                onSelect={() => setSelectedGroupId(g.id)}
                onDelete={() => setDeleteTarget(g)}
              />
            ))}
        </div>

        {selectedGroup ? (
          <div className="lg:col-span-2 space-y-4">
            {loadingDetail ? (
              <div className="p-4 border border-border/40 bg-card rounded-2xl"><LoadingSkeleton type="list" count={2} /></div>
            ) : (
              <>
                <GroupMembersPanel
                  groupName={selectedGroup.name}
                  members={members}
                  students={students}
                  showAddMembers={showAddMembers}
                  setShowAddMembers={setShowAddMembers}
                  availableStudentsForGroup={availableStudentsForGroup}
                  selectedStudentIds={selectedStudentIds}
                  toggleStudentSelection={toggleStudentSelection}
                  addMembers={addMembers}
                  removeMember={removeMember}
                  loadingDetail={loadingDetail}
                />

                <GroupRoutinePanel
                  exercises={exercises}
                  showInlineRoutine={showInlineRoutine}
                  setShowInlineRoutine={setShowInlineRoutine}
                  selectedGroupId={selectedGroupId}
                  onNavigateToRoutine={() => navigate(`/trainer/routines/group/${selectedGroupId}`)}
                />
              </>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center py-16 border border-dashed border-border/50 rounded-xl bg-muted/20">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Selecciona un grupo para ver su detalle</p>
          </div>
        )}
      </div>

      <DeleteGroupDialog
        deleteTarget={deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={deleteGroup}
        deleting={deleting}
      />
    </div>
  );
}
