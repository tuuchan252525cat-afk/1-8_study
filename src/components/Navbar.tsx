import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart2, BookOpen, FolderDown, MessageSquare, User, Edit3, LogOut, Sparkles, ChevronLeft } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentTab, setCurrentTab, currentStudent, logout, isLoggedIn } = useApp();

  const getPageTitle = () => {
    switch (currentTab) {
      case 'home':
      case 'scores':
      case 'tests':
        return '成績・順位';
      case 'quiz':
        return '定期テスト';
      case 'ai_analyzer':
        return 'AI傾向分析';
      case 'materials':
        return '教材共有';
      case 'forum':
        return 'クラス掲示板';
      case 'mypage':
        return 'マイページ';
      case 'edit':
        return '問題編集 (/edit)';
      default:
        return 'ポータル';
    }
  };

  return (
    <>
      {/* Top Bar for Desktop & Tablet */}
      <header className="sticky top-0 z-30 bg-[#c2c3c3]/95 backdrop-blur-md border-b border-slate-400/50 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 bg-[#c2c3c3]">
          {/* Zone 1: Back Button & Page Title (Topmost Element) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {currentTab !== 'portal' ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setCurrentTab('portal')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-slate-800 text-xs sm:text-sm font-black transition-all cursor-pointer border border-stone-300 shadow-2xs shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>戻る</span>
                </button>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {getPageTitle()}
                </h1>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#1c603a] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                  1-8
                </div>
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900">
                  ポータル
                </span>
              </div>
            )}
          </div>

          {/* Zone 2: Navigation Links */}
          {isLoggedIn && (
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-xs sm:text-sm font-semibold text-slate-600">
              <button
                onClick={() => setCurrentTab('portal')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'portal'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ポータル
              </button>

              <button
                onClick={() => setCurrentTab('home')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'home' || currentTab === 'tests' || currentTab === 'scores'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                成績・順位
              </button>

              <button
                onClick={() => setCurrentTab('quiz')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'quiz'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                定期テスト
              </button>

              <button
                onClick={() => setCurrentTab('ai_analyzer')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 ${
                  currentTab === 'ai_analyzer'
                    ? 'bg-slate-900 text-amber-400 font-bold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-slate-100 text-slate-800 font-bold'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI傾向分析</span>
              </button>

              <button
                onClick={() => setCurrentTab('materials')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'materials'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                教材共有
              </button>

              <button
                onClick={() => setCurrentTab('forum')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'forum'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                掲示板
              </button>

              <button
                onClick={() => setCurrentTab('mypage')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'mypage'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                マイページ
              </button>

              <button
                onClick={() => setCurrentTab('edit')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 border border-slate-200 ${
                  currentTab === 'edit'
                    ? 'bg-rose-600 text-white font-bold border-rose-600 shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700'
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 text-xs text-slate-700 transition-colors cursor-pointer"
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
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
        >
          <div className="grid grid-cols-7 items-center h-16 max-w-lg mx-auto px-1">
            <button
              onClick={() => setCurrentTab('portal')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'portal' ? 'text-[#1c603a] font-black' : 'text-stone-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-full ${currentTab === 'portal' ? 'bg-[#1c603a]/10' : ''}`}>
                <span className="text-sm">🏠</span>
              </div>
              <span className="text-[8px] font-black mt-0.5">ポータル</span>
            </button>

            <button
              onClick={() => setCurrentTab('home')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'home' || currentTab === 'tests' || currentTab === 'scores' ? 'text-[#1c603a] font-black' : 'text-stone-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="w-4 h-4 mb-0.5" />
              <span className="text-[8px] font-bold">順位成績</span>
            </button>

            <button
              onClick={() => setCurrentTab('quiz')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'quiz' ? 'text-[#1c603a] font-black' : 'text-stone-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4 mb-0.5" />
              <span className="text-[8px] font-bold">定期テスト</span>
            </button>

            <button
              onClick={() => setCurrentTab('ai_analyzer')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'ai_analyzer' ? 'text-[#1c603a] font-black' : 'text-stone-600 hover:text-slate-900 font-bold'
              }`}
            >
              <Sparkles className="w-4 h-4 mb-0.5 text-amber-500" />
              <span className="text-[8px] font-bold">AI分析</span>
            </button>

            <button
              onClick={() => setCurrentTab('materials')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'materials' ? 'text-[#1c603a] font-black' : 'text-stone-500 hover:text-slate-800'
              }`}
            >
              <FolderDown className="w-4 h-4 mb-0.5" />
              <span className="text-[8px] font-bold">教材共有</span>
            </button>

            <button
              onClick={() => setCurrentTab('forum')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'forum' ? 'text-[#1c603a] font-black' : 'text-stone-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 mb-0.5" />
              <span className="text-[8px] font-bold">掲示板</span>
            </button>

            <button
              onClick={() => setCurrentTab('mypage')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                currentTab === 'mypage' ? 'text-[#1c603a] font-black' : 'text-stone-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4 mb-0.5" />
              <span className="text-[8px] font-bold">マイページ</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
