import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  Student,
  TestRecord,
  WeeklyQuiz,
  QuizQuestion,
  QuizResult,
  StudyMaterial,
  StudentPrediction,
  ForumPost,
  AnonymousRankItem,
  AnonymousGrowthItem,
  PersonalStanding,
  ScoreDistributionBin,
  SubjectScores,
  PeriodicTestSchedule,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_TEST_RECORDS,
  INITIAL_QUIZZES,
  INITIAL_QUIZ_SUBMISSIONS,
  INITIAL_MATERIALS,
  INITIAL_POSTS,
} from '../data/initialData';
import {
  calculateAnonymousRankings,
  calculatePersonalStanding,
  calculateAnonymousGrowthRankings,
  calculatePersonalGrowth,
  calculateDistribution,
} from '../utils/privacyRankings';
import { getPersistentItem, setPersistentItem, compressImageBase64 } from '../utils/dbStorage';
import { SubjectOption, DEFAULT_SUBJECTS, createSubjectOption } from '../constants/subjects';
import {
  getAppBasePath,
  getTabFromLocation,
  getTabUrl,
  VALID_TABS,
  isStaticDeployment,
} from '../utils/navigation';

import {
  saveMaterialToCloud,
  deleteMaterialFromCloud,
  fetchMaterialsFromCloud,
  subscribeToMaterials,
  saveStudentToCloud,
  fetchStudentsFromCloud,
  subscribeToStudents,
  saveStudentPredictionToCloud,
  deleteStudentPredictionFromCloud,
  fetchStudentPredictionsFromCloud,
  subscribeToStudentPredictions,
  saveQuizToCloud,
  deleteQuizFromCloud,
  fetchQuizzesFromCloud,
  subscribeToQuizzes,
  saveQuizSubmissionToCloud,
  fetchQuizSubmissionsFromCloud,
  subscribeToQuizSubmissions,
  savePeriodicTestToCloud,
  deletePeriodicTestFromCloud,
  fetchPeriodicTestsFromCloud,
  subscribeToPeriodicTests,
  savePostToCloud,
  fetchPostsFromCloud,
  subscribeToPosts,
} from '../utils/firebase';

import { AppTab } from '../types';
export type { AppTab };

interface AppContextType {
  // Auth & Student State
  students: Student[];
  currentStudent: Student | null;
  currentStudentNum: number;
  isLoggedIn: boolean;
  login: (attendanceNumber: number, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  updateNickname: (newNickname: string) => void;
  updatePassword: (password: string) => void;
  switchStudentDemo: (attendanceNumber: number) => void;

  // Custom Subjects Management
  customSubjects: SubjectOption[];
  allSubjects: SubjectOption[];
  addCustomSubject: (name: string) => SubjectOption;
  deleteCustomSubject: (key: string) => void;

  // Test & Score Management
  testRecords: TestRecord[];
  periodicTests: PeriodicTestSchedule[];
  availableTestTitles: string[];
  activeTestTitle: string;
  setActiveTestTitle: (title: string) => void;
  saveMyScore: (testTitle: string, testDate: string, scores: SubjectScores) => void;
  addPeriodicTest: (title: string, date: string) => Promise<void>;
  deletePeriodicTest: (testId: string) => Promise<void>;

  // Privacy Protected Rankings (Public & Personal)
  anonymousRankings: AnonymousRankItem[];
  anonymousGrowthRankings: AnonymousGrowthItem[];
  personalStanding: PersonalStanding;
  scoreDistribution: ScoreDistributionBin[];

  // Quizzes (English & Mizo-Blue)
  quizzes: WeeklyQuiz[];
  quizSubmissions: QuizResult[];
  submitQuiz: (quizId: string, answers: number[]) => { score: number; bestScore: number; attemptCount: number; maxScore: number; rank: number; total: number };
  getQuizAnonymousRankings: (quizId: string) => AnonymousRankItem[];
  getMyQuizStanding: (quizId: string) => { myScore: number | null; bestScore: number | null; attemptCount: number; maxScore: number | null; completedAt: string | null; myRank: number | null; total: number; avg: number } | null;
  updateQuiz: (quiz: WeeklyQuiz) => Promise<void>;
  addQuiz: (quiz: WeeklyQuiz) => Promise<void>;
  deleteQuiz: (quizId: string) => Promise<void>;
  updateQuizQuestion: (quizId: string, qIndex: number, question: QuizQuestion) => Promise<void>;
  addQuizQuestion: (quizId: string, question: QuizQuestion) => Promise<void>;
  deleteQuizQuestion: (quizId: string, questionId: string) => Promise<void>;

  // Study Materials
  materials: StudyMaterial[];
  addMaterial: (material: Omit<StudyMaterial, 'id' | 'createdAt' | 'downloadCount' | 'authorNickname'>) => Promise<void>;
  incrementMaterialDownload: (materialId: string) => void;
  updateMaterial: (materialId: string, updated: Partial<StudyMaterial>) => void;
  deleteMaterial: (materialId: string) => void;

  // Student Test Predictions
  studentPredictions: StudentPrediction[];
  addStudentPrediction: (prediction: Omit<StudentPrediction, 'id' | 'createdAt' | 'downloadCount' | 'authorNickname' | 'authorStudentNumber'>) => Promise<void>;
  deleteStudentPrediction: (predictionId: string) => Promise<void>;

  // Forum (Board)
  posts: ForumPost[];
  addPost: (subjectTag: string, title: string, content: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  toggleReaction: (postId: string, reactionType: 'like' | 'heart' | 'lightbulb') => void;

  // Navigation
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  editSectionHint: 'quizzes' | 'periodic' | 'subjects' | null;
  setEditSectionHint: (section: 'quizzes' | 'periodic' | 'subjects' | null) => void;

  // Anti-Data-Loss & Cloud Sync Tools
  isStorageHydrated: boolean;
  syncWithServer: () => Promise<void>;
  exportBackupJson: () => void;
  importBackupJson: (file: File) => Promise<{ success: boolean; count: number; error?: string }>;

  // Cloud Sync & Reliability
  cloudSyncStatus: 'connected' | 'syncing' | 'error';
  cloudSyncError: string | null;
  retryCloudSync: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_STUDENT_NUM: 'classhub_current_student',
  STUDENTS: 'classhub_students',
  TEST_RECORDS: 'classhub_test_records',
  QUIZ_SUBMISSIONS: 'classhub_quiz_submissions',
  QUIZZES: 'classhub_quizzes',
  MATERIALS: 'classhub_materials',
  POSTS: 'classhub_posts',
  PASSWORDS: 'classhub_passwords',
  ACTIVE_TEST: 'classhub_active_test',
  PERIODIC_TESTS: 'classhub_periodic_tests',
  CUSTOM_SUBJECTS: 'classhub_custom_subjects',
};

function mergeForumPost(existing: ForumPost | undefined, incoming: ForumPost): ForumPost {
  if (!existing) return incoming;
  const commentMap = new Map<string, ForumPost['comments'][number]>();
  (existing.comments || []).forEach((c) => {
    if (c?.id) commentMap.set(c.id, c);
  });
  (incoming.comments || []).forEach((c) => {
    if (c?.id) commentMap.set(c.id, c);
  });
  const mergedComments = Array.from(commentMap.values()).sort((a, b) =>
    (a.createdAt || '').localeCompare(b.createdAt || '')
  );
  return {
    ...existing,
    ...incoming,
    createdAtMs: Math.max(
      existing.createdAtMs || Date.parse(existing.createdAt) || 0,
      incoming.createdAtMs || Date.parse(incoming.createdAt) || 0
    ),
    reactions: {
      like: Math.max(existing.reactions?.like || 0, incoming.reactions?.like || 0),
      heart: Math.max(existing.reactions?.heart || 0, incoming.reactions?.heart || 0),
      lightbulb: Math.max(existing.reactions?.lightbulb || 0, incoming.reactions?.lightbulb || 0),
    },
    comments: mergedComments,
  };
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Current Student State
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [currentStudentNum, setCurrentStudentNum] = useState<number>(1);
  const [passwords, setPasswords] = useState<Record<number, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // 2. Main Content States
  const [customSubjects, setCustomSubjects] = useState<SubjectOption[]>([]);
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [periodicTests, setPeriodicTests] = useState<PeriodicTestSchedule[]>([]);
  const [activeTestTitle, setActiveTestTitle] = useState<string>('第1回 定期考査');
  const [quizzes, setQuizzes] = useState<WeeklyQuiz[]>(INITIAL_QUIZZES);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizResult[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [studentPredictions, setStudentPredictions] = useState<StudentPrediction[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [editSectionHint, setEditSectionHint] = useState<'quizzes' | 'periodic' | 'subjects' | null>(null);

  // Cloud Sync & Reliability State (surfaces Firestore connection & save issues directly on UI)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'error'>('syncing');
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  // Hydration status guard: prevents React initial empty state from wiping persisted data
  const isHydratedRef = useRef<boolean>(false);
  const hasSyncedCloudQuizzesRef = useRef<boolean>(false);
  const [isStorageHydrated, setIsStorageHydrated] = useState<boolean>(false);

  // Async Storage Hydration on Mount: Loads both from IndexedDB & Server Storage, merging safely
  useEffect(() => {
    let isMounted = true;
    const hydrateStorage = async () => {
      try {
        const savedStudents = await getPersistentItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
        const savedNum = await getPersistentItem<number>(STORAGE_KEYS.CURRENT_STUDENT_NUM, 1);
        const savedPasses = await getPersistentItem<Record<number, string>>(STORAGE_KEYS.PASSWORDS, {});
        const savedLoggedIn = await getPersistentItem<boolean>('classhub_is_logged_in', false);

        // A. Load from client storage (IndexedDB / localStorage)
        const localRecords = await getPersistentItem<TestRecord[]>(STORAGE_KEYS.TEST_RECORDS, INITIAL_TEST_RECORDS);
        const localMaterials = await getPersistentItem<StudyMaterial[]>(STORAGE_KEYS.MATERIALS, []);
        const localPosts = await getPersistentItem<ForumPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
        const localSubs = await getPersistentItem<QuizResult[]>(STORAGE_KEYS.QUIZ_SUBMISSIONS, INITIAL_QUIZ_SUBMISSIONS);
        const localActiveTest = await getPersistentItem<string>(STORAGE_KEYS.ACTIVE_TEST, '第1回 定期考査');
        const localQuizzes = await getPersistentItem<WeeklyQuiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
        const localCustomSubjects = await getPersistentItem<SubjectOption[]>(STORAGE_KEYS.CUSTOM_SUBJECTS, []);

        // B. Fetch server persistent storage & Cloud Firestore students and materials
        let serverData: any = null;
        if (!isStaticDeployment()) {
          try {
            const res = await fetch('/api/data');
            if (res.ok) {
              serverData = await res.json();
            }
          } catch (e) {
            console.warn('Server storage fetch notice:', e);
          }
        }

        let cloudStudents: Partial<Student>[] = [];
        try {
          cloudStudents = await fetchStudentsFromCloud();
        } catch (e) {
          console.warn('Firebase cloud students fetch notice:', e);
        }

        // Merge cloudStudents into INITIAL_STUDENTS & savedStudents & savedPasses
        const mergedPasses: Record<number, string> = { ...savedPasses };
        const mergedStudents = INITIAL_STUDENTS.map((s) => {
          const localObj = (savedStudents || []).find((ls) => ls.attendanceNumber === s.attendanceNumber);
          const cloudObj = cloudStudents.find((cs) => cs.attendanceNumber === s.attendanceNumber);

          let nickname = localObj?.nickname || s.nickname;
          let password = mergedPasses[s.attendanceNumber] || s.password || '0000';
          let hasCustomPassword = localObj?.hasCustomPassword || Boolean(mergedPasses[s.attendanceNumber]);

          if (cloudObj) {
            if (cloudObj.nickname) nickname = cloudObj.nickname;
            if (cloudObj.password) {
              password = cloudObj.password;
              mergedPasses[s.attendanceNumber] = cloudObj.password;
              hasCustomPassword = true;
            }
            if (cloudObj.hasCustomPassword !== undefined) {
              hasCustomPassword = cloudObj.hasCustomPassword;
            }
          }

          return {
            ...s,
            nickname,
            password,
            hasCustomPassword,
          };
        });

        let cloudMaterials: StudyMaterial[] = [];
        try {
          cloudMaterials = await fetchMaterialsFromCloud();
          setCloudSyncStatus('connected');
          setCloudSyncError(null);
        } catch (e: any) {
          console.warn('Firebase cloud materials fetch notice:', e);
          setCloudSyncStatus('error');
          setCloudSyncError(e?.message || 'Firestore接続エラー');
        }

        let cloudPredictions: StudentPrediction[] = [];
        try {
          cloudPredictions = await fetchStudentPredictionsFromCloud();
        } catch (e) {
          console.warn('Firebase cloud predictions fetch notice:', e);
        }

        const localPredictions = await getPersistentItem<StudentPrediction[]>('classhub_student_predictions', []);
        const predictionsMap = new Map<string, StudentPrediction>();
        (localPredictions || []).forEach((p) => { if (p?.id) predictionsMap.set(p.id, p); });
        (cloudPredictions || []).forEach((p) => { if (p?.id) predictionsMap.set(p.id, p); });
        const mergedPredictions = Array.from(predictionsMap.values());
        mergedPredictions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        // C. Safe Union Merge (Union by ID, filtering out legacy sample items)
        const isLegacySample = (id?: string) =>
          !id || id === 'mat-math-1' || id === 'mat-eng-1' || id === 'mat-chem-1' || id === 'test-doc';

        const materialsMap = new Map<string, StudyMaterial>();
        (serverData?.materials || []).forEach((m: StudyMaterial) => {
          if (m?.id && !isLegacySample(m.id)) materialsMap.set(m.id, m);
        });
        (localMaterials || []).forEach((m) => {
          if (m?.id && !isLegacySample(m.id)) materialsMap.set(m.id, m);
        });
        (cloudMaterials || []).forEach((m) => {
          if (m?.id && !isLegacySample(m.id)) materialsMap.set(m.id, m);
        });
        const mergedMaterials = Array.from(materialsMap.values());

        // Sync any real user materials to cloud if they were added offline
        if (cloudMaterials.length === 0 && mergedMaterials.length > 0) {
          mergedMaterials.forEach((m) => {
            if (!isLegacySample(m.id)) {
              saveMaterialToCloud(m).catch(() => {});
            }
          });
        }

        let cloudQuizzes: WeeklyQuiz[] = [];
        try {
          cloudQuizzes = await fetchQuizzesFromCloud();
        } catch (e) {
          console.warn('Firebase cloud quizzes fetch notice:', e);
        }

        const migrateQuizTitle = (q: WeeklyQuiz): WeeklyQuiz =>
          q.id === 'quiz-eng-w4' && q.title === '第4週 英単語ターゲット 500演習'
            ? { ...q, title: 'LEAP テスト' }
            : q;

        let mergedQuizzes: WeeklyQuiz[] = [];
        if (cloudQuizzes.length > 0) {
          mergedQuizzes = cloudQuizzes.map((q) => {
            const migrated = migrateQuizTitle(q);
            if (migrated.title !== q.title) {
              saveQuizToCloud(migrated).catch(() => {});
            }
            return migrated;
          });
          hasSyncedCloudQuizzesRef.current = true;
        } else {
          const quizzesMap = new Map<string, WeeklyQuiz>();
          (serverData?.quizzes || []).forEach((q: WeeklyQuiz) => {
            if (q?.id) quizzesMap.set(q.id, migrateQuizTitle(q));
          });
          (localQuizzes || []).forEach((q) => {
            if (q?.id) quizzesMap.set(q.id, migrateQuizTitle(q));
          });
          const localOrServerQuizzes = Array.from(quizzesMap.values());
          mergedQuizzes = localOrServerQuizzes.length > 0 ? localOrServerQuizzes : INITIAL_QUIZZES;
          // Seed Firestore with quizzes so all devices share the same quizzes collection
          Promise.all(mergedQuizzes.map((q) => saveQuizToCloud(q).catch(() => {}))).then(() => {
            hasSyncedCloudQuizzesRef.current = true;
          });
        }

        const recordsMap = new Map<string, TestRecord>();
        (serverData?.testRecords || []).forEach((r: TestRecord) => { if (r?.id) recordsMap.set(r.id, r); });
        (localRecords || []).forEach((r) => { if (r?.id) recordsMap.set(r.id, r); });
        const mergedRecords = Array.from(recordsMap.values());

        let cloudPosts: ForumPost[] = [];
        try {
          cloudPosts = await fetchPostsFromCloud();
        } catch (e) {
          console.warn('Firebase cloud posts fetch notice:', e);
        }

        const cloudPostsMap = new Map<string, ForumPost>();
        (cloudPosts || []).forEach((p) => {
          if (p?.id) cloudPostsMap.set(p.id, p);
        });

        const postsMap = new Map<string, ForumPost>();
        [...(serverData?.posts || []), ...(localPosts || []), ...(cloudPosts || [])].forEach(
          (p: ForumPost) => {
            if (!p?.id) return;
            postsMap.set(p.id, mergeForumPost(postsMap.get(p.id), p));
          }
        );
        const mergedPosts = Array.from(postsMap.values()).sort(
          (a, b) => (b.createdAtMs || Date.parse(b.createdAt) || 0) - (a.createdAtMs || Date.parse(a.createdAt) || 0)
        );

        // Backfill any local/server forum posts or newer comments/reactions to Firestore so app updates never wipe them
        mergedPosts.forEach((p) => {
          const cloudCopy = cloudPostsMap.get(p.id);
          const needsCloudSync =
            !cloudCopy ||
            (p.comments?.length || 0) > (cloudCopy.comments?.length || 0) ||
            (p.reactions?.like || 0) > (cloudCopy.reactions?.like || 0) ||
            (p.reactions?.heart || 0) > (cloudCopy.reactions?.heart || 0) ||
            (p.reactions?.lightbulb || 0) > (cloudCopy.reactions?.lightbulb || 0);
          if (needsCloudSync) {
            savePostToCloud(p).catch(() => {});
          }
        });

        let cloudSubs: QuizResult[] = [];
        try {
          cloudSubs = await fetchQuizSubmissionsFromCloud();
        } catch (e) {
          console.warn('Firebase cloud quizSubmissions fetch notice:', e);
        }

        const mergeQuizSubmission = (prevItem: QuizResult | undefined, nextItem: QuizResult): QuizResult => {
          if (!prevItem) return nextItem;
          const prevAttempts = prevItem.attemptCount ?? 1;
          const nextAttempts = nextItem.attemptCount ?? 1;
          const prevBest = prevItem.bestScore ?? prevItem.score;
          const nextBest = nextItem.bestScore ?? nextItem.score;
          const useNext =
            nextAttempts > prevAttempts ||
            (nextAttempts === prevAttempts && (nextItem.completedAt || '') >= (prevItem.completedAt || ''));
          const chosen = useNext ? nextItem : prevItem;
          return {
            ...chosen,
            bestScore: Math.max(prevBest, nextBest),
            attemptCount: Math.max(prevAttempts, nextAttempts),
          };
        };

        const subsMap = new Map<string, QuizResult>();
        [...(serverData?.quizSubmissions || []), ...(localSubs || []), ...(cloudSubs || [])].forEach((s: QuizResult) => {
          if (!s?.quizId || !s?.studentNumber) return;
          const key = `${s.quizId}_student_${s.studentNumber}`;
          subsMap.set(key, mergeQuizSubmission(subsMap.get(key), s));
        });
        const mergedSubs = Array.from(subsMap.values());

        let cloudPeriodicTests: PeriodicTestSchedule[] = [];
        try {
          cloudPeriodicTests = await fetchPeriodicTestsFromCloud();
        } catch (e) {
          console.warn('Firebase cloud periodicTests fetch notice:', e);
        }
        const localPeriodicTests = await getPersistentItem<PeriodicTestSchedule[]>(STORAGE_KEYS.PERIODIC_TESTS, []);
        const periodicMap = new Map<string, PeriodicTestSchedule>();
        (localPeriodicTests || []).forEach((p) => { if (p?.id) periodicMap.set(p.id, p); });
        (cloudPeriodicTests || []).forEach((p) => { if (p?.id) periodicMap.set(p.id, p); });
        const mergedPeriodicTests = Array.from(periodicMap.values()).sort((a, b) =>
          (a.date || '').localeCompare(b.date || '')
        );

        const subjectsMap = new Map<string, SubjectOption>();
        (serverData?.customSubjects || []).forEach((s: SubjectOption) => { if (s?.key) subjectsMap.set(s.key, s); });
        (localCustomSubjects || []).forEach((s) => { if (s?.key) subjectsMap.set(s.key, s); });
        const mergedSubjects = Array.from(subjectsMap.values());

        if (isMounted) {
          setStudents(mergedStudents);
          setCurrentStudentNum(savedNum);
          setPasswords(mergedPasses);
          setIsLoggedIn(savedLoggedIn);
          setTestRecords(mergedRecords);
          setPeriodicTests(mergedPeriodicTests);
          setMaterials(mergedMaterials);
          setStudentPredictions(mergedPredictions);
          setPosts(mergedPosts);
          setQuizSubmissions(mergedSubs);
          setActiveTestTitle(localActiveTest);
          setQuizzes(mergedQuizzes.length > 0 ? mergedQuizzes : INITIAL_QUIZZES);
          setCustomSubjects(mergedSubjects);

          // Mark hydration complete! Now effects can safely write updates
          isHydratedRef.current = true;
          setIsStorageHydrated(true);

          // Sync any new client items to server if running on full-stack server
          if (!isStaticDeployment()) {
            fetch('/api/data/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                materials: mergedMaterials,
                quizzes: mergedQuizzes,
                testRecords: mergedRecords,
                posts: mergedPosts,
                customSubjects: mergedSubjects,
                quizSubmissions: mergedSubs,
              }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Error hydrating storage:', err);
        isHydratedRef.current = true;
        setIsStorageHydrated(true);
      }
    };
    hydrateStorage();
    return () => { isMounted = false; };
  }, []);

  // Real-time Firestore subscription for student account profiles (nicknames & passwords)
  useEffect(() => {
    const unsubscribe = subscribeToStudents((cloudList) => {
      if (!cloudList || cloudList.length === 0) return;

      setStudents((prev) =>
        prev.map((s) => {
          const cloudObj = cloudList.find((c) => c.attendanceNumber === s.attendanceNumber);
          if (!cloudObj) return s;
          return {
            ...s,
            nickname: cloudObj.nickname || s.nickname,
            password: cloudObj.password || s.password || '0000',
            hasCustomPassword:
              cloudObj.hasCustomPassword ?? (cloudObj.password ? true : s.hasCustomPassword),
          };
        })
      );

      setPasswords((prev) => {
        const next = { ...prev };
        cloudList.forEach((c) => {
          if (c.attendanceNumber && c.password) {
            next[c.attendanceNumber] = c.password;
          }
        });
        return next;
      });
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription: when ANY PC uploads or deletes a material, all PCs update instantly
  useEffect(() => {
    const isLegacySample = (id?: string) =>
      !id || id === 'mat-math-1' || id === 'mat-eng-1' || id === 'mat-chem-1' || id === 'test-doc';

    const unsubscribe = subscribeToMaterials(
      (cloudList) => {
        const cleanList = (cloudList || []).filter((m) => m && m.id && !isLegacySample(m.id));
        setMaterials(cleanList);
        setCloudSyncStatus('connected');
        setCloudSyncError(null);
        if (isHydratedRef.current) {
          setPersistentItem(STORAGE_KEYS.MATERIALS, cleanList);
        }
      },
      (err) => {
        setCloudSyncStatus('error');
        setCloudSyncError(err.message || 'Firestoreリアルタイム購読エラー');
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription for student test predictions
  useEffect(() => {
    const unsubscribe = subscribeToStudentPredictions(
      (cloudList) => {
        setStudentPredictions(cloudList || []);
        if (isHydratedRef.current) {
          setPersistentItem('classhub_student_predictions', cloudList || []);
        }
      },
      (err) => {
        console.warn('Student predictions subscription error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription for WeeklyQuizzes across all devices
  useEffect(() => {
    const unsubscribe = subscribeToQuizzes(
      (cloudList) => {
        if (cloudList.length > 0 || hasSyncedCloudQuizzesRef.current) {
          hasSyncedCloudQuizzesRef.current = true;
          setQuizzes(cloudList);
          if (isHydratedRef.current) {
            setPersistentItem(STORAGE_KEYS.QUIZZES, cloudList);
          }
        }
      },
      (err) => {
        console.warn('Quizzes subscription error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription for Quiz Submissions across all devices
  useEffect(() => {
    const unsubscribe = subscribeToQuizSubmissions((cloudList) => {
      if (!cloudList) return;
      setQuizSubmissions((prev) => {
        const map = new Map<string, QuizResult>();
        [...prev, ...cloudList].forEach((s) => {
          if (!s?.quizId || !s?.studentNumber) return;
          const key = `${s.quizId}_student_${s.studentNumber}`;
          const existing = map.get(key);
          if (!existing) {
            map.set(key, s);
          } else {
            const prevAttempts = existing.attemptCount ?? 1;
            const nextAttempts = s.attemptCount ?? 1;
            const useNext =
              nextAttempts > prevAttempts ||
              (nextAttempts === prevAttempts && (s.completedAt || '') >= (existing.completedAt || ''));
            const chosen = useNext ? s : existing;
            map.set(key, {
              ...chosen,
              bestScore: Math.max(existing.bestScore ?? existing.score, s.bestScore ?? s.score),
              attemptCount: Math.max(prevAttempts, nextAttempts),
            });
          }
        });
        const merged = Array.from(map.values());
        if (isHydratedRef.current) {
          setPersistentItem(STORAGE_KEYS.QUIZ_SUBMISSIONS, merged);
        }
        return merged;
      });
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription for Periodic Test Schedules
  useEffect(() => {
    const unsubscribe = subscribeToPeriodicTests((cloudList) => {
      if (!cloudList) return;
      setPeriodicTests((prev) => {
        if (cloudList.length === 0 && prev.length === 0) return prev;
        if (isHydratedRef.current) {
          setPersistentItem(STORAGE_KEYS.PERIODIC_TESTS, cloudList);
        }
        return cloudList;
      });
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription for Forum Posts
  useEffect(() => {
    const unsubscribe = subscribeToPosts(
      (cloudList) => {
        if (!cloudList || cloudList.length === 0) return;
        setPosts((prev) => {
          const map = new Map<string, ForumPost>();
          prev.forEach((p) => {
            if (p?.id) map.set(p.id, p);
          });
          cloudList.forEach((p) => {
            if (p?.id) map.set(p.id, mergeForumPost(map.get(p.id), p));
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => (b.createdAtMs || Date.parse(b.createdAt) || 0) - (a.createdAtMs || Date.parse(a.createdAt) || 0)
          );
          if (isHydratedRef.current) {
            setPersistentItem(STORAGE_KEYS.POSTS, merged);
          }
          return merged;
        });
      },
      (err) => {
        console.warn('Forum posts subscription warning:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Persistent State Effects (GUARDED: never overwrite storage before hydration completes!)
  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.STUDENTS, students);
  }, [students]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.CURRENT_STUDENT_NUM, currentStudentNum);
  }, [currentStudentNum]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.PASSWORDS, passwords);
  }, [passwords]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem('classhub_is_logged_in', isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.TEST_RECORDS, testRecords);
    if (!isStaticDeployment()) {
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testRecords }),
      }).catch(() => {});
    }
  }, [testRecords]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.QUIZ_SUBMISSIONS, quizSubmissions);
    if (!isStaticDeployment()) {
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizSubmissions }),
      }).catch(() => {});
    }
  }, [quizSubmissions]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.QUIZZES, quizzes);
    if (!isStaticDeployment()) {
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizzes }),
      }).catch(() => {});
    }
  }, [quizzes]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.MATERIALS, materials);
    if (!isStaticDeployment()) {
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials }),
      }).catch(() => {});
    }
  }, [materials]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.POSTS, posts);
    if (!isStaticDeployment()) {
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts }),
      }).catch(() => {});
    }
  }, [posts]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.ACTIVE_TEST, activeTestTitle);
  }, [activeTestTitle]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.PERIODIC_TESTS, periodicTests);
  }, [periodicTests]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.CUSTOM_SUBJECTS, customSubjects);
    if (!isStaticDeployment()) {
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customSubjects }),
      }).catch(() => {});
    }
  }, [customSubjects]);

  // Current logged in student object
  const currentStudent = useMemo(() => {
    return students.find((s) => s.attendanceNumber === currentStudentNum) || null;
  }, [students, currentStudentNum]);

  // Navigation State
  const [currentTab, setCurrentTabState] = useState<AppTab>(() => {
    return getTabFromLocation();
  });

  const setCurrentTab = (tab: AppTab) => {
    setCurrentTabState(tab);
    if (typeof window !== 'undefined') {
      const targetUrl = getTabUrl(tab);
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (currentUrl !== targetUrl) {
        window.history.pushState({ tab }, '', targetUrl);
      }
    }
  };

  useEffect(() => {
    // 1. If page was opened directly at a path ending with /edit (e.g. /1-8_study/edit) without hash,
    // normalize URL to /1-8_study/#/edit to ensure refreshes and subsequent subpage loads never 404
    if (typeof window !== 'undefined') {
      const cleanPath = window.location.pathname.replace(/\/+$/, '');
      if (cleanPath.endsWith('/edit') && !window.location.hash) {
        const base = getAppBasePath();
        window.history.replaceState({ tab: 'edit' }, '', `${base}#/edit`);
      }
    }

    // 2. Popstate and hashchange listeners for browser back/forward buttons
    const handleLocationChange = (e?: Event) => {
      const popState = typeof PopStateEvent !== 'undefined' && e instanceof PopStateEvent ? e : undefined;
      if (popState?.state?.tab && VALID_TABS.includes(popState.state.tab as AppTab)) {
        setCurrentTabState(popState.state.tab as AppTab);
        return;
      }
      const detectedTab = getTabFromLocation();
      setCurrentTabState(detectedTab);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const login = (attendanceNumber: number, password?: string) => {
    if (attendanceNumber < 1 || attendanceNumber > 40) {
      return { success: false, error: '出席番号は1番〜40番を入力してください' };
    }
    const student = students.find((s) => s.attendanceNumber === attendanceNumber);
    if (!student) {
      return { success: false, error: '指定された出席番号が存在しません' };
    }

    const expectedPass = passwords[attendanceNumber] || student.password || '0000';
    if (!password || password.trim() !== expectedPass) {
      return { success: false, error: 'パスワードが正しくありません。（初期パスワード: 0000）' };
    }

    setCurrentStudentNum(attendanceNumber);
    setIsLoggedIn(true);
    return { success: true };
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const switchStudentDemo = (attendanceNumber: number) => {
    setCurrentStudentNum(attendanceNumber);
  };

  const updateNickname = async (newNickname: string) => {
    if (!currentStudentNum) return;
    const trimmed = newNickname.trim();
    if (!trimmed) return;

    // Update local React state & IndexedDB
    setStudents((prev) => {
      const next = prev.map((s) =>
        s.attendanceNumber === currentStudentNum ? { ...s, nickname: trimmed } : s
      );
      setPersistentItem(STORAGE_KEYS.STUDENTS, next);
      return next;
    });

    // Update authorNickname for materials and posts authored by current student
    setMaterials((prev) =>
      prev.map((m) =>
        m.authorStudentNumber === currentStudentNum ? { ...m, authorNickname: trimmed } : m
      )
    );

    const updatedPostsToSync: ForumPost[] = [];
    setPosts((prev) =>
      prev.map((p) => {
        const isPostAuthor = p.studentNumber === currentStudentNum;
        let hasCommentChange = false;
        const updatedComments = p.comments.map((c) => {
          if (c.studentNumber === currentStudentNum && c.authorNickname !== trimmed) {
            hasCommentChange = true;
            return { ...c, authorNickname: trimmed };
          }
          return c;
        });
        if ((isPostAuthor && p.authorNickname !== trimmed) || hasCommentChange) {
          const updated = {
            ...p,
            authorNickname: isPostAuthor ? trimmed : p.authorNickname,
            comments: updatedComments,
          };
          updatedPostsToSync.push(updated);
          return updated;
        }
        return p;
      })
    );
    updatedPostsToSync.forEach((p) => {
      savePostToCloud(p).catch(() => {});
    });

    // Save to Firebase Firestore Cloud
    try {
      await saveStudentToCloud({
        attendanceNumber: currentStudentNum,
        nickname: trimmed,
        password: passwords[currentStudentNum] || '0000',
      });
    } catch (e) {
      console.error('Failed to sync nickname to Firestore:', e);
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!currentStudentNum) return;
    const trimmed = newPassword.trim();
    if (!trimmed) return;

    // Update local passwords & students state
    setPasswords((prev) => {
      const next = { ...prev, [currentStudentNum]: trimmed };
      setPersistentItem(STORAGE_KEYS.PASSWORDS, next);
      return next;
    });

    setStudents((prev) => {
      const next = prev.map((s) =>
        s.attendanceNumber === currentStudentNum
          ? { ...s, password: trimmed, hasCustomPassword: true }
          : s
      );
      setPersistentItem(STORAGE_KEYS.STUDENTS, next);
      return next;
    });

    // Save to Firebase Firestore Cloud
    try {
      await saveStudentToCloud({
        attendanceNumber: currentStudentNum,
        nickname: currentStudent?.nickname || `出席番号${currentStudentNum}番`,
        password: trimmed,
        hasCustomPassword: true,
      });
    } catch (e) {
      console.error('Failed to sync password to Firestore:', e);
    }
  };

  // Custom Subjects Management
  const addCustomSubject = (name: string): SubjectOption => {
    const trimmed = name.trim();
    if (!trimmed) return createSubjectOption('新規教科');

    const existingCustom = customSubjects.find(
      (s) => s.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (existingCustom) return existingCustom;

    const existingDefault = DEFAULT_SUBJECTS.find(
      (s) => s.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (existingDefault) return existingDefault;

    const newSubj = createSubjectOption(trimmed);
    setCustomSubjects((prev) => [...prev, newSubj]);
    return newSubj;
  };

  const deleteCustomSubject = (key: string) => {
    setCustomSubjects((prev) => prev.filter((s) => s.key !== key));
  };

  const allSubjects = useMemo(() => {
    return [...DEFAULT_SUBJECTS, ...customSubjects];
  }, [customSubjects]);

  // Score Management
  const saveMyScore = (
    testTitle: string,
    testDate: string,
    scores: SubjectScores
  ) => {
    if (!currentStudentNum) return;
    const total: number = Object.values(scores).reduce<number>(
      (acc, val) => acc + (Number(val) || 0),
      0
    );

    setTestRecords((prev) => {
      const existingIndex = prev.findIndex(
        (r) => r.testTitle === testTitle && r.studentNumber === currentStudentNum
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          testDate,
          scores,
          totalScore: total,
        };
        return updated;
      }
      return [
        {
          id: `custom-test-${Date.now()}`,
          testTitle,
          testDate,
          studentNumber: currentStudentNum,
          scores,
          totalScore: total,
        },
        ...prev,
      ];
    });
  };

  const availableTestTitles = useMemo(() => {
    const set = new Set<string>();
    periodicTests.forEach((p) => {
      if (p.title) set.add(p.title);
    });
    if (activeTestTitle) set.add(activeTestTitle);
    testRecords.forEach((r) => set.add(r.testTitle));
    if (set.size === 0) set.add('第1回 定期考査');
    return Array.from(set);
  }, [periodicTests, testRecords, activeTestTitle]);

  const currentTestRecords = useMemo(() => {
    return testRecords.filter((r) => r.testTitle === activeTestTitle);
  }, [testRecords, activeTestTitle]);

  const prevTestRecords = useMemo(() => {
    return testRecords.filter((r) => r.testTitle !== activeTestTitle);
  }, [testRecords, activeTestTitle]);

  // Anonymous Rankings
  const anonymousRankings = useMemo(() => {
    const items = currentTestRecords.map((r) => ({
      studentNumber: r.studentNumber,
      score: r.totalScore,
    }));
    return calculateAnonymousRankings(items);
  }, [currentTestRecords]);

  // Anonymous Growth Rankings
  const anonymousGrowthRankings = useMemo(() => {
    const prevItems = prevTestRecords.map((r) => ({
      studentNumber: r.studentNumber,
      score: r.totalScore,
    }));
    const currItems = currentTestRecords.map((r) => ({
      studentNumber: r.studentNumber,
      score: r.totalScore,
    }));
    return calculateAnonymousGrowthRankings(prevItems, currItems);
  }, [prevTestRecords, currentTestRecords]);

  // Personal Standing
  const personalStanding = useMemo(() => {
    const items = currentTestRecords.map((r) => ({
      studentNumber: r.studentNumber,
      score: r.totalScore,
    }));
    const standing = calculatePersonalStanding(items, currentStudentNum);

    const prevItems = prevTestRecords.map((r) => ({
      studentNumber: r.studentNumber,
      score: r.totalScore,
    }));
    const growth = calculatePersonalGrowth(prevItems, items, currentStudentNum);

    return {
      studentNumber: currentStudentNum,
      totalScore: standing.myScore ?? 0,
      rank: standing.myRank ?? 0,
      totalParticipants: standing.totalParticipants,
      classAverage: standing.classAverage,
      classMax: standing.classMax,
      growthDelta: growth.growthDelta ?? undefined,
      growthRank: growth.growthRank ?? undefined,
    };
  }, [currentTestRecords, prevTestRecords, currentStudentNum]);

  // Score Distribution
  const scoreDistribution = useMemo(() => {
    const scores = currentTestRecords.map((r) => r.totalScore);
    return calculateDistribution(scores, 500);
  }, [currentTestRecords]);

  // Quiz Handling (Cloud-synced bestScore, attemptCount, category, quizTitle)
  const submitQuiz = (quizId: string, answers: number[]) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz || !currentStudentNum) {
      return { score: 0, bestScore: 0, attemptCount: 1, maxScore: 5, rank: 0, total: 0 };
    }

    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const existingSub = quizSubmissions.find(
      (s) => s.quizId === quizId && s.studentNumber === currentStudentNum
    );
    const prevBest = existingSub ? (existingSub.bestScore ?? existingSub.score) : 0;
    const prevAttempts = existingSub ? (existingSub.attemptCount ?? 1) : 0;
    const nextBest = Math.max(prevBest, correctCount);
    const nextAttempts = prevAttempts + 1;

    const newSubmission: QuizResult = {
      id: `${quizId}_student_${currentStudentNum}`,
      quizId,
      quizTitle: quiz.title,
      category: quiz.category,
      studentNumber: currentStudentNum,
      score: correctCount,
      bestScore: nextBest,
      maxScore: quiz.questions.length,
      attemptCount: nextAttempts,
      answers,
      completedAt: new Date().toISOString(),
    };

    setQuizSubmissions((prev) => {
      const filtered = prev.filter(
        (s) => !(s.quizId === quizId && s.studentNumber === currentStudentNum)
      );
      const next = [newSubmission, ...filtered];
      setPersistentItem(STORAGE_KEYS.QUIZ_SUBMISSIONS, next);
      return next;
    });

    // Save to Firebase Firestore asynchronously
    saveQuizSubmissionToCloud(newSubmission).catch(() => {});

    const allQuizSubs = quizSubmissions.filter((s) => s.quizId === quizId);
    const updatedSubs = [
      newSubmission,
      ...allQuizSubs.filter((s) => s.studentNumber !== currentStudentNum),
    ];
    const items = updatedSubs.map((s) => ({
      studentNumber: s.studentNumber,
      score: s.bestScore ?? s.score,
    }));
    const standing = calculatePersonalStanding(items, currentStudentNum);

    return {
      score: correctCount,
      bestScore: nextBest,
      attemptCount: nextAttempts,
      maxScore: quiz.questions.length,
      rank: standing.myRank || 1,
      total: standing.totalParticipants,
    };
  };

  const getQuizAnonymousRankings = (quizId: string): AnonymousRankItem[] => {
    const subs = quizSubmissions.filter((s) => s.quizId === quizId);
    const items = subs.map((s) => ({
      studentNumber: s.studentNumber,
      score: s.bestScore ?? s.score,
    }));
    return calculateAnonymousRankings(items);
  };

  const getMyQuizStanding = (quizId: string) => {
    const subs = quizSubmissions.filter((s) => s.quizId === quizId);
    const mySub = subs.find((s) => s.studentNumber === currentStudentNum);
    const items = subs.map((s) => ({
      studentNumber: s.studentNumber,
      score: s.bestScore ?? s.score,
    }));
    const standing = calculatePersonalStanding(items, currentStudentNum);
    return {
      myScore: mySub ? (mySub.bestScore ?? mySub.score) : standing.myScore,
      bestScore: mySub ? (mySub.bestScore ?? mySub.score) : null,
      attemptCount: mySub ? (mySub.attemptCount ?? 1) : 0,
      maxScore: mySub ? mySub.maxScore : null,
      completedAt: mySub ? mySub.completedAt : null,
      myRank: standing.myRank,
      total: standing.totalParticipants,
      avg: standing.classAverage,
    };
  };

  // Materials with double-layer persistent IndexedDB & server-side JSON backup & Firebase real-time sync
  const addMaterial = async (
    material: Omit<StudyMaterial, 'id' | 'createdAt' | 'downloadCount' | 'authorNickname'>
  ) => {
    const author = currentStudent?.nickname || `出席番号${currentStudentNum}番`;

    let processedImg = material.imageUrl;
    if (processedImg && processedImg.startsWith('data:image/')) {
      try {
        processedImg = await compressImageBase64(processedImg, 1100, 1500, 0.7);
      } catch (e) {
        console.warn('Image compression notice:', e);
      }
    }

    const nowMs = Date.now();
    const newMat: StudyMaterial = {
      ...material,
      imageUrl: processedImg,
      id: `mat-user-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date(nowMs).toISOString().slice(0, 10),
      createdAtMs: nowMs,
      downloadCount: 0,
      authorNickname: author,
    };

    // 1. Persist directly to Firebase Cloud Firestore for real-time synchronization across all PCs
    setCloudSyncStatus('syncing');
    try {
      await saveMaterialToCloud(newMat);
      setCloudSyncStatus('connected');
      setCloudSyncError(null);

      // Update local state and IndexedDB after cloud confirmation
      setMaterials((prev) => {
        const nextList = [newMat, ...prev.filter((m) => m.id !== newMat.id)];
        setPersistentItem(STORAGE_KEYS.MATERIALS, nextList);
        return nextList;
      });
    } catch (e: any) {
      const msg = e?.message || 'Firebaseクラウドへの保存に失敗しました';
      setCloudSyncStatus('error');
      setCloudSyncError(msg);
      console.error('Cloud material save error:', e);
      throw new Error(msg);
    }

    // 2. Also persist to server-side JSON storage if running with Express backend
    if (!isStaticDeployment()) {
      try {
        await fetch('/api/data/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMat),
        });
      } catch (err) {
        console.warn('Server material persist notice:', err);
      }
    }
  };

  const incrementMaterialDownload = (materialId: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, downloadCount: m.downloadCount + 1 } : m))
    );
  };

  const updateMaterial = (materialId: string, updated: Partial<StudyMaterial>) => {
    setMaterials((prev) => {
      const next = prev.map((m) => (m.id === materialId ? { ...m, ...updated } : m));
      setPersistentItem(STORAGE_KEYS.MATERIALS, next);
      const target = next.find((m) => m.id === materialId);
      if (target) {
        saveMaterialToCloud(target).catch(() => {});
        if (!isStaticDeployment()) {
          fetch('/api/data/materials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(target),
          }).catch(() => {});
        }
      }
      return next;
    });
  };

  const deleteMaterial = async (materialId: string) => {
    // Delete from Firebase Cloud Firestore
    setCloudSyncStatus('syncing');
    try {
      await deleteMaterialFromCloud(materialId);
      setCloudSyncStatus('connected');
      setCloudSyncError(null);

      setMaterials((prev) => {
        const filtered = prev.filter((m) => m.id !== materialId);
        setPersistentItem(STORAGE_KEYS.MATERIALS, filtered);
        return filtered;
      });
    } catch (e: any) {
      const msg = e?.message || 'Firebaseクラウドからの削除に失敗しました';
      setCloudSyncStatus('error');
      setCloudSyncError(msg);
      console.error('Cloud material delete error:', e);
      throw new Error(msg);
    }

    if (!isStaticDeployment()) {
      try {
        await fetch(`/api/data/materials/${encodeURIComponent(materialId)}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.warn('Server material delete notice:', e);
      }
    }
  };

  // Student Test Predictions Management
  const addStudentPrediction = async (
    prediction: Omit<StudentPrediction, 'id' | 'createdAt' | 'downloadCount' | 'authorNickname' | 'authorStudentNumber'>
  ) => {
    const author = currentStudent?.nickname || `出席番号${currentStudentNum}番`;

    let processedImg = prediction.imageUrl;
    if (processedImg && processedImg.startsWith('data:image/')) {
      try {
        processedImg = await compressImageBase64(processedImg, 1100, 1500, 0.7);
      } catch (e) {
        console.warn('Image compression notice:', e);
      }
    }

    const nowMs = Date.now();
    const newPred: StudentPrediction = {
      ...prediction,
      imageUrl: processedImg,
      id: `pred-user-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date(nowMs).toISOString().slice(0, 10),
      createdAtMs: nowMs,
      downloadCount: 0,
      authorNickname: author,
      authorStudentNumber: currentStudentNum,
    };

    setCloudSyncStatus('syncing');
    try {
      await saveStudentPredictionToCloud(newPred);
      setCloudSyncStatus('connected');
      setCloudSyncError(null);

      setStudentPredictions((prev) => {
        const nextList = [newPred, ...prev.filter((p) => p.id !== newPred.id)];
        setPersistentItem('classhub_student_predictions', nextList);
        return nextList;
      });
    } catch (e: any) {
      const msg = e?.message || '予想問題のクラウド保存に失敗しました';
      setCloudSyncStatus('error');
      setCloudSyncError(msg);
      throw new Error(msg);
    }
  };

  const deleteStudentPrediction = async (predictionId: string) => {
    setCloudSyncStatus('syncing');
    try {
      await deleteStudentPredictionFromCloud(predictionId);
      setCloudSyncStatus('connected');
      setCloudSyncError(null);

      setStudentPredictions((prev) => {
        const nextList = prev.filter((p) => p.id !== predictionId);
        setPersistentItem('classhub_student_predictions', nextList);
        return nextList;
      });
    } catch (e: any) {
      const msg = e?.message || '予想問題の削除に失敗しました';
      setCloudSyncStatus('error');
      setCloudSyncError(msg);
      throw new Error(msg);
    }
  };

  // Re-fetch all shared materials and forum posts from Firestore manually (for recovery if network drops)
  const retryCloudSync = async () => {
    setCloudSyncStatus('syncing');
    setCloudSyncError(null);
    try {
      const [cloudList, cloudPosts] = await Promise.all([
        fetchMaterialsFromCloud(),
        fetchPostsFromCloud(),
      ]);
      setMaterials(cloudList);
      if (isHydratedRef.current) {
        setPersistentItem(STORAGE_KEYS.MATERIALS, cloudList);
      }

      setPosts((prev) => {
        const map = new Map<string, ForumPost>();
        prev.forEach((p) => {
          if (p?.id) map.set(p.id, p);
        });
        cloudPosts.forEach((p) => {
          if (p?.id) map.set(p.id, mergeForumPost(map.get(p.id), p));
        });
        const merged = Array.from(map.values()).sort(
          (a, b) => (b.createdAtMs || Date.parse(b.createdAt) || 0) - (a.createdAtMs || Date.parse(a.createdAt) || 0)
        );
        if (isHydratedRef.current) {
          setPersistentItem(STORAGE_KEYS.POSTS, merged);
        }
        return merged;
      });

      setCloudSyncStatus('connected');
    } catch (e: any) {
      setCloudSyncStatus('error');
      setCloudSyncError(e?.message || 'Firestore再同期に失敗しました');
    }
  };

  // Forum (Cloud-first Firestore + IndexedDB + Server JSON)
  const addPost = async (subjectTag: string, title: string, content: string) => {
    if (!currentStudentNum) return;
    const author = currentStudent?.nickname || `出席番号${currentStudentNum}番`;
    const nowMs = Date.now();
    const newPost: ForumPost = {
      id: `post-user-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
      studentNumber: currentStudentNum,
      authorNickname: author,
      subjectTag,
      title,
      content,
      createdAt: new Date(nowMs).toISOString(),
      createdAtMs: nowMs,
      reactions: { like: 0, heart: 0, lightbulb: 0 },
      comments: [],
    };

    setPosts((prev) => {
      const next = [newPost, ...prev.filter((p) => p.id !== newPost.id)];
      setPersistentItem(STORAGE_KEYS.POSTS, next);
      return next;
    });

    setCloudSyncStatus('syncing');
    try {
      await savePostToCloud(newPost);
      setCloudSyncStatus('connected');
      setCloudSyncError(null);
    } catch (e: any) {
      const msg = e?.message || '掲示板投稿のクラウド保存に失敗しました';
      setCloudSyncStatus('error');
      setCloudSyncError(msg);
      throw new Error(msg);
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!currentStudentNum || !content.trim()) return;
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    const author = currentStudent?.nickname || `出席番号${currentStudentNum}番`;
    const newComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentNumber: currentStudentNum,
      authorNickname: author,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedPost: ForumPost = {
      ...target,
      comments: [...(target.comments || []), newComment],
    };

    setPosts((prev) => {
      const next = prev.map((p) => (p.id === postId ? updatedPost : p));
      setPersistentItem(STORAGE_KEYS.POSTS, next);
      return next;
    });

    try {
      await savePostToCloud(updatedPost);
      setCloudSyncStatus('connected');
      setCloudSyncError(null);
    } catch (e: any) {
      const msg = e?.message || '返信のクラウド保存に失敗しました';
      setCloudSyncStatus('error');
      setCloudSyncError(msg);
    }
  };

  const toggleReaction = (postId: string, reactionType: 'like' | 'heart' | 'lightbulb') => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    const updatedPost: ForumPost = {
      ...target,
      reactions: {
        ...target.reactions,
        [reactionType]: (target.reactions?.[reactionType] || 0) + 1,
      },
    };

    setPosts((prev) => {
      const next = prev.map((p) => (p.id === postId ? updatedPost : p));
      setPersistentItem(STORAGE_KEYS.POSTS, next);
      return next;
    });

    savePostToCloud(updatedPost).catch((e) => {
      console.warn('Reaction cloud sync warning:', e);
    });
  };

  // Editing functions for /edit
  const addPeriodicTest = async (title: string, date: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setActiveTestTitle(trimmedTitle);

    const existing = periodicTests.find((p) => p.title === trimmedTitle);
    const schedule: PeriodicTestSchedule = {
      id: existing ? existing.id : `periodic-${Date.now()}`,
      title: trimmedTitle,
      date: date || '',
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    setPeriodicTests((prev) => {
      const next = [...prev.filter((p) => p.id !== schedule.id), schedule].sort((a, b) =>
        (a.date || '').localeCompare(b.date || '')
      );
      setPersistentItem(STORAGE_KEYS.PERIODIC_TESTS, next);
      return next;
    });

    try {
      await savePeriodicTestToCloud(schedule);
    } catch (e) {
      console.warn('Periodic test cloud save notice:', e);
    }
  };

  const deletePeriodicTest = async (testId: string) => {
    setPeriodicTests((prev) => {
      const next = prev.filter((p) => p.id !== testId);
      setPersistentItem(STORAGE_KEYS.PERIODIC_TESTS, next);
      return next;
    });
    try {
      await deletePeriodicTestFromCloud(testId);
    } catch (e) {
      console.warn('Periodic test cloud delete notice:', e);
    }
  };

  const updateQuiz = async (updated: WeeklyQuiz) => {
    setCloudSyncStatus('syncing');
    try {
      await saveQuizToCloud(updated);
      setCloudSyncStatus('connected');
      setCloudSyncError(null);
      hasSyncedCloudQuizzesRef.current = true;

      setQuizzes((prev) => {
        const next = prev.map((q) => (q.id === updated.id ? updated : q));
        setPersistentItem(STORAGE_KEYS.QUIZZES, next);
        return next;
      });
    } catch (e: any) {
      const msg = e?.message || '小テストのクラウド保存に失敗しました';
      setCloudSyncStatus('error');
      setCloudSyncError(msg);
      throw new Error(msg);
    }
  };

  const addQuiz = async (newQuiz: WeeklyQuiz) => {
    setCloudSyncStatus('syncing');
    try {
      await saveQuizToCloud(newQuiz);
      setCloudSyncStatus('connected');
      setCloudSyncError(null);
      hasSyncedCloudQuizzesRef.current = true;

      setQuizzes((prev) => {
        const next = [...prev.filter((q) => q.id !== newQuiz.id), newQuiz];
        setPersistentItem(STORAGE_KEYS.QUIZZES, next);
        return next;
      });
    } catch (e: any) {
      const msg = e?.message || '新規小テストのクラウド保存に失敗しました';
      setCloudSyncStatus('error');
      setCloudSyncError(msg);
      throw new Error(msg);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    setCloudSyncStatus('syncing');
    try {
      await deleteQuizFromCloud(quizId);
      setCloudSyncStatus('connected');
      setCloudSyncError(null);
      hasSyncedCloudQuizzesRef.current = true;

      setQuizzes((prev) => {
        const next = prev.filter((q) => q.id !== quizId);
        setPersistentItem(STORAGE_KEYS.QUIZZES, next);
        return next;
      });
    } catch (e: any) {
      const msg = e?.message || '小テストのクラウド削除に失敗しました';
      setCloudSyncStatus('error');
      setCloudSyncError(msg);
      throw new Error(msg);
    }
  };

  const updateQuizQuestion = async (quizId: string, qIndex: number, question: QuizQuestion) => {
    const target = quizzes.find((q) => q.id === quizId);
    if (!target) return;
    const updatedQuestions = [...target.questions];
    updatedQuestions[qIndex] = question;
    await updateQuiz({ ...target, questions: updatedQuestions });
  };

  const addQuizQuestion = async (quizId: string, question: QuizQuestion) => {
    const target = quizzes.find((q) => q.id === quizId);
    if (!target) return;
    await updateQuiz({ ...target, questions: [...target.questions, question] });
  };

  const deleteQuizQuestion = async (quizId: string, questionId: string) => {
    const target = quizzes.find((q) => q.id === quizId);
    if (!target) return;
    await updateQuiz({
      ...target,
      questions: target.questions.filter((item) => item.id !== questionId),
    });
  };

  // Sync With Server Manual Trigger
  const syncWithServer = async () => {
    if (isStaticDeployment()) return;
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const serverData = await res.json();
        if (Array.isArray(serverData.materials)) {
          setMaterials((prev) => {
            const map = new Map<string, StudyMaterial>();
            prev.forEach((m) => map.set(m.id, m));
            serverData.materials.forEach((m: StudyMaterial) => map.set(m.id, m));
            const merged = Array.from(map.values());
            setPersistentItem(STORAGE_KEYS.MATERIALS, merged);
            return merged;
          });
        }
        if (Array.isArray(serverData.posts)) {
          setPosts((prev) => {
            const map = new Map<string, ForumPost>();
            prev.forEach((p) => { if (p?.id) map.set(p.id, p); });
            serverData.posts.forEach((p: ForumPost) => {
              if (p?.id) {
                const mergedPost = mergeForumPost(map.get(p.id), p);
                map.set(p.id, mergedPost);
                savePostToCloud(mergedPost).catch(() => {});
              }
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => (b.createdAtMs || Date.parse(b.createdAt) || 0) - (a.createdAtMs || Date.parse(a.createdAt) || 0)
            );
            setPersistentItem(STORAGE_KEYS.POSTS, merged);
            return merged;
          });
        }
      }
    } catch (e) {
      console.warn('Manual sync notice:', e);
    }
  };

  // Export full JSON backup file (protects user data indefinitely)
  const exportBackupJson = () => {
    const backupData = {
      version: '1-8-site-backup-v3',
      exportedAt: new Date().toISOString(),
      materials,
      studentPredictions,
      periodicTests,
      quizzes,
      testRecords,
      posts,
      customSubjects,
      quizSubmissions,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ichihachi_materials_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import and restore from backup JSON file
  const importBackupJson = async (file: File): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, count: 0, error: 'バックアップファイルの形式が無効です。' };
      }

      let count = 0;
      if (Array.isArray(parsed.materials)) {
        setMaterials((prev) => {
          const map = new Map<string, StudyMaterial>();
          prev.forEach((m) => map.set(m.id, m));
          parsed.materials.forEach((m: StudyMaterial) => {
            if (m && m.id) {
              map.set(m.id, m);
              saveMaterialToCloud(m).catch(() => {});
              count += 1;
            }
          });
          const merged = Array.from(map.values());
          setPersistentItem(STORAGE_KEYS.MATERIALS, merged);
          return merged;
        });
      }

      if (Array.isArray(parsed.posts)) {
        setPosts((prev) => {
          const map = new Map<string, ForumPost>();
          prev.forEach((p) => { if (p?.id) map.set(p.id, p); });
          parsed.posts.forEach((p: ForumPost) => {
            if (p && p.id && p.title) {
              const mergedPost = mergeForumPost(map.get(p.id), p);
              map.set(p.id, mergedPost);
              savePostToCloud(mergedPost).catch(() => {});
              count += 1;
            }
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => (b.createdAtMs || Date.parse(b.createdAt) || 0) - (a.createdAtMs || Date.parse(a.createdAt) || 0)
          );
          setPersistentItem(STORAGE_KEYS.POSTS, merged);
          return merged;
        });
      }

      if (Array.isArray(parsed.studentPredictions)) {
        setStudentPredictions((prev) => {
          const map = new Map<string, StudentPrediction>();
          prev.forEach((p) => { if (p?.id) map.set(p.id, p); });
          parsed.studentPredictions.forEach((p: StudentPrediction) => {
            if (p && p.id) {
              map.set(p.id, p);
              saveStudentPredictionToCloud(p).catch(() => {});
              count += 1;
            }
          });
          const merged = Array.from(map.values());
          setPersistentItem('classhub_student_predictions', merged);
          return merged;
        });
      }

      if (Array.isArray(parsed.periodicTests)) {
        setPeriodicTests((prev) => {
          const map = new Map<string, PeriodicTestSchedule>();
          prev.forEach((p) => { if (p?.id) map.set(p.id, p); });
          parsed.periodicTests.forEach((p: PeriodicTestSchedule) => {
            if (p && p.id && p.title) {
              map.set(p.id, p);
              savePeriodicTestToCloud(p).catch(() => {});
            }
          });
          const merged = Array.from(map.values()).sort((a, b) =>
            (a.date || '').localeCompare(b.date || '')
          );
          setPersistentItem(STORAGE_KEYS.PERIODIC_TESTS, merged);
          return merged;
        });
      }

      if (Array.isArray(parsed.quizzes) && parsed.quizzes.length > 0) {
        setQuizzes(parsed.quizzes);
        setPersistentItem(STORAGE_KEYS.QUIZZES, parsed.quizzes);
        parsed.quizzes.forEach((q: WeeklyQuiz) => {
          if (q?.id) saveQuizToCloud(q).catch(() => {});
        });
      }

      // Sync to server storage if backend exists
      if (!isStaticDeployment()) {
        try {
          await fetch('/api/data/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed),
          });
        } catch (e) {
          console.warn('Server restore notice:', e);
        }
      }

      return { success: true, count };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || '復元処理に失敗しました。' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        students,
        currentStudent,
        currentStudentNum,
        isLoggedIn,
        login,
        logout,
        updateNickname,
        updatePassword,
        switchStudentDemo,
        customSubjects,
        allSubjects,
        addCustomSubject,
        deleteCustomSubject,
        testRecords,
        periodicTests,
        availableTestTitles,
        activeTestTitle,
        setActiveTestTitle,
        saveMyScore,
        addPeriodicTest,
        deletePeriodicTest,
        anonymousRankings,
        anonymousGrowthRankings,
        personalStanding,
        scoreDistribution,
        quizzes,
        quizSubmissions,
        submitQuiz,
        getQuizAnonymousRankings,
        getMyQuizStanding,
        updateQuiz,
        addQuiz,
        deleteQuiz,
        updateQuizQuestion,
        addQuizQuestion,
        deleteQuizQuestion,
        materials,
        addMaterial,
        incrementMaterialDownload,
        updateMaterial,
        deleteMaterial,
        studentPredictions,
        addStudentPrediction,
        deleteStudentPrediction,
        posts,
        addPost,
        addComment,
        toggleReaction,
        currentTab,
        setCurrentTab,
        editSectionHint,
        setEditSectionHint,
        isStorageHydrated,
        syncWithServer,
        exportBackupJson,
        importBackupJson,
        cloudSyncStatus,
        cloudSyncError,
        retryCloudSync,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
