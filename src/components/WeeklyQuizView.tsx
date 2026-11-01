import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  BarChart2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const WeeklyQuizView: React.FC = () => {
  const { quizzes, submitQuiz, getQuizAnonymousRankings, getMyQuizStanding } = useApp();

  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || 'quiz-eng-w4');
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

  const activeQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];

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

  const startQuiz = () => {
    setIsPlaying(true);
    setCurrentQIndex(0);
    setSelectedAnswers([]);
    setLastResult(null);
    setShowResultReview(false);
  };

  if (!activeQuiz) return null;

  const anonymousRankings = getQuizAnonymousRankings(activeQuiz.id);
  const myStanding = getMyQuizStanding(activeQuiz.id);
  const existingSubmission = myStanding && myStanding.myScore !== null;

  // Distribution chart computation
  const distributionCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
  anonymousRankings.forEach((r) => {
    if (distributionCounts[r.score] !== undefined) {
      distributionCounts[r.score] += 1;
    }
  });

  const scoreDistributionMap = [5, 4, 3, 2, 1, 0].map((score) => ({
    score,
    count: distributionCounts[score] || 0,
    isMyScore: existingSubmission && myStanding?.myScore === score,
  }));

  return (
    <div className="space-y-6">
      {/* Quiz Selector Segmented Pills (Modeled on DAY 1 / DAY 2 in 39204_0_b6de3a0e.jpg) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-stone-400 uppercase tracking-wider">
            SELECT QUIZ
          </span>
          <span className="text-xs text-stone-500 font-bold">
            毎週更新 · 演習テスト
          </span>
        </div>

        {/* Big Rounded Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {quizzes.map((q, idx) => {
            const isSel = selectedQuizId === q.id;
            return (
              <button
                key={q.id}
                onClick={() => {
                  setSelectedQuizId(q.id);
                  setIsPlaying(false);
                  setShowResultReview(false);
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left flex items-center gap-3 ${
                  isSel
                    ? 'border-[#1c603a] bg-[#1c603a] text-white shadow-xs'
                    : 'border-stone-200 bg-[#fdfbf7] hover:bg-white text-slate-800'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                    isSel
                      ? 'bg-white/20 text-white'
                      : q.category === 'english'
                      ? 'bg-sky-100 text-sky-800'
                      : q.category === 'mizoblue'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className={`block text-[10px] font-black tracking-wider uppercase truncate ${
                      isSel ? 'text-emerald-100' : 'text-stone-400'
                    }`}
                  >
                    {q.category === 'english'
                      ? 'ENGLISH'
                      : q.category === 'mizoblue'
                      ? 'SCIENCE'
                      : 'AI PREDICTED'}
                  </span>
                  <span className="block text-xs sm:text-sm font-black truncate mt-0.5">
                    {q.category === 'english'
                      ? '英単語ターゲット'
                      : q.category === 'mizoblue'
                      ? 'ミゾブルー理科'
                      : q.title.replace('【AI予想】', '')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Quiz Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs">
        {/* State A: Quiz Header Info (Not playing) */}
        {!isPlaying && (
          <div className="mb-6 pb-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#1c603a]/10 text-[#1c603a] flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-stone-500 mb-1">
                  <span className="text-[#1c603a] font-black">{activeQuiz.weekLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>所要時間 約{activeQuiz.durationMinutes}分</span>
                  <span aria-hidden="true">·</span>
                  <span>全{activeQuiz.questions.length}問</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">{activeQuiz.title}</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xl font-medium leading-relaxed">
                  {activeQuiz.description}
                </p>
                <div className="text-[11px] text-[#1c603a] font-black mt-2 flex items-center gap-1.5">
                  <span>◎ 1年8組 小テスト演習</span>
                  <span aria-hidden="true">·</span>
                  <span>自動採点＆解説付き</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={startQuiz}
                className="px-6 py-3 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white font-black text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{existingSubmission ? '再挑戦して解き直す' : 'テストを開始する'}</span>
              </button>
            </div>
          </div>
        )}

        {/* State B: In-Progress Quiz Play Mode */}
        {isPlaying ? (
          <div className="max-w-2xl mx-auto py-3">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-xs text-stone-600 mb-2 font-black">
              <span className="text-[#1c603a]">
                ◎ 問 {currentQIndex + 1} / {activeQuiz.questions.length}
              </span>
              <span>選択肢を1つ選んでください</span>
            </div>
            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden mb-6 border border-stone-200">
              <div
                className="bg-[#1c603a] h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Question Card */}
            <div className="bg-[#fdfbf7] rounded-3xl p-6 border border-stone-200/90 mb-6 shadow-2xs">
              <div className="text-[11px] font-black text-stone-400 mb-1">QUESTION {currentQIndex + 1}</div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {activeQuiz.questions[currentQIndex].question}
              </h4>
            </div>

            {/* Options List */}
            <div className="space-y-3 mb-6">
              {activeQuiz.questions[currentQIndex].options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQIndex] === optIdx;
                const optionLabel = ['A', 'B', 'C', 'D'][optIdx] || `${optIdx + 1}`;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 min-h-[52px] rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#1c603a] border-[#1c603a] text-white shadow-xs'
                        : 'bg-white hover:bg-[#fdfbf7] border-stone-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-100 text-slate-700'
                        }`}
                      >
                        {optionLabel}
                      </span>
                      <span>{option}</span>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 ${
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

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsPlaying(false)}
                className="text-xs font-black text-stone-500 hover:text-slate-800 cursor-pointer"
              >
                中止して戻る
              </button>

              <button
                onClick={handleNextOrFinish}
                disabled={selectedAnswers[currentQIndex] === undefined || selectedAnswers[currentQIndex] === -1}
                className={`px-6 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  selectedAnswers[currentQIndex] !== undefined && selectedAnswers[currentQIndex] !== -1
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
        ) : (
          /* State C: Normal Overview & Previous Results */
          <div className="space-y-6">
            {/* Personal Status Badge if taken */}
            {existingSubmission && myStanding && (
              <div className="bg-[#fdfbf7] rounded-3xl p-5 sm:p-6 border border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-[#1c603a] text-white flex items-center justify-center font-black text-xl shadow-xs">
                    {myStanding.myScore}
                    <span className="text-xs font-bold opacity-80">/{activeQuiz.questions.length}</span>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#1c603a] font-black">
                      ◎ あなたの最新解答スコア
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {myStanding.myScore === 5
                        ? '満点達成！素晴らしい習熟度です！'
                        : (myStanding.myScore ?? 0) >= 3
                        ? '合格ライン突破！要点も復習しておこう'
                        : '復習チャンス！解説を確認して弱点を克服しよう'}
                    </div>
                  </div>
                </div>

                {myStanding && myStanding.myRank && (
                  <div className="bg-white rounded-2xl px-5 py-3 border border-stone-200 flex items-center gap-3 shrink-0 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-black uppercase">
                        CLASS RANK
                      </span>
                      <span className="text-base font-black text-slate-900 tabular-nums">
                        {myStanding.myRank}位{' '}
                        <span className="text-xs font-bold text-stone-500">
                          / {myStanding.total}人中
                        </span>
                      </span>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-[#1c603a]" />
                  </div>
                )}
              </div>
            )}

            {/* Anonymous Class Score Distribution & Strict Ranking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Box 1: Score Distribution */}
              <div className="bg-[#fdfbf7] rounded-3xl p-5 border border-stone-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-[#1c603a]" />
                    クラスの得点分布（匿名集計）
                  </span>
                  <span className="text-[11px] text-stone-500 font-bold bg-stone-100 px-2.5 py-0.5 rounded-full">
                    {anonymousRankings.length}名提出
                  </span>
                </div>

                <div className="space-y-2.5">
                  {scoreDistributionMap.map((item) => (
                    <div key={item.score} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-700">{item.score}問正解</span>
                          {item.isMyScore && (
                            <span className="text-[10px] font-black text-white bg-[#1c603a] px-2 py-0.5 rounded-full">
                              あなた
                            </span>
                          )}
                        </div>
                        <span className="text-slate-800 font-mono tabular-nums font-black">{item.count} 名</span>
                      </div>
                      <div className="w-full bg-stone-200/80 h-3 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.isMyScore ? 'bg-[#1c603a]' : 'bg-slate-700'
                          }`}
                          style={{
                            width: `${
                              anonymousRankings.length > 0
                                ? (item.count / anonymousRankings.length) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: Anonymous Ranking Table */}
              <div className="bg-[#fdfbf7] rounded-3xl p-5 border border-stone-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    週間順位表（匿名）
                  </span>
                  <span className="text-[11px] text-stone-400 font-bold">1〜15位</span>
                </div>

                {anonymousRankings.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-500 font-medium">
                    まだ提出データはありません。「テストを開始する」から最初に挑戦してみましょう！
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {(() => {
                      let userRowShown = false;
                      return anonymousRankings.slice(0, 15).map((item, idx) => {
                        const isMatch = myStanding?.myRank === item.rank && myStanding?.myScore === item.score;
                        const isMyRow = isMatch && !userRowShown;
                        if (isMyRow) userRowShown = true;

                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                              isMyRow
                                ? 'bg-[#f4f8f5] border-2 border-[#1c603a] font-black text-[#1c603a]'
                                : 'bg-white border border-stone-200/90 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-xl flex items-center justify-center font-black text-[10px] ${
                                  item.rank === 1
                                    ? 'bg-amber-400 text-amber-950'
                                    : item.rank === 2
                                    ? 'bg-stone-300 text-slate-800'
                                    : item.rank === 3
                                    ? 'bg-amber-700/20 text-amber-900'
                                    : 'bg-stone-100 text-slate-600'
                                }`}
                              >
                                {item.rank}
                              </span>
                              <span className="font-black">{item.score} 点</span>
                            </div>
                            {isMyRow && (
                              <span className="text-[10px] text-white bg-[#1c603a] px-2 py-0.5 rounded-full font-black">
                                あなた
                              </span>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Answer Explanations */}
            {showResultReview && (
              <div className="mt-8 pt-6 border-t border-stone-200 space-y-4">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#1c603a]" />
                  <span>各問の解説と解答比較</span>
                </h4>

                <div className="space-y-3">
                  {activeQuiz.questions.map((q, idx) => {
                    const userAns = selectedAnswers[idx];
                    const isCorrect = userAns === q.correctIndex;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-3xl border text-xs space-y-2.5 ${
                          isCorrect
                            ? 'bg-[#f4f8f5] border-[#1c603a]/40'
                            : 'bg-rose-50/60 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-black">
                          <span className="flex items-center gap-1.5 text-slate-900">
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-[#1c603a]" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600" />
                            )}
                            問{idx + 1}: {q.question}
                          </span>
                          <span
                            className={isCorrect ? 'text-[#1c603a] font-black' : 'text-rose-700 font-black'}
                          >
                            {isCorrect ? '◎ 正解' : '× 不正解'}
                          </span>
                        </div>

                        <div className="text-slate-700 space-y-1 font-medium">
                          <div>
                            あなたの選択:{' '}
                            <span className="font-black text-slate-900">
                              {userAns !== undefined && userAns !== -1
                                ? q.options[userAns]
                                : '未解答'}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div>
                              正解:{' '}
                              <span className="font-black text-[#1c603a]">
                                {q.options[q.correctIndex]}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 bg-white rounded-2xl text-stone-700 leading-relaxed border border-stone-200/90 font-medium">
                          <span className="font-black text-slate-900">◎ 解説: </span>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
