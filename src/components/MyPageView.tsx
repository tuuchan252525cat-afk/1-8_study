import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Key,
  ShieldCheck,
  Award,
  TrendingUp,
  BookOpen,
  Edit2,
  Check,
  Lock,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const MyPageView: React.FC = () => {
  const {
    currentStudent,
    updateNickname,
    updatePassword,
    personalStanding,
    activeTestTitle,
    switchStudentDemo,
    students,
    quizSubmissions,
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
      {/* 1. Account & Privacy Profile Box */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-xs shrink-0"
              style={{ backgroundColor: currentStudent.avatarColor }}
            >
              {currentStudent.attendanceNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{currentStudent.nickname}</h2>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  出席番号 {currentStudent.attendanceNumber}番
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                本名は一切不要。アプリ内では出席番号とニックネームのみで管理されます。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>プライバシー保護モード作動中</span>
            </span>
          </div>
        </div>

        {/* Profile Editing Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* Nickname Form */}
          <form onSubmit={handleNicknameSave} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                マイニックネームの変更
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                掲示板や教材共有で表示される名前です（本名ではなく好きな名前を設定できます）
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={16}
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1"
                >
                  {nicknameSaved ? <Check className="w-4 h-4" /> : <Edit2 className="w-3.5 h-3.5" />}
                  <span>{nicknameSaved ? '保存済' : '変更'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Password Form */}
          <form onSubmit={handlePasswordSave} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ログインパスワードの設定・変更
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                他の人があなたの出席番号で点数を見られないよう、暗証番号を設定できます
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="任意の暗証番号（例: 4桁数字）"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1"
                >
                  {passwordSaved ? <Check className="w-4 h-4" /> : <Key className="w-3.5 h-3.5" />}
                  <span>{passwordSaved ? '設定完了' : '登録'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Personal Private Academic Report (The Core Requirement) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              完全非公開レポート
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              {activeTestTitle} 個人成績と成長度サマリー
            </h3>
          </div>
          <span className="text-xs text-slate-400">あなただけが閲覧可能</span>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
              <Award className="w-4 h-4 text-amber-500" />
              あなたの総合順位
            </span>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {personalStanding.rank}
              <span className="text-xs font-semibold text-slate-500 ml-1">
                / {personalStanding.totalParticipants}人中
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              上位 {Math.round((personalStanding.rank / personalStanding.totalParticipants) * 100)}%
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              あなたの成長度順位
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 tabular-nums">
              {personalStanding.growthRank ? (
                <>
                  {personalStanding.growthRank}
                  <span className="text-xs font-semibold text-slate-500 ml-1">
                    位 ({personalStanding.growthDelta && personalStanding.growthDelta > 0 ? `+${personalStanding.growthDelta}` : personalStanding.growthDelta}点)
                  </span>
                </>
              ) : (
                '集計中'
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              全体順位表には点数幅のみ掲載（個人特定ゼロ）
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
              <BookOpen className="w-4 h-4 text-sky-500" />
              5教科合計得点
            </span>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {personalStanding.totalScore}
              <span className="text-xs font-normal text-slate-500 ml-1">/ 500点</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              クラス平均 {personalStanding.classAverage}点 (+{Math.round((personalStanding.totalScore - personalStanding.classAverage) * 10) / 10}点)
            </p>
          </div>
        </div>

        {/* Weekly Quizzes Private Status */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-700 mb-3">週替わり定期テスト 個人記録</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-sky-800">第4週 英単語ターゲット</span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  スコア: {engStanding?.myScore ?? '-'}/5問正解
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-sky-700">
                  {engStanding?.myRank ? `${engStanding.myRank}位` : '未受験'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  / {engStanding?.total ?? 0}人中
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-800">第4週 ミゾブルー理科教養</span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  スコア: {mizoStanding?.myScore ?? '-'}/5問正解
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-700">
                  {mizoStanding?.myRank ? `${mizoStanding.myRank}位` : '未受験'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  / {mizoStanding?.total ?? 0}人中
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Fast Demo Switcher for Evaluation */}
      <div className="bg-slate-50 rounded-3xl p-5 sm:p-7 border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              出席番号切り替え（全40人プライバシー検証用）
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              タップすると該当の出席番号の個別画面・プライバシー表示に切り替わります。
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">1〜40番</span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 pt-2">
          {students.map((s) => {
            const isCurrent = s.attendanceNumber === currentStudent.attendanceNumber;
            return (
              <button
                key={s.attendanceNumber}
                onClick={() => {
                  switchStudentDemo(s.attendanceNumber);
                  setNicknameInput(s.nickname);
                }}
                className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-emerald-600 text-white font-bold shadow-xs scale-105 ring-2 ring-emerald-300'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200/80'
                }`}
              >
                <div className="text-xs font-bold">{s.attendanceNumber}番</div>
                <div className="text-[10px] truncate max-w-[50px] mx-auto opacity-80">
                  {s.nickname}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
