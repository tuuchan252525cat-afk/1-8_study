import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { WeeklyQuiz, QuizQuestion } from '../types';
import {
  BookOpen,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Sparkles,
  HelpCircle,
  Pencil,
  MessageSquare,
  ListChecks,
  Lightbulb,
  X,
  FlaskConical,
  FileCheck2,
  AlertCircle,
  FileText,
  Tag,
  Bookmark,
  AlignLeft,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

type QuizCategory = 'english' | 'mizoblue' | 'ai_predicted' | (string & {});

const CATEGORY_PRESETS: { value: QuizCategory; label: string; description: string }[] = [
  { value: 'english', label: '英単語ターゲット', description: 'LEAP・英単語・熟語' },
  { value: 'mizoblue', label: 'ミゾブルー理科教養', description: '理科・一般教養' },
  { value: 'ai_predicted', label: 'AI定期テスト予想', description: '定期テスト対策' },
];

const getCategoryMeta = (category: QuizCategory) => {
  switch (category) {
    case 'english':
      return {
        label: '英単語ターゲット',
        badgeClass: 'bg-sky-50 border-sky-200 text-sky-600',
        tagClass: 'bg-sky-50 text-sky-700 border-sky-200',
        hoverBorderClass: 'hover:border-sky-400',
        icon: <BookOpen className="w-6 h-6" />,
      };
    case 'mizoblue':
      return {
        label: 'ミゾブルー理科教養',
        badgeClass: 'bg-amber-50 border-amber-200 text-amber-600',
        tagClass: 'bg-amber-50 text-amber-700 border-amber-200',
        hoverBorderClass: 'hover:border-amber-400',
        icon: <FlaskConical className="w-6 h-6" />,
      };
    case 'ai_predicted':
      return {
        label: 'AI定期テスト予想',
        badgeClass: 'bg-rose-50 border-rose-200 text-rose-600',
        tagClass: 'bg-rose-50 text-rose-700 border-rose-200',
        hoverBorderClass: 'hover:border-rose-400',
        icon: <FileCheck2 className="w-6 h-6" />,
      };
    default:
      return {
        label: category || 'その他カテゴリ',
        badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-600',
        tagClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        hoverBorderClass: 'hover:border-emerald-400',
        icon: <BookOpen className="w-6 h-6" />,
      };
  }
};

export const EditManagementView: React.FC = () => {
  const {
    quizzes,
    updateQuiz,
    addQuiz,
    deleteQuiz,
    periodicTests,
    availableTestTitles,
    addPeriodicTest,
    deletePeriodicTest,
    setCurrentTab,
    editSectionHint,
    setEditSectionHint,
    allSubjects,
    addCustomSubject,
    deleteCustomSubject,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'quizzes' | 'periodic' | 'subjects'>(
    editSectionHint || 'quizzes'
  );
  const [newCustomSubjectName, setNewCustomSubjectName] = useState('');

  useEffect(() => {
    if (editSectionHint) {
      setActiveSection(editSectionHint);
      setEditSectionHint(null);
    }
  }, [editSectionHint, setEditSectionHint]);

  // Step 1 vs Step 2/3 View State
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const activeQuiz = selectedQuizId ? quizzes.find((q) => q.id === selectedQuizId) || null : null;

  // Editing states for currently selected quiz
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<QuizCategory>('english');
  const [editWeekLabel, setEditWeekLabel] = useState('今週の小テスト');
  const [editDesc, setEditDesc] = useState('');
  const [editDuration, setEditDuration] = useState(5);
  const [editQuestions, setEditQuestions] = useState<QuizQuestion[]>([]);
  const [quizSaved, setQuizSaved] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // Step 2: Basic Info Edit Modal & Drafts
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState<QuizCategory>('english');
  const [draftWeekLabel, setDraftWeekLabel] = useState('');
  const [draftDesc, setDraftDesc] = useState('');

  // Quiz Delete Confirmation Modal State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Step 3/4: Dedicated Question Edit Modal State
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | 'new' | null>(null);
  const [draftQuestion, setDraftQuestion] = useState<QuizQuestion | null>(null);
  const [inlineNotice, setInlineNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Sync local editor buffers when activeQuiz changes from Firestore real-time updates
  useEffect(() => {
    if (selectedQuizId) {
      const found = quizzes.find((q) => q.id === selectedQuizId);
      if (!found) {
        setSelectedQuizId(null);
        setIsMetaModalOpen(false);
        setIsDeleteConfirmOpen(false);
      } else {
        setEditTitle(found.title);
        setEditCategory(found.category);
        setEditWeekLabel(found.weekLabel);
        setEditDesc(found.description);
        setEditDuration(found.durationMinutes);
        setEditQuestions(found.questions);
      }
    }
  }, [quizzes, selectedQuizId]);

  const showNotice = (text: string, type: 'error' | 'success' = 'error') => {
    setInlineNotice({ type, text });
    setTimeout(() => {
      setInlineNotice((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  // Step 1 -> Step 2/3: Select a Quiz Card
  const handleSelectQuiz = (quizId: string) => {
    const q = quizzes.find((item) => item.id === quizId);
    if (!q) return;
    setSelectedQuizId(quizId);
    setEditTitle(q.title);
    setEditCategory(q.category);
    setEditWeekLabel(q.weekLabel);
    setEditDesc(q.description);
    setEditDuration(q.durationMinutes);
    setEditQuestions(q.questions);
    setIsMetaModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setEditingQuestionIdx(null);
    setDraftQuestion(null);
    setQuizSaved(false);
  };

  const handleBackToQuizList = () => {
    setSelectedQuizId(null);
    setIsMetaModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setEditingQuestionIdx(null);
    setDraftQuestion(null);
  };

  // Helper to commit full quiz state to AppContext & Firebase Firestore
  const commitQuizChanges = async (
    overrides: Partial<WeeklyQuiz> = {},
    showBanner = true
  ) => {
    if (!activeQuiz) return false;
    setIsSavingCloud(true);
    try {
      const updatedQuiz: WeeklyQuiz = {
        ...activeQuiz,
        title: (overrides.title ?? editTitle).trim() || activeQuiz.title,
        category: (overrides.category ?? editCategory).trim() || 'english',
        weekLabel: (overrides.weekLabel ?? editWeekLabel).trim() || '今週の小テスト',
        description: (overrides.description ?? editDesc).trim(),
        durationMinutes: Number(overrides.durationMinutes ?? editDuration) || 5,
        questions: overrides.questions ?? editQuestions,
      };
      await updateQuiz(updatedQuiz);
      if (showBanner) {
        setQuizSaved(true);
        setTimeout(() => setQuizSaved(false), 2000);
      }
      return true;
    } catch (err: any) {
      showNotice(err?.message || 'Firestoreへの保存に失敗しました。通信環境をご確認ください。', 'error');
      return false;
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Open Basic Info Edit Modal
  const handleOpenMetaModal = () => {
    setDraftTitle(editTitle);
    setDraftCategory(editCategory);
    setDraftWeekLabel(editWeekLabel);
    setDraftDesc(editDesc);
    setIsDeleteConfirmOpen(false);
    setIsMetaModalOpen(true);
  };

  // Save Basic Info from Modal -> Firestore
  const handleSaveMetaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) return;

    const nextTitle = draftTitle.trim();
    const nextCategory = draftCategory.trim() || 'english';
    const nextWeekLabel = draftWeekLabel.trim() || '今週の小テスト';
    const nextDesc = draftDesc.trim();

    setEditTitle(nextTitle);
    setEditCategory(nextCategory);
    setEditWeekLabel(nextWeekLabel);
    setEditDesc(nextDesc);

    const ok = await commitQuizChanges(
      {
        title: nextTitle,
        category: nextCategory,
        weekLabel: nextWeekLabel,
        description: nextDesc,
      },
      true
    );

    if (ok) {
      setIsMetaModalOpen(false);
      showNotice('テスト基本情報をクラウドに保存しました', 'success');
    }
  };

  // Confirm Delete Quiz -> Firestore
  const handleConfirmDeleteQuiz = async () => {
    if (!activeQuiz) return;
    setIsSavingCloud(true);
    try {
      await deleteQuiz(activeQuiz.id);
      setIsDeleteConfirmOpen(false);
      setIsMetaModalOpen(false);
      setSelectedQuizId(null);
    } catch (err: any) {
      showNotice(err?.message || '小テストの削除に失敗しました。', 'error');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Step 3: Open Question Edit Modal (existing question)
  const handleOpenEditQuestion = (index: number) => {
    const target = editQuestions[index];
    if (!target) return;
    setEditingQuestionIdx(index);
    setDraftQuestion({
      ...target,
      options: [...target.options],
    });
  };

  // Step 3: Open Question Edit Modal (new question)
  const handleOpenAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-custom-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
    };
    setEditingQuestionIdx('new');
    setDraftQuestion(newQ);
  };

  // Step 4: Save Question from Modal -> Firestore
  const handleSaveQuestionModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftQuestion) return;

    const cleanedQuestion: QuizQuestion = {
      ...draftQuestion,
      question: draftQuestion.question.trim() || '問題文を入力してください',
      options: draftQuestion.options.map((opt, idx) => opt.trim() || `選択肢 ${idx + 1}`),
      explanation: draftQuestion.explanation.trim() || '解説は準備中です。',
    };

    let nextList: QuizQuestion[];
    if (editingQuestionIdx === 'new') {
      nextList = [...editQuestions, cleanedQuestion];
    } else if (typeof editingQuestionIdx === 'number') {
      nextList = editQuestions.map((item, idx) =>
        idx === editingQuestionIdx ? cleanedQuestion : item
      );
    } else {
      return;
    }

    setEditQuestions(nextList);
    const ok = await commitQuizChanges({ questions: nextList }, true);
    if (ok) {
      setEditingQuestionIdx(null);
      setDraftQuestion(null);
    }
  };

  const handleDeleteQuestion = async (index: number) => {
    if (editQuestions.length <= 1) {
      showNotice('問題は最低1問必要です。削除する前に別の問題を追加してください。', 'error');
      return;
    }
    const nextList = editQuestions.filter((_, i) => i !== index);
    setEditQuestions(nextList);
    await commitQuizChanges({ questions: nextList }, true);
  };

  // Create new Quiz Modal (All 4 basic info fields + Firestore persistence)
  const [isNewQuizOpen, setIsNewQuizOpen] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizCategory, setNewQuizCategory] = useState<QuizCategory>('english');
  const [newQuizWeekLabel, setNewQuizWeekLabel] = useState('今週の小テスト');
  const [newQuizDesc, setNewQuizDesc] = useState('');

  const handleCreateNewQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;

    const newQ: WeeklyQuiz = {
      id: `quiz-custom-${Date.now()}`,
      title: newQuizTitle.trim(),
      category: newQuizCategory.trim() || 'english',
      weekLabel: newQuizWeekLabel.trim() || '新規小テスト',
      description: newQuizDesc.trim() || '新しく追加されたクラス小テストです。',
      durationMinutes: 5,
      questions: [
        {
          id: `q-init-${Date.now()}`,
          question: '第1問のテスト問題を入力してください',
          options: ['正解の選択肢', '誤答の選択肢1', '誤答の選択肢2', '誤答の選択肢3'],
          correctIndex: 0,
          explanation: '正解の根拠や解説を記入してください。',
        },
      ],
    };

    setIsSavingCloud(true);
    try {
      await addQuiz(newQ);
      setSelectedQuizId(newQ.id);
      setEditTitle(newQ.title);
      setEditCategory(newQ.category);
      setEditWeekLabel(newQ.weekLabel);
      setEditDesc(newQ.description);
      setEditDuration(newQ.durationMinutes);
      setEditQuestions(newQ.questions);
      setIsNewQuizOpen(false);
      setNewQuizTitle('');
      setNewQuizCategory('english');
      setNewQuizWeekLabel('今週の小テスト');
      setNewQuizDesc('');
    } catch (err: any) {
      showNotice(err?.message || '小テストの作成・クラウド保存に失敗しました。', 'error');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Periodic Test Creation State
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestDate, setNewTestDate] = useState('2026-11-15');
  const [periodicTestSaved, setPeriodicTestSaved] = useState(false);

  const handleAddPeriodicTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim()) return;

    await addPeriodicTest(newTestTitle.trim(), newTestDate);
    setPeriodicTestSaved(true);
    setNewTestTitle('');
    setTimeout(() => setPeriodicTestSaved(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Pencil className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              定期テスト一覧 ＆ 小テスト問題編集エディタ
            </h1>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              英単語・ミゾブルー小テストの問題文・選択肢・解説、および定期テストの登録を編集できます。
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentTab('portal')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs transition-all self-start sm:self-auto cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ポータルに戻る</span>
        </button>
      </div>

      {/* Editor Section Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveSection('quizzes')}
          className={`py-3.5 px-4 rounded-2xl border-2 transition-all cursor-pointer text-center flex items-center justify-center gap-2.5 ${
            activeSection === 'quizzes'
              ? 'border-[#1c603a] bg-[#1c603a] text-white shadow-sm'
              : 'border-stone-200 bg-white hover:bg-[#F5F4EE] text-slate-800'
          }`}
        >
          <HelpCircle
            className={`w-4 h-4 ${activeSection === 'quizzes' ? 'text-amber-300' : 'text-amber-600'}`}
          />
          <span className="text-xs font-black whitespace-nowrap">小テスト問題編集</span>
        </button>

        <button
          onClick={() => setActiveSection('periodic')}
          className={`py-3.5 px-4 rounded-2xl border-2 transition-all cursor-pointer text-center flex items-center justify-center gap-2.5 ${
            activeSection === 'periodic'
              ? 'border-[#1c603a] bg-[#1c603a] text-white shadow-sm'
              : 'border-stone-200 bg-white hover:bg-[#F5F4EE] text-slate-800'
          }`}
        >
          <Calendar
            className={`w-4 h-4 ${activeSection === 'periodic' ? 'text-sky-300' : 'text-sky-600'}`}
          />
          <span className="text-xs font-black whitespace-nowrap">定期テスト日程一覧</span>
        </button>

        <button
          onClick={() => setActiveSection('subjects')}
          className={`py-3.5 px-4 rounded-2xl border-2 transition-all cursor-pointer text-center flex items-center justify-center gap-2.5 ${
            activeSection === 'subjects'
              ? 'border-[#1c603a] bg-[#1c603a] text-white shadow-sm'
              : 'border-stone-200 bg-white hover:bg-[#F5F4EE] text-slate-800'
          }`}
        >
          <BookOpen
            className={`w-4 h-4 ${activeSection === 'subjects' ? 'text-emerald-300' : 'text-emerald-600'}`}
          />
          <span className="text-xs font-black whitespace-nowrap">教科管理・カスタム追加</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* Section 1: Quizzes Problem Editor (#F5F4EE Unified Style) */}
      {/* ========================================================= */}
      {activeSection === 'quizzes' && (
        <div className="bg-[#F5F4EE] p-4 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
          {/* STEP 1: Icon Card Grid for Quiz Selection & Creation */}
          {!activeQuiz ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Step 1 Header */}
              <div className="flex items-center gap-3.5 px-1">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    編集する小テストを選択
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    カードをタップすると、テストの基本情報や問題の追加・編集画面が開きます
                  </p>
                </div>
              </div>

              {/* 2-Column White Icon Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quizzes.map((q) => {
                  const meta = getCategoryMeta(q.category);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSelectQuiz(q.id)}
                      className={`bg-white hover:bg-stone-50/70 p-5 sm:p-6 rounded-3xl border border-stone-200/80 ${meta.hoverBorderClass} shadow-sm hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between gap-4 group cursor-pointer`}
                    >
                      {/* Top row: Pastel icon badge + Question count badge + Edit icon */}
                      <div className="flex items-start justify-between gap-3 w-full">
                        <div
                          className={`w-13 h-13 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${meta.badgeClass}`}
                        >
                          {meta.icon}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-xl border text-xs font-black tabular-nums ${meta.tagClass}`}
                          >
                            全 {q.questions.length} 問
                          </span>
                          <span className="w-9 h-9 rounded-xl bg-stone-100 group-hover:bg-[#1c603a] text-slate-500 group-hover:text-white flex items-center justify-center transition-colors">
                            <Pencil className="w-4 h-4" />
                          </span>
                        </div>
                      </div>

                      {/* Title & Subtext */}
                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#1c603a] transition-colors leading-snug">
                          {q.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 line-clamp-2 leading-relaxed">
                          {q.description || '問題文・選択肢・解説を編集できます'}
                        </p>
                      </div>

                      {/* Clean unboxed metadata footer */}
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 pt-2.5 border-t border-stone-100 w-full">
                        <span>{meta.label}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{q.weekLabel}</span>
                      </div>
                    </button>
                  );
                })}

                {/* "+ Create New Quiz" Card inside the same 2-column grid */}
                <button
                  type="button"
                  onClick={() => setIsNewQuizOpen(true)}
                  className="bg-white hover:bg-emerald-50/40 p-5 sm:p-6 rounded-3xl border-2 border-dashed border-emerald-300 hover:border-[#1c603a] shadow-sm hover:shadow-md transition-all duration-200 text-center flex flex-col items-center justify-center min-h-[185px] group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-600 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-[#1c603a] flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
                    <Plus className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#1c603a] transition-colors mb-1">
                    ＋ 新しい小テストを作成
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    テスト名・カテゴリ・表示ラベル・説明文を入力して作成します
                  </p>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2 & STEP 3: Active Quiz Editor Screen */
            <div className="space-y-5 animate-fadeIn">
              {/* Top Back Navigation Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBackToQuizList}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/90 text-slate-800 text-xs font-black shadow-2xs transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#1c603a]" />
                  <span>小テスト一覧に戻る</span>
                </button>

                {isSavingCloud && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-[#1c603a]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>クラウド保存中...</span>
                  </span>
                )}
              </div>

              {/* STEP 2: Basic Information Header Card (Matches Focus Selector Structure) */}
              {(() => {
                const activeMeta = getCategoryMeta(editCategory);
                return (
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${activeMeta.badgeClass}`}
                        >
                          {activeMeta.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400 mb-0.5">
                            <span>テスト基本情報</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-600">{activeMeta.label}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#1c603a]">{editWeekLabel}</span>
                          </div>
                          <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                            {editTitle || '無題の小テスト'}
                          </h2>
                          <p className="text-xs font-semibold text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {editDesc || '説明文・ねらいは設定されていません'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenMetaModal}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap shadow-2xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>テスト情報を編集</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Inline Toast / Validation Notice */}
              {inlineNotice && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                    inlineNotice.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {inlineNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{inlineNotice.text}</span>
                </div>
              )}

              {/* STEP 3: Clean Question List & Dedicated Editor Trigger */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm space-y-5">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                      <ListChecks className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        出題問題一覧（全{editQuestions.length}問）
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">
                        問題カードをタップすると専用の編集画面が開きます
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddQuestion}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#1c603a] text-xs font-black border border-emerald-200 transition-all cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>問題を追加</span>
                  </button>
                </div>

                {/* Compact Question Cards */}
                <div className="space-y-3">
                  {editQuestions.map((q, qIndex) => {
                    const correctAnswerText = q.options[q.correctIndex] || '未設定';
                    return (
                      <div
                        key={q.id || qIndex}
                        onClick={() => handleOpenEditQuestion(qIndex)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenEditQuestion(qIndex);
                          }
                        }}
                        className="p-4 sm:p-5 rounded-2xl bg-[#F5F4EE]/55 hover:bg-white border border-stone-200/90 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 sm:gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c603a]"
                      >
                        {/* Left: Circular "問1" Badge */}
                        <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 text-[#1c603a] font-black text-xs flex items-center justify-center shrink-0 tabular-nums group-hover:bg-[#1c603a] group-hover:text-white group-hover:border-[#1c603a] transition-colors">
                          問{qIndex + 1}
                        </div>

                        {/* Center: Question Text + Correct Answer Preview */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 group-hover:text-[#1c603a] transition-colors line-clamp-2 leading-snug">
                            {q.question}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 min-w-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-emerald-700 font-bold shrink-0">正解:</span>
                            <span className="truncate">{correctAnswerText}</span>
                          </div>
                        </div>

                        {/* Right: Edit (Pen) & Delete (Trash) Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditQuestion(qIndex);
                            }}
                            className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:border-sky-300 hover:bg-sky-50 text-slate-600 hover:text-sky-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="この問題を編集"
                            aria-label={`問${qIndex + 1}を編集`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestion(qIndex);
                            }}
                            className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="この問題を削除"
                            aria-label={`問${qIndex + 1}を削除`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add New Question Wide Card */}
                  <button
                    type="button"
                    onClick={handleOpenAddQuestion}
                    className="w-full p-4 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50 border-2 border-dashed border-emerald-300 hover:border-[#1c603a] transition-all flex items-center justify-center gap-3 cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-full bg-white border border-emerald-200 text-[#1c603a] flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-sm font-black text-[#1c603a]">
                      ＋ 問題を追加する
                    </span>
                  </button>
                </div>

                {/* Bottom Prominent Save Bar */}
                <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500">
                    変更内容はクラウドに保存され、全端末の「小テスト」タブに即時反映されます
                  </span>

                  <button
                    type="button"
                    disabled={isSavingCloud}
                    onClick={() => commitQuizChanges({}, true)}
                    className={`px-7 py-3.5 rounded-2xl text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                      quizSaved
                        ? 'bg-emerald-600 hover:bg-emerald-600'
                        : 'bg-[#1c603a] hover:bg-[#154a2c]'
                    }`}
                  >
                    {isSavingCloud ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    )}
                    <span>{quizSaved ? 'クラウド保存完了！' : '変更を保存する'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* Section 2: Periodic Test List & Creation                  */}
      {/* ========================================================= */}
      {activeSection === 'periodic' && (
        <div className="bg-[#F5F4EE] p-4 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">定期テスト日程一覧</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  ここで登録した実施日はホーム画面の「テストカウントダウン」に自動連携されます（全端末クラウド共有）。
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {periodicTests.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-black text-[#1c603a] px-1">
                    ◎ カウントダウン連携中の定期テスト日程 ({periodicTests.length}件)
                  </div>
                  {periodicTests.map((schedule, idx) => (
                    <div
                      key={schedule.id}
                      className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="w-9 h-9 rounded-2xl bg-white border border-sky-200 text-sky-600 text-xs font-black flex items-center justify-center tabular-nums shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-slate-900 truncate">{schedule.title}</h4>
                          <span className="text-xs font-bold text-sky-700 tabular-nums">
                            実施日: {schedule.date ? schedule.date.replace(/-/g, '/') : '未設定'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-[#1c603a] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                          連携済
                        </span>
                        <button
                          type="button"
                          onClick={() => deletePeriodicTest(schedule.id)}
                          className="p-2 rounded-xl bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-stone-200 hover:border-rose-200 transition-colors cursor-pointer"
                          title="この日程を削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {availableTestTitles
                .filter((title) => !periodicTests.some((p) => p.title === title))
                .map((title, idx) => (
                  <div
                    key={title}
                    className="p-4 rounded-2xl bg-[#F5F4EE]/60 border border-stone-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-[#1c603a] text-xs font-black flex items-center justify-center tabular-nums shrink-0">
                        {periodicTests.length + idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{title}</h4>
                        <span className="text-[11px] font-semibold text-slate-500">
                          5教科（国・数・英・理・社）各100点 満点500点
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shrink-0">
                      登録済
                    </span>
                  </div>
                ))}
            </div>

            {/* Add Periodic Test Form */}
            <form
              onSubmit={handleAddPeriodicTest}
              className="p-5 rounded-3xl bg-[#F5F4EE]/70 border border-stone-200/80 space-y-4"
            >
              <h4 className="text-sm font-black text-slate-900">＋ 新規定期テストを追加</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    テスト名・考査名
                  </label>
                  <input
                    type="text"
                    placeholder="例: 第3回 校内実力模試（11月）"
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                    className="w-full text-sm font-semibold border border-stone-200 rounded-2xl p-3 bg-white focus:outline-none focus:border-[#1c603a]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">実施日</label>
                  <input
                    type="date"
                    value={newTestDate}
                    onChange={(e) => setNewTestDate(e.target.value)}
                    className="w-full text-sm font-semibold border border-stone-200 rounded-2xl p-3 bg-white focus:outline-none focus:border-[#1c603a]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={periodicTestSaved}
                  className="px-6 py-3 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {periodicTestSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>追加しました！</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>定期テストを追加登録</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Section 3: Subject Management                             */}
      {/* ========================================================= */}
      {activeSection === 'subjects' && (
        <div className="bg-[#F5F4EE] p-4 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/80 shadow-sm space-y-6">
            <div className="flex items-start sm:items-center gap-3.5 pb-4 border-b border-stone-100">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  登録教科一覧 ＆ カスタム教科追加
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-relaxed">
                  標準教科およびユーザーが自由に追加登録したカスタム教科の一覧です。追加した教科はテスト成績入力・教材共有・学習掲示板のすべてに即座に反映されます。
                </p>
              </div>
            </div>

            {/* Add Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCustomSubjectName.trim()) return;
                addCustomSubject(newCustomSubjectName);
                setNewCustomSubjectName('');
              }}
              className="bg-[#F5F4EE]/70 p-4 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row items-center gap-3"
            >
              <input
                type="text"
                placeholder="新規教科名を入力（例: 情報Ⅰ、保健体育、探究、プログラミング）"
                value={newCustomSubjectName}
                onChange={(e) => setNewCustomSubjectName(e.target.value)}
                className="flex-1 w-full text-xs font-semibold border border-stone-200 rounded-2xl p-3 bg-white focus:outline-none focus:border-[#1c603a]"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-3 bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black rounded-2xl transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>新しい教科を登録</span>
              </button>
            </form>

            {/* List of Subjects */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-700">
                登録済み教科リスト ({allSubjects.length}教科)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {allSubjects.map((s) => (
                  <div
                    key={s.key}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      s.isCustom
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-[#F5F4EE]/50 border-stone-200/80'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black text-slate-900 block">{s.label}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {s.isCustom ? 'ユーザー追加' : '標準教科'}
                      </span>
                    </div>
                    {s.isCustom && (
                      <button
                        type="button"
                        onClick={() => deleteCustomSubject(s.key)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        title="このカスタム教科を削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 2 MODAL: Quiz Basic Information Edit Modal           */}
      {/* ========================================================= */}
      {isMetaModalOpen && activeQuiz && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsMetaModalOpen(false)}
        >
          <form
            onSubmit={handleSaveMetaModal}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#F5F4EE] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="bg-white px-5 sm:px-6 py-4 border-b border-stone-200/80 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">テスト基本情報の編集</h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    テスト名・カテゴリ・表示ラベル・説明文を変更して保存します
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMetaModalOpen(false)}
                className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (4 Fields with Pastel Icon Badges) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* 1. テスト名 */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900">① テスト名</label>
                    <p className="text-[11px] font-semibold text-slate-500">
                      例：LEAP テスト、第4週 ミゾブルー理科教養
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="例: LEAP テスト"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full text-sm font-bold text-slate-900 border-2 border-stone-200 rounded-2xl p-3 bg-[#F5F4EE]/55 focus:bg-white focus:outline-none focus:border-[#1c603a]"
                  required
                />
              </div>

              {/* 2. カテゴリ */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900">② カテゴリ</label>
                    <p className="text-[11px] font-semibold text-slate-500">
                      プリセットから選ぶか、任意のカテゴリ名を入力できます
                    </p>
                  </div>
                </div>

                {/* Preset Category Chips */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_PRESETS.map((preset) => {
                    const isSelected = draftCategory === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setDraftCategory(preset.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1c603a] text-white border-[#1c603a] shadow-2xs'
                            : 'bg-[#F5F4EE] text-slate-700 border-stone-200 hover:border-emerald-400'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="または任意のカテゴリを入力（例: 古文単語、数学I・A）"
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 border-2 border-stone-200 rounded-2xl p-3 bg-[#F5F4EE]/55 focus:bg-white focus:outline-none focus:border-[#1c603a]"
                  required
                />
              </div>

              {/* 3. 表示ラベル */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900">③ 表示ラベル</label>
                    <p className="text-[11px] font-semibold text-slate-500">
                      例：今週の小テスト、テスト対策、定期考査直前
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="例: 今週の小テスト"
                  value={draftWeekLabel}
                  onChange={(e) => setDraftWeekLabel(e.target.value)}
                  className="w-full text-sm font-bold text-slate-900 border-2 border-stone-200 rounded-2xl p-3 bg-[#F5F4EE]/55 focus:bg-white focus:outline-none focus:border-[#1c603a]"
                  required
                />
              </div>

              {/* 4. 説明文・ねらい */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                    <AlignLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900">④ 説明文・ねらい</label>
                    <p className="text-[11px] font-semibold text-slate-500">
                      生徒へ表示されるテストの概要や出題範囲を入力します
                    </p>
                  </div>
                </div>
                <textarea
                  rows={3}
                  placeholder="例: LEAP Part1〜2から最重要語彙を厳選。語法と文脈の判断力を確認しよう！"
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold text-slate-800 border-2 border-stone-200 rounded-2xl p-3 bg-[#F5F4EE]/55 focus:bg-white focus:outline-none focus:border-[#1c603a] leading-relaxed"
                />
              </div>

              {/* Delete Quiz Trigger inside Basic Info Modal */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-rose-50/80 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>この小テストを削除する</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-5 sm:px-6 py-4 border-t border-stone-200/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsMetaModalOpen(false)}
                className="px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-black transition-colors cursor-pointer whitespace-nowrap"
              >
                キャンセル
              </button>

              <button
                type="submit"
                disabled={isSavingCloud}
                className="flex-1 sm:flex-initial px-7 py-3.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                {isSavingCloud ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                )}
                <span>変更を保存する</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* Delete Quiz Confirmation Dialog                           */}
      {/* ========================================================= */}
      {isDeleteConfirmOpen && activeQuiz && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsDeleteConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  小テストを削除しますか？
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">
                  「<span className="text-slate-900 font-black">{activeQuiz.title}</span>」（全{activeQuiz.questions.length}問）をクラウド上から完全に削除します。この操作は元に戻せません。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSavingCloud}
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-black cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={isSavingCloud}
                onClick={handleConfirmDeleteQuiz}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSavingCloud ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>はい、削除する</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 4: Dedicated Question Edit Modal (Icon & Tap UI)     */}
      {/* ========================================================= */}
      {draftQuestion && editingQuestionIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => {
            setEditingQuestionIdx(null);
            setDraftQuestion(null);
          }}
        >
          <form
            onSubmit={handleSaveQuestionModal}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#F5F4EE] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="bg-white px-5 sm:px-6 py-4 border-b border-stone-200/80 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-[#1c603a] font-black text-xs flex items-center justify-center tabular-nums shrink-0">
                  {editingQuestionIdx === 'new' ? '新規' : `問${editingQuestionIdx + 1}`}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingQuestionIdx === 'new' ? '新しい問題を追加' : '問題の内容を編集'}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {editTitle || '小テスト'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingQuestionIdx(null);
                  setDraftQuestion(null);
                }}
                className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
              {/* 1. Question Text Section (Speech Bubble Pastel Badge) */}
              <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-900">問題文</label>
                    <p className="text-[11px] font-semibold text-slate-500">
                      出題される問題文・単語・設問を入力してください
                    </p>
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="例: 「〜を当然のことと思う」を意味するイディオムを選びなさい。"
                  value={draftQuestion.question}
                  onChange={(e) =>
                    setDraftQuestion({ ...draftQuestion, question: e.target.value })
                  }
                  className="w-full text-sm font-bold text-slate-900 border-2 border-stone-200 rounded-2xl p-3.5 bg-[#F5F4EE]/55 focus:bg-white focus:outline-none focus:border-[#1c603a] leading-relaxed"
                  required
                />
              </div>

              {/* 2. 4 Choices Section (Tap-to-Select Cards) */}
              <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                    <ListChecks className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-slate-900">
                      選択肢と正解の指定
                    </span>
                    <p className="text-[11px] font-semibold text-slate-500">
                      正解にしたい選択肢カード全体をタップして選択してください
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {draftQuestion.options.map((opt, optIdx) => {
                    const isCorrect = draftQuestion.correctIndex === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() =>
                          setDraftQuestion({ ...draftQuestion, correctIndex: optIdx })
                        }
                        className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                            : 'bg-white hover:bg-[#F5F4EE]/60 border-stone-200 hover:border-emerald-300'
                        }`}
                      >
                        {/* Left Circle Check / Option Number */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDraftQuestion({ ...draftQuestion, correctIndex: optIdx });
                          }}
                          aria-label={`選択肢${optIdx + 1}を正解にする`}
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-sm transition-all cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs scale-105'
                              : 'bg-stone-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'
                          }`}
                        >
                          {isCorrect ? <Check className="w-5 h-5 stroke-[3]" /> : optIdx + 1}
                        </button>

                        {/* Editable Option Input */}
                        <input
                          type="text"
                          placeholder={`選択肢 ${optIdx + 1} を入力`}
                          value={opt}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const newOpts = [...draftQuestion.options];
                            newOpts[optIdx] = e.target.value;
                            setDraftQuestion({ ...draftQuestion, options: newOpts });
                          }}
                          className={`flex-1 min-w-0 text-sm rounded-xl px-3 py-2 border focus:outline-none transition-colors ${
                            isCorrect
                              ? 'font-bold text-slate-900 bg-white border-emerald-200 focus:border-emerald-500'
                              : 'font-semibold text-slate-800 bg-[#F5F4EE]/60 focus:bg-white border-stone-200 focus:border-[#1c603a]'
                          }`}
                          required
                        />

                        {/* Right Correct Badge / Tap Hint */}
                        <div className="shrink-0">
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-2xs whitespace-nowrap">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>正解</span>
                            </span>
                          ) : (
                            <span className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-xl bg-stone-100 text-slate-500 text-[11px] font-bold whitespace-nowrap">
                              タップで正解
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Explanation Section (Lightbulb Pastel Badge) */}
              <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-900">解説文</label>
                    <p className="text-[11px] font-semibold text-slate-500">
                      解答後に生徒へ表示される詳しい解説・覚え方を記入します
                    </p>
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="例: take ~ for granted は「〜を当然のこととみなす」という重要熟語です。"
                  value={draftQuestion.explanation}
                  onChange={(e) =>
                    setDraftQuestion({ ...draftQuestion, explanation: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm font-semibold text-slate-800 border-2 border-stone-200 rounded-2xl p-3.5 bg-[#F5F4EE]/55 focus:bg-white focus:outline-none focus:border-[#1c603a] leading-relaxed"
                  required
                />
              </div>
            </div>

            {/* Modal Footer: Large Save Button */}
            <div className="bg-white px-5 sm:px-6 py-4 border-t border-stone-200/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingQuestionIdx(null);
                  setDraftQuestion(null);
                }}
                className="px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-black transition-colors cursor-pointer whitespace-nowrap"
              >
                キャンセル
              </button>

              <button
                type="submit"
                disabled={isSavingCloud}
                className="flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                {isSavingCloud ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                )}
                <span>変更を保存する</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* New Quiz Creation Modal (All 4 Basic Info Fields)         */}
      {/* ========================================================= */}
      {isNewQuizOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsNewQuizOpen(false)}
        >
          <form
            onSubmit={handleCreateNewQuiz}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#F5F4EE] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="bg-white px-5 sm:px-6 py-4 border-b border-stone-200/80 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">小テストの新規作成</h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    基本情報を入力して新しいテストをクラウドに作成します
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewQuizOpen(false)}
                className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-500 flex items-center justify-center cursor-pointer"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* 1. テスト名 */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900">① テスト名</label>
                    <p className="text-[11px] font-semibold text-slate-500">
                      例：LEAP テスト、第5週 英文法演習
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="例: LEAP テスト（Part 2）"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  className="w-full text-sm font-bold text-slate-900 border-2 border-stone-200 rounded-2xl p-3 bg-[#F5F4EE]/55 focus:bg-white focus:outline-none focus:border-[#1c603a]"
                  required
                />
              </div>

              {/* 2. カテゴリ */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900">② カテゴリ</label>
                    <p className="text-[11px] font-semibold text-slate-500">
                      ジャンルを選ぶか、カスタム名を入力してください
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {CATEGORY_PRESETS.map((preset) => {
                    const isSelected = newQuizCategory === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setNewQuizCategory(preset.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1c603a] text-white border-[#1c603a] shadow-2xs'
                            : 'bg-[#F5F4EE] text-slate-700 border-stone-200 hover:border-emerald-400'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="または任意のカテゴリを入力"
                  value={newQuizCategory}
                  onChange={(e) => setNewQuizCategory(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 border-2 border-stone-200 rounded-2xl p-3 bg-[#F5F4EE]/55 focus:bg-white focus:outline-none focus:border-[#1c603a]"
                  required
                />
              </div>

              {/* 3. 表示ラベル */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900">③ 表示ラベル</label>
                    <p className="text-[11px] font-semibold text-slate-500">
                      例：今週の小テスト、テスト対策
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="例: 今週の小テスト"
                  value={newQuizWeekLabel}
                  onChange={(e) => setNewQuizWeekLabel(e.target.value)}
                  className="w-full text-sm font-bold text-slate-900 border-2 border-stone-200 rounded-2xl p-3 bg-[#F5F4EE]/55 focus:bg-white focus:outline-none focus:border-[#1c603a]"
                  required
                />
              </div>

              {/* 4. 説明文・ねらい */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                    <AlignLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900">④ 説明文・ねらい</label>
                    <p className="text-[11px] font-semibold text-slate-500">
                      テストの出題範囲や目的を入力します
                    </p>
                  </div>
                </div>
                <textarea
                  rows={3}
                  placeholder="例: 次の小テストに向けて基本単語と熟語をまとめて確認します。"
                  value={newQuizDesc}
                  onChange={(e) => setNewQuizDesc(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold text-slate-800 border-2 border-stone-200 rounded-2xl p-3 bg-[#F5F4EE]/55 focus:bg-white focus:outline-none focus:border-[#1c603a] leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-5 sm:px-6 py-4 border-t border-stone-200/80 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsNewQuizOpen(false)}
                className="px-5 py-3 text-xs font-black text-slate-600 bg-stone-100 hover:bg-stone-200 rounded-2xl cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSavingCloud}
                className="px-6 py-3 text-xs sm:text-sm font-black text-white bg-[#1c603a] hover:bg-[#154a2c] rounded-2xl shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSavingCloud ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>作成して編集開始</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
