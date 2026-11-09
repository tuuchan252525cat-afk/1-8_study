import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
    maxScore: number;
    rank: number;
    total: number;
  } | null>(null);
  const [showResultReview, setShowResultReview] = useState<boolean>(false);
  const [showClassStats, setShowClassStats] = useState<boolean>(false);

  // Filter quizzes by tab
  const tabQuizzes = quizzes.filter((q) => {
    if (activeTabType === 'weekly') {
      return q.category === 'english' || q.category === 'mizoblue';
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

  const handleSelectOption = (optIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentQIndex] = optIndex;
    setSelectedAnswers(updated);
  };

  const handleNextOrFinish = () => {
    if (!activeQuiz) return;
    if (currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      // Submit
      const res = submitQuiz(activeQuiz.id, selectedAnswers);
      setLastResult(res);
      setIsPlaying(false);
      setShowResultReview(true);
    }
  };

  const startQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setIsPlaying(true);
    setCurrentQIndex(0);
    setSelectedAnswers([]);
    setLastResult(null);
    setShowResultReview(false);
    setShowClassStats(false);
  };

  const backToList = () => {
    setIsPlaying(false);
    setSelectedQuizId(null);
    setShowResultReview(false);
    setShowClassStats(false);
  };

  return (
    <div className="space-y-4">
      {/* If playing a quiz */}
      {isPlaying && activeQuiz ? (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-5">
          {/* Top Back & Step Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <button
              onClick={backToList}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-black transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>テスト一覧に戻る</span>
            </button>

            <span className="text-xs font-black text-[#1c603a] bg-[#f4f8f5] px-3 py-1 rounded-full">
              問 {currentQIndex + 1} / {activeQuiz.questions.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200">
            <div
              className="bg-[#1c603a] h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Text Box */}
          <div className="bg-[#fdfbf7] rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs">
            <div className="text-[11px] font-black text-stone-400 mb-1">
              QUESTION {currentQIndex + 1}
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {activeQuiz.questions[currentQIndex].question}
            </h3>
          </div>

          {/* Choices as Large Button Cards */}
          <div className="space-y-3">
            {activeQuiz.questions[currentQIndex].options.map((option, optIdx) => {
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
                {currentQIndex === activeQuiz.questions.length - 1 ? '採点して結果を見る' : '次の問題へ'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : showResultReview && activeQuiz ? (
        /* Result Review Screen (Clean and button-heavy) */
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
          {/* Result Score Banner */}
          <div className="bg-[#1c603a] text-white rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-2xl shrink-0 shadow-2xs">
                {lastResult?.score ?? 0}
                <span className="text-xs font-bold text-slate-700">/{activeQuiz.questions.length}</span>
              </div>
              <div>
                <div className="text-xs font-black text-amber-300">◎ 採点完了</div>
                <h3 className="text-lg sm:text-xl font-black mt-0.5">
                  {lastResult?.score === activeQuiz.questions.length
                    ? '満点達成！完璧です！'
                    : (lastResult?.score ?? 0) >= 3
                    ? '合格ライン突破！よく頑張りました'
                    : '復習チャンス！解説をチェックしよう'}
                </h3>
              </div>
            </div>

            {lastResult && (
              <div className="bg-white text-slate-900 rounded-2xl px-5 py-3 border border-stone-200 flex items-center gap-3 shrink-0 shadow-2xs">
                <div>
                  <span className="text-[10px] text-stone-400 block font-black">クラス順位</span>
                  <span className="text-base font-black tabular-nums">
                    {lastResult.rank}位{' '}
                    <span className="text-xs font-bold text-stone-500">/ {lastResult.total}人中</span>
                  </span>
                </div>
                <ShieldCheck className="w-5 h-5 text-[#1c603a]" />
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
              <span>もう一度挑戦</span>
            </button>

            <button
              onClick={() => setShowClassStats(!showClassStats)}
              className="py-3 px-3 rounded-2xl bg-[#fdfbf7] hover:bg-stone-100 text-slate-800 text-xs font-black border border-stone-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BarChart2 className="w-4 h-4 text-[#1c603a]" />
              <span>{showClassStats ? '順位表を閉じる' : 'クラス順位を見る'}</span>
            </button>

            <button
              onClick={() => setCurrentTab('ai_analyzer')}
              className="py-3 px-3 rounded-2xl bg-[#fdfbf7] hover:bg-stone-100 text-slate-800 text-xs font-black border border-stone-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>定期テスト予想問題一覧へ</span>
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
                      <span>スコア: {r.score}問正解</span>
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
              <span>全問題の解答と詳しい解説</span>
            </h4>

            <div className="space-y-3">
              {activeQuiz.questions.map((q, idx) => {
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
                          <span className="text-xl font-black mt-0.5">1900</span>
                        </>
                      ) : quiz.category === 'mizoblue' ? (
                        <>
                          <span className="text-[10px] tracking-wider font-extrabold uppercase opacity-80">
                            MIZO
                          </span>
                          <span className="text-xl font-black mt-0.5">理科</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-amber-300" />
                          <span className="text-[10px] font-black mt-0.5">AI予想</span>
                        </>
                      )}
                    </div>

                    {/* Right Content Block (3 Lines like 39204_0.jpg) */}
                    <div className="flex-1 min-w-0">
                      {/* Line 1: Status / Duration (like 10:00~18:00) */}
                      <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center justify-between">
                        <span>所要時間 約{quiz.durationMinutes}分 · 全{quiz.questions.length}問</span>
                        {hasTaken && (
                          <span className="text-[11px] font-black text-[#1c603a] bg-[#f4f8f5] px-2 py-0.5 rounded-full border border-[#1c603a]/20">
                            スコア: {standing.myScore}/{quiz.questions.length}
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
                            : 'AI出題予想'}
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
