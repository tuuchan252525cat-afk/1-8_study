import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { PortalHomeView } from './components/PortalHomeView';
import { ScoreManagementView } from './components/ScoreManagementView';
import { WeeklyQuizView } from './components/WeeklyQuizView';
import { MaterialShareView } from './components/MaterialShareView';
import { ForumView } from './components/ForumView';
import { MyPageView } from './components/MyPageView';
import { EditManagementView } from './components/EditManagementView';
import { AiTestAnalyzerView } from './components/AiTestAnalyzerView';
import { LoginView } from './components/LoginView';
import { SubViewHeader, ReturnToHomeButton } from './components/SubViewHeader';

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
            {/* Main Portal View (Modeled on 39203_0_78740368.jpg) */}
            {currentTab === 'portal' && <PortalHomeView />}

            {/* Sub-Views with SubHeader & Return to Home Button (Modeled on 39204_0_b6de3a0e.jpg) */}
            {(currentTab === 'home' || currentTab === 'scores' || currentTab === 'tests') && (
              <>
                <SubViewHeader title="成績・順位" subtitle="総合順位表" />
                <ScoreManagementView />
                <ReturnToHomeButton />
              </>
            )}

            {currentTab === 'quiz' && (
              <>
                <SubViewHeader title="定期テスト" subtitle="小テスト演習" />
                <WeeklyQuizView />
                <ReturnToHomeButton />
              </>
            )}

            {currentTab === 'ai_analyzer' && (
              <>
                <SubViewHeader title="AI傾向分析 ＆ 予想問題" subtitle="AI過去問解析" />
                <AiTestAnalyzerView />
                <ReturnToHomeButton />
              </>
            )}

            {currentTab === 'materials' && (
              <>
                <SubViewHeader title="教材共有" subtitle="問題用紙ビューア" />
                <MaterialShareView />
                <ReturnToHomeButton />
              </>
            )}

            {currentTab === 'forum' && (
              <>
                <SubViewHeader title="クラス掲示板" subtitle="質問スレッド" />
                <ForumView />
                <ReturnToHomeButton />
              </>
            )}

            {currentTab === 'mypage' && (
              <>
                <SubViewHeader title="マイページ" subtitle="アカウント情報" />
                <MyPageView />
                <ReturnToHomeButton />
              </>
            )}

            {currentTab === 'edit' && (
              <>
                <SubViewHeader title="設定・問題編集" subtitle="問題＆教科管理" />
                <EditManagementView />
                <ReturnToHomeButton />
              </>
            )}
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
