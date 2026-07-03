import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLinkedStudents } from '@/hooks/useLinkedStudents';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
} from 'firebase/firestore';
import { ChunkedBatch } from '@/lib/chunking';
import { toast } from 'sonner';

const DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export interface TrainingGroup {
  id: string;
  name: string;
  trainer_id: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
  created_at?: string;
}

export interface GroupExercise {
  id: string;
  group_id: string;
  trainer_id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  day: string;
  body_part?: string;
  is_to_failure: boolean;
  is_dropset?: boolean;
  is_piramide?: boolean;
  pyramid_reps?: string | null;
  exercise_type?: string;
  created_at?: string;
}

/**
 * Central hook for the TrainingGroups page.
 * It encapsulates all data fetching, mutation, and UI state management.
 * The page component becomes a thin orchestrator that only renders UI.
 */
export function useTrainingGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { students, loading: loadingStudents } = useLinkedStudents();

  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState(() =>
    localStorage.getItem('trainer_groups_search') || ''
  );
  const [creating, setCreating] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() =>
    localStorage.getItem('trainer_selected_group_id')
  );
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [exercises, setExercises] = useState<GroupExercise[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [deleteTarget, setDeleteTarget] = useState<TrainingGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showInlineRoutine, setShowInlineRoutine] = useState(false);

  // Persist search & selected group in localStorage
  useEffect(() => {
    localStorage.setItem('trainer_groups_search', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedGroupId) {
      localStorage.setItem('trainer_selected_group_id', selectedGroupId);
    } else {
      localStorage.removeItem('trainer_selected_group_id');
    }
  }, [selectedGroupId]);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'training_groups'),
        where('trainer_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );
      const snap = await getDocs(q);
      setGroups(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrainingGroup))
      );
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const fetchGroupDetail = useCallback(async (groupId: string) => {
    if (!user) return;
    setLoadingDetail(true);
    try {
      // Members
      const qMembers = query(
        collection(db, 'training_group_members'),
        where('group_id', '==', groupId)
      );
      const membersSnap = await getDocs(qMembers);
      setMembers(
        membersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupMember))
      );

      // Exercises
      const qExercises = query(
        collection(db, 'group_exercises'),
        where('group_id', '==', groupId)
      );
      const exercisesSnap = await getDocs(qExercises);
      const rawExercises = exercisesSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as GroupExercise)
      );
      const sortedExercises = [...rawExercises].sort((a, b) => {
        const indexA = DAYS.indexOf(a.day);
        const indexB = DAYS.indexOf(b.day);
        if (indexA !== indexB) return indexA - indexB;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });
      setExercises(sortedExercises);
    } catch (err) {
      console.error('Error fetching group details:', err);
    } finally {
      setLoadingDetail(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupDetail(selectedGroupId);
    } else {
      setMembers([]);
      setExercises([]);
    }
    setShowInlineRoutine(false);
  }, [selectedGroupId, fetchGroupDetail]);

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    setCreating(true);
    try {
      await addDoc(collection(db, 'training_groups'), {
        name: newGroupName.trim(),
        trainer_id: user.uid,
        created_at: new Date().toISOString(),
      });
      setNewGroupName('');
      toast.success('Grupo creado');
      fetchGroups();
    } catch (err) {
      toast.error('Error al crear grupo');
    } finally {
      setCreating(false);
    }
  };

  const deleteGroup = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete group document
      await deleteDoc(doc(db, 'training_groups', deleteTarget.id));

      // Delete members
      const qM = query(
        collection(db, 'training_group_members'),
        where('group_id', '==', deleteTarget.id)
      );
      const snapM = await getDocs(qM);
      const batchM = new ChunkedBatch(db);
      snapM.docs.forEach((d) => batchM.delete(d.ref));
      await batchM.commit();

      // Delete exercises
      const qE = query(
        collection(db, 'group_exercises'),
        where('group_id', '==', deleteTarget.id)
      );
      const snapE = await getDocs(qE);
      const batchE = new ChunkedBatch(db);
      snapE.docs.forEach((d) => batchE.delete(d.ref));
      await batchE.commit();

      toast.success('Grupo eliminado');
      setSelectedGroupId(null);
      fetchGroups();
    } catch (err) {
      toast.error('Error al eliminar grupo');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const addMembers = async () => {
    if (!selectedGroupId || selectedStudentIds.size === 0 || !user) return;
    setLoadingDetail(true);
    try {
      const batch = new ChunkedBatch(db);
      for (const studentId of Array.from(selectedStudentIds)) {
        const memberRef = doc(collection(db, 'training_group_members'));
        batch.set(memberRef, {
          group_id: selectedGroupId,
          student_id: studentId,
          created_at: new Date().toISOString(),
        });
      }
      await batch.commit();
      toast.success(`${selectedStudentIds.size} alumno(s) agregado(s) al grupo.`);
      setSelectedStudentIds(new Set());
      setShowAddMembers(false);
      await fetchGroupDetail(selectedGroupId);
    } catch (err) {
      toast.error('Error al agregar miembros');
    } finally {
      setLoadingDetail(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await deleteDoc(doc(db, 'training_group_members', memberId));
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success('Miembro eliminado del grupo');
    } catch (err) {
      toast.error('Error al eliminar miembro');
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const memberStudentIds = new Set(members.map((m) => m.student_id));
  const availableStudentsForGroup = students.filter(
    (s) => !memberStudentIds.has(s.user_id)
  );
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    // State
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
    setSelectedStudentIds,
    deleteTarget,
    setDeleteTarget,
    deleting,
    showInlineRoutine,
    setShowInlineRoutine,
    // Derived
    selectedGroup,
    availableStudentsForGroup,
    filteredGroups,
    // Handlers
    createGroup,
    deleteGroup,
    toggleStudentSelection,
    addMembers,
    removeMember,
    // Dependencies
    navigate,
    loadingStudents,
    user,
    students,
  };
}
