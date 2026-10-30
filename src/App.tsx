import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ScoreManagementView } from './components/ScoreManagementView';
import { WeeklyQuizView } from './components/WeeklyQuizView';
import { MaterialShareView } from './components/MaterialShareView';
import { ForumView } from './components/ForumView';
import { MyPageView } from './components/MyPageView';
import { EditManagementView } from './components/EditManagementView';
import { LoginView } from './components/LoginView';

const AppContent: React.FC = () => {
  const { currentTab, isLoggedIn } = useApp();

  return (
    <div className="min-h-screen bg-[#c2c3c3] text-slate-800 flex flex-col font-sans">
      {/* Top Bar & Mobile Navigation */}
      <Navbar />

      {/* Main View Area (Protected by Login Gate) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {!isLoggedIn ? (
          <LoginView />
        ) : (
          <>
            {(currentTab === 'home' || currentTab === 'tests') && <ScoreManagementView />}
            {currentTab === 'quiz' && <WeeklyQuizView />}
            {currentTab === 'materials' && <MaterialShareView />}
            {currentTab === 'forum' && <ForumView />}
            {currentTab === 'mypage' && <MyPageView />}
            {currentTab === 'edit' && <EditManagementView />}
          </>
        )}
      </main>

      {/* Clean festival-inspired quiet footer */}
      <footer className="border-t border-slate-400/40 bg-[#c2c3c3]/70 text-slate-600 text-xs py-6 text-center">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-700">いちはちさいと</span>
            <span className="text-[11px] font-bold text-slate-400 tracking-wider">1-8 SITE</span>
            <span aria-hidden="true">·</span>
            <span>1年8組 学習・情報共有ポータル</span>
          </div>
          <div className="text-[11px] text-slate-400">
            まなぶことは、つながること。 · 2026
          </div>
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
