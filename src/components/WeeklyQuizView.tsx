import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QuizQuestion } from '../types';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  BarChart2,
  ChevronRight,
  ShieldCheck,
  ChevronLeft,
  Filter,
  RotateCcw,
  Trophy,
  Target,
  Award,
} from 'lucide-react';

export const WeeklyQuizView: React.FC = () => {
  const { quizzes, submitQuiz, getQuizAnonymousRankings, getMyQuizStanding, setCurrentTab } = useApp();

  // Mode: regular weekly quizzes vs AI predicted quizzes
  const [activeTabType, setActiveTabType] = useState<'weekly' | 'ai'>('weekly');
  const [filterCondition, setFilterCondition] = useState<'all' | 'not_taken' | 'completed'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Active quiz state
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<{
    score: number;
    bestScore: number;
    attemptCount: number;
    maxScore: number;
    rank: number;
    total: number;
  } | null>(null);
  const [showResultReview, setShowResultReview] = useState<boolean>(false);
  const [showClassStats, setShowClassStats] = useState<boolean>(false);

  // Missed-questions-only review mode state
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [reviewQuestions, setReviewQuestions] = useState<QuizQuestion[]>([]);
  const [reviewResult, setReviewResult] = useState<{ score: number; maxScore: number } | null>(null);

  // Filter quizzes by tab
  const tabQuizzes = quizzes.filter((q) => {
    if (activeTabType === 'weekly') {
      return q.category !== 'ai_predicted';
    } else {
      return q.category === 'ai_predicted';
    }
  });

  const displayedQuizzes = tabQuizzes.filter((q) => {
    const standing = getMyQuizStanding(q.id);
    const hasTaken = standing && standing.myScore !== null;
    if (filterCondition === 'not_taken') return !hasTaken;
    if (filterCondition === 'completed') return hasTaken;
    return true;
  });

  const activeQuiz = quizzes.find((q) => q.id === selectedQuizId);
  const activeQuestions =
    isReviewMode && reviewQuestions.length > 0
      ? reviewQuestions
      : activeQuiz?.questions || [];

  const handleSelectOption = (optIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentQIndex] = optIndex;
    setSelectedAnswers(updated);
  };

  const handleNextOrFinish = () => {
    if (!activeQuiz || activeQuestions.length === 0) return;
    if (currentQIndex < activeQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else if (isReviewMode) {
      let correctCount = 0;
      activeQuestions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctIndex) {
          correctCount += 1;
        }
      });
      setReviewResult({ score: correctCount, maxScore: activeQuestions.length });
      setIsPlaying(false);
      setShowResultReview(true);
    } else {
      // Submit full quiz to local + Firestore cloud
      const res = submitQuiz(activeQuiz.id, selectedAnswers);
      setLastResult(res);
      setIsPlaying(false);
      setShowResultReview(true);
    }
  };

  const startQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setIsReviewMode(false);
    setReviewQuestions([]);
    setReviewResult(null);
    setIsPlaying(true);
    setCurrentQIndex(0);
    setSelectedAnswers([]);
    setLastResult(null);
    setShowResultReview(false);
    setShowClassStats(false);
  };

  const startMissedReview = (missed: QuizQuestion[]) => {
    if (missed.length === 0) return;
    setReviewQuestions(missed);
    setIsReviewMode(true);
    setReviewResult(null);
    setIsPlaying(true);
    setCurrentQIndex(0);
    setSelectedAnswers([]);
    setShowResultReview(false);
    setShowClassStats(false);
  };

  const backToList = () => {
    setIsPlaying(false);
    setIsReviewMode(false);
    setReviewQuestions([]);
    setReviewResult(null);
    setSelectedQuizId(null);
    setShowResultReview(false);
    setShowClassStats(false);
  };

  const missedQuestions = activeQuestions.filter(
    (q, idx) => selectedAnswers[idx] !== q.correctIndex
  );
  const currentScore = isReviewMode
    ? reviewResult?.score ?? 0
    : lastResult?.score ?? 0;
  const currentMaxScore = activeQuestions.length;
  const accuracyPercent =
    currentMaxScore > 0 ? Math.round((currentScore / currentMaxScore) * 100) : 0;
  const isPerfect = currentMaxScore > 0 && currentScore === currentMaxScore;

  return (
    <div className="space-y-4">
      {/* If playing a quiz */}
      {isPlaying && activeQuiz && activeQuestions[currentQIndex] ? (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-5">
          {/* Top Back & Step Header */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100 flex-wrap">
            <button
              onClick={backToList}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-black transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>テスト一覧に戻る</span>
            </button>

            <div className="flex items-center gap-2">
              {isReviewMode && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black">
                  <Target className="w-3.5 h-3.5" />
                  <span>間違えた問題 復習モード</span>
                </span>
              )}
              <span className="text-xs font-black text-[#1c603a] bg-[#f4f8f5] px-3 py-1 rounded-full">
                問 {currentQIndex + 1} / {activeQuestions.length}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200">
            <div
              className="bg-[#1c603a] h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentQIndex + 1) / activeQuestions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Text Box */}
          <div className="bg-[#fdfbf7] rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs">
            <div className="text-[11px] font-black text-stone-400 mb-1">
              {isReviewMode ? `REVIEW ${currentQIndex + 1}` : `QUESTION ${currentQIndex + 1}`}
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {activeQuestions[currentQIndex].question}
            </h3>
          </div>

          {/* Choices as Large Button Cards */}
          <div className="space-y-3">
            {activeQuestions[currentQIndex].options.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentQIndex] === optIdx;
              const optionLetter = ['A', 'B', 'C', 'D'][optIdx] || `${optIdx + 1}`;

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 text-sm sm:text-base font-black transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[#1c603a] bg-[#1c603a] text-white shadow-xs'
                      : 'border-stone-200 bg-white hover:bg-[#fdfbf7] text-slate-800 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-slate-700'
                      }`}
                    >
                      {optionLetter}
                    </span>
                    <span>{option}</span>
                  </div>

                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 ${
                      isSelected
                        ? 'border-white bg-white text-[#1c603a] font-black'
                        : 'border-stone-300 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-between border-t border-stone-100">
            <button
              onClick={backToList}
              className="text-xs font-black text-stone-400 hover:text-slate-800 cursor-pointer"
            >
              中断する
            </button>

            <button
              onClick={handleNextOrFinish}
              disabled={selectedAnswers[currentQIndex] === undefined}
              className={`px-7 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                selectedAnswers[currentQIndex] !== undefined
                  ? 'bg-[#1c603a] hover:bg-[#154a2c] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>
                {currentQIndex === activeQuestions.length - 1 ? '採点して結果を見る' : '次の問題へ'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : showResultReview && activeQuiz ? (
        /* Result Review Screen (Unified Pastel Icon Card + Missed-Questions Review CTA) */
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
          {/* Score Card Banner */}
          <div className="bg-[#F5F4EE] rounded-3xl p-5 sm:p-6 border border-stone-200/80 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${
                    isPerfect
                      ? 'bg-amber-50 border-amber-300 text-amber-500'
                      : accuracyPercent >= 60
                      ? 'bg-emerald-50 border-emerald-200 text-[#1c603a]'
                      : 'bg-sky-50 border-sky-200 text-sky-600'
                  }`}
                >
                  <Trophy className="w-8 h-8" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black text-[#1c603a]">
                      {isReviewMode ? '◎ 復習モード 採点完了' : '◎ 採点完了 · クラウド保存済'}
                    </span>
                    {isPerfect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-black">
                        <Award className="w-3.5 h-3.5" />
                        <span>パーフェクト！</span>
                      </span>
                    ) : accuracyPercent >= 60 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-black">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>合格ライン突破</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-black">
                        <Target className="w-3.5 h-3.5" />
                        <span>復習チャレンジ</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                    {isPerfect
                      ? isReviewMode
                        ? '復習パーフェクト！弱点を克服しました！'
                        : '満点達成！パーフェクトです！'
                      : accuracyPercent >= 60
                      ? 'よく頑張りました！あと少しで満点です'
                      : '間違えた問題をすぐ復習しよう！'}
                  </h3>
                </div>
              </div>

              {/* Numeric Stats Cards */}
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <div className="bg-white rounded-2xl px-4 py-3 border border-stone-200/80 shadow-2xs text-center min-w-[92px]">
                  <span className="text-[10px] font-bold text-stone-400 block">正答数</span>
                  <span className="text-xl font-black text-slate-900 tabular-nums">
                    {currentScore}
                    <span className="text-xs font-bold text-stone-500">/{currentMaxScore}</span>
                  </span>
                </div>

                <div className="bg-white rounded-2xl px-4 py-3 border border-stone-200/80 shadow-2xs text-center min-w-[84px]">
                  <span className="text-[10px] font-bold text-stone-400 block">正答率</span>
                  <span className="text-xl font-black text-[#1c603a] tabular-nums">
                    {accuracyPercent}%
                  </span>
                </div>

                {!isReviewMode && lastResult && (
                  <div className="bg-white rounded-2xl px-4 py-3 border border-stone-200/80 shadow-2xs flex items-center gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 block">クラス順位</span>
                      <span className="text-base font-black text-slate-900 tabular-nums">
                        {lastResult.rank}位
                        <span className="text-[11px] font-bold text-stone-500 ml-0.5">
                          /{lastResult.total}人
                        </span>
                      </span>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-[#1c603a]" />
                  </div>
                )}
              </div>
            </div>

            {/* Missed Questions Review CTA or Perfect Achievement Banner */}
            {missedQuestions.length > 0 ? (
              <button
                onClick={() => startMissedReview(missedQuestions)}
                className="w-full bg-white hover:bg-amber-50/70 p-4 rounded-2xl border-2 border-amber-300 hover:border-amber-500 shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-black text-slate-900">
                      間違えた問題だけ復習する（全{missedQuestions.length}問）
                    </div>
                    <div className="text-xs font-semibold text-stone-500">
                      不正解だった問題だけをピックアップして即座に解き直せます
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-600 shrink-0" />
              </button>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 flex items-center gap-3.5 shadow-2xs">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-[#1c603a]">
                    パーフェクト！全問正解達成
                  </div>
                  <div className="text-xs font-semibold text-stone-500">
                    {isReviewMode
                      ? '間違えた問題をすべて正解できました！本番テストでもう一度満点を狙いましょう。'
                      : '素晴らしい成績です！記録はマイページの「小テスト成績」にも自動保存されました。'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => startQuiz(activeQuiz.id)}
              className="py-3 px-3 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isReviewMode ? '全問テストに再挑戦' : 'もう一度挑戦'}</span>
            </button>

            <button
              onClick={() => setShowClassStats(!showClassStats)}
              className="py-3 px-3 rounded-2xl bg-[#fdfbf7] hover:bg-stone-100 text-slate-800 text-xs font-black border border-stone-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BarChart2 className="w-4 h-4 text-[#1c603a]" />
              <span>{showClassStats ? '順位表を閉じる' : 'クラス順位を見る'}</span>
            </button>

            <button
              onClick={() => setCurrentTab('mypage')}
              className="py-3 px-3 rounded-2xl bg-[#fdfbf7] hover:bg-stone-100 text-slate-800 text-xs font-black border border-stone-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>マイページ成績を見る</span>
            </button>

            <button
              onClick={backToList}
              className="py-3 px-3 rounded-2xl bg-white hover:bg-stone-100 text-slate-800 text-xs font-black border border-stone-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>小テスト一覧へ戻る</span>
            </button>
          </div>

          {/* Optional Class Rankings Modal/Accordion */}
          {showClassStats && (
            <div className="bg-[#fdfbf7] rounded-3xl p-5 border border-stone-200 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span>◎ クラス順位表（匿名集計）</span>
                <span className="text-stone-400">上位10名</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getQuizAnonymousRankings(activeQuiz.id).slice(0, 10).map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs font-black"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-stone-100 text-slate-800 flex items-center justify-center text-[10px]">
                        {r.rank}
                      </span>
                      <span>最高スコア: {r.score}問正解</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanations List */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1c603a]" />
              <span>{isReviewMode ? '復習問題の解答と詳しい解説' : '全問題の解答と詳しい解説'}</span>
            </h4>

            <div className="space-y-3">
              {activeQuestions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={`p-4 sm:p-5 rounded-2xl border text-xs space-y-2 ${
                      isCorrect
                        ? 'bg-[#f4f8f5] border-[#1c603a]/40'
                        : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-black">
                      <span className="flex items-center gap-1.5 text-slate-900 text-sm">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-[#1c603a]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        問{idx + 1}: {q.question}
                      </span>
                      <span className={isCorrect ? 'text-[#1c603a] font-black' : 'text-rose-700 font-black'}>
                        {isCorrect ? '◎ 正解' : '× 不正解'}
                      </span>
                    </div>

                    <div className="text-slate-700 space-y-1 font-bold">
                      <div>
                        あなたの選択: {userAns !== undefined ? q.options[userAns] : '未解答'}
                      </div>
                      {!isCorrect && (
                        <div className="text-[#1c603a]">
                          正解: {q.options[q.correctIndex]}
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-white rounded-xl text-stone-700 border border-stone-200 font-medium leading-relaxed">
                      <span className="font-black text-slate-900">解説: </span>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* MAIN LIST VIEW (EXACTLY MODELED ON 39204_0.jpg) */
        <div className="space-y-4">
          {/* 1. Large DAY 1 / DAY 2 Style Segmented Buttons (Modeled on 39204_0.jpg) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setActiveTabType('weekly');
                setSelectedQuizId(null);
              }}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                activeTabType === 'weekly'
                  ? 'border-[#1c603a] bg-white ring-2 ring-[#1c603a]/20 shadow-xs'
                  : 'border-stone-300/80 bg-white hover:bg-stone-50'
              }`}
            >
              <div className="text-xs font-black text-stone-500 uppercase tracking-wider">
                WEEKLY TEST
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                週替わり小テスト
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTabType('ai');
                setSelectedQuizId(null);
              }}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                activeTabType === 'ai'
                  ? 'border-[#1c603a] bg-white ring-2 ring-[#1c603a]/20 shadow-xs'
                  : 'border-stone-300/80 bg-white hover:bg-stone-50'
              }`}
            >
              <div className="text-xs font-black text-stone-500 uppercase tracking-wider">
                AI PREDICTED
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                AI予想問題
              </div>
            </button>
          </div>

          {/* 2. "▽ 条件を選ぶ" Filter Button (Modeled on 39204_0.jpg) */}
          <div className="text-center py-1">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full bg-white border border-stone-300 hover:border-slate-800 text-xs sm:text-sm font-black text-slate-800 shadow-2xs transition-all cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-stone-600" />
              <span>
                {filterCondition === 'all'
                  ? '▽ 条件を選ぶ'
                  : filterCondition === 'not_taken'
                  ? '▽ 条件: 未受験'
                  : '▽ 条件: 受験済み'}
              </span>
            </button>

            {/* Filter Dropdown Pills */}
            {isFilterOpen && (
              <div className="mt-2 p-2 bg-white rounded-2xl border border-stone-200 shadow-sm max-w-xs mx-auto flex items-center justify-center gap-2 animate-fadeIn">
                <button
                  onClick={() => {
                    setFilterCondition('all');
                    setIsFilterOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                    filterCondition === 'all' ? 'bg-[#1c603a] text-white' : 'text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => {
                    setFilterCondition('not_taken');
                    setIsFilterOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                    filterCondition === 'not_taken' ? 'bg-[#1c603a] text-white' : 'text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  未受験
                </button>
                <button
                  onClick={() => {
                    setFilterCondition('completed');
                    setIsFilterOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                    filterCondition === 'completed' ? 'bg-[#1c603a] text-white' : 'text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  受験済み
                </button>
              </div>
            )}
          </div>

          {/* 3. List of Button Cards (Modeled on 39204_0.jpg Exhibition List) */}
          <div className="space-y-3">
            {displayedQuizzes.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-stone-200/90 shadow-xs space-y-3">
                <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-sm font-black text-slate-800">
                  {activeTabType === 'ai'
                    ? 'AI予想問題はまだ作成されていません'
                    : '該当するテストがありません'}
                </p>
                {activeTabType === 'ai' && (
                  <button
                    onClick={() => setCurrentTab('ai_analyzer')}
                    className="px-5 py-2.5 rounded-2xl bg-[#1c603a] text-white text-xs font-black shadow-xs hover:bg-[#154a2c] cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>定期テスト予想問題一覧を見る</span>
                  </button>
                )}
              </div>
            ) : (
              displayedQuizzes.map((quiz, idx) => {
                const standing = getMyQuizStanding(quiz.id);
                const hasTaken = standing && standing.myScore !== null;

                // Color thumbnail styles matching the varied cards in 39204_0.jpg
                const bgColors = [
                  'bg-amber-100 text-amber-900',
                  'bg-indigo-900 text-white',
                  'bg-stone-900 text-white',
                  'bg-lime-400 text-slate-900',
                  'bg-emerald-700 text-white',
                ];
                const thumbColor = bgColors[idx % bgColors.length];

                return (
                  <button
                    key={quiz.id}
                    onClick={() => startQuiz(quiz.id)}
                    className="w-full text-left bg-white hover:bg-[#fdfbf7] active:bg-[#f4f8f5] rounded-2xl p-3.5 sm:p-4 border border-stone-200/90 shadow-xs flex items-center gap-3.5 sm:gap-4 transition-all cursor-pointer group hover:border-slate-800"
                  >
                    {/* Left Thumbnail (Square image/icon container like 39204_0.jpg) */}
                    <div
                      className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 flex flex-col items-center justify-center font-black ${thumbColor} shadow-2xs group-hover:scale-[1.02] transition-transform`}
                    >
                      {quiz.category === 'english' ? (
                        <>
                          <span className="text-[10px] tracking-wider font-extrabold uppercase opacity-80">
                            ENG
                          </span>
                          <span className="text-lg font-black mt-0.5">LEAP</span>
                        </>
                      ) : quiz.category === 'mizoblue' ? (
                        <>
                          <span className="text-[10px] tracking-wider font-extrabold uppercase opacity-80">
                            MIZO
                          </span>
                          <span className="text-xl font-black mt-0.5">理科</span>
                        </>
                      ) : quiz.category === 'ai_predicted' ? (
                        <>
                          <Sparkles className="w-5 h-5 text-amber-300" />
                          <span className="text-[10px] font-black mt-0.5">AI予想</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-5 h-5 opacity-90" />
                          <span className="text-[10px] font-black mt-1 px-1 truncate max-w-full">
                            {quiz.category.slice(0, 6)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Right Content Block (3 Lines like 39204_0.jpg) */}
                    <div className="flex-1 min-w-0">
                      {/* Line 1: Status / Duration (like 10:00~18:00) */}
                      <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center justify-between">
                        <span>所要時間 約{quiz.durationMinutes}分 · 全{quiz.questions.length}問</span>
                        {hasTaken && (
                          <span className="text-[11px] font-black text-[#1c603a] bg-[#f4f8f5] px-2 py-0.5 rounded-full border border-[#1c603a]/20 tabular-nums">
                            最高: {standing.bestScore ?? standing.myScore}/{quiz.questions.length}
                            {standing.attemptCount > 0 ? ` (${standing.attemptCount}回)` : ''}
                          </span>
                        )}
                      </div>

                      {/* Line 2: Big Bold Title (like 株式会社WAQHAPI) */}
                      <div className="text-base sm:text-lg font-black text-slate-900 truncate my-0.5 group-hover:text-[#1c603a] transition-colors">
                        {quiz.title}
                      </div>

                      {/* Line 3: Category with ◎ (like ◎ 飲食) */}
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-2 mt-1">
                        <span>
                          ◎{' '}
                          {quiz.category === 'english'
                            ? '英語・英単語'
                            : quiz.category === 'mizoblue'
                            ? '理科・教養'
                            : quiz.category === 'ai_predicted'
                            ? 'AI出題予想'
                            : quiz.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-stone-400 font-semibold">{quiz.weekLabel}</span>
                      </div>
                    </div>

                    {/* Right arrow */}
                    <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-slate-800 transition-colors shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
