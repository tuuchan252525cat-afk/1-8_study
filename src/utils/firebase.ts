import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import { FIRESTORE_CHUNK_SIZE, splitStringIntoChunks } from './fileProcessing';
import { Student, StudyMaterial, StudentPrediction, WeeklyQuiz, TestRecord, ForumPost, QuizResult, PeriodicTestSchedule } from '../types';

/**
 * Firebase configuration for 1-8 SITE.
 * Supports overriding via Vite environment variables (VITE_FIREBASE_*)
 * and falls back cleanly to firebase-applet-config.json.
 */
const env = (import.meta as any)?.env || {};
export const FIREBASE_CONFIG = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || firebaseAppletConfig.measurementId || '',
  oAuthClientId: firebaseAppletConfig.oAuthClientId || '',
  recaptchaSiteKey: firebaseAppletConfig.recaptchaSiteKey || '',
};

// 1. Initialize Firebase App (Singleton)
const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();

// CRITICAL: Must pass firestoreDatabaseId as required by AI Studio Firestore Enterprise setup
export const db: Firestore = getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId);
export const auth = getAuth(app);

// Validate initial Firestore server connectivity on boot
async function validateFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
    }
  }
}
validateFirestoreConnection();

export const COLLECTIONS = {
  MATERIALS: 'materials',
  QUIZZES: 'quizzes',
  TEST_RECORDS: 'testRecords',
  POSTS: 'posts',
  CUSTOM_SUBJECTS: 'customSubjects',
  QUIZ_SUBMISSIONS: 'quizSubmissions',
  STUDENTS: 'students',
  STUDENT_PREDICTIONS: 'student_predictions',
  PERIODIC_TESTS: 'periodicTests',
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

// In-memory cache for reassembled chunked files (avoids repeated Firestore reads and keeps localStorage tiny)
const reassembledChunkCache = new Map<string, string>();

export function cacheReassembledFileData(
  collectionName: 'materials' | 'student_predictions',
  docId: string,
  dataUrl: string
): void {
  if (docId && dataUrl) {
    reassembledChunkCache.set(`${collectionName}:${docId}`, dataUrl);
  }
}

export function getCachedReassembledFileData(
  collectionName: 'materials' | 'student_predictions',
  docId: string
): string | undefined {
  return reassembledChunkCache.get(`${collectionName}:${docId}`);
}

/**
 * Deletes all chunk documents in `{collectionName}/{docId}/chunks`.
 */
async function deleteAllChunksForDoc(
  collectionName: 'materials' | 'student_predictions',
  docId: string
): Promise<void> {
  const chunksColRef = collection(db, collectionName, docId, 'chunks');
  const snap = await getDocs(chunksColRef);
  if (snap.empty) return;

  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 100) {
    const batch = writeBatch(db);
    docs.slice(i, i + 100).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

/**
 * Saves a StudyMaterial or StudentPrediction to Firestore.
 * If `pdfUrl` or `imageUrl` exceeds 700,000 characters, splits it into
 * 700,000-char chunks in `{collectionName}/{docId}/chunks/{index}` and stores
 * only metadata (`isChunked`, `totalChunks`, `chunkedField`) on the parent doc.
 */
async function saveDocumentWithChunking(
  collectionName: 'materials' | 'student_predictions',
  material: StudyMaterial
): Promise<void> {
  const docId = toSafeFirestoreId(material.id);
  const rawPdf = material.pdfUrl || '';
  const rawImg = material.imageUrl || '';
  const targetField: 'pdfUrl' | 'imageUrl' | null =
    rawPdf.length > FIRESTORE_CHUNK_SIZE
      ? 'pdfUrl'
      : rawImg.length > FIRESTORE_CHUNK_SIZE
        ? 'imageUrl'
        : null;

  const parentDocRef = doc(db, collectionName, docId);

  if (targetField) {
    const rawContent = targetField === 'pdfUrl' ? rawPdf : rawImg;
    const chunks = splitStringIntoChunks(rawContent, FIRESTORE_CHUNK_SIZE);

    // Cache locally so the uploader can preview immediately without re-downloading chunks
    cacheReassembledFileData(collectionName, docId, rawContent);

    const parentData: Record<string, any> = {
      ...material,
      id: docId,
      isChunked: true,
      totalChunks: chunks.length,
      chunkedField: targetField,
      mimeType:
        material.mimeType ||
        (targetField === 'pdfUrl' ? 'application/pdf' : 'image/jpeg'),
    };
    delete parentData.pdfUrl;
    delete parentData.imageUrl;

    // 1. Clean any stale chunks first, then write new chunks in batches of 4 (~2.8MB/batch)
    await deleteAllChunksForDoc(collectionName, docId);
    for (let i = 0; i < chunks.length; i += 4) {
      const batch = writeBatch(db);
      const slice = chunks.slice(i, i + 4);
      slice.forEach((chunkData, offset) => {
        const index = i + offset;
        const chunkRef = doc(db, collectionName, docId, 'chunks', String(index));
        batch.set(chunkRef, { index, data: chunkData });
      });
      await batch.commit();
    }

    // 2. Save parent document after all chunks are safely written
    const sanitizedParent = sanitizeForFirestore(parentData);
    await setDoc(parentDocRef, sanitizedParent);
    return;
  }

  // Non-chunked (fits comfortably within 700,000 chars)
  const payload = sanitizeForFirestore({
    ...material,
    id: docId,
    isChunked: false,
    totalChunks: 0,
  });
  await setDoc(parentDocRef, payload, { merge: true });
}

/**
 * Fetches and reassembles chunked file data from `{collectionName}/{docId}/chunks`
 * sorted by `index` ascending. Caches reassembled Data URL in memory.
 */
export async function resolveMaterialFileData(
  material: StudyMaterial,
  collectionName: 'materials' | 'student_predictions' = 'materials'
): Promise<string | undefined> {
  const direct =
    material.fileType === 'pdf'
      ? material.pdfUrl || material.imageUrl
      : material.imageUrl || material.pdfUrl;

  if (direct) return direct;

  const docId = toSafeFirestoreId(material.id);
  const cached = getCachedReassembledFileData(collectionName, docId);
  if (cached) return cached;

  if (!material.isChunked && !material.totalChunks) {
    return undefined;
  }

  const chunksColRef = collection(db, collectionName, docId, 'chunks');
  const snap = await getDocs(chunksColRef);
  if (snap.empty) {
    throw new Error('分割されたファイルデータが見つかりませんでした。');
  }

  const parts = snap.docs
    .map((d) => {
      const data = d.data();
      return {
        index: typeof data.index === 'number' ? data.index : Number(d.id),
        data: String(data.data || ''),
      };
    })
    .sort((a, b) => a.index - b.index);

  if (material.totalChunks && parts.length < material.totalChunks) {
    throw new Error(
      `ファイルデータの一部が不足しています (${parts.length}/${material.totalChunks})。`
    );
  }

  const joined = parts.map((p) => p.data).join('');
  cacheReassembledFileData(collectionName, docId, joined);
  return joined;
}

/**
 * Saves a study material directly to Firebase Firestore (with automatic 700KB chunk splitting for files up to 5MB).
 */
export async function saveMaterialToCloud(material: StudyMaterial): Promise<void> {
  try {
    await saveDocumentWithChunking(COLLECTIONS.MATERIALS, material);
    console.info(`[Firebase] Successfully saved material to Firestore: ${material.id} (${material.title})`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to save material to Firestore:', errorMsg, material);
    throw new Error(`Firestore保存エラー: ${errorMsg}`);
  }
}

/**
 * Deletes a study material and its chunk subcollection from Firebase Firestore.
 */
export async function deleteMaterialFromCloud(materialId: string): Promise<void> {
  try {
    const docId = toSafeFirestoreId(materialId);
    await deleteAllChunksForDoc(COLLECTIONS.MATERIALS, docId);
    await deleteDoc(doc(db, COLLECTIONS.MATERIALS, docId));
    reassembledChunkCache.delete(`${COLLECTIONS.MATERIALS}:${docId}`);
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
      role: studentData.role,
      updatedAt: new Date().toISOString(),
    });
    const docRef = doc(db, COLLECTIONS.STUDENTS, String(studentData.attendanceNumber));
    await setDoc(docRef, payload, { merge: true });
    console.info(`[Firebase] Saved account #${studentData.attendanceNumber} to cloud:`, studentData.nickname);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error(`[Firebase] Failed to save account #${studentData.attendanceNumber}:`, errorMsg);
    throw new Error(`アカウントのクラウド保存エラー: ${errorMsg}`);
  }
}

/**
 * Fetches all student & teacher account profiles from Firebase Firestore once.
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
          role: data.role,
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
 * Subscribes to real-time updates for student & teacher accounts across all devices.
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
              role: data.role,
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
 * Saves a student-created test prediction to Firebase Firestore (with automatic chunk splitting for files up to 5MB).
 */
export async function saveStudentPredictionToCloud(prediction: StudentPrediction): Promise<void> {
  try {
    await saveDocumentWithChunking(COLLECTIONS.STUDENT_PREDICTIONS, prediction);
    console.info(`[Firebase] Saved student prediction to Firestore: ${prediction.id} (${prediction.title})`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to save student prediction to Firestore:', errorMsg);
    throw new Error(`予想問題のクラウド保存エラー: ${errorMsg}`);
  }
}

/**
 * Deletes a student prediction and its chunk subcollection from Firebase Firestore.
 */
export async function deleteStudentPredictionFromCloud(predictionId: string): Promise<void> {
  try {
    const docId = toSafeFirestoreId(predictionId);
    await deleteAllChunksForDoc(COLLECTIONS.STUDENT_PREDICTIONS, docId);
    await deleteDoc(doc(db, COLLECTIONS.STUDENT_PREDICTIONS, docId));
    reassembledChunkCache.delete(`${COLLECTIONS.STUDENT_PREDICTIONS}:${docId}`);
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

/**
 * Saves or updates a WeeklyQuiz directly in Firebase Firestore (`quizzes` collection).
 */
export async function saveQuizToCloud(quiz: WeeklyQuiz): Promise<void> {
  try {
    const payload = sanitizeForFirestore({
      ...quiz,
      updatedAt: new Date().toISOString(),
    });
    const docRef = doc(db, COLLECTIONS.QUIZZES, quiz.id);
    await setDoc(docRef, payload, { merge: true });
    console.info(`[Firebase] Saved quiz to Firestore: ${quiz.id} (${quiz.title})`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to save quiz to Firestore:', errorMsg, quiz);
    throw new Error(`小テストのクラウド保存エラー: ${errorMsg}`);
  }
}

/**
 * Deletes a WeeklyQuiz from Firebase Firestore (`quizzes` collection).
 */
export async function deleteQuizFromCloud(quizId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.QUIZZES, quizId);
    await deleteDoc(docRef);
    console.info(`[Firebase] Deleted quiz from Firestore: ${quizId}`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to delete quiz from Firestore:', errorMsg);
    throw new Error(`小テストの削除エラー: ${errorMsg}`);
  }
}

/**
 * Fetches all WeeklyQuizzes from Firebase Firestore once.
 */
export async function fetchQuizzesFromCloud(): Promise<WeeklyQuiz[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.QUIZZES));
    const list: WeeklyQuiz[] = [];
    snap.forEach((d) => {
      const item = d.data() as WeeklyQuiz;
      if (item && item.id && Array.isArray(item.questions)) {
        list.push(item);
      }
    });
    return list;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Error fetching quizzes from cloud:', errorMsg);
    throw new Error(`小テストのクラウド取得エラー: ${errorMsg}`);
  }
}

/**
 * Subscribes to real-time updates for WeeklyQuizzes across all devices.
 */
export function subscribeToQuizzes(
  onUpdate: (quizzes: WeeklyQuiz[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.QUIZZES);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: WeeklyQuiz[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as WeeklyQuiz;
          if (item && item.id && Array.isArray(item.questions)) {
            list.push(item);
          }
        });
        onUpdate(list);
      },
      (error) => {
        console.error('Firestore quizzes real-time subscription error:', error);
        if (onError) {
          onError(new Error(`小テストリアルタイム同期エラー: ${error.message}`));
        }
      }
    );
    return unsubscribe;
  } catch (e: any) {
    console.error('Failed to attach quizzes Firestore listener:', e);
    return () => {};
  }
}

/**
 * Normalizes a Firestore doc ID so it always satisfies `^[a-zA-Z0-9_-]+$` and <= 128 chars.
 */
function toSafeFirestoreId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

/**
 * Saves a student's quiz result (bestScore, attemptCount, category, quizTitle) to Firebase Firestore.
 */
export async function saveQuizSubmissionToCloud(submission: QuizResult): Promise<void> {
  try {
    const docId = toSafeFirestoreId(`${submission.quizId}_student_${submission.studentNumber}`);
    const payload = sanitizeForFirestore({
      ...submission,
      id: docId,
      updatedAt: new Date().toISOString(),
    });
    const docRef = doc(db, COLLECTIONS.QUIZ_SUBMISSIONS, docId);
    await setDoc(docRef, payload, { merge: true });
  } catch (err: any) {
    console.error('[Firebase] Failed to save quiz submission:', err?.message || err);
  }
}

/**
 * Fetches all quiz submissions from Firebase Firestore once.
 */
export async function fetchQuizSubmissionsFromCloud(): Promise<QuizResult[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.QUIZ_SUBMISSIONS));
    const list: QuizResult[] = [];
    snap.forEach((d) => {
      const item = d.data() as QuizResult;
      if (item && item.quizId && item.studentNumber) {
        list.push({
          ...item,
          id: item.id || d.id,
        });
      }
    });
    return list;
  } catch (err: any) {
    console.error('[Firebase] Error fetching quiz submissions:', err?.message || err);
    return [];
  }
}

/**
 * Subscribes to real-time updates for quiz submissions across all devices.
 */
export function subscribeToQuizSubmissions(
  onUpdate: (submissions: QuizResult[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.QUIZ_SUBMISSIONS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: QuizResult[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as QuizResult;
          if (item && item.quizId && item.studentNumber) {
            list.push({
              ...item,
              id: item.id || d.id,
            });
          }
        });
        onUpdate(list);
      },
      (error) => {
        console.error('Firestore quizSubmissions subscription error:', error);
      }
    );
  } catch (e: any) {
    console.error('Failed to attach quizSubmissions listener:', e);
    return () => {};
  }
}

/**
 * Saves or updates a periodic test schedule in Firebase Firestore.
 */
export async function savePeriodicTestToCloud(schedule: PeriodicTestSchedule): Promise<void> {
  try {
    const docId = toSafeFirestoreId(schedule.id);
    const payload = sanitizeForFirestore({
      ...schedule,
      id: docId,
    });
    const docRef = doc(db, COLLECTIONS.PERIODIC_TESTS, docId);
    await setDoc(docRef, payload, { merge: true });
  } catch (err: any) {
    console.error('[Firebase] Failed to save periodic test schedule:', err?.message || err);
    throw new Error(`定期テスト日程のクラウド保存エラー: ${err?.message || err}`);
  }
}

/**
 * Deletes a periodic test schedule from Firebase Firestore.
 */
export async function deletePeriodicTestFromCloud(testId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PERIODIC_TESTS, toSafeFirestoreId(testId));
    await deleteDoc(docRef);
  } catch (err: any) {
    console.error('[Firebase] Failed to delete periodic test schedule:', err?.message || err);
    throw new Error(`定期テスト日程の削除エラー: ${err?.message || err}`);
  }
}

/**
 * Fetches all periodic test schedules from Firebase Firestore once.
 */
export async function fetchPeriodicTestsFromCloud(): Promise<PeriodicTestSchedule[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PERIODIC_TESTS));
    const list: PeriodicTestSchedule[] = [];
    snap.forEach((d) => {
      const item = d.data() as PeriodicTestSchedule;
      if (item && item.title && item.date) {
        list.push({
          ...item,
          id: item.id || d.id,
        });
      }
    });
    list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return list;
  } catch (err: any) {
    console.error('[Firebase] Error fetching periodic tests:', err?.message || err);
    return [];
  }
}

/**
 * Subscribes to real-time updates for periodic test schedules.
 */
export function subscribeToPeriodicTests(
  onUpdate: (schedules: PeriodicTestSchedule[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.PERIODIC_TESTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: PeriodicTestSchedule[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as PeriodicTestSchedule;
          if (item && item.title && item.date) {
            list.push({
              ...item,
              id: item.id || d.id,
            });
          }
        });
        list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        onUpdate(list);
      },
      (error) => {
        console.error('Firestore periodicTests subscription error:', error);
      }
    );
  } catch (e: any) {
    console.error('Failed to attach periodicTests listener:', e);
    return () => {};
  }
}

export function isOctoberPost(p: { id?: string; createdAt?: string }): boolean {
  if (!p) return false;
  if (['post-1', 'post-2', 'post-3', 'post-4'].includes(p.id || '')) return true;
  const createdAt = p.createdAt || '';
  if (createdAt.includes('-10-') || createdAt.startsWith('2026-10')) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime()) && d.getFullYear() === 2026 && d.getMonth() === 9) {
      return true;
    }
  }
  return false;
}

function normalizeForumPost(raw: any, fallbackId?: string): ForumPost | null {
  if (!raw || !raw.title) return null;
  const id = raw.id || fallbackId;
  if (!id) return null;
  if (isOctoberPost({ id: String(id), createdAt: raw.createdAt })) {
    return null;
  }
  return {
    id: String(id),
    studentNumber: Number(raw.studentNumber) || 0,
    authorNickname: String(raw.authorNickname || '匿名'),
    subjectTag: String(raw.subjectTag || '質問'),
    title: String(raw.title),
    content: String(raw.content || ''),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    createdAtMs: typeof raw.createdAtMs === 'number' ? raw.createdAtMs : (Date.parse(raw.createdAt) || 0),
    reactions: {
      like: Number(raw.reactions?.like) || 0,
      heart: Number(raw.reactions?.heart) || 0,
      lightbulb: Number(raw.reactions?.lightbulb) || 0,
    },
    comments: Array.isArray(raw.comments) ? raw.comments : [],
  };
}

/**
 * Saves or updates a class forum post in Firebase Firestore (`posts` collection).
 * Throws an explicit error on failure so the UI can notify or retry instead of silently losing posts.
 */
export async function savePostToCloud(post: ForumPost): Promise<void> {
  if (isOctoberPost(post)) {
    console.warn(`[Firebase] Ignored saving deleted October post: ${post.id}`);
    return;
  }
  try {
    const docId = toSafeFirestoreId(post.id);
    const payload = sanitizeForFirestore({
      ...post,
      id: docId,
      createdAtMs: post.createdAtMs || Date.parse(post.createdAt) || Date.now(),
      reactions: {
        like: Number(post.reactions?.like) || 0,
        heart: Number(post.reactions?.heart) || 0,
        lightbulb: Number(post.reactions?.lightbulb) || 0,
      },
      comments: Array.isArray(post.comments) ? post.comments : [],
    });
    const docRef = doc(db, COLLECTIONS.POSTS, docId);
    await setDoc(docRef, payload, { merge: true });
    console.info(`[Firebase] Saved forum post to Firestore: ${docId} (${post.title})`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to save forum post:', errorMsg);
    throw new Error(`掲示板のクラウド保存エラー: ${errorMsg}`);
  }
}

/**
 * Deletes a class forum post from Firebase Firestore (`posts` collection).
 */
export async function deletePostFromCloud(postId: string): Promise<void> {
  try {
    const docId = toSafeFirestoreId(postId);
    const docRef = doc(db, COLLECTIONS.POSTS, docId);
    await deleteDoc(docRef);
    console.info(`[Firebase] Deleted forum post: ${docId}`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to delete forum post:', errorMsg);
    throw new Error(`掲示板のクラウド削除エラー: ${errorMsg}`);
  }
}

/**
 * Fetches all class forum posts from Firebase Firestore once.
 */
export async function fetchPostsFromCloud(): Promise<ForumPost[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.POSTS));
    const list: ForumPost[] = [];
    snap.forEach((d) => {
      const normalized = normalizeForumPost(d.data(), d.id);
      if (normalized) {
        list.push(normalized);
      }
    });
    list.sort((a, b) => (b.createdAtMs || Date.parse(b.createdAt) || 0) - (a.createdAtMs || Date.parse(a.createdAt) || 0));
    return list;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Error fetching forum posts:', errorMsg);
    throw new Error(`掲示板のクラウド取得エラー: ${errorMsg}`);
  }
}

/**
 * Subscribes to real-time updates for class forum posts across all devices.
 */
export function subscribeToPosts(
  onUpdate: (posts: ForumPost[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.POSTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: ForumPost[] = [];
        snapshot.forEach((d) => {
          const normalized = normalizeForumPost(d.data(), d.id);
          if (normalized) {
            list.push(normalized);
          }
        });
        list.sort((a, b) => (b.createdAtMs || Date.parse(b.createdAt) || 0) - (a.createdAtMs || Date.parse(a.createdAt) || 0));
        onUpdate(list);
      },
      (error) => {
        console.error('Firestore posts subscription error:', error);
        if (onError) {
          onError(new Error(`掲示板リアルタイム同期エラー: ${error.message}`));
        }
      }
    );
  } catch (e: any) {
    console.error('Failed to attach posts listener:', e);
    if (onError) {
      onError(new Error(`掲示板Firestore接続エラー: ${e?.message || String(e)}`));
    }
    return () => {};
  }
}

/**
 * Saves or updates a test score record in Firebase Firestore (`testRecords` collection).
 */
export async function saveTestRecordToCloud(record: TestRecord): Promise<void> {
  try {
    const docId = toSafeFirestoreId(record.id);
    const payload = sanitizeForFirestore({
      ...record,
      id: docId,
      updatedAt: record.updatedAt || new Date().toISOString(),
    });
    const docRef = doc(db, COLLECTIONS.TEST_RECORDS, docId);
    await setDoc(docRef, payload, { merge: true });
    console.info(`[Firebase] Saved test record to Firestore: ${docId}`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to save test record:', errorMsg);
    throw new Error(`成績データのクラウド保存エラー: ${errorMsg}`);
  }
}

/**
 * Fetches all test score records from Firebase Firestore once.
 */
export async function fetchTestRecordsFromCloud(): Promise<TestRecord[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.TEST_RECORDS));
    const list: TestRecord[] = [];
    snap.forEach((d) => {
      const item = d.data() as TestRecord;
      if (item && item.testTitle && item.studentNumber !== undefined) {
        list.push({
          ...item,
          id: item.id || d.id,
        });
      }
    });
    return list;
  } catch (err: any) {
    console.error('[Firebase] Error fetching test records:', err?.message || err);
    return [];
  }
}

/**
 * Subscribes to real-time updates for test score records across all devices.
 */
export function subscribeToTestRecords(
  onUpdate: (records: TestRecord[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.TEST_RECORDS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: TestRecord[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as TestRecord;
          if (item && item.testTitle && item.studentNumber !== undefined) {
            list.push({
              ...item,
              id: item.id || d.id,
            });
          }
        });
        onUpdate(list);
      },
      (error) => {
        console.error('Firestore testRecords subscription error:', error);
      }
    );
  } catch (e: any) {
    console.error('Failed to attach testRecords listener:', e);
    return () => {};
  }
}



