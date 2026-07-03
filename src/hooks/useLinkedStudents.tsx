import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { chunkArray } from "@/lib/chunking";

export interface LinkedStudentProfile {
  user_id: string;
  display_name: string;
  avatar_initials: string | null;
  avatar_url: string | null;
  weight: number | null;
  age: number | null;
}

export function useLinkedStudents() {
  const { user } = useAuth();

  const { data: students = [], isLoading: loading, refetch } = useQuery<LinkedStudentProfile[]>({
    queryKey: ["linkedStudentsProfiles", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      // 1. Fetch student IDs linked to this trainer
      const qLinks = query(
        collection(db, "trainer_students"), 
        where("trainer_id", "==", user.uid)
      );
      const snapLinks = await getDocs(qLinks);
      
      if (snapLinks.empty) {
        return [];
      }

      const ids = snapLinks.docs.map(doc => doc.data().student_id);

      // 2. Fetch profiles in chunks of 30 (Firestore 'in' operator limit)
      const chunks = chunkArray(ids, 30);

      const profilesSnaps = await Promise.all(
        chunks.map(chunk =>
          getDocs(query(collection(db, "profiles"), where("user_id", "in", chunk)))
        )
      );

      const profiles = profilesSnaps
        .flatMap(snap => snap.docs.map(doc => ({ ...doc.data() } as LinkedStudentProfile)));

      return profiles;
    },
    enabled: !!user?.uid,
  });

  return { students, loading, refetch };
}
