import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

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
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-stone-200/90 space-y-6">
        {/* Top Header Branding (Modeled on 39203_0_78740368.jpg) */}
        <div className="text-center space-y-2">
          {/* Green Festival Logo Badge */}
          <div className="inline-block bg-[#1c603a] text-white px-5 py-2.5 rounded-2xl shadow-xs border border-[#185533]">
            <div className="flex items-center justify-center gap-2">
              <span className="font-black text-sm tracking-tight text-white">
                いちはちさいと
              </span>
              <span className="text-[10px] font-black text-amber-300">2026</span>
            </div>
            <div className="text-[9px] text-emerald-100 font-bold tracking-wider mt-0.5">
              まなぶことは、つながること。
            </div>
          </div>

          <div className="space-y-0.5 pt-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              1年8組 生徒ログイン
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              出席番号とパスワードを入力して入室してください。
            </p>
          </div>
        </div>

        {/* Ticket-style subtle dashed line */}
        <div className="relative py-1">
          <div className="border-t-2 border-dashed border-sky-300 w-full" />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 font-black animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#1c603a]" />
              <span>出席番号</span>
            </label>
            <select
              value={studentNum}
              onChange={(e) => setStudentNum(Number(e.target.value))}
              className="w-full text-sm font-black border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white focus:outline-none focus:border-[#1c603a] transition-all cursor-pointer shadow-2xs"
            >
              {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  出席番号 {num}番
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-[#1c603a]" />
              <span>パスワード</span>
            </label>
            <input
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm font-bold border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white focus:outline-none focus:border-[#1c603a] transition-all shadow-2xs"
              required
            />
            <p className="text-[11px] text-stone-500 font-bold mt-1.5">
              ※ 初期パスワード: 0000
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white font-black text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>ログインして入室する</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
