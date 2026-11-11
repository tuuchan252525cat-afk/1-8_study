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

  // Unified Menu Bar Items (Identical on both PC and smartphone)
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
      key: 'materials' as const,
      label: '教材共有',
      icon: FolderDown,
      isActive: currentTab === 'materials',
      onClick: () => setCurrentTab('materials'),
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
      {/* Top Header (Unified between PC & Smartphone) */}
      <header className="sticky top-0 z-30 bg-[#c2c3c3]/95 backdrop-blur-md border-b border-slate-400/50 shadow-2xs">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 bg-[#c2c3c3]">
          {/* Zone 1: Back Button & Page Title */}
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

          {/* Zone 2: User Status & Problem Edit Action */}
          <div className="flex items-center gap-2 shrink-0">
            {isLoggedIn && currentStudent ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setCurrentTab('edit')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-xs font-black border ${
                    currentTab === 'edit'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-white hover:bg-stone-100 text-slate-700 border-stone-300 shadow-2xs'
                  }`}
                  title="問題・テストの編集 (/edit)"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">問題編集</span>
                </button>

                <button
                  onClick={() => setCurrentTab('mypage')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-xs text-slate-800 transition-colors cursor-pointer shadow-2xs"
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

      {/* Unified Sleek Bottom Menu Bar (Both PC & Smartphone) */}
      {/* Modeled on the clean smartphone menu bar: icon squircle container + label underneath */}
      {isLoggedIn && (
        <nav
          aria-label="メインメニューバー"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]"
        >
          <div className="max-w-2xl mx-auto flex items-center justify-around h-[70px] sm:h-[74px] px-1 sm:px-4 pb-safe">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={item.onClick}
                  className="flex-1 flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-all duration-200 cursor-pointer group"
                >
                  {/* Squircle container: active item has the clean deep green container */}
                  <div
                    className={`w-10 h-8 sm:w-12 sm:h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                      item.isActive
                        ? 'bg-[#1c603a] text-white shadow-xs'
                        : 'text-stone-400 group-hover:text-slate-800 group-hover:bg-stone-100/70'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform duration-200 ${
                        item.isActive ? 'scale-105' : ''
                      }`}
                    />
                  </div>

                  {/* Clean text label below */}
                  <span
                    className={`text-[9.5px] sm:text-[11px] mt-1 tracking-tight transition-colors duration-200 ${
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
