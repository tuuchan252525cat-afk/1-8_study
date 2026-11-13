import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  TrendingUp,
  Check,
  Edit2,
  Key,
  BookOpen,
  Trophy,
  FlaskConical,
  Sparkles,
  CheckCircle2,
  Target,
  ChevronRight,
} from 'lucide-react';

export const MyPageView: React.FC = () => {
  const {
    currentStudent,
    updateNickname,
    updatePassword,
    personalStanding,
    activeTestTitle,
    quizzes,
    getMyQuizStanding,
    setCurrentTab,
  } = useApp();

  const [nicknameInput, setNicknameInput] = useState(currentStudent?.nickname || '');
  const [nicknameSaved, setNicknameSaved] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  if (!currentStudent) return null;

  const handleNicknameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;
    await updateNickname(nicknameInput.trim());
    setNicknameSaved(true);
    setTimeout(() => setNicknameSaved(false), 2000);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    await updatePassword(newPassword.trim());
    setPasswordSaved(true);
    setNewPassword('');
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  // Show all weekly quizzes + any AI predicted quizzes that the student has attempted
  const quizCards = quizzes.filter((q) => {
    if (q.category !== 'ai_predicted') return true;
    const st = getMyQuizStanding(q.id);
    return Boolean(st && st.attemptCount > 0);
  });

  const getQuizIconBadge = (category: string) => {
    if (category === 'english') {
      return {
        bg: 'bg-sky-50 border-sky-200 text-sky-600',
        label: '英単語',
        icon: <BookOpen className="w-5 h-5" />,
      };
    }
    if (category === 'mizoblue') {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-600',
        label: 'ミゾブルー',
        icon: <FlaskConical className="w-5 h-5" />,
      };
    }
    if (category === 'ai_predicted') {
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-600',
        label: 'AI予想問題',
        icon: <Sparkles className="w-5 h-5" />,
      };
    }
    return {
      bg: 'bg-emerald-50 border-emerald-200 text-[#1c603a]',
      label: category || '小テスト',
      icon: <BookOpen className="w-5 h-5" />,
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Account & Profile Box */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div className="flex items-center gap-3.5">
            <span
              className="w-13 h-13 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-xs shrink-0"
              style={{ backgroundColor: currentStudent.avatarColor }}
            >
              {currentStudent.attendanceNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">{currentStudent.nickname}</h2>
                <span className="text-xs font-black text-[#1c603a] bg-[#f4f8f5] px-2.5 py-1 rounded-full border border-[#1c603a]/20">
                  出席番号 {currentStudent.attendanceNumber}番
                </span>
              </div>
              <div className="text-[11px] text-stone-500 font-bold mt-0.5">
                ◎ 1年8組 生徒専用アカウント
              </div>
            </div>
          </div>
        </div>

        {/* Profile Editing Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nickname Form */}
          <form onSubmit={handleNicknameSave} className="space-y-3 bg-[#fdfbf7] p-4 sm:p-5 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-[#1c603a]" />
                <span>ニックネームの変更</span>
              </label>
              <p className="text-[11px] text-stone-500 mb-2 font-medium">
                掲示板や教材共有で表示されるお名前です
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={16}
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  className="flex-1 text-xs border border-stone-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-[#1c603a] font-bold"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black transition-colors shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  {nicknameSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      保存完了
                    </>
                  ) : (
                    '保存'
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Password Form */}
          <form onSubmit={handlePasswordSave} className="space-y-3 bg-[#fdfbf7] p-4 sm:p-5 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#1c603a]" />
                <span>ログインパスワードの変更</span>
              </label>
              <p className="text-[11px] text-stone-500 mb-2 font-medium">
                次回ログイン時から変更後のパスワードが適用されます
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="新しいパスワード"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 text-xs border border-stone-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-[#1c603a] font-bold"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black transition-colors shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  {passwordSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      変更完了
                    </>
                  ) : (
                    '変更'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Personal Private Academic Report */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
        <div className="pb-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">
            {activeTestTitle} 個人成績と成長度サマリー
          </h3>
          <span className="text-[11px] font-black text-[#1c603a]">
            ◎ 非公開データ
          </span>
        </div>

        {/* Top 2 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-[#fdfbf7] rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800">総合順位</span>
            </div>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {personalStanding.rank > 0 ? personalStanding.rank : '-'}
              <span className="text-xs font-bold text-stone-500 ml-1">
                / {personalStanding.totalParticipants}人中
              </span>
            </div>
            {personalStanding.totalParticipants > 0 && (
              <p className="text-[11px] text-[#1c603a] font-black mt-1">
                ◎ 上位 {Math.round((personalStanding.rank / personalStanding.totalParticipants) * 100)}%
              </p>
            )}
          </div>

          <div className="bg-[#fdfbf7] rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#1c603a] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800">成長度順位</span>
            </div>
            <div className="text-2xl font-black text-[#1c603a] tabular-nums">
              {personalStanding.growthRank ? (
                <>
                  {personalStanding.growthRank}
                  <span className="text-xs font-bold text-stone-500 ml-1">
                    位 ({personalStanding.growthDelta && personalStanding.growthDelta > 0 ? `+${personalStanding.growthDelta}` : personalStanding.growthDelta}点)
                  </span>
                </>
              ) : (
                '集計中'
              )}
            </div>
            <p className="text-[11px] text-stone-500 font-bold mt-1">
              ◎ 前回テストからの向上順位
            </p>
          </div>
        </div>

        {/* Cloud-Synced Quiz Results Card */}
        <div className="bg-[#F5F4EE] rounded-3xl p-4 sm:p-5 border border-stone-200/80 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900">小テスト成績</h4>
                <p className="text-[11px] font-semibold text-slate-500">
                  受験結果・最高得点・受験回数はクラウドに自動保存されます
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentTab('quiz')}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-black text-[#1c603a] cursor-pointer shadow-2xs"
            >
              <span>小テストを解く</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quizCards.map((quiz) => {
              const standing = getMyQuizStanding(quiz.id);
              const meta = getQuizIconBadge(quiz.category);
              const maxQ = standing?.maxScore || quiz.questions.length || 5;
              const bestScore = standing?.bestScore ?? standing?.myScore;
              const attempts = standing?.attemptCount ?? 0;
              const hasAttempted = bestScore !== null && bestScore !== undefined && attempts > 0;
              const rate = hasAttempted && maxQ > 0 ? Math.round((bestScore / maxQ) * 100) : 0;
              const isPerfect = hasAttempted && bestScore >= maxQ;
              const isPassed = hasAttempted && !isPerfect && rate >= 60;

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${meta.bg}`}
                    >
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-stone-400">
                        {meta.label}
                      </div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                        {quiz.title}
                      </div>
                      <div className="text-[11px] font-bold text-stone-500 mt-0.5 tabular-nums">
                        {hasAttempted ? `受験 ${attempts}回 · 正答率 ${rate}%` : 'まだ受験していません'}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right space-y-1">
                    {hasAttempted ? (
                      <>
                        <div className="text-sm sm:text-base font-black text-slate-900 tabular-nums">
                          {bestScore}
                          <span className="text-xs font-bold text-stone-500"> / {maxQ}問</span>
                        </div>
                        {isPerfect ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black">
                            <Trophy className="w-3 h-3" />
                            <span>パーフェクト</span>
                          </span>
                        ) : isPassed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#1c603a] text-[10px] font-black">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>合格</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black">
                            <Target className="w-3 h-3" />
                            <span>復習推奨</span>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-stone-100 text-stone-500 text-[11px] font-black">
                        未挑戦
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
