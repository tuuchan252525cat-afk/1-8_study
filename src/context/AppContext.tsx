import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  Student,
  TestRecord,
  WeeklyQuiz,
  QuizQuestion,
  QuizResult,
  StudyMaterial,
  ForumPost,
  AnonymousRankItem,
  AnonymousGrowthItem,
  PersonalStanding,
  ScoreDistributionBin,
  SubjectScores,
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
} from '../utils/navigation';

import { AppTab } from '../types';
export type { AppTab };

interface AppContextType {
  // Auth & Student State
  students: Student[];
  currentStudent: Student | null;
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
  availableTestTitles: string[];
  activeTestTitle: string;
  setActiveTestTitle: (title: string) => void;
  saveMyScore: (testTitle: string, testDate: string, scores: SubjectScores) => void;
  addPeriodicTest: (title: string, date: string) => void;

  // Privacy Protected Rankings (Public & Personal)
  anonymousRankings: AnonymousRankItem[];
  anonymousGrowthRankings: AnonymousGrowthItem[];
  personalStanding: PersonalStanding;
  scoreDistribution: ScoreDistributionBin[];

  // Quizzes (English & Mizo-Blue)
  quizzes: WeeklyQuiz[];
  quizSubmissions: QuizResult[];
  submitQuiz: (quizId: string, answers: number[]) => { score: number; maxScore: number; rank: number; total: number };
  getQuizAnonymousRankings: (quizId: string) => AnonymousRankItem[];
  getMyQuizStanding: (quizId: string) => { myScore: number | null; myRank: number | null; total: number; avg: number } | null;
  updateQuiz: (quiz: WeeklyQuiz) => void;
  addQuiz: (quiz: WeeklyQuiz) => void;
  deleteQuiz: (quizId: string) => void;
  updateQuizQuestion: (quizId: string, qIndex: number, question: QuizQuestion) => void;
  addQuizQuestion: (quizId: string, question: QuizQuestion) => void;
  deleteQuizQuestion: (quizId: string, questionId: string) => void;

  // Study Materials
  materials: StudyMaterial[];
  addMaterial: (material: Omit<StudyMaterial, 'id' | 'createdAt' | 'downloadCount' | 'authorNickname'>) => Promise<void>;
  incrementMaterialDownload: (materialId: string) => void;
  updateMaterial: (materialId: string, updated: Partial<StudyMaterial>) => void;
  deleteMaterial: (materialId: string) => void;

  // Forum (Board)
  posts: ForumPost[];
  addPost: (subjectTag: string, title: string, content: string) => void;
  addComment: (postId: string, content: string) => void;
  toggleReaction: (postId: string, reactionType: 'like' | 'heart' | 'lightbulb') => void;

  // Navigation
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;

  // Anti-Data-Loss & Cloud Sync Tools
  isStorageHydrated: boolean;
  syncWithServer: () => Promise<void>;
  exportBackupJson: () => void;
  importBackupJson: (file: File) => Promise<{ success: boolean; count: number; error?: string }>;
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
  CUSTOM_SUBJECTS: 'classhub_custom_subjects',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Current Student State
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [currentStudentNum, setCurrentStudentNum] = useState<number>(1);
  const [passwords, setPasswords] = useState<Record<number, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // 2. Main Content States
  const [customSubjects, setCustomSubjects] = useState<SubjectOption[]>([]);
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [activeTestTitle, setActiveTestTitle] = useState<string>('第1回 定期考査');
  const [quizzes, setQuizzes] = useState<WeeklyQuiz[]>(INITIAL_QUIZZES);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizResult[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);

  // Hydration status guard: prevents React initial empty state from wiping persisted data
  const isHydratedRef = useRef<boolean>(false);
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
        const localMaterials = await getPersistentItem<StudyMaterial[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
        const localPosts = await getPersistentItem<ForumPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
        const localSubs = await getPersistentItem<QuizResult[]>(STORAGE_KEYS.QUIZ_SUBMISSIONS, INITIAL_QUIZ_SUBMISSIONS);
        const localActiveTest = await getPersistentItem<string>(STORAGE_KEYS.ACTIVE_TEST, '第1回 定期考査');
        const localQuizzes = await getPersistentItem<WeeklyQuiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
        const localCustomSubjects = await getPersistentItem<SubjectOption[]>(STORAGE_KEYS.CUSTOM_SUBJECTS, []);

        // B. Fetch server persistent storage from /api/data
        let serverData: any = null;
        try {
          const res = await fetch('/api/data');
          if (res.ok) {
            serverData = await res.json();
          }
        } catch (e) {
          console.warn('Server storage fetch notice:', e);
        }

        // C. Safe Union Merge (Union by ID so no data is ever lost across device/browser updates)
        const materialsMap = new Map<string, StudyMaterial>();
        (serverData?.materials || []).forEach((m: StudyMaterial) => { if (m?.id) materialsMap.set(m.id, m); });
        (localMaterials || []).forEach((m) => { if (m?.id) materialsMap.set(m.id, m); });
        const mergedMaterials = Array.from(materialsMap.values());

        const quizzesMap = new Map<string, WeeklyQuiz>();
        (serverData?.quizzes || []).forEach((q: WeeklyQuiz) => { if (q?.id) quizzesMap.set(q.id, q); });
        (localQuizzes || []).forEach((q) => { if (q?.id) quizzesMap.set(q.id, q); });
        const mergedQuizzes = Array.from(quizzesMap.values());

        const recordsMap = new Map<string, TestRecord>();
        (serverData?.testRecords || []).forEach((r: TestRecord) => { if (r?.id) recordsMap.set(r.id, r); });
        (localRecords || []).forEach((r) => { if (r?.id) recordsMap.set(r.id, r); });
        const mergedRecords = Array.from(recordsMap.values());

        const postsMap = new Map<string, ForumPost>();
        (serverData?.posts || []).forEach((p: ForumPost) => { if (p?.id) postsMap.set(p.id, p); });
        (localPosts || []).forEach((p) => { if (p?.id) postsMap.set(p.id, p); });
        const mergedPosts = Array.from(postsMap.values());

        const subsMap = new Map<string, QuizResult>();
        (serverData?.quizSubmissions || []).forEach((s: QuizResult) => { if (s?.id) subsMap.set(s.id, s); });
        (localSubs || []).forEach((s) => { if (s?.id) subsMap.set(s.id, s); });
        const mergedSubs = Array.from(subsMap.values());

        const subjectsMap = new Map<string, SubjectOption>();
        (serverData?.customSubjects || []).forEach((s: SubjectOption) => { if (s?.key) subjectsMap.set(s.key, s); });
        (localCustomSubjects || []).forEach((s) => { if (s?.key) subjectsMap.set(s.key, s); });
        const mergedSubjects = Array.from(subjectsMap.values());

        if (isMounted) {
          setStudents(savedStudents);
          setCurrentStudentNum(savedNum);
          setPasswords(savedPasses);
          setIsLoggedIn(savedLoggedIn);
          setTestRecords(mergedRecords);
          setMaterials(mergedMaterials);
          setPosts(mergedPosts);
          setQuizSubmissions(mergedSubs);
          setActiveTestTitle(localActiveTest);
          setQuizzes(mergedQuizzes.length > 0 ? mergedQuizzes : INITIAL_QUIZZES);
          setCustomSubjects(mergedSubjects);

          // Mark hydration complete! Now effects can safely write updates
          isHydratedRef.current = true;
          setIsStorageHydrated(true);

          // Sync any new client items to server
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
      } catch (err) {
        console.error('Error hydrating storage:', err);
        isHydratedRef.current = true;
        setIsStorageHydrated(true);
      }
    };
    hydrateStorage();
    return () => { isMounted = false; };
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
    fetch('/api/data/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testRecords }),
    }).catch(() => {});
  }, [testRecords]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.QUIZ_SUBMISSIONS, quizSubmissions);
    fetch('/api/data/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizSubmissions }),
    }).catch(() => {});
  }, [quizSubmissions]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.QUIZZES, quizzes);
    fetch('/api/data/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizzes }),
    }).catch(() => {});
  }, [quizzes]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.MATERIALS, materials);
    fetch('/api/data/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materials }),
    }).catch(() => {});
  }, [materials]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.POSTS, posts);
    fetch('/api/data/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts }),
    }).catch(() => {});
  }, [posts]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.ACTIVE_TEST, activeTestTitle);
  }, [activeTestTitle]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    setPersistentItem(STORAGE_KEYS.CUSTOM_SUBJECTS, customSubjects);
    fetch('/api/data/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customSubjects }),
    }).catch(() => {});
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

    const expectedPass = passwords[attendanceNumber] || '0000';
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

  const updateNickname = (newNickname: string) => {
    if (!currentStudentNum) return;
    const trimmed = newNickname.trim();
    if (!trimmed) return;
    setStudents((prev) =>
      prev.map((s) => (s.attendanceNumber === currentStudentNum ? { ...s, nickname: trimmed } : s))
    );
  };

  const updatePassword = (newPassword: string) => {
    if (!currentStudentNum) return;
    setPasswords((prev) => ({
      ...prev,
      [currentStudentNum]: newPassword,
    }));
    setStudents((prev) =>
      prev.map((s) => (s.attendanceNumber === currentStudentNum ? { ...s, hasCustomPassword: true } : s))
    );
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
    if (activeTestTitle) set.add(activeTestTitle);
    testRecords.forEach((r) => set.add(r.testTitle));
    if (set.size === 0) set.add('第1回 定期考査');
    return Array.from(set);
  }, [testRecords, activeTestTitle]);

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

  // Quiz Handling
  const submitQuiz = (quizId: string, answers: number[]) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz || !currentStudentNum) {
      return { score: 0, maxScore: 5, rank: 0, total: 0 };
    }

    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const newSubmission: QuizResult = {
      id: `sub-${quizId}-${currentStudentNum}-${Date.now()}`,
      quizId,
      studentNumber: currentStudentNum,
      score: correctCount,
      maxScore: quiz.questions.length,
      answers,
      completedAt: new Date().toISOString(),
    };

    setQuizSubmissions((prev) => {
      const filtered = prev.filter(
        (s) => !(s.quizId === quizId && s.studentNumber === currentStudentNum)
      );
      return [newSubmission, ...filtered];
    });

    const allQuizSubs = quizSubmissions.filter((s) => s.quizId === quizId);
    const updatedSubs = [
      newSubmission,
      ...allQuizSubs.filter((s) => s.studentNumber !== currentStudentNum),
    ];
    const items = updatedSubs.map((s) => ({ studentNumber: s.studentNumber, score: s.score }));
    const standing = calculatePersonalStanding(items, currentStudentNum);

    return {
      score: correctCount,
      maxScore: quiz.questions.length,
      rank: standing.myRank || 1,
      total: standing.totalParticipants,
    };
  };

  const getQuizAnonymousRankings = (quizId: string): AnonymousRankItem[] => {
    const subs = quizSubmissions.filter((s) => s.quizId === quizId);
    const items = subs.map((s) => ({ studentNumber: s.studentNumber, score: s.score }));
    return calculateAnonymousRankings(items);
  };

  const getMyQuizStanding = (quizId: string) => {
    const subs = quizSubmissions.filter((s) => s.quizId === quizId);
    const items = subs.map((s) => ({ studentNumber: s.studentNumber, score: s.score }));
    const standing = calculatePersonalStanding(items, currentStudentNum);
    return {
      myScore: standing.myScore,
      myRank: standing.myRank,
      total: standing.totalParticipants,
      avg: standing.classAverage,
    };
  };

  // Materials with double-layer persistent IndexedDB & server-side JSON backup
  const addMaterial = async (
    material: Omit<StudyMaterial, 'id' | 'createdAt' | 'downloadCount' | 'authorNickname'>
  ) => {
    const author = currentStudent?.nickname || `出席番号${currentStudentNum}番`;

    let processedImg = material.imageUrl;
    if (processedImg && processedImg.startsWith('data:image/')) {
      try {
        processedImg = await compressImageBase64(processedImg, 1200, 1600, 0.75);
      } catch (e) {
        console.warn('Image compression failed, using original', e);
      }
    }

    const newMat: StudyMaterial = {
      ...material,
      imageUrl: processedImg,
      id: `mat-user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString().slice(0, 10),
      downloadCount: 0,
      authorNickname: author,
    };

    // 1. Update React state immediately
    setMaterials((prev) => {
      const nextList = [newMat, ...prev];
      // 2. Save directly to persistent IndexedDB
      setPersistentItem(STORAGE_KEYS.MATERIALS, nextList);
      return nextList;
    });

    // 3. Immediately persist to server-side JSON storage
    try {
      await fetch('/api/data/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMat),
      });
    } catch (err) {
      console.warn('Server material persist notice:', err);
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
        fetch('/api/data/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(target),
        }).catch(() => {});
      }
      return next;
    });
  };

  const deleteMaterial = (materialId: string) => {
    setMaterials((prev) => {
      const filtered = prev.filter((m) => m.id !== materialId);
      setPersistentItem(STORAGE_KEYS.MATERIALS, filtered);
      return filtered;
    });
    fetch(`/api/data/materials/${encodeURIComponent(materialId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  // Forum
  const addPost = (subjectTag: string, title: string, content: string) => {
    if (!currentStudentNum) return;
    const author = currentStudent?.nickname || `出席番号${currentStudentNum}番`;
    const newPost: ForumPost = {
      id: `post-user-${Date.now()}`,
      studentNumber: currentStudentNum,
      authorNickname: author,
      subjectTag,
      title,
      content,
      createdAt: new Date().toISOString(),
      reactions: { like: 0, heart: 0, lightbulb: 0 },
      comments: [],
    };
    setPosts((prev) => {
      const next = [newPost, ...prev];
      setPersistentItem(STORAGE_KEYS.POSTS, next);
      return next;
    });
  };

  const addComment = (postId: string, content: string) => {
    if (!currentStudentNum || !content.trim()) return;
    const author = currentStudent?.nickname || `出席番号${currentStudentNum}番`;
    const newComment = {
      id: `c-${Date.now()}`,
      studentNumber: currentStudentNum,
      authorNickname: author,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    );
  };

  const toggleReaction = (postId: string, reactionType: 'like' | 'heart' | 'lightbulb') => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          reactions: {
            ...p.reactions,
            [reactionType]: p.reactions[reactionType] + 1,
          },
        };
      })
    );
  };

  // Editing functions for /edit
  const addPeriodicTest = (title: string, date: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setActiveTestTitle(trimmedTitle);
  };

  const updateQuiz = (updated: WeeklyQuiz) => {
    setQuizzes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  const addQuiz = (newQuiz: WeeklyQuiz) => {
    setQuizzes((prev) => {
      const next = [...prev, newQuiz];
      setPersistentItem(STORAGE_KEYS.QUIZZES, next);
      return next;
    });
  };

  const deleteQuiz = (quizId: string) => {
    setQuizzes((prev) => {
      const next = prev.filter((q) => q.id !== quizId);
      setPersistentItem(STORAGE_KEYS.QUIZZES, next);
      return next;
    });
  };

  const updateQuizQuestion = (quizId: string, qIndex: number, question: QuizQuestion) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id !== quizId) return q;
        const updatedQuestions = [...q.questions];
        updatedQuestions[qIndex] = question;
        return { ...q, questions: updatedQuestions };
      })
    );
  };

  const addQuizQuestion = (quizId: string, question: QuizQuestion) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id !== quizId) return q;
        return { ...q, questions: [...q.questions, question] };
      })
    );
  };

  const deleteQuizQuestion = (quizId: string, questionId: string) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id !== quizId) return q;
        return { ...q, questions: q.questions.filter((item) => item.id !== questionId) };
      })
    );
  };

  // Sync With Server Manual Trigger
  const syncWithServer = async () => {
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
      }
    } catch (e) {
      console.warn('Manual sync error:', e);
    }
  };

  // Export full JSON backup file (protects user data indefinitely)
  const exportBackupJson = () => {
    const backupData = {
      version: '1-8-site-backup-v2',
      exportedAt: new Date().toISOString(),
      materials,
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
              count += 1;
            }
          });
          const merged = Array.from(map.values());
          setPersistentItem(STORAGE_KEYS.MATERIALS, merged);
          return merged;
        });
      }

      if (Array.isArray(parsed.quizzes) && parsed.quizzes.length > 0) {
        setQuizzes(parsed.quizzes);
        setPersistentItem(STORAGE_KEYS.QUIZZES, parsed.quizzes);
      }

      // Sync to server storage
      await fetch('/api/data/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

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
        availableTestTitles,
        activeTestTitle,
        setActiveTestTitle,
        saveMyScore,
        addPeriodicTest,
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
        posts,
        addPost,
        addComment,
        toggleReaction,
        currentTab,
        setCurrentTab,
        isStorageHydrated,
        syncWithServer,
        exportBackupJson,
        importBackupJson,
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
