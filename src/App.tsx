import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ScoreManagementView } from './components/ScoreManagementView';
import { WeeklyQuizView } from './components/WeeklyQuizView';
import { MaterialShareView } from './components/MaterialShareView';
import { ForumView } from './components/ForumView';
import { MyPageView } from './components/MyPageView';
import { EditManagementView } from './components/EditManagementView';

const AppContent: React.FC = () => {
  const { currentTab } = useApp();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 flex flex-col">
      {/* Top Bar & Mobile Navigation */}
      <Navbar />

      {/* Main View Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {(currentTab === 'home' || currentTab === 'tests') && <ScoreManagementView />}
        {currentTab === 'quiz' && <WeeklyQuizView />}
        {currentTab === 'materials' && <MaterialShareView />}
        {currentTab === 'forum' && <ForumView />}
        {currentTab === 'mypage' && <MyPageView />}
        {currentTab === 'edit' && <EditManagementView />}
      </main>

      {/* Clean, quiet footer */}
      <footer className="border-t border-slate-200/60 bg-white/50 text-slate-400 text-xs py-6 text-center">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">ClassHub 3-B</span>
            <span aria-hidden="true">·</span>
            <span>クラス専用学習・情報共有システム</span>
          </div>
          <p className="text-[11px] text-slate-400">
            出席番号1〜40番対応 · 本名不使用 · 全体順位表個人特定完全ゼロ保証
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
