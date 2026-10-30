import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, UserCheck, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useApp();

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
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
        {/* Top Header Branding (Marugotosai Style) */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-teal-500 text-white font-black text-sm flex items-center justify-center mx-auto shadow-sm">
            1-8
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-rose-600 tracking-wider">
              1-8 SITE · 1年8組
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              いちはちさいと ログイン
            </h1>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            出席番号とパスワードを入力して入室してください。
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
              <span>出席番号</span>
            </label>
            <select
              value={studentNum}
              onChange={(e) => setStudentNum(Number(e.target.value))}
              className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer"
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
              className="w-full text-sm font-medium border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
              required
            />
            <p className="text-[11px] text-slate-500 font-medium mt-1.5">
              ※ 初期パスワード: 0000
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-rose-600 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>ログインして入室する</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
