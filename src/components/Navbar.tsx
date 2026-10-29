import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart2, BookOpen, FolderDown, MessageSquare, User, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentTab, setCurrentTab, currentStudent, switchStudentDemo } = useApp();

  return (
    <>
      {/* Top Bar for Desktop & Tablet (Adheres to 3-zone Top Bar Contract) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark (single line) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-bold shadow-sm">
              CH
            </div>
            <button
              onClick={() => setCurrentTab('home')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors whitespace-nowrap">
                ClassHub 3-B
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-600 font-medium whitespace-nowrap">
                学習＆プライバシー情報共有
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (single line, unboxed hover styling) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => setCurrentTab('home')}
              className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'home' || currentTab === 'tests' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-500' : ''
              }`}
            >
              成績・匿名順位
            </button>
            <button
              onClick={() => setCurrentTab('quiz')}
              className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'quiz' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-500' : ''
              }`}
            >
              定期テスト（英単語・ミゾブルー）
            </button>
            <button
              onClick={() => setCurrentTab('materials')}
              className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'materials' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-500' : ''
              }`}
            >
              教材共有
            </button>
            <button
              onClick={() => setCurrentTab('forum')}
              className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'forum' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-500' : ''
              }`}
            >
              学習掲示板
            </button>
            <button
              onClick={() => setCurrentTab('mypage')}
              className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'mypage' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-500' : ''
              }`}
            >
              マイページ
            </button>
            <button
              onClick={() => setCurrentTab('edit')}
              className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 py-1 text-xs px-2.5 py-1 rounded-lg ${
                currentTab === 'edit'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
              }`}
              title="定期テスト・小テストの問題編集 (/edit)"
            >
              問題編集 (/edit)
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action (User status / Quick switcher) */}
          <div className="flex items-center gap-3 shrink-0">
            {currentStudent ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('mypage')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 text-xs text-slate-700 transition-colors cursor-pointer"
                  title="マイページでプライバシーとパスワードを設定"
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ backgroundColor: currentStudent.avatarColor }}
                  >
                    {currentStudent.attendanceNumber}
                  </span>
                  <span className="font-semibold text-slate-800 truncate max-w-[90px]">
                    {currentStudent.nickname}
                  </span>
                  <span className="hidden sm:inline text-slate-600 text-[11px]">
                    (出席番号 {currentStudent.attendanceNumber}番)
                  </span>
                </button>
                {/* Fast switcher selector for demo test */}
                <select
                  value={currentStudent.attendanceNumber}
                  onChange={(e) => switchStudentDemo(Number(e.target.value))}
                  className="hidden lg:block text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-lg py-1 px-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  title="出席番号切り替え (デモ確認用)"
                >
                  {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      番号 {num}番 で表示
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <button
                onClick={() => setCurrentTab('mypage')}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap shadow-sm"
              >
                ログイン
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (< 768px, adheres to 15% sticky cap and 44px touch targets) */}
      <nav
        aria-label="モバイルナビゲーション"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      >
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              currentTab === 'home' || currentTab === 'tests'
                ? 'text-emerald-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-medium tracking-tight mt-1">順位・成績</span>
          </button>

          <button
            onClick={() => setCurrentTab('quiz')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              currentTab === 'quiz' ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-medium tracking-tight mt-1">定期テスト</span>
          </button>

          <button
            onClick={() => setCurrentTab('materials')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              currentTab === 'materials' ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FolderDown className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-medium tracking-tight mt-1">教材共有</span>
          </button>

          <button
            onClick={() => setCurrentTab('forum')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              currentTab === 'forum' ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-medium tracking-tight mt-1">掲示板</span>
          </button>

          <button
            onClick={() => setCurrentTab('mypage')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              currentTab === 'mypage' ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <User className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-medium tracking-tight mt-1">マイページ</span>
          </button>
        </div>
      </nav>
    </>
  );
};
