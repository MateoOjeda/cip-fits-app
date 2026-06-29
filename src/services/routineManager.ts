import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  addDoc,
  writeBatch,
  orderBy,
  limit
} from "firebase/firestore";

export type TargetType = "ALUMNO" | "GRUPO";
export type RoutineStatus = "ACTIVA" | "ARCHIVADA";
export type RoutineType = "INDIVIDUAL" | "GRUPAL";

export interface Routine {
  id: string;
  trainer_id: string;
  target_type: TargetType;
  target_id: string;
  status: RoutineStatus;
  routine_type: RoutineType;
  name: string;
  created_at: string;
}

/**
 * Get or create the active routine for a given target (student or group).
 * If no routine exists, one is created automatically.
 */
export async function getOrCreateActiveRoutine(
  trainerId: string,
  targetType: TargetType,
  targetId: string,
  routineType: RoutineType = "INDIVIDUAL"
): Promise<Routine> {
  const q = query(
    collection(db, "routines"),
    where("trainer_id", "==", trainerId),
    where("target_type", "==", targetType),
    where("target_id", "==", targetId),
    where("status", "==", "ACTIVA"),
    limit(1)
  );
  
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Routine;
  }

  const newDoc = {
    trainer_id: trainerId,
    target_type: targetType,
    target_id: targetId,
    status: "ACTIVA",
    routine_type: routineType,
    name: targetType === "GRUPO" ? "Rutina grupal" : "Rutina individual",
    created_at: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, "routines"), newDoc);
  return { id: docRef.id, ...newDoc } as Routine;
}

/**
 * Archive the active routine for a student (set status to ARCHIVADA).
 */
export async function archiveActiveRoutine(
  trainerId: string,
  studentId: string
): Promise<void> {
  const q = query(
    collection(db, "routines"),
    where("trainer_id", "==", trainerId),
    where("target_type", "==", "ALUMNO"),
    where("target_id", "==", studentId),
    where("status", "==", "ACTIVA")
  );
  
  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { status: "ARCHIVADA" }));
  await batch.commit();
}

/**
 * Fetch all routines for a student (active + archived).
 */
export async function fetchStudentRoutines(
  trainerId: string,
  studentId: string
): Promise<Routine[]> {
  const q = query(
    collection(db, "routines"),
    where("trainer_id", "==", trainerId),
    where("target_type", "==", "ALUMNO"),
    where("target_id", "==", studentId),
    orderBy("created_at", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Routine));
}

/**
 * Fetch archived routines for a student, including group routines they were part of.
 */
export async function fetchArchivedRoutines(
  trainerId: string,
  studentId: string
): Promise<Routine[]> {
  const q = query(
    collection(db, "routines"),
    where("trainer_id", "==", trainerId),
    where("target_id", "==", studentId),
    where("status", "==", "ARCHIVADA"),
    orderBy("created_at", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Routine));
}

/**
 * Fetch exercises belonging to a specific routine.
 */
export async function fetchRoutineExercises(routineId: string) {
  const q = query(collection(db, "exercises"), where("routine_id", "==", routineId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function assignGroupRoutineToStudent(
  trainerId: string,
  studentId: string,
  groupId: string // Not used for copying anymore, kept for backwards compatibility in function signature
): Promise<void> {
  // We no longer copy exercises. The student UI dynamically fetches group_exercises
  // based on their training_group_members record. This prevents data duplication
  // and keeps the student exactly in sync with the group routine dynamically.
  
  const qActive = query(
    collection(db, "routines"),
    where("trainer_id", "==", trainerId),
    where("target_type", "==", "ALUMNO"),
    where("target_id", "==", studentId),
    where("status", "==", "ACTIVA")
  );

  const qLink = query(
    collection(db, "trainer_students"),
    where("trainer_id", "==", trainerId),
    where("student_id", "==", studentId)
  );

  // Fetch both active routines and link data in parallel
  const [activeSnap, linkSnap] = await Promise.all([
    getDocs(qActive),
    getDocs(qLink)
  ]);

  const batch = writeBatch(db);
  let hasWrites = false;

  // 1. Archive ANY current active individual routine for this student
  if (!activeSnap.empty) {
    activeSnap.docs.forEach(d => {
      if (d.data().status !== "ARCHIVADA") {
        batch.update(d.ref, { status: "ARCHIVADA" });
        hasWrites = true;
      }
    });
  }

  // 2. Automatically update routine cycle dates to keep the range active
  if (!linkSnap.empty) {
    const docRef = linkSnap.docs[0].ref;
    const data = linkSnap.docs[0].data();
    
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayLocal = new Date(today.getTime() - (offset * 60 * 1000));
    const todayStr = todayLocal.toISOString().split('T')[0];
    
    const updates: any = {};
    if (data.routine_assignment_date !== todayStr) {
      updates.routine_assignment_date = todayStr;
    }
    
    const currentNextChange = data.routine_next_change_date;
    const isFuture = currentNextChange && new Date(currentNextChange) > today;
    
    if (!isFuture) {
      const nextChange = new Date(today.getTime() - (offset * 60 * 1000));
      nextChange.setDate(nextChange.getDate() + 30);
      const nextChangeStr = nextChange.toISOString().split('T')[0];
      if (data.routine_next_change_date !== nextChangeStr) {
        updates.routine_next_change_date = nextChangeStr;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      batch.update(docRef, updates);
      hasWrites = true;
    }
  }

  if (hasWrites) {
    await batch.commit();
  }
}

/**
 * Link existing unlinked exercises to a routine.
 */
export async function linkExercisesToRoutine(
  trainerId: string,
  studentId: string,
  routineId: string
): Promise<void> {
  const q = query(
    collection(db, "exercises"),
    where("trainer_id", "==", trainerId),
    where("student_id", "==", studentId),
    where("routine_id", "==", null)
  );
  
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { routine_id: routineId }));
  await batch.commit();
}

