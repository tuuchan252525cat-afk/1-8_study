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
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import { FIRESTORE_CHUNK_SIZE, splitStringIntoChunks } from './fileProcessing';
import {
  PUBLIC_TOP_LIMIT,
  AnonymousRankEntry,
  AnonymousGrowthEntry,
  calcRatePercent,
  calculateAnonymousRankingsFromEntries,
  calculateAnonymousGrowthFromEntries,
} from './privacyRankings';
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
  TEST_LEADERBOARDS: 'testLeaderboards',
  GROWTH_LEADERBOARDS: 'growthLeaderboards',
  DELETED_TESTS: 'deletedTests',
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

function hashStringHex(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x85ebca6b);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

export function toTestLeaderboardId(testTitle: string): string {
  return `test_${hashStringHex((testTitle || '').trim())}`;
}

export function toOpaqueLeaderboardEntryId(testTitle: string, studentNumber: number): string {
  return `entry_${hashStringHex(`classhub_1_8_anon_v1::${(testTitle || '').trim()}::${studentNumber}`)}`;
}

function getRecordMaxForLeaderboard(record: TestRecord): number {
  if (typeof record.totalMaxScore === 'number' && record.totalMaxScore > 0) {
    return record.totalMaxScore;
  }
  if (Array.isArray(record.subjectDetails) && record.subjectDetails.length > 0) {
    const sum = record.subjectDetails.reduce((acc, d) => acc + (Number(d.maxScore) || 100), 0);
    if (sum > 0) return sum;
  }
  if (record.scores) {
    const keys = Object.keys(record.scores).filter(
      (k) => record.scores[k] !== undefined && record.scores[k] !== null
    );
    if (keys.length > 0) {
      return keys.reduce((acc, k) => acc + (Number(record.maxScores?.[k] ?? 100) || 100), 0);
    }
  }
  return 500;
}

/**
 * Mirrors a single TestRecord (plus optional growth delta) to the anonymous
 * per-test leaderboard subcollections so public TOP-N queries never touch PII.
 */
export async function syncTestRecordToAnonymousLeaderboards(
  record: TestRecord,
  growthInfo?: { delta: number; rateDelta: number; hasDifferentMax: boolean } | null
): Promise<void> {
  if (!record?.testTitle || record.studentNumber === undefined) return;
  const testId = toTestLeaderboardId(record.testTitle);
  const opaqueId = toOpaqueLeaderboardEntryId(record.testTitle, record.studentNumber);
  const maxScore = Math.max(1, getRecordMaxForLeaderboard(record));
  const scoreRate = calcRatePercent(record.totalScore, maxScore) ?? 0;
  const nowIso = record.updatedAt || new Date().toISOString();

  await setDoc(
    doc(db, COLLECTIONS.TEST_LEADERBOARDS, testId),
    sanitizeForFirestore({
      id: testId,
      testTitle: record.testTitle.slice(0, 128),
      updatedAt: nowIso,
    }),
    { merge: true }
  );

  await setDoc(
    doc(db, COLLECTIONS.TEST_LEADERBOARDS, testId, 'entries', opaqueId),
    sanitizeForFirestore({
      score: record.totalScore,
      maxScore,
      scoreRate,
      updatedAt: nowIso,
    }),
    { merge: true }
  );

  if (growthInfo) {
    await setDoc(
      doc(db, COLLECTIONS.GROWTH_LEADERBOARDS, testId),
      sanitizeForFirestore({
        id: testId,
        testTitle: record.testTitle.slice(0, 128),
        updatedAt: nowIso,
      }),
      { merge: true }
    );

    await setDoc(
      doc(db, COLLECTIONS.GROWTH_LEADERBOARDS, testId, 'entries', opaqueId),
      sanitizeForFirestore({
        delta: growthInfo.delta,
        rateDelta: growthInfo.rateDelta,
        hasDifferentMax: Boolean(growthInfo.hasDifferentMax),
        updatedAt: nowIso,
      }),
      { merge: true }
    );
  }
}

/**
 * Saves or updates a student's own test score record in Firebase Firestore
 * (`testRecords` collection) and updates their anonymous entry in `testLeaderboards`
 * (and `growthLeaderboards` when prior test history exists).
 */
export async function saveTestRecordToCloud(
  record: TestRecord,
  growthInfo?: { delta: number; rateDelta: number; hasDifferentMax: boolean } | null
): Promise<void> {
  try {
    const docId = toSafeFirestoreId(record.id);
    const payload = sanitizeForFirestore({
      ...record,
      id: docId,
      updatedAt: record.updatedAt || new Date().toISOString(),
    });
    const docRef = doc(db, COLLECTIONS.TEST_RECORDS, docId);
    await setDoc(docRef, payload, { merge: true });
    await syncTestRecordToAnonymousLeaderboards(record, growthInfo);
    console.info(`[Firebase] Saved test record and anonymous leaderboard entry: ${docId}`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('[Firebase] Failed to save test record:', errorMsg);
    throw new Error(`成績データのクラウド保存エラー: ${errorMsg}`);
  }
}

/**
 * Fetches ONLY the logged-in student's own test score records from Firestore.
 * Uses `where('studentNumber', '==', studentNumber)` so other students' raw records
 * are never transferred over the network.
 */
export async function fetchMyTestRecordsFromCloud(studentNumber: number): Promise<TestRecord[]> {
  if (!studentNumber) return [];
  try {
    const q = query(
      collection(db, COLLECTIONS.TEST_RECORDS),
      where('studentNumber', '==', studentNumber)
    );
    const snap = await getDocs(q);
    const list: TestRecord[] = [];
    snap.forEach((d) => {
      const item = d.data() as TestRecord;
      if (item && item.testTitle && item.studentNumber === studentNumber) {
        list.push({
          ...item,
          id: item.id || d.id,
        });
      }
    });
    return list;
  } catch (err: any) {
    console.error('[Firebase] Error fetching own test records:', err?.message || err);
    return [];
  }
}

/**
 * Subscribes ONLY to the logged-in student's own test records in Firestore.
 */
export function subscribeToMyTestRecords(
  studentNumber: number,
  onUpdate: (records: TestRecord[]) => void
): () => void {
  if (!studentNumber) return () => {};
  try {
    const q = query(
      collection(db, COLLECTIONS.TEST_RECORDS),
      where('studentNumber', '==', studentNumber)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: TestRecord[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as TestRecord;
          if (item && item.testTitle && item.studentNumber === studentNumber) {
            list.push({
              ...item,
              id: item.id || d.id,
            });
          }
        });
        onUpdate(list);
      },
      (error) => {
        console.error('Firestore own testRecords subscription error:', error);
      }
    );
  } catch (e: any) {
    console.error('Failed to attach own testRecords listener:', e);
    return () => {};
  }
}

/**
 * Fetches available test titles from `testLeaderboards` metadata docs without downloading any scores.
 */
export async function fetchLeaderboardTestTitles(): Promise<string[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.TEST_LEADERBOARDS));
    const titles: string[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data && typeof data.testTitle === 'string' && data.testTitle.trim()) {
        titles.push(data.testTitle.trim());
      }
    });
    return titles;
  } catch (err: any) {
    console.warn('[Firebase] Error fetching leaderboard test titles:', err?.message || err);
    return [];
  }
}

/**
 * Fetches ONLY the top `limitCount` anonymous score entries for a test via server-side orderBy + limit.
 * Lower-ranked records are NEVER downloaded to the client.
 */
export async function fetchPublicTopLeaderboard(
  testTitle: string,
  limitCount = PUBLIC_TOP_LIMIT
): Promise<AnonymousRankEntry[]> {
  if (!testTitle) return [];
  try {
    const testId = toTestLeaderboardId(testTitle);
    const q = query(
      collection(db, COLLECTIONS.TEST_LEADERBOARDS, testId, 'entries'),
      orderBy('scoreRate', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const entries: Array<{ score: number; maxScore: number; scoreRate: number }> = [];
    snap.forEach((d) => {
      const data = d.data();
      if (typeof data.score === 'number' && typeof data.maxScore === 'number' && typeof data.scoreRate === 'number') {
        entries.push({
          score: data.score,
          maxScore: data.maxScore,
          scoreRate: data.scoreRate,
        });
      }
    });
    return calculateAnonymousRankingsFromEntries(entries, limitCount);
  } catch (err: any) {
    console.warn('[Firebase] Error fetching top leaderboard:', err?.message || err);
    return [];
  }
}

/**
 * Subscribes in real time ONLY to the top `limitCount` anonymous score entries for a test.
 */
export function subscribeToPublicTopLeaderboard(
  testTitle: string,
  limitCount: number,
  onUpdate: (rankings: AnonymousRankEntry[]) => void
): () => void {
  if (!testTitle) return () => {};
  try {
    const testId = toTestLeaderboardId(testTitle);
    const q = query(
      collection(db, COLLECTIONS.TEST_LEADERBOARDS, testId, 'entries'),
      orderBy('scoreRate', 'desc'),
      limit(limitCount)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const entries: Array<{ score: number; maxScore: number; scoreRate: number }> = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (typeof data.score === 'number' && typeof data.maxScore === 'number' && typeof data.scoreRate === 'number') {
            entries.push({
              score: data.score,
              maxScore: data.maxScore,
              scoreRate: data.scoreRate,
            });
          }
        });
        onUpdate(calculateAnonymousRankingsFromEntries(entries, limitCount));
      },
      (error) => {
        console.warn('Firestore top leaderboard subscription warning:', error);
      }
    );
  } catch (e) {
    console.warn('Failed to attach top leaderboard listener:', e);
    return () => {};
  }
}

/**
 * Fetches ONLY the top `limitCount` anonymous growth entries for a test via server-side orderBy + limit.
 */
export async function fetchPublicTopGrowthLeaderboard(
  testTitle: string,
  limitCount = PUBLIC_TOP_LIMIT
): Promise<AnonymousGrowthEntry[]> {
  if (!testTitle) return [];
  try {
    const testId = toTestLeaderboardId(testTitle);
    const q = query(
      collection(db, COLLECTIONS.GROWTH_LEADERBOARDS, testId, 'entries'),
      orderBy('rateDelta', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const entries: Array<{ delta: number; rateDelta: number; hasDifferentMax?: boolean }> = [];
    snap.forEach((d) => {
      const data = d.data();
      if (typeof data.delta === 'number' && typeof data.rateDelta === 'number') {
        entries.push({
          delta: data.delta,
          rateDelta: data.rateDelta,
          hasDifferentMax: Boolean(data.hasDifferentMax),
        });
      }
    });
    return calculateAnonymousGrowthFromEntries(entries, limitCount);
  } catch (err: any) {
    console.warn('[Firebase] Error fetching top growth leaderboard:', err?.message || err);
    return [];
  }
}

/**
 * Subscribes in real time ONLY to the top `limitCount` anonymous growth entries for a test.
 */
export function subscribeToPublicTopGrowthLeaderboard(
  testTitle: string,
  limitCount: number,
  onUpdate: (rankings: AnonymousGrowthEntry[]) => void
): () => void {
  if (!testTitle) return () => {};
  try {
    const testId = toTestLeaderboardId(testTitle);
    const q = query(
      collection(db, COLLECTIONS.GROWTH_LEADERBOARDS, testId, 'entries'),
      orderBy('rateDelta', 'desc'),
      limit(limitCount)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const entries: Array<{ delta: number; rateDelta: number; hasDifferentMax?: boolean }> = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (typeof data.delta === 'number' && typeof data.rateDelta === 'number') {
            entries.push({
              delta: data.delta,
              rateDelta: data.rateDelta,
              hasDifferentMax: Boolean(data.hasDifferentMax),
            });
          }
        });
        onUpdate(calculateAnonymousGrowthFromEntries(entries, limitCount));
      },
      (error) => {
        console.warn('Firestore top growth leaderboard subscription warning:', error);
      }
    );
  } catch (e) {
    console.warn('Failed to attach top growth leaderboard listener:', e);
    return () => {};
  }
}

/**
 * Uses Firestore server-side aggregation `getCountFromServer()` to compute the logged-in
 * user's exact rank and total participant count without downloading any other student's score.
 */
export async function fetchMyServerRankStanding(
  testTitle: string,
  myScoreRate: number | null,
  myRateDelta: number | null
): Promise<{
  totalParticipants: number;
  myRank: number | null;
  growthRank: number | null;
}> {
  if (!testTitle) {
    return { totalParticipants: 0, myRank: null, growthRank: null };
  }
  try {
    const testId = toTestLeaderboardId(testTitle);
    const entriesCol = collection(db, COLLECTIONS.TEST_LEADERBOARDS, testId, 'entries');
    const totalSnap = await getCountFromServer(entriesCol);
    const totalParticipants = totalSnap.data().count;

    let myRank: number | null = null;
    if (myScoreRate !== null) {
      const aheadSnap = await getCountFromServer(
        query(entriesCol, where('scoreRate', '>', myScoreRate))
      );
      myRank = aheadSnap.data().count + 1;
    }

    let growthRank: number | null = null;
    if (myRateDelta !== null) {
      const growthCol = collection(db, COLLECTIONS.GROWTH_LEADERBOARDS, testId, 'entries');
      const aheadGrowthSnap = await getCountFromServer(
        query(growthCol, where('rateDelta', '>', myRateDelta))
      );
      growthRank = aheadGrowthSnap.data().count + 1;
    }

    return { totalParticipants, myRank, growthRank };
  } catch (err: any) {
    console.warn('[Firebase] Error counting server rank standing:', err?.message || err);
    return { totalParticipants: 0, myRank: null, growthRank: null };
  }
}

async function deleteDocRefsInBatches(refs: any[]): Promise<void> {
  for (let i = 0; i < refs.length; i += 100) {
    const batch = writeBatch(db);
    refs.slice(i, i + 100).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

/**
 * Fetches all deleted periodic test titles (tombstones) from Firestore.
 */
export async function fetchDeletedTestTitlesFromCloud(): Promise<string[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.DELETED_TESTS));
    const titles: string[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data && typeof data.title === 'string' && data.title.trim()) {
        titles.push(data.title.trim());
      }
    });
    return titles;
  } catch (err: any) {
    console.warn('[Firebase] Error fetching deleted test titles:', err?.message || err);
    return [];
  }
}

/**
 * Subscribes to real-time deleted periodic test tombstones so stale clients immediately purge them.
 */
export function subscribeToDeletedTestTitles(
  onUpdate: (titles: string[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.DELETED_TESTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const titles: string[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && typeof data.title === 'string' && data.title.trim()) {
            titles.push(data.title.trim());
          }
        });
        onUpdate(titles);
      },
      (error) => {
        console.warn('Firestore deletedTests subscription warning:', error);
      }
    );
  } catch (e) {
    console.warn('Failed to attach deletedTests listener:', e);
    return () => {};
  }
}

/**
 * Removes a deleted-test tombstone when a periodic test with that name is newly registered.
 */
export async function clearDeletedTestTombstone(testTitle: string): Promise<void> {
  const trimmed = (testTitle || '').trim();
  if (!trimmed) return;
  try {
    const safeId = toTestLeaderboardId(trimmed);
    await deleteDoc(doc(db, COLLECTIONS.DELETED_TESTS, safeId));
  } catch (err: any) {
    console.warn('[Firebase] Failed to clear deleted test tombstone:', err?.message || err);
  }
}

/**
 * Cascade-deletes a periodic test and ALL associated data from Firestore:
 * 1. Writes a tombstone to `deletedTests/{safeId}`
 * 2. Deletes `periodicTests` schedule docs (by ID and by matching title)
 * 3. Deletes ALL `testRecords` matching `testTitle` across all students
 * 4. Deletes ALL entries + parent doc in `testLeaderboards/{safeId}`
 * 5. Deletes ALL entries + parent doc in `growthLeaderboards/{safeId}`
 */
export async function cascadeDeleteTestFromCloud(
  testTitle: string,
  testId?: string
): Promise<void> {
  const trimmedTitle = (testTitle || '').trim();
  const safeId = trimmedTitle ? toTestLeaderboardId(trimmedTitle) : '';

  try {
    if (trimmedTitle && safeId) {
      await setDoc(
        doc(db, COLLECTIONS.DELETED_TESTS, safeId),
        sanitizeForFirestore({
          id: safeId,
          title: trimmedTitle.slice(0, 128),
          deletedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    }

    const refsToDelete: any[] = [];

    if (testId) {
      refsToDelete.push(doc(db, COLLECTIONS.PERIODIC_TESTS, toSafeFirestoreId(testId)));
    }

    if (trimmedTitle) {
      const periodicSnap = await getDocs(
        query(collection(db, COLLECTIONS.PERIODIC_TESTS), where('title', '==', trimmedTitle))
      );
      periodicSnap.forEach((d) => refsToDelete.push(d.ref));

      const recordsSnap = await getDocs(
        query(collection(db, COLLECTIONS.TEST_RECORDS), where('testTitle', '==', trimmedTitle))
      );
      recordsSnap.forEach((d) => refsToDelete.push(d.ref));

      if (safeId) {
        const lbEntriesSnap = await getDocs(
          collection(db, COLLECTIONS.TEST_LEADERBOARDS, safeId, 'entries')
        );
        lbEntriesSnap.forEach((d) => refsToDelete.push(d.ref));
        refsToDelete.push(doc(db, COLLECTIONS.TEST_LEADERBOARDS, safeId));

        const growthEntriesSnap = await getDocs(
          collection(db, COLLECTIONS.GROWTH_LEADERBOARDS, safeId, 'entries')
        );
        growthEntriesSnap.forEach((d) => refsToDelete.push(d.ref));
        refsToDelete.push(doc(db, COLLECTIONS.GROWTH_LEADERBOARDS, safeId));
      }
    }

    if (refsToDelete.length > 0) {
      await deleteDocRefsInBatches(refsToDelete);
    }
    console.info(`[Firebase] Cascade deleted test "${trimmedTitle || testId}" (${refsToDelete.length} docs)`);
  } catch (err: any) {
    console.error('[Firebase] Cascade delete test error:', err?.message || err);
    throw new Error(`テストおよび関連成績データの削除エラー: ${err?.message || err}`);
  }
}

