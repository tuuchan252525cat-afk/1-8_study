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
  } catch (err) {
    console.warn('Firestore material save notice:', err);
  }
}

/**
 * Deletes a study material from Firebase Firestore.
 */
export async function deleteMaterialFromCloud(materialId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.MATERIALS, materialId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore material delete notice:', err);
  }
}

/**
 * Fetches all study materials from Firebase Firestore once.
 */
export async function fetchMaterialsFromCloud(): Promise<StudyMaterial[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.MATERIALS));
    const list: StudyMaterial[] = [];
    snap.forEach((d) => {
      list.push(d.data() as StudyMaterial);
    });
    return list;
  } catch (err) {
    console.warn('Firestore fetch materials notice:', err);
    return [];
  }
}

/**
 * Subscribes to real-time updates for study materials across all devices.
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
          list.push(d.data() as StudyMaterial);
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('Firestore real-time materials subscription notice:', error);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('Failed to attach Firestore listener:', e);
    return () => {};
  }
}
