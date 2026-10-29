import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart2, BookOpen, FolderDown, MessageSquare, User, Edit3, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentTab, setCurrentTab, currentStudent, logout, isLoggedIn } = useApp();

  return (
    <>
      {/* Top Bar for Desktop & Tablet */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Brand wordmark (Compact & single line) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-black text-xs shadow-2xs">
              CH
            </div>
            <button
              onClick={() => setCurrentTab('home')}
              className="text-left group cursor-pointer focus:outline-none flex items-baseline gap-1.5"
            >
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors whitespace-nowrap">
                ClassHub 3-B
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (fits completely on screen) */}
          {isLoggedIn && (
            <nav className="hidden md:flex items-center gap-2 lg:gap-4 text-xs sm:text-sm font-semibold text-slate-600">
              <button
                onClick={() => setCurrentTab('home')}
                className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'home' || currentTab === 'tests'
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                成績・順位
              </button>

              <button
                onClick={() => setCurrentTab('quiz')}
                className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'quiz'
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                定期テスト
              </button>

              <button
                onClick={() => setCurrentTab('materials')}
                className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'materials'
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                教材共有
              </button>

              <button
                onClick={() => setCurrentTab('forum')}
                className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'forum'
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                掲示板
              </button>

              <button
                onClick={() => setCurrentTab('mypage')}
                className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'mypage'
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                マイページ
              </button>

              <button
                onClick={() => setCurrentTab('edit')}
                className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 ${
                  currentTab === 'edit'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700'
                }`}
                title="問題・テストの編集 (/edit)"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>問題編集 (/edit)</span>
              </button>
            </nav>
          )}

          {/* Zone 3: User status / Action */}
          <div className="flex items-center gap-2 shrink-0">
            {isLoggedIn && currentStudent ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setCurrentTab('mypage')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 text-xs text-slate-700 transition-colors cursor-pointer"
                  title="マイページへ"
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0"
                    style={{ backgroundColor: currentStudent.avatarColor }}
                  >
                    {currentStudent.attendanceNumber}
                  </span>
                  <span className="font-bold text-slate-800 truncate max-w-[65px] sm:max-w-[90px]">
                    {currentStudent.nickname}
                  </span>
                </button>

                <button
                  onClick={() => logout()}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  title="ログアウト"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ログアウト</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (< 768px) */}
      {isLoggedIn && (
        <nav
          aria-label="モバイルナビゲーション"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
        >
          <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
            <button
              onClick={() => setCurrentTab('home')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'home' || currentTab === 'tests' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">順位・成績</span>
            </button>

            <button
              onClick={() => setCurrentTab('quiz')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'quiz' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">定期テスト</span>
            </button>

            <button
              onClick={() => setCurrentTab('materials')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'materials' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderDown className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">教材共有</span>
            </button>

            <button
              onClick={() => setCurrentTab('forum')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'forum' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">掲示板</span>
            </button>

            <button
              onClick={() => setCurrentTab('mypage')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'mypage' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">マイページ</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
