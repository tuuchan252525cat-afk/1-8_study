import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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

export type AppTab = 'home' | 'tests' | 'quiz' | 'materials' | 'forum' | 'mypage' | 'edit';

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

  // Test & Score Management
  testRecords: TestRecord[];
  availableTestTitles: string[];
  activeTestTitle: string;
  setActiveTestTitle: (title: string) => void;
  saveMyScore: (testTitle: string, testDate: string, scores: { japanese: number; math: number; english: number; science: number; social: number }) => void;
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
};

// Helper to check and filter out old mock data
function filterOutMockData<T extends { id?: string }>(items: T[], mockIdPrefixes: string[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => {
    if (!item || !item.id) return true;
    return !mockIdPrefixes.some((prefix) => item.id?.startsWith(prefix));
  });
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Current Student State
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [currentStudentNum, setCurrentStudentNum] = useState<number>(1);
  const [passwords, setPasswords] = useState<Record<number, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // 2. Main Content States (Initialized cleanly, loaded async from IndexedDB)
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [activeTestTitle, setActiveTestTitle] = useState<string>('第1回 定期考査');
  const [quizzes, setQuizzes] = useState<WeeklyQuiz[]>(INITIAL_QUIZZES);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizResult[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);

  // Async Storage Hydration on Mount (IndexedDB + localStorage)
  useEffect(() => {
    let isMounted = true;
    const hydrateStorage = async () => {
      try {
        const savedStudents = await getPersistentItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
        const savedNum = await getPersistentItem<number>(STORAGE_KEYS.CURRENT_STUDENT_NUM, 1);
        const savedPasses = await getPersistentItem<Record<number, string>>(STORAGE_KEYS.PASSWORDS, {});
        const savedLoggedIn = await getPersistentItem<boolean>('classhub_is_logged_in', false);

        // Filter out old mock sample records if they exist in storage
        const rawRecords = await getPersistentItem<TestRecord[]>(STORAGE_KEYS.TEST_RECORDS, INITIAL_TEST_RECORDS);
        const cleanRecords = filterOutMockData(rawRecords, ['test-2026-10-', 'test-2026-06-']);

        const rawMaterials = await getPersistentItem<StudyMaterial[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
        const cleanMaterials = filterOutMockData(rawMaterials, ['mat-1', 'mat-2', 'mat-3', 'mat-4', 'mat-5', 'mat-6']);

        const rawPosts = await getPersistentItem<ForumPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
        const cleanPosts = filterOutMockData(rawPosts, ['post-1', 'post-2', 'post-3', 'post-4']);

        const rawSubs = await getPersistentItem<QuizResult[]>(STORAGE_KEYS.QUIZ_SUBMISSIONS, INITIAL_QUIZ_SUBMISSIONS);
        const cleanSubs = filterOutMockData(rawSubs, ['sub-eng-', 'sub-mizo-']);

        const savedActiveTest = await getPersistentItem<string>(STORAGE_KEYS.ACTIVE_TEST, '第1回 定期考査');
        const savedQuizzes = await getPersistentItem<WeeklyQuiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);

        if (isMounted) {
          setStudents(savedStudents);
          setCurrentStudentNum(savedNum);
          setPasswords(savedPasses);
          setIsLoggedIn(savedLoggedIn);
          setTestRecords(cleanRecords);
          setMaterials(cleanMaterials);
          setPosts(cleanPosts);
          setQuizSubmissions(cleanSubs);
          setActiveTestTitle(savedActiveTest);
          setQuizzes(savedQuizzes);
        }
      } catch (err) {
        console.error('Error hydrating storage:', err);
      }
    };
    hydrateStorage();
    return () => { isMounted = false; };
  }, []);

  // Persistent State Effects
  useEffect(() => {
    setPersistentItem(STORAGE_KEYS.STUDENTS, students);
  }, [students]);

  useEffect(() => {
    setPersistentItem(STORAGE_KEYS.CURRENT_STUDENT_NUM, currentStudentNum);
  }, [currentStudentNum]);

  useEffect(() => {
    setPersistentItem(STORAGE_KEYS.PASSWORDS, passwords);
  }, [passwords]);

  useEffect(() => {
    setPersistentItem('classhub_is_logged_in', isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    setPersistentItem(STORAGE_KEYS.TEST_RECORDS, testRecords);
  }, [testRecords]);

  useEffect(() => {
    setPersistentItem(STORAGE_KEYS.QUIZ_SUBMISSIONS, quizSubmissions);
  }, [quizSubmissions]);

  useEffect(() => {
    setPersistentItem(STORAGE_KEYS.QUIZZES, quizzes);
  }, [quizzes]);

  useEffect(() => {
    setPersistentItem(STORAGE_KEYS.MATERIALS, materials);
  }, [materials]);

  useEffect(() => {
    setPersistentItem(STORAGE_KEYS.POSTS, posts);
  }, [posts]);

  useEffect(() => {
    setPersistentItem(STORAGE_KEYS.ACTIVE_TEST, activeTestTitle);
  }, [activeTestTitle]);

  // Current logged in student object
  const currentStudent = useMemo(() => {
    return students.find((s) => s.attendanceNumber === currentStudentNum) || null;
  }, [students, currentStudentNum]);

  // Navigation State
  const [currentTab, setCurrentTabState] = useState<AppTab>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/edit') {
      return 'edit';
    }
    return 'home';
  });

  const setCurrentTab = (tab: AppTab) => {
    setCurrentTabState(tab);
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'edit' ? '/edit' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/edit') {
        setCurrentTabState('edit');
      } else {
        setCurrentTabState('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  // Score Management
  const saveMyScore = (
    testTitle: string,
    testDate: string,
    scores: { japanese: number; math: number; english: number; science: number; social: number }
  ) => {
    if (!currentStudentNum) return;
    const total = scores.japanese + scores.math + scores.english + scores.science + scores.social;

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

  // Materials with image compression & persistent IndexedDB saving
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
      id: `mat-user-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      downloadCount: 0,
      authorNickname: author,
    };

    setMaterials((prev) => {
      const nextList = [newMat, ...prev];
      setPersistentItem(STORAGE_KEYS.MATERIALS, nextList);
      return nextList;
    });
  };

  const incrementMaterialDownload = (materialId: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, downloadCount: m.downloadCount + 1 } : m))
    );
  };

  const updateMaterial = (materialId: string, updated: Partial<StudyMaterial>) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, ...updated } : m))
    );
  };

  const deleteMaterial = (materialId: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
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
    setPosts((prev) => [newPost, ...prev]);
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
    setQuizzes((prev) => [...prev, newQuiz]);
  };

  const deleteQuiz = (quizId: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
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
