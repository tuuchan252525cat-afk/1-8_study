import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, UserCheck, ShieldCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, students } = useApp();

  const [studentNum, setStudentNum] = useState<number>(1);
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = login(studentNum, password);
    if (!res.success) {
      setErrorMessage(res.error || 'パスワードが正しくありません');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-6">
        {/* Top Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ClassHub 3-B 認証ゲート</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            生徒ログイン
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            成績・匿名順位・定期テスト演習・教材共有の閲覧には、出席番号とパスワードが必要です。
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-slate-500" />
              <span>出席番号（1番〜40番）</span>
            </label>
            <select
              value={studentNum}
              onChange={(e) => setStudentNum(Number(e.target.value))}
              className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all cursor-pointer"
            >
              {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  出席番号 {num}番
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-slate-500" />
              <span>パスワード</span>
            </label>
            <input
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm font-medium border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              required
            />
            <p className="text-[11px] text-emerald-700 font-semibold mt-1.5 bg-emerald-50/80 px-2.5 py-1 rounded-lg inline-block">
              ※ 初期パスワードは 0000 です（ログイン後マイページで変更可能）
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Lock className="w-4 h-4" />
            <span>ログインして閲覧する</span>
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-400">
          出席番号と暗証番号でログイン中のみプライバシー保護機能が適用されます
        </div>
      </div>
    </div>
  );
};
