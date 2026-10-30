import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  TrendingUp,
  Check,
  Edit2,
  Key,
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
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-300/80 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-2xs shrink-0"
              style={{ backgroundColor: currentStudent.avatarColor }}
            >
              {currentStudent.attendanceNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">{currentStudent.nickname}</h2>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                  出席番号 {currentStudent.attendanceNumber}番
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Editing Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nickname Form */}
          <form onSubmit={handleNicknameSave} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                <span>ニックネームの変更</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                掲示板や教材共有で表示されるお名前です
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={16}
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-slate-900 font-bold"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {nicknameSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
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
          <form onSubmit={handlePasswordSave} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-600" />
                <span>ログインパスワードの変更</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                次回ログイン時から変更後のパスワードが適用されます
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="新しいパスワード"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-slate-900 font-bold"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {passwordSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
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
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-300/80 shadow-md space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            {activeTestTitle} 個人成績と成長度サマリー
          </h3>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Award className="w-4 h-4 text-amber-500" />
              総合順位
            </span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {personalStanding.rank > 0 ? personalStanding.rank : '-'}
              <span className="text-xs font-bold text-slate-500 ml-1">
                / {personalStanding.totalParticipants}人中
              </span>
            </div>
            {personalStanding.totalParticipants > 0 && (
              <p className="text-[11px] text-emerald-700 font-bold mt-1">
                上位 {Math.round((personalStanding.rank / personalStanding.totalParticipants) * 100)}%
              </p>
            )}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              成長度順位
            </span>
            <div className="text-2xl font-black text-emerald-600 tabular-nums">
              {personalStanding.growthRank ? (
                <>
                  {personalStanding.growthRank}
                  <span className="text-xs font-bold text-slate-500 ml-1">
                    位 ({personalStanding.growthDelta && personalStanding.growthDelta > 0 ? `+${personalStanding.growthDelta}` : personalStanding.growthDelta}点)
                  </span>
                </>
              ) : (
                '集計中'
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
              英単語＆ミゾブルー小テスト成績
            </span>
            <div className="space-y-1 mt-1 text-xs">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>英単語:</span>
                <span className="font-bold text-slate-900">
                  {engStanding?.myScore !== null && engStanding?.myScore !== undefined
                    ? `${engStanding.myScore} / 5問`
                    : '未挑戦'}
                </span>
              </div>
              <div className="flex justify-between text-slate-700 font-medium">
                <span>ミゾブルー:</span>
                <span className="font-bold text-slate-900">
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
