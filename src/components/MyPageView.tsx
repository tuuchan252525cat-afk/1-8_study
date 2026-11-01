import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  TrendingUp,
  Check,
  Edit2,
  Key,
  BookOpen,
} from 'lucide-react';

export const MyPageView: React.FC = () => {
  const {
    currentStudent,
    updateNickname,
    updatePassword,
    personalStanding,
    activeTestTitle,
    getMyQuizStanding,
  } = useApp();

  const [nicknameInput, setNicknameInput] = useState(currentStudent?.nickname || '');
  const [nicknameSaved, setNicknameSaved] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  if (!currentStudent) return null;

  const handleNicknameSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;
    updateNickname(nicknameInput.trim());
    setNicknameSaved(true);
    setTimeout(() => setNicknameSaved(false), 1500);
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    updatePassword(newPassword.trim());
    setPasswordSaved(true);
    setNewPassword('');
    setTimeout(() => setPasswordSaved(false), 1500);
  };

  const engStanding = getMyQuizStanding('quiz-eng-w4');
  const mizoStanding = getMyQuizStanding('quiz-mizo-w4');

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

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-[#fdfbf7] rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                <Award className="w-4 h-4" />
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

          <div className="bg-[#fdfbf7] rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#1c603a] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
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

          <div className="bg-[#fdfbf7] rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-800">小テスト成績</span>
            </div>
            <div className="space-y-1 mt-1 text-xs font-medium">
              <div className="flex justify-between text-stone-600">
                <span>英単語:</span>
                <span className="font-black text-slate-900">
                  {engStanding?.myScore !== null && engStanding?.myScore !== undefined
                    ? `${engStanding.myScore} / 5問`
                    : '未挑戦'}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>ミゾブルー:</span>
                <span className="font-black text-slate-900">
                  {mizoStanding?.myScore !== null && mizoStanding?.myScore !== undefined
                    ? `${mizoStanding.myScore} / 5問`
                    : '未挑戦'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
