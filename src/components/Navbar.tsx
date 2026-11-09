import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart2,
  BookOpen,
  FolderDown,
  MessageSquare,
  User,
  Edit3,
  LogOut,
  ChevronLeft,
  Home,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentTab, setCurrentTab, currentStudent, logout, isLoggedIn } = useApp();

  const getPageTitle = () => {
    switch (currentTab) {
      case 'home':
      case 'scores':
      case 'tests':
        return '成績・順位';
      case 'quiz':
        return '小テスト';
      case 'ai_analyzer':
      case 'periodic_predicted':
        return '定期テスト予想問題一覧';
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

  // Sleek Bottom Menu Bar items (Structure modeled on reference layout with clean white/light styling)
  const navItems = [
    {
      key: 'portal' as const,
      label: 'ホーム',
      icon: Home,
      isActive: currentTab === 'portal',
      onClick: () => setCurrentTab('portal'),
    },
    {
      key: 'scores' as const,
      label: '成績',
      icon: BarChart2,
      isActive: currentTab === 'home' || currentTab === 'scores' || currentTab === 'tests',
      onClick: () => setCurrentTab('home'),
    },
    {
      key: 'quiz' as const,
      label: '小テスト',
      icon: BookOpen,
      isActive: currentTab === 'quiz',
      onClick: () => setCurrentTab('quiz'),
    },
    {
      key: 'ai_analyzer' as const,
      label: '予想問題',
      icon: PlusCircle,
      isActive: currentTab === 'ai_analyzer' || (currentTab as string) === 'periodic_predicted',
      onClick: () => setCurrentTab('ai_analyzer'),
    },
    {
      key: 'forum' as const,
      label: '掲示板',
      icon: MessageSquare,
      isActive: currentTab === 'forum',
      onClick: () => setCurrentTab('forum'),
    },
    {
      key: 'mypage' as const,
      label: 'マイページ',
      icon: User,
      isActive: currentTab === 'mypage',
      onClick: () => setCurrentTab('mypage'),
    },
  ];

  return (
    <>
      {/* Top Bar for Desktop & Tablet (White / Light theme matching portal) */}
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

          {/* Zone 2: Navigation Links for Desktop */}
          {isLoggedIn && (
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-xs sm:text-sm font-semibold text-slate-700">
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
                小テスト
              </button>

              <button
                onClick={() => setCurrentTab('ai_analyzer')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'ai_analyzer' || (currentTab as string) === 'periodic_predicted'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>定期テスト予想問題</span>
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
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 border border-slate-300 ${
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300/80 text-xs text-slate-800 transition-colors cursor-pointer shadow-2xs"
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
                  className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
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

      {/* Sleek White-Based Menu Bar (< 768px Mobile & Floating Quick Navigation) */}
      {/* Retains the clean, spacious, uncluttered squircle layout from the reference image in a white/light theme */}
      {isLoggedIn && (
        <nav
          aria-label="メインメニューバー"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden"
        >
          <div className="max-w-xl mx-auto flex items-center justify-around h-[70px] px-2 pb-safe">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={item.onClick}
                  className="flex-1 flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-all duration-200 cursor-pointer group"
                >
                  {/* Squircle container: active item has the clean soft-tinted rounded square container */}
                  <div
                    className={`w-11 h-10 sm:w-12 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                      item.isActive
                        ? 'bg-[#1c603a] text-white shadow-xs'
                        : 'text-stone-400 group-hover:text-slate-800 group-hover:bg-stone-100/60'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                        item.isActive ? 'scale-105' : ''
                      }`}
                    />
                  </div>

                  {/* Clean text label below */}
                  <span
                    className={`text-[10px] sm:text-[11px] mt-1 tracking-tight transition-colors duration-200 ${
                      item.isActive
                        ? 'text-[#1c603a] font-black'
                        : 'text-stone-500 font-bold group-hover:text-slate-800'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};
