import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WeeklyQuiz } from '../types';
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
      {/* Category Picker Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-300/80 shadow-md">
        <div>
          <h2 className="text-base font-bold text-slate-900">週替わり定期テスト</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            毎週更新！英単語ターゲット演習 ＆ 理科教養「ミゾブルー」テスト
          </p>
        </div>

        {/* Functional Tabs for English vs Mizo-Blue */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
          {quizzes.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                setSelectedQuizId(q.id);
                setIsPlaying(false);
                setShowResultReview(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedQuizId === q.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  q.category === 'english' ? 'bg-sky-400' : 'bg-rose-500'
                }`}
              />
              <span>{q.category === 'english' ? '英単語ターゲット' : 'ミゾブルー理科教養'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Quiz Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-300/80 shadow-md">
        {/* State A: Quiz Header Info (Not playing) */}
        {!isPlaying && (
          <div className="mb-6 pb-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-bold text-rose-600">{activeQuiz.weekLabel}</span>
                <span aria-hidden="true">·</span>
                <span>所要時間: 約{activeQuiz.durationMinutes}分</span>
                <span aria-hidden="true">·</span>
                <span>全{activeQuiz.questions.length}問</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">{activeQuiz.title}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">{activeQuiz.description}</p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={startQuiz}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
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
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-bold">
              <span className="text-rose-600">
                問 {currentQIndex + 1} / {activeQuiz.questions.length}
              </span>
              <span>選択肢を1つ選んでください</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6 border border-slate-200">
              <div
                className="bg-slate-900 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Question Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-6">
              <h4 className="text-base font-bold text-slate-900 leading-snug">
                {activeQuiz.questions[currentQIndex].question}
              </h4>
            </div>

            {/* Options List */}
            <div className="space-y-3 mb-6">
              {activeQuiz.questions[currentQIndex].options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQIndex] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 min-h-[48px] rounded-2xl border text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <span>{option}</span>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                        isSelected
                          ? 'border-white bg-white text-slate-900 font-bold'
                          : 'border-slate-300 text-transparent'
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
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                中止して戻る
              </button>

              <button
                onClick={handleNextOrFinish}
                disabled={selectedAnswers[currentQIndex] === undefined || selectedAnswers[currentQIndex] === -1}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedAnswers[currentQIndex] !== undefined && selectedAnswers[currentQIndex] !== -1
                    ? 'bg-slate-900 hover:bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-2xs">
                    {myStanding.myScore}
                    <span className="text-xs font-normal">/{activeQuiz.questions.length}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-600 font-bold">
                        あなたのスコア
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      {myStanding.myScore === 5
                        ? '満点達成！完璧です！'
                        : (myStanding.myScore ?? 0) >= 3
                        ? '合格ライン突破！要点も復習しておこう'
                        : '復習チャンス！解説を確認しましょう'}
                    </div>
                  </div>
                </div>

                {myStanding && myStanding.myRank && (
                  <div className="bg-white rounded-xl px-4 py-2 border border-slate-200 flex items-center gap-3 shrink-0 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">ランキング順位</span>
                      <span className="text-base font-black text-slate-900 tabular-nums">
                        {myStanding.myRank}位{' '}
                        <span className="text-xs font-normal text-slate-500">
                          / {myStanding.total}人中
                        </span>
                      </span>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                )}
              </div>
            )}

            {/* Anonymous Class Score Distribution & Strict Ranking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Box 1: Score Distribution */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-rose-600" />
                    クラスの得点分布（匿名）
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    提出数: {anonymousRankings.length}名
                  </span>
                </div>

                <div className="space-y-2.5">
                  {scoreDistributionMap.map((item) => (
                    <div key={item.score} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">{item.score}問正解</span>
                          {item.isMyScore && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                              あなた
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 font-mono tabular-nums font-bold">{item.count} 名</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.isMyScore ? 'bg-rose-500' : 'bg-slate-700'
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
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    週間順位表
                  </span>
                </div>

                {anonymousRankings.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-medium">
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
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                              isMyRow
                                ? 'bg-rose-100/80 border border-rose-300 font-bold text-rose-950'
                                : 'bg-white border border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                                  item.rank === 1
                                    ? 'bg-amber-400 text-amber-950'
                                    : item.rank === 2
                                    ? 'bg-slate-300 text-slate-800'
                                    : item.rank === 3
                                    ? 'bg-amber-600/30 text-amber-900'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.rank}
                              </span>
                              <span>{item.score} 点</span>
                            </div>
                            {isMyRow && <span className="text-[10px] text-rose-700 font-bold">あなた</span>}
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
              <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-rose-600" />
                  <span>各問の解説と解答比較</span>
                </h4>

                <div className="space-y-3">
                  {activeQuiz.questions.map((q, idx) => {
                    const userAns = selectedAnswers[idx];
                    const isCorrect = userAns === q.correctIndex;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border text-xs space-y-2 ${
                          isCorrect
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-rose-50/60 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5 text-slate-900">
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600" />
                            )}
                            問{idx + 1}: {q.question}
                          </span>
                          <span
                            className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}
                          >
                            {isCorrect ? '正解' : '不正解'}
                          </span>
                        </div>

                        <div className="text-slate-700 space-y-1">
                          <div>
                            あなたの選択:{' '}
                            <span className="font-bold">
                              {userAns !== undefined && userAns !== -1
                                ? q.options[userAns]
                                : '未解答'}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div>
                              正解:{' '}
                              <span className="font-bold text-emerald-800">
                                {q.options[q.correctIndex]}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-2.5 bg-white/80 rounded-xl text-slate-600 leading-relaxed border border-slate-200/80">
                          <span className="font-bold text-slate-800">解説: </span>
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
