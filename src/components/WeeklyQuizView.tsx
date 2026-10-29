import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WeeklyQuiz } from '../types';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  Award,
  RefreshCw,
  HelpCircle,
  BarChart2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const WeeklyQuizView: React.FC = () => {
  const {
    quizzes,
    submitQuiz,
    quizSubmissions,
    getQuizAnonymousRankings,
    getMyQuizStanding,
    currentStudent,
  } = useApp();

  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || 'quiz-eng-w4');
  const activeQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];

  // In-quiz state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResultReview, setShowResultReview] = useState<boolean>(false);

  // Check if current student has submitted this quiz
  const existingSubmission = quizSubmissions.find(
    (s) => s.quizId === selectedQuizId && s.studentNumber === currentStudent?.attendanceNumber
  );

  const anonymousRankings = getQuizAnonymousRankings(selectedQuizId);
  const myStanding = getMyQuizStanding(selectedQuizId);

  const startQuiz = () => {
    setIsPlaying(true);
    setCurrentQIndex(0);
    setSelectedAnswers(new Array(activeQuiz.questions.length).fill(-1));
    setShowResultReview(false);
  };

  const handleSelectOption = (optionIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentQIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleNextOrFinish = () => {
    if (currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      // Submit
      submitQuiz(selectedQuizId, selectedAnswers);
      setIsPlaying(false);
      setShowResultReview(true);
    }
  };

  // Group quiz scores into distribution
  const scoreDistributionMap = [5, 4, 3, 2, 1, 0].map((score) => {
    const count = anonymousRankings.filter((r) => r.score === score).length;
    return {
      score,
      count,
      isMyScore: myStanding?.myScore === score,
    };
  });

  return (
    <div className="space-y-6">
      {/* Category Picker Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">週替わり定期テスト</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            毎週更新！英単語ターゲット演習 ＆ クラス名物「ミゾブルー」テスト
          </p>
        </div>

        {/* Functional Tabs for English vs Mizo-Blue */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          {quizzes.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                setSelectedQuizId(q.id);
                setIsPlaying(false);
                setShowResultReview(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedQuizId === q.id
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  q.category === 'english' ? 'bg-sky-500' : 'bg-indigo-500'
                }`}
              />
              <span>{q.category === 'english' ? '英単語ターゲット' : 'ミゾブルー理科教養'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Quiz Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
        {/* State A: Quiz Header Info (Not playing) */}
        {!isPlaying && (
          <div className="mb-6 pb-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-semibold text-emerald-600">{activeQuiz.weekLabel}</span>
                <span aria-hidden="true">·</span>
                <span>所要時間: 約{activeQuiz.durationMinutes}分</span>
                <span aria-hidden="true">·</span>
                <span>全{activeQuiz.questions.length}問</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{activeQuiz.title}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">{activeQuiz.description}</p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={startQuiz}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{existingSubmission ? '再挑戦して解き直す' : 'テストを開始する'}</span>
              </button>
            </div>
          </div>
        )}

        {/* State B: In-Progress Quiz Play Mode */}
        {isPlaying ? (
          <div className="max-w-2xl mx-auto py-3">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-emerald-700">
                問 {currentQIndex + 1} / {activeQuiz.questions.length}
              </span>
              <span>選択肢を1つ選んでください</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Question Card */}
            <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100 mb-6">
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
                        ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 ring-1 ring-emerald-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <span>{option}</span>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
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
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                中止して戻る
              </button>

              <button
                onClick={handleNextOrFinish}
                disabled={selectedAnswers[currentQIndex] === undefined || selectedAnswers[currentQIndex] === -1}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 ${
                  selectedAnswers[currentQIndex] !== undefined && selectedAnswers[currentQIndex] !== -1
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
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
          /* State C: Quiz Result, Private Standing, and Anonymous Score Distribution */
          <div className="space-y-6">
            {/* My Personal Score Banner */}
            {existingSubmission && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white rounded-2xl p-5 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {existingSubmission.score}
                    <span className="text-xs font-normal">/{activeQuiz.questions.length}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-800 font-bold">
                        あなたの個人スコア（非公開）
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      {existingSubmission.score === 5
                        ? '満点達成！完璧です！'
                        : existingSubmission.score >= 3
                        ? '合格ライン突破！要点も復習しておこう'
                        : '復習チャンス！解説を確認しましょう'}
                    </div>
                  </div>
                </div>

                {myStanding && myStanding.myRank && (
                  <div className="bg-white/90 rounded-xl px-4 py-2 border border-emerald-100 flex items-center gap-3 shrink-0">
                    <div>
                      <span className="text-[10px] text-slate-400 block">週間ランキング順位</span>
                      <span className="text-base font-extrabold text-emerald-700 tabular-nums">
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
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-emerald-600" />
                    クラスの得点分布（匿名）
                  </span>
                  <span className="text-[11px] text-slate-400">
                    提出数: {anonymousRankings.length}名
                  </span>
                </div>

                <div className="space-y-2.5">
                  {scoreDistributionMap.map((item) => (
                    <div key={item.score} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700">{item.score}問正解</span>
                          {item.isMyScore && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              あなた
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 tabular-nums">{item.count} 名</span>
                      </div>
                      <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.isMyScore ? 'bg-emerald-500' : 'bg-slate-400'
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
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    週間匿名順位表（順位とスコアのみ）
                  </span>
                  <span className="text-[11px] text-slate-400">氏名・番号完全非表示</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {(() => {
                    let userRowShown = false;
                    return anonymousRankings.slice(0, 15).map((item, idx) => {
                      const isMatch = myStanding?.myRank === item.rank && myStanding?.myScore === item.score;
                      const isMyRow = isMatch && !userRowShown;
                      if (isMyRow) userRowShown = true;

                      return (
                        <div
                          key={`quiz-rank-${idx}`}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                            isMyRow ? 'bg-emerald-100/70 font-bold text-emerald-900 ring-1 ring-emerald-300' : 'bg-white text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-center font-bold text-slate-500">
                              {item.rank}位
                            </span>
                            <span>{item.score}問正解 ({(item.score / 5) * 100}点)</span>
                          </div>
                          {isMyRow && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-200/80 px-1.5 py-0.5 rounded font-bold">
                              あなた
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}
                  {anonymousRankings.length > 15 && (
                    <p className="text-center text-[11px] text-slate-400 py-1">
                      …他 {anonymousRankings.length - 15}名のスコア
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Question Review & Explanations */}
            <div className="pt-2">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                出題問題と詳しい解説
              </h4>

              <div className="space-y-3">
                {activeQuiz.questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-slate-50/60 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                        問{qIdx + 1}.
                      </span>
                      <p className="text-xs font-semibold text-slate-800">{q.question}</p>
                    </div>

                    <div className="ml-5 space-y-1.5 text-xs">
                      <div className="text-emerald-700 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>正解: {q.options[q.correctIndex]}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] bg-white p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
