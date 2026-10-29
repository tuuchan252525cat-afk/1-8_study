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
  addMaterial: (material: Omit<StudyMaterial, 'id' | 'createdAt' | 'downloadCount' | 'authorNickname'>) => void;
  incrementMaterialDownload: (materialId: string) => void;
  updateMaterial: (materialId: string, updated: Partial<StudyMaterial>) => void;

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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Current Student
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [currentStudentNum, setCurrentStudentNum] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT_NUM);
      return saved ? Number(saved) : 12; // Default to Student #12 (ミント)
    } catch {
      return 12;
    }
  });

  // Passwords storage { [studentNumber]: string }
  const [passwords, setPasswords] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      return saved ? JSON.parse(saved) : { 12: '1212' };
    } catch {
      return { 12: '1212' };
    }
  });

  // Current logged in student object
  const currentStudent = useMemo(() => {
    return students.find((s) => s.attendanceNumber === currentStudentNum) || null;
  }, [students, currentStudentNum]);

  // 2. Navigation State with URL /edit support
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

  // 3. Test Records
  const [testRecords, setTestRecords] = useState<TestRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEST_RECORDS);
      return saved ? JSON.parse(saved) : INITIAL_TEST_RECORDS;
    } catch {
      return INITIAL_TEST_RECORDS;
    }
  });

  const availableTestTitles = useMemo(() => {
    const set = new Set<string>();
    testRecords.forEach((r) => set.add(r.testTitle));
    return Array.from(set);
  }, [testRecords]);

  const [activeTestTitle, setActiveTestTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEST);
      return saved || '第2回 校内実力模試（10月）';
    } catch {
      return '第2回 校内実力模試（10月）';
    }
  });

  // 4. Quizzes (now editable & stored)
  const [quizzes, setQuizzes] = useState<WeeklyQuiz[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUIZZES);
      return saved ? JSON.parse(saved) : INITIAL_QUIZZES;
    } catch {
      return INITIAL_QUIZZES;
    }
  });
  const [quizSubmissions, setQuizSubmissions] = useState<QuizResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUIZ_SUBMISSIONS);
      return saved ? JSON.parse(saved) : INITIAL_QUIZ_SUBMISSIONS;
    } catch {
      return INITIAL_QUIZ_SUBMISSIONS;
    }
  });

  // 5. Materials
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
    } catch {
      return INITIAL_MATERIALS;
    }
  });

  // 6. Forum Posts
  const [posts, setPosts] = useState<ForumPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSTS);
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch {}
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT_NUM, String(currentStudentNum));
    } catch {}
  }, [currentStudentNum]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
    } catch {}
  }, [passwords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEST_RECORDS, JSON.stringify(testRecords));
    } catch {}
  }, [testRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUIZ_SUBMISSIONS, JSON.stringify(quizSubmissions));
    } catch {}
  }, [quizSubmissions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    } catch {}
  }, [quizzes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
    } catch {}
  }, [materials]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    } catch {}
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TEST, activeTestTitle);
    } catch {}
  }, [activeTestTitle]);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('classhub_is_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('classhub_is_logged_in', String(isLoggedIn));
    } catch {}
  }, [isLoggedIn]);

  // Auth Functions
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
    try {
      localStorage.removeItem('classhub_is_logged_in');
    } catch {}
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
      // Check if current student already has a record for this test
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

  // Calculations for Active Test
  const currentTestRecords = useMemo(() => {
    return testRecords.filter((r) => r.testTitle === activeTestTitle);
  }, [testRecords, activeTestTitle]);

  const prevTestRecords = useMemo(() => {
    return testRecords.filter((r) => r.testTitle === '第1回 校内実力模試（6月）');
  }, [testRecords]);

  // Anonymous Rankings (Strictly No Identifiers)
  const anonymousRankings = useMemo(() => {
    const items = currentTestRecords.map((r) => ({
      studentNumber: r.studentNumber,
      score: r.totalScore,
    }));
    return calculateAnonymousRankings(items);
  }, [currentTestRecords]);

  // Anonymous Growth Rankings (Strictly No Identifiers)
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

  // Personal Standing (Visible ONLY to logged in user)
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

    // Calculate personal standing for this quiz
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

  // Materials
  const addMaterial = (
    material: Omit<StudyMaterial, 'id' | 'createdAt' | 'downloadCount' | 'authorNickname'>
  ) => {
    const author = currentStudent?.nickname || `出席番号${currentStudentNum}`;
    const newMat: StudyMaterial = {
      ...material,
      id: `mat-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      downloadCount: 0,
      authorNickname: author,
    };
    setMaterials((prev) => [newMat, ...prev]);
  };

  const incrementMaterialDownload = (materialId: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, downloadCount: m.downloadCount + 1 } : m))
    );
  };

  // Forum
  const addPost = (subjectTag: string, title: string, content: string) => {
    if (!currentStudentNum) return;
    const author = currentStudent?.nickname || `出席番号${currentStudentNum}`;
    const newPost: ForumPost = {
      id: `post-${Date.now()}`,
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
    const author = currentStudent?.nickname || `出席番号${currentStudentNum}`;
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

    // Seed dummy baseline scores for classmates so rankings calculate immediately
    const newRecords: TestRecord[] = students.map((s) => {
      const base = 310 + ((s.attendanceNumber * 19 + 11) % 150);
      const j = Math.round(base * 0.2);
      const m = Math.round(base * 0.22);
      const e = Math.round(base * 0.2);
      const sc = Math.round(base * 0.19);
      const so = base - (j + m + e + sc);
      return {
        id: `test-${Date.now()}-${s.attendanceNumber}`,
        testTitle: trimmedTitle,
        testDate: date || new Date().toISOString().slice(0, 10),
        studentNumber: s.attendanceNumber,
        scores: { japanese: j, math: m, english: e, science: sc, social: so },
        totalScore: base,
      };
    });

    setTestRecords((prev) => [...newRecords, ...prev]);
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

  const updateMaterial = (materialId: string, updated: Partial<StudyMaterial>) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, ...updated } : m))
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
