import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Firestore,
} from 'firebase/firestore';
import { Student, StudyMaterial, StudentPrediction, WeeklyQuiz, TestRecord, ForumPost, QuizResult } from '../types';

/**
 * Direct hardcoded Firebase configuration for 1-8 SITE.
 * Explicitly provided so GitHub Pages (static site builds) and external clients
 * never encounter missing .env variables or unresolved JSON import paths.
 */
export const FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0105505780',
  appId: '1:195274843550:web:b9df896894df45d039e28f',
  apiKey: 'AIzaSyB25JN_ZaselKMXEPbTyOPyxXsweA2bOwo',
  authDomain: 'gen-lang-client-0105505780.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-classhub-ebff2094-49ab-4aac-b936-61880ba4d9ce',
  storageBucket: 'gen-lang-client-0105505780.firebasestorage.app',
  messagingSenderId: '195274843550',
  measurementId: '',
  oAuthClientId: '195274843550-fl72dc41t7o1f66egrsqlje4q20bqdpt.apps.googleusercontent.com',
  recaptchaSiteKey: '',
};

// 1. Initialize Firebase App (Singleton)
const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();

// CRITICAL: Must pass firestoreDatabaseId as required by AI Studio Firestore Enterprise setup
export const db: Firestore = getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId);
export const auth = getAuth(app);

export const COLLECTIONS = {
  MATERIALS: 'materials',
  QUIZZES: 'quizzes',
  TEST_RECORDS: 'testRecords',
  POSTS: 'posts',
  CUSTOM_SUBJECTS: 'customSubjects',
  QUIZ_SUBMISSIONS: 'quizSubmissions',
  STUDENTS: 'students',
  STUDENT_PREDICTIONS: 'student_predictions',
} as const;

/**
 * Recursively strips `undefined` values from an object.
 * CRITICAL: Firestore `setDoc()` immediately throws `Unsupported field value: undefined`
 * if any property in the document is `undefined` (e.g. imageUrl on a PDF, or optional formulas).
 */
export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore).filter((item) => item !== undefined);
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = sanitizeForFirestore(v);
      }
    }
    return clean;
  }
  return obj;
}

const isLegacyMockId = (id?: string) =>
  !id ||
  id === 'mat-math-1' ||
  id === 'mat-eng-1' ||
  id === 'mat-chem-1' ||
  id === 'test-doc';

/**
 * Saves a study material directly to Firebase Firestore, ensuring it is visible on all PCs & smartphones in real time.
 * Sanitizes all payload fields to prevent `undefined` field crashes.
 */
export async function saveMaterialToCloud(material: StudyMaterial): Promise<void> {
  try {
    const payload = sanitizeForFirestore(material);
    const docRef = doc(db, COLLECTIONS.MATERIALS, material.id);
    await setDoc(docRef, payload, { merge: true });
    console.info(`[Firebase] Successfully saved material to Firestore: ${material.id} (${material.title})`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to save material to Firestore:', errorMsg, material);
    throw new Error(`Firestore保存エラー: ${errorMsg}`);
  }
}

/**
 * Deletes a study material from Firebase Firestore.
 */
export async function deleteMaterialFromCloud(materialId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.MATERIALS, materialId);
    await deleteDoc(docRef);
    console.info(`[Firebase] Deleted material from Firestore: ${materialId}`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to delete material from Firestore:', errorMsg);
    throw new Error(`Firestore削除エラー: ${errorMsg}`);
  }
}

/**
 * Fetches all study materials from Firebase Firestore once.
 * No user-specific filter or where clause is applied, ensuring all users & devices see all shared materials.
 */
export async function fetchMaterialsFromCloud(): Promise<StudyMaterial[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.MATERIALS));
    const list: StudyMaterial[] = [];
    snap.forEach((d) => {
      const item = d.data() as StudyMaterial;
      if (item && item.id && !isLegacyMockId(item.id)) {
        list.push(item);
      }
    });
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return list;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Error fetching materials from cloud:', errorMsg);
    throw new Error(`Firestoreデータ取得エラー: ${errorMsg}`);
  }
}

/**
 * Subscribes to real-time updates for study materials across all devices (PCs, tablets, smartphones).
 * Broad collection listener without any user-specific or device-specific filtering.
 */
export function subscribeToMaterials(
  onUpdate: (materials: StudyMaterial[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.MATERIALS);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: StudyMaterial[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as StudyMaterial;
          if (item && item.id && !isLegacyMockId(item.id)) {
            list.push(item);
          }
        });
        // Sort newest first
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(list);
      },
      (error) => {
        console.error('Firestore real-time materials subscription error:', error);
        if (onError) {
          onError(new Error(`リアルタイム同期エラー: ${error.message}`));
        }
      }
    );
    return unsubscribe;
  } catch (e: any) {
    console.error('Failed to attach Firestore listener:', e);
    if (onError) {
      onError(new Error(`Firestore接続初期化エラー: ${e?.message || String(e)}`));
    }
    return () => {};
  }
}

/**
 * Saves or updates student account profile (nickname, password, etc.) in Firebase Firestore.
 * Keyed by attendanceNumber as a string (e.g., "5").
 */
export async function saveStudentToCloud(studentData: Partial<Student> & { attendanceNumber: number }): Promise<void> {
  try {
    const payload = sanitizeForFirestore({
      attendanceNumber: studentData.attendanceNumber,
      nickname: studentData.nickname,
      password: studentData.password,
      hasCustomPassword: studentData.hasCustomPassword,
      avatarColor: studentData.avatarColor,
      updatedAt: new Date().toISOString(),
    });
    const docRef = doc(db, COLLECTIONS.STUDENTS, String(studentData.attendanceNumber));
    await setDoc(docRef, payload, { merge: true });
    console.info(`[Firebase] Saved student #${studentData.attendanceNumber} to cloud:`, studentData.nickname);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error(`[Firebase] Failed to save student #${studentData.attendanceNumber}:`, errorMsg);
    throw new Error(`生徒アカウントのクラウド保存エラー: ${errorMsg}`);
  }
}

/**
 * Fetches all student account profiles from Firebase Firestore once.
 */
export async function fetchStudentsFromCloud(): Promise<Partial<Student>[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    const list: Partial<Student>[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data && data.attendanceNumber) {
        list.push({
          attendanceNumber: Number(data.attendanceNumber),
          nickname: data.nickname,
          password: data.password,
          hasCustomPassword: data.hasCustomPassword,
          avatarColor: data.avatarColor,
        });
      }
    });
    return list;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Error fetching students from cloud:', errorMsg);
    return [];
  }
}

/**
 * Subscribes to real-time updates for student accounts across all devices.
 */
export function subscribeToStudents(
  onUpdate: (students: Partial<Student>[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.STUDENTS);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: Partial<Student>[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && data.attendanceNumber) {
            list.push({
              attendanceNumber: Number(data.attendanceNumber),
              nickname: data.nickname,
              password: data.password,
              hasCustomPassword: data.hasCustomPassword,
              avatarColor: data.avatarColor,
            });
          }
        });
        onUpdate(list);
      },
      (error) => {
        console.error('Firestore students real-time subscription error:', error);
        if (onError) {
          onError(new Error(`生徒データ同期エラー: ${error.message}`));
        }
      }
    );
    return unsubscribe;
  } catch (e: any) {
    console.error('Failed to attach students Firestore listener:', e);
    return () => {};
  }
}

/**
 * Saves a student-created test prediction to Firebase Firestore (student_predictions collection).
 */
export async function saveStudentPredictionToCloud(prediction: StudentPrediction): Promise<void> {
  try {
    const payload = sanitizeForFirestore(prediction);
    const docRef = doc(db, COLLECTIONS.STUDENT_PREDICTIONS, prediction.id);
    await setDoc(docRef, payload, { merge: true });
    console.info(`[Firebase] Saved student prediction to Firestore: ${prediction.id} (${prediction.title})`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to save student prediction to Firestore:', errorMsg);
    throw new Error(`予想問題のクラウド保存エラー: ${errorMsg}`);
  }
}

/**
 * Deletes a student prediction from Firebase Firestore.
 */
export async function deleteStudentPredictionFromCloud(predictionId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.STUDENT_PREDICTIONS, predictionId);
    await deleteDoc(docRef);
    console.info(`[Firebase] Deleted student prediction from Firestore: ${predictionId}`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to delete student prediction from Firestore:', errorMsg);
    throw new Error(`予想問題の削除エラー: ${errorMsg}`);
  }
}

/**
 * Fetches all student predictions from Firebase Firestore.
 */
export async function fetchStudentPredictionsFromCloud(): Promise<StudentPrediction[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.STUDENT_PREDICTIONS));
    const list: StudentPrediction[] = [];
    snap.forEach((d) => {
      const item = d.data() as StudentPrediction;
      if (item && item.id) {
        list.push(item);
      }
    });
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return list;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Error fetching student predictions from cloud:', errorMsg);
    return [];
  }
}

/**
 * Subscribes to real-time updates for student predictions across all devices.
 */
export function subscribeToStudentPredictions(
  onUpdate: (predictions: StudentPrediction[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.STUDENT_PREDICTIONS);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: StudentPrediction[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as StudentPrediction;
          if (item && item.id) {
            list.push(item);
          }
        });
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(list);
      },
      (error) => {
        console.error('Firestore student predictions real-time subscription error:', error);
        if (onError) {
          onError(new Error(`予想問題リアルタイム同期エラー: ${error.message}`));
        }
      }
    );
    return unsubscribe;
  } catch (e: any) {
    console.error('Failed to attach student predictions Firestore listener:', e);
    return () => {};
  }
}


