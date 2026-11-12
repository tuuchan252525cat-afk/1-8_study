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
import firebaseConfig from '../../firebase-applet-config.json';
import { StudyMaterial, WeeklyQuiz, TestRecord, ForumPost, QuizResult } from '../types';
import { SubjectOption } from '../constants/subjects';

// 1. Initialize Firebase App (Singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId as required by AI Studio Firestore Enterprise setup
export const db: Firestore = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

export const COLLECTIONS = {
  MATERIALS: 'materials',
  QUIZZES: 'quizzes',
  TEST_RECORDS: 'testRecords',
  POSTS: 'posts',
  CUSTOM_SUBJECTS: 'customSubjects',
  QUIZ_SUBMISSIONS: 'quizSubmissions',
} as const;

/**
 * Saves a study material directly to Firebase Firestore, ensuring it is visible on all PCs & smartphones in real time.
 */
export async function saveMaterialToCloud(material: StudyMaterial): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.MATERIALS, material.id);
    await setDoc(docRef, material, { merge: true });
    console.info(`[Firebase] Saved material to Firestore: ${material.id} (${material.title})`);
  } catch (err) {
    console.error('[Firebase] Failed to save material to Firestore:', err);
    throw err;
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
  } catch (err) {
    console.error('[Firebase] Failed to delete material from Firestore:', err);
    throw err;
  }
}

const isLegacyMockId = (id?: string) =>
  !id ||
  id === 'mat-math-1' ||
  id === 'mat-eng-1' ||
  id === 'mat-chem-1' ||
  id === 'test-doc';

/**
 * Fetches all study materials from Firebase Firestore once.
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
    return list;
  } catch (err) {
    console.warn('Firestore fetch materials notice:', err);
    return [];
  }
}

/**
 * Subscribes to real-time updates for study materials across all devices (PCs, tablets, smartphones).
 * Always notifies the callback with the full up-to-date cloud list.
 */
export function subscribeToMaterials(
  onUpdate: (materials: StudyMaterial[]) => void
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
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error('Failed to attach Firestore listener:', e);
    return () => {};
  }
}
