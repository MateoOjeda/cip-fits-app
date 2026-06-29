import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export function useStudentDashboard(studentId?: string) {
  const profileQuery = useQuery({
    queryKey: ["studentProfile", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const snap = await getDoc(doc(db, "profiles", studentId));
      return snap.exists() ? snap.data() : null;
    },
    enabled: !!studentId,
  });

  const trainerLinkQuery = useQuery({
    queryKey: ["studentTrainerLink", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const q = query(collection(db, "trainer_students"), where("student_id", "==", studentId));
      const snap = await getDocs(q);
      return !snap.empty ? snap.docs[0].data() : null;
    },
    enabled: !!studentId,
  });

  const trainerChangesQuery = useQuery({
    queryKey: ["trainerChanges", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const q = query(
        collection(db, "trainer_changes"), 
        where("student_id", "==", studentId),
        orderBy("created_at", "desc"),
        limit(10)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!studentId,
  });

  return {
    profile: profileQuery.data || null,
    isLoadingProfile: profileQuery.isLoading,

    studentData: trainerLinkQuery.data || null,
    isLoadingStudentData: trainerLinkQuery.isLoading,

    notifications: trainerChangesQuery.data || [],
    isLoadingNotifications: trainerChangesQuery.isLoading,

    isLoading: profileQuery.isLoading || trainerLinkQuery.isLoading || trainerChangesQuery.isLoading,
    refetch: async () => {
      await Promise.all([
        profileQuery.refetch(),
        trainerLinkQuery.refetch(),
        trainerChangesQuery.refetch(),
      ]);
    }
  };
}
