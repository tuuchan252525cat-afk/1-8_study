import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WeeklyQuiz, QuizQuestion, AiAnalysisResult } from '../types';
import {
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tag,
  Upload,
  FileText,
  Clock,
  Layers,
  Award,
  Check,
  Plus,
} from 'lucide-react';

export const PeriodicPredictedQuestionsView: React.FC = () => {
  const {
    quizzes,
    addQuiz,
    submitQuiz,
    getMyQuizStanding,
    getQuizAnonymousRankings,
    allSubjects,
    setCurrentTab,
  } = useApp();

  // Top Segmented Mode (Modeled on DAY 1 / DAY 2 tabs from 39204_0.jpg)
  const [activeSegment, setActiveSegment] = useState<'list' | 'trends'>('list');

  // Filter state
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // New Question Creation Drawer/Accordion
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'text'>('text');
  const [textPrompt, setTextPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    fileData: string;
    mimeType: string;
    fileName: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Active quiz runner state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanationList, setShowExplanationList] = useState(false);
  const [showRankings, setShowRankings] = useState(false);

  // Presets for AI quick generation
  const presets = [
    { label: '数学：二次関数の動く区間・最大最小', text: '二次関数の動く区間における最大値・最小値の場合分け。文字係数 a を含む放物線 y = x^2 - 2ax + 1 (0 <= x <= 2) の最大値・最小値を求める問題。' },
    { label: '英語：関係代名詞・前置詞＋関係詞', text: 'whose の用法、前置詞＋関係代名詞（in which, with whom）、関係副詞 where/when の使い分けと差がつく整序英作文。' },
    { label: '化学：酸化還元反応と滴定計算', text: '過マンガン酸カリウムとシュウ酸の酸化還元滴定。半反応式の作成と電子のやり取り、当量関係に基づくモル濃度計算問題。' },
    { label: '物理：等加速度直線運動と落体の運動', text: '等加速度直線運動の公式3つ、自由落下・鉛直投げ上げの最高点・落下時間の計算とグラフ（v-t図）の読み取り問題。' },
  ];

  // All predicted quizzes: filter by category 'ai_predicted'
  // If user has other quizzes with 'ai_predicted' or sample ones
  const predictedQuizzes = quizzes.filter(
    (q) => q.category === 'ai_predicted' || q.weekLabel.includes('定期テスト予想問題')
  );

  // Filtered by subject
  const displayedQuizzes = predictedQuizzes.filter((quiz) => {
    if (selectedSubject === 'all') return true;
    const summarySubject = quiz.aiAnalysisSummary?.subject || '';
    const titleMatch = quiz.title.toLowerCase().includes(selectedSubject.toLowerCase());
    const subjectMatch = summarySubject.toLowerCase().includes(selectedSubject.toLowerCase());
    return titleMatch || subjectMatch;
  });

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId);

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedFile({
        fileData: result,
        mimeType: file.type || 'image/png',
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  // Run AI Generation
  const handleCreateNewPredictedQuiz = async () => {
    if (!textPrompt.trim() && !selectedFile) {
      alert('過去問の画像、PDF、または問題文テキストを入力してください。');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/ai/analyze-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textPrompt: textPrompt.trim(),
          fileData: selectedFile?.fileData,
          mimeType: selectedFile?.mimeType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'AI分析サーバーの通信エラーが発生しました。');
      }

      const data: AiAnalysisResult = await response.json();
      if (!data || !data.analysis || !Array.isArray(data.predicted_questions)) {
        throw new Error('AIの解析結果フォーマットが不正です。');
      }

      // Convert to WeeklyQuiz format and save into app store
      const formattedQuestions: QuizQuestion[] = data.predicted_questions.map((q, idx) => ({
        id: `q-pred-${Date.now()}-${idx}`,
        question: q.question,
        options: q.options,
        correctIndex: q.correct_index,
        explanation: q.explanation,
      }));

      const newQuiz: WeeklyQuiz = {
        id: `quiz-pred-${Date.now()}`,
        title: `${data.analysis.subject || '定期テスト'}：${data.analysis.unit || '予想問題'}`,
        category: 'ai_predicted',
        weekLabel: '定期テスト予想問題',
        description: data.analysis.trends?.[0] || 'AIが過去問の傾向から自動生成した定期テスト対策予想問題です。',
        durationMinutes: 10,
        questions: formattedQuestions,
        createdAuthor: 'AI分析作成',
        aiAnalysisSummary: data.analysis,
      };

      addQuiz(newQuiz);
      setIsCreateOpen(false);
      setTextPrompt('');
      setSelectedFile(null);
      // Automatically open the newly created quiz!
      startQuiz(newQuiz.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '予想問題の生成に失敗しました。';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Interactive Quiz Runner Handlers
  const startQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
    setIsPlaying(true);
    setCurrentQIndex(0);
    setSelectedAnswers([]);
    setIsSubmitted(false);
    setShowExplanationList(false);
    setShowRankings(false);
  };

  const handleSelectOption = (optIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentQIndex] = optIndex;
    setSelectedAnswers(updated);
  };

  const handleNextOrSubmit = () => {
    if (!activeQuiz) return;
    if (currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      submitQuiz(activeQuiz.id, selectedAnswers);
      setIsSubmitted(true);
    }
  };

  const backToList = () => {
    setIsPlaying(false);
    setActiveQuizId(null);
    setIsSubmitted(false);
    setShowExplanationList(false);
    setShowRankings(false);
  };

  // Subject icon helper
  const getSubjectColorBadge = (title: string, subjectName?: string) => {
    const combined = `${title} ${subjectName || ''}`.toLowerCase();
    if (combined.includes('数学') || combined.includes('math')) {
      return { bg: 'bg-blue-900 text-white', label: '数学', border: 'border-blue-800' };
    }
    if (combined.includes('英語') || combined.includes('english')) {
      return { bg: 'bg-emerald-800 text-white', label: '英語', border: 'border-emerald-700' };
    }
    if (combined.includes('化学') || combined.includes('chem')) {
      return { bg: 'bg-amber-600 text-white', label: '化学', border: 'border-amber-500' };
    }
    if (combined.includes('物理') || combined.includes('physics')) {
      return { bg: 'bg-purple-900 text-white', label: '物理', border: 'border-purple-800' };
    }
    if (combined.includes('生物') || combined.includes('bio')) {
      return { bg: 'bg-teal-700 text-white', label: '生物', border: 'border-teal-600' };
    }
    if (combined.includes('地理') || combined.includes('歴史') || combined.includes('社会')) {
      return { bg: 'bg-stone-800 text-white', label: '社会', border: 'border-stone-700' };
    }
    return { bg: 'bg-stone-900 text-white', label: '教科', border: 'border-stone-800' };
  };

  return (
    <div className="space-y-4">
      {/* ============================================================== */}
      {/* 1. QUIZ RUNNER MODE (When student is taking a predicted test)   */}
      {/* ============================================================== */}
      {isPlaying && activeQuiz ? (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-5">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <button
              onClick={backToList}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-black transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>予想問題一覧へ戻る</span>
            </button>

            <span className="text-xs font-black text-[#1c603a] bg-[#f4f8f5] px-3 py-1 rounded-full">
              問 {currentQIndex + 1} / {activeQuiz.questions.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200">
            <div
              className="bg-[#1c603a] h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%`,
              }}
            />
          </div>

          {!isSubmitted ? (
            /* Active Question Card */
            <div className="space-y-6 py-2">
              <div>
                <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider block mb-1">
                  QUESTION {currentQIndex + 1} · {activeQuiz.title}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-relaxed">
                  {activeQuiz.questions[currentQIndex].question}
                </h3>
              </div>

              {/* Option Choice Buttons */}
              <div className="space-y-2.5">
                {activeQuiz.questions[currentQIndex].options.map((opt, optIdx) => {
                  const isChosen = selectedAnswers[currentQIndex] === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                        isChosen
                          ? 'border-[#1c603a] bg-[#f4f8f5] ring-2 ring-[#1c603a]/20 shadow-xs'
                          : 'border-stone-200/90 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                          isChosen
                            ? 'bg-[#1c603a] text-white'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="text-sm font-bold text-slate-800 pt-0.5 leading-snug">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Step Navigation Button */}
              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={handleNextOrSubmit}
                  disabled={selectedAnswers[currentQIndex] === undefined}
                  className={`px-7 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                    selectedAnswers[currentQIndex] !== undefined
                      ? 'bg-[#1c603a] hover:bg-[#154a2c] text-white hover:shadow-md'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <span>
                    {currentQIndex < activeQuiz.questions.length - 1 ? '次の問題へ' : '採点する'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Results Screen */
            (() => {
              const standing = getMyQuizStanding(activeQuiz.id);
              const score = standing?.myScore ?? 0;
              const maxScore = activeQuiz.questions.length * 20; // 100 pt max

              return (
                <div className="space-y-6 text-center py-4 animate-fadeIn">
                  <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 mb-1">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>

                  <div>
                    <span className="text-xs font-black text-stone-500 block mb-1">
                      定期テスト予想問題 採点結果
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                      {activeQuiz.title}
                    </h2>
                  </div>

                  {/* Score Pill Card */}
                  <div className="bg-[#fdfbf7] p-6 rounded-3xl border border-stone-200/90 max-w-sm mx-auto shadow-2xs space-y-2">
                    <div className="text-xs font-black text-stone-500">あなたの得点</div>
                    <div className="text-4xl font-black text-[#1c603a]">
                      {score} <span className="text-base text-stone-600 font-bold">/ {maxScore} 点</span>
                    </div>
                    {standing && (
                      <div className="text-xs font-black text-slate-600 pt-2 border-t border-stone-200/80">
                        クラス順位: {standing.myRank !== null ? `${standing.myRank}位` : '-'} / {standing.total}人中
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <button
                      onClick={() => {
                        setCurrentQIndex(0);
                        setSelectedAnswers([]);
                        setIsSubmitted(false);
                      }}
                      className="py-3 px-3 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>もう一度挑戦</span>
                    </button>

                    <button
                      onClick={() => setShowExplanationList(!showExplanationList)}
                      className="py-3 px-3 rounded-2xl bg-[#fdfbf7] hover:bg-stone-100 text-slate-800 text-xs font-black border border-stone-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-[#1c603a]" />
                      <span>{showExplanationList ? '解説を閉じる' : '全問解説を見る'}</span>
                    </button>

                    <button
                      onClick={() => setShowRankings(!showRankings)}
                      className="py-3 px-3 rounded-2xl bg-[#fdfbf7] hover:bg-stone-100 text-slate-800 text-xs font-black border border-stone-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>{showRankings ? '順位表を閉じる' : 'クラス順位'}</span>
                    </button>

                    <button
                      onClick={backToList}
                      className="py-3 px-3 rounded-2xl bg-white hover:bg-stone-100 text-slate-800 text-xs font-black border border-stone-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>一覧へ戻る</span>
                    </button>
                  </div>

                  {/* Class Rankings Modal / Accordion */}
                  {showRankings && (
                    <div className="bg-[#fdfbf7] rounded-3xl p-5 border border-stone-200 space-y-3 animate-fadeIn text-left">
                      <div className="flex items-center justify-between text-xs font-black text-slate-800">
                        <span>◎ クラス順位表（匿名集計）</span>
                        <span className="text-stone-400">上位10名</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getQuizAnonymousRankings(activeQuiz.id).slice(0, 10).map((r, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between font-black ${
                              r.isCurrentUser
                                ? 'bg-emerald-50 border-[#1c603a] text-[#1c603a]'
                                : 'bg-white border-stone-200 text-slate-700'
                            }`}
                          >
                            <span>
                              第 {r.rank} 位 {r.isCurrentUser ? '（あなた）' : ''}
                            </span>
                            <span>{r.score} 点</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Explanations List */}
                  {showExplanationList && (
                    <div className="space-y-3 pt-2 text-left animate-fadeIn">
                      <div className="text-xs font-black text-slate-800 px-1">
                        ◎ 全問の正誤判定 ＆ 詳しい解説
                      </div>
                      {activeQuiz.questions.map((q, idx) => {
                        const userAns = selectedAnswers[idx];
                        const isCorrect = userAns === q.correctIndex;
                        return (
                          <div
                            key={q.id}
                            className="bg-[#fdfbf7] p-4 rounded-2xl border border-stone-200/90 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-800">問 {idx + 1}</span>
                              <span
                                className={`font-black flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] ${
                                  isCorrect
                                    ? 'bg-emerald-100 text-[#1c603a]'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" /> 正解
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" /> 不正解
                                  </>
                                )}
                              </span>
                            </div>
                            <p className="font-bold text-slate-900">{q.question}</p>
                            <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-1">
                              <div className="font-black text-[#1c603a]">
                                正解: {q.options[q.correctIndex]}
                              </div>
                              <p className="text-stone-600 font-medium leading-relaxed">
                                {q.explanation}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* 2. MAIN PREDICTED QUESTIONS LIST VIEW (Modeled on 39204_0.jpg) */
        /* ============================================================== */
        <div className="space-y-4">
          {/* A. Large DAY 1 / DAY 2 Segmented Button Cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveSegment('list')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                activeSegment === 'list'
                  ? 'border-[#1c603a] bg-white ring-2 ring-[#1c603a]/20 shadow-xs'
                  : 'border-stone-300/80 bg-white hover:bg-stone-50'
              }`}
            >
              <div className="text-xs font-black text-stone-500 uppercase tracking-wider">
                EXAM PREDICTION
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                全教科 予想問題
              </div>
            </button>

            <button
              onClick={() => setActiveSegment('trends')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                activeSegment === 'trends'
                  ? 'border-[#1c603a] bg-white ring-2 ring-[#1c603a]/20 shadow-xs'
                  : 'border-stone-300/80 bg-white hover:bg-stone-50'
              }`}
            >
              <div className="text-xs font-black text-stone-500 uppercase tracking-wider">
                ANALYSIS & TRENDS
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                出題傾向・重要単元
              </div>
            </button>
          </div>

          {/* B. "▽ 条件を選ぶ" Filter Button & "＋ 新しい予想問題を作成" */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 py-1">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full bg-white border border-stone-300 hover:border-slate-800 text-xs sm:text-sm font-black text-slate-800 shadow-2xs transition-all cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-stone-600" />
              <span>
                {selectedSubject === 'all'
                  ? '▽ 教科を選ぶ (すべて)'
                  : `▽ 教科: ${
                      allSubjects.find((s) => s.key === selectedSubject)?.label || selectedSubject
                    }`}
              </span>
            </button>

            <button
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-black shadow-2xs transition-all cursor-pointer ${
                isCreateOpen
                  ? 'bg-slate-900 text-white'
                  : 'bg-[#1c603a] text-white hover:bg-[#154a2c]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isCreateOpen ? '作成フォームを閉じる' : 'AIで新しい予想問題を追加'}</span>
            </button>
          </div>

          {/* Subject Filter Dropdown Pills */}
          {isFilterOpen && (
            <div className="p-3 bg-white rounded-3xl border border-stone-200 shadow-sm max-w-xl mx-auto flex flex-wrap items-center justify-center gap-1.5 animate-fadeIn">
              <button
                onClick={() => {
                  setSelectedSubject('all');
                  setIsFilterOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                  selectedSubject === 'all'
                    ? 'bg-[#1c603a] text-white'
                    : 'text-slate-700 hover:bg-stone-100'
                }`}
              >
                すべて
              </button>
              {allSubjects.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => {
                    setSelectedSubject(sub.key);
                    setIsFilterOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                    selectedSubject === sub.key
                      ? 'bg-[#1c603a] text-white'
                      : 'text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {/* C. Expandable AI Prediction Generator Form */}
          {isCreateOpen && (
            <div className="bg-[#fdfbf7] p-5 sm:p-6 rounded-3xl border-2 border-[#1c603a]/40 shadow-xs space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1c603a] text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      過去問・単元から新しい定期テスト予想問題を自動作成
                    </h3>
                    <p className="text-[11px] text-stone-500 font-bold">
                      過去問データ（画像・PDF・テキスト）を入力してAI分析＆予想問題を一覧に追加します
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode Toggle Pills: File vs Text */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    inputMode === 'file'
                      ? 'bg-[#1c603a] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-stone-300'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>過去問ファイル添付（画像/PDF）</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    inputMode === 'text'
                      ? 'bg-[#1c603a] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-stone-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>問題文・単元直接入力</span>
                </button>
              </div>

              {/* Input Form Body */}
              {inputMode === 'file' ? (
                <div className="border-2 border-dashed border-stone-300 rounded-2xl p-5 text-center bg-white space-y-2">
                  <Upload className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-xs font-black text-slate-800">
                    過去問の画像ファイル（PNG/JPG）またはPDFを選択
                  </p>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="text-xs text-stone-600 block mx-auto cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="text-xs font-black text-[#1c603a] pt-1">
                      選択中: {selectedFile.fileName}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Preset Quick Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTextPrompt(p.text)}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-stone-100 text-[11px] font-black text-slate-700 border border-stone-200 transition-colors cursor-pointer"
                      >
                        ⚡ {p.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={4}
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder="過去問の問題文や、テスト対策したい単元・重要テーマを入力してください。"
                    className="w-full p-3.5 rounded-2xl border border-stone-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1c603a]"
                  />
                </div>
              )}

              {analysisError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-black text-rose-700">
                  {analysisError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleCreateNewPredictedQuiz}
                disabled={isAnalyzing}
                className="w-full py-3.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs sm:text-sm font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isAnalyzing ? 'AIが過去問を分析＆予想問題作成中...' : '予想問題を生成して一覧に追加する'}</span>
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* D. SECTION 1: PREDICTED QUESTIONS LIST (Modeled on 39204_0.jpg)*/}
          {/* ============================================================== */}
          {activeSegment === 'list' && (
            <div className="space-y-3">
              {displayedQuizzes.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-stone-200/90 shadow-xs space-y-3">
                  <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-sm font-black text-slate-800">
                    該当する定期テスト予想問題がありません
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSubject('all');
                      setIsCreateOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-[#1c603a] text-white text-xs font-black shadow-xs hover:bg-[#154a2c] cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>AIで新しい予想問題を追加する</span>
                  </button>
                </div>
              ) : (
                displayedQuizzes.map((quiz) => {
                  const standing = getMyQuizStanding(quiz.id);
                  const hasTaken = standing && standing.myScore !== null;
                  const badge = getSubjectColorBadge(quiz.title, quiz.aiAnalysisSummary?.subject);

                  return (
                    <button
                      key={quiz.id}
                      onClick={() => startQuiz(quiz.id)}
                      className="w-full bg-white hover:bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs transition-all duration-150 flex items-center gap-4 text-left group cursor-pointer hover:border-slate-400 hover:shadow-sm"
                    >
                      {/* Left: Square Icon Badge (Modeled on 39204_0.jpg) */}
                      <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0 flex flex-col items-center justify-center p-2 text-center shadow-2xs border ${badge.bg} ${badge.border}`}
                      >
                        <BookOpen className="w-6 h-6 mb-0.5 opacity-90" />
                        <span className="text-[10px] font-black tracking-tight leading-tight">
                          {badge.label}
                        </span>
                      </div>

                      {/* Middle: 3-line format */}
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Line 1: Target Test / Duration / Status */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-slate-700">
                            定期テスト対策 · 制限時間 {quiz.durationMinutes}分
                          </span>
                          {hasTaken ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[#1c603a] text-[10px] font-extrabold flex items-center gap-0.5">
                              <Check className="w-3 h-3" />
                              <span>{standing.myScore}点 受験済</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-bold">
                              未受験 (全{quiz.questions.length}問)
                            </span>
                          )}
                        </div>

                        {/* Line 2: Bold Title */}
                        <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#1c603a] transition-colors truncate">
                          {quiz.title}
                        </h3>

                        {/* Line 3: Category & Highlights */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-500">
                          <span>◎ {quiz.aiAnalysisSummary?.unit || quiz.weekLabel}</span>
                          {quiz.aiAnalysisSummary?.keywords?.[0] && (
                            <span className="text-stone-400">
                              · 重点: {quiz.aiAnalysisSummary.keywords[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Chevron */}
                      <div className="shrink-0 text-stone-300 group-hover:text-slate-800 transition-colors pr-1">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* E. SECTION 2: EXAM TRENDS & KEY POINTS (Modeled on 39204_0.jpg)*/}
          {/* ============================================================== */}
          {activeSegment === 'trends' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                  <TrendingUp className="w-5 h-5 text-[#1c603a]" />
                  <h3 className="text-base font-black text-slate-900">
                    教科別 定期テスト出題傾向 ＆ 合否を分けるポイントまとめ
                  </h3>
                </div>

                <div className="space-y-3">
                  {displayedQuizzes.map((quiz) => {
                    const summary = quiz.aiAnalysisSummary;
                    if (!summary) return null;

                    return (
                      <div
                        key={quiz.id}
                        className="bg-[#fdfbf7] p-4 sm:p-5 rounded-2xl border border-stone-200/90 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-[#1c603a] text-white text-xs font-black">
                              {summary.subject}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {summary.unit}
                            </span>
                          </div>

                          <button
                            onClick={() => startQuiz(quiz.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-xs font-black text-slate-800 border border-stone-300 shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <span>予想問題を解く</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Keywords Tag Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          {summary.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1"
                            >
                              <Tag className="w-3 h-3 text-[#1c603a]" />
                              <span>{kw}</span>
                            </span>
                          ))}
                        </div>

                        {/* Trends Bullet Points */}
                        <ul className="space-y-1.5 text-xs font-medium text-slate-700 bg-white p-3 rounded-xl border border-stone-200/80">
                          {summary.trends.map((trend, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#1c603a] font-black">✔</span>
                              <span>{trend}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
