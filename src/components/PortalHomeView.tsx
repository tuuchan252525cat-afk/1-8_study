import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { isStaticDeployment } from '../utils/navigation';
import {
  MapPin,
  Grid,
  FileCheck2,
  Sparkles,
  Bell,
  User,
  FolderDown,
  MessageSquare,
  Edit3,
  Search,
  X,
  Send,
  HelpCircle,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export const PortalHomeView: React.FC = () => {
  const { setCurrentTab, currentStudent } = useApp();

  // AI Q&A Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);

  const handleAskAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || isAskingAi) return;

    setIsAskingAi(true);
    setAiAnswer(null);

    if (isStaticDeployment()) {
      setTimeout(() => {
        const text = aiQuestion.trim();
        const subject = text.includes('英語') ? '英語' : text.includes('国語') ? '国語' : text.includes('化学') ? '化学基礎' : '数学I・A';
        const formatted = `【単元/テーマ】: ${subject} 学習アドバイス\n\n` +
          `【要点解説】:\n` +
          `・ 基本公式の適用条件と定義域を必ず確認し、符号ミスに注意して演習を進めましょう。\n` +
          `・ 過去問の類題を反復練習し、解法手順を自分の言葉で説明できるように定着させましょう。\n` +
          `・ 間違えた問題は専用の解き直しノートにまとめ、週末に再度復習することをおすすめします。\n\n` +
          `【関連キーワード】: 公式確認、反復演習、弱点克服、検算チェック`;
        setAiAnswer(formatted);
        setIsAskingAi(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch('/api/ai/analyze-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textPrompt: `【勉強の質問・学習相談】:\n${aiQuestion.trim()}\n\n高校・中学校の全教科を分かりやすく解説するAI学習アシスタントとして、親切・丁寧・簡潔に疑問に答えてください。`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.analysis && data.analysis.trends) {
          const formatted = `【単元/テーマ】: ${data.analysis.unit || '学習質問'}\n\n` +
            `【要点解説】:\n` +
            data.analysis.trends.map((t: string) => `・ ${t}`).join('\n') +
            `\n\n【関連キーワード】: ${data.analysis.keywords ? data.analysis.keywords.join('、') : ''}`;
          setAiAnswer(formatted);
        } else {
          setAiAnswer('質問への解説が生成されました。質問内容を参考に復習を進めてみましょう！');
        }
      } else {
        setAiAnswer('質問への回答を生成しました。二次関数や英語構文など、具体的な問題文を入力するとさらに詳しく解説できます！');
      }
    } catch (err) {
      setAiAnswer('現在AIアシスタントが混み合っています。少し時間をおいて再度お試しください。');
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Green Header Banner (Modeled on まるごと祭 2026 header in 39203_0_78740368.jpg) */}
      <div className="relative bg-[#1c603a] text-white rounded-3xl overflow-hidden shadow-lg border border-[#185533]">
        <div className="px-6 pt-8 pb-10 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-100 text-xs font-bold mb-3 backdrop-blur-xs">
            <span>1年8組 学習・情報共有ポータル</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>いちはちさいと</span>
            <span className="text-lg font-bold text-amber-300 align-super">2026</span>
          </h1>

          {currentStudent && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/15 px-3.5 py-1.5 rounded-2xl backdrop-blur-xs text-xs font-extrabold text-white">
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-black"
                style={{ backgroundColor: currentStudent.avatarColor }}
              >
                {currentStudent.attendanceNumber}
              </span>
              <span>ログイン中: {currentStudent.nickname}</span>
            </div>
          )}
        </div>

        {/* Wavy/Organic Divider Edge SVG at bottom of banner */}
        <div className="w-full overflow-hidden leading-none z-10 relative -mt-3">
          <svg
            className="relative block w-full h-6 text-[#f0ece1]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,0 C150,90 350,-40 500,45 C650,110 900,10 1200,40 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </div>

      {/* 2. Main Icon-Centered Grid (Modeled on 39203_0_78740368.jpg) */}
      <div className="bg-[#f0ece1] p-4 sm:p-6 rounded-3xl space-y-4 border border-stone-200/80 shadow-xs">
        {/* Row 1: 2-Column Cards (成績・順位 & 定期テスト) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card A: 成績・順位 */}
          <button
            onClick={() => setCurrentTab('home')}
            className="bg-white hover:bg-stone-50 p-6 rounded-3xl border border-stone-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center group cursor-pointer hover:border-emerald-500 hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors mb-1">
              成績・順位
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              クラス総合順位・個人成績レポートを確認する
            </p>
          </button>

          {/* Card B: 小テスト */}
          <button
            onClick={() => setCurrentTab('quiz')}
            className="bg-white hover:bg-stone-50 p-6 rounded-3xl border border-stone-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center group cursor-pointer hover:border-amber-500 hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3 group-hover:scale-110 transition-transform">
              <Grid className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900 group-hover:text-amber-700 transition-colors mb-1">
              小テスト
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              英単語＆ミゾブルー小テスト・AI予想問題を解く
            </p>
          </button>
        </div>

        {/* Row 2: Full Width Wide Card with Dashed Border (定期テスト予想問題一覧) */}
        <button
          onClick={() => setCurrentTab('ai_analyzer')}
          className="w-full bg-white hover:bg-sky-50/50 p-6 sm:p-7 rounded-3xl border border-stone-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center group cursor-pointer hover:border-sky-500 hover:shadow-md relative overflow-hidden"
        >
          {/* Top and Bottom Dashed Accent Lines */}
          <div className="w-full border-t-2 border-dashed border-sky-300 mb-4" />

          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mb-2 group-hover:scale-110 transition-transform">
            <FileCheck2 className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 group-hover:text-sky-700 transition-colors mb-1 flex items-center gap-2">
            <span>定期テスト予想問題一覧</span>
            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 text-xs font-extrabold">
              NEW
            </span>
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-4">
            各教科の出題傾向を分析した定期テスト予想問題の演習 ＆ 新規作成
          </p>

          <div className="w-full border-b-2 border-dashed border-sky-300" />
        </button>

        {/* Row 3: Full Width Wide Card (AIに質問する) */}
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="w-full bg-white hover:bg-rose-50/50 p-6 sm:p-7 rounded-3xl border border-stone-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center group cursor-pointer hover:border-rose-500 hover:shadow-md"
        >
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3 group-hover:scale-110 transition-transform shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 group-hover:text-rose-600 transition-colors mb-1">
            AIに質問する
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            教科やテスト勉強で分からないことをAI講師に即座に質問・相談する
          </p>
        </button>

        {/* Row 4: 2-Column Cards (教材共有 & クラス掲示板) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card E: 教材共有 */}
          <button
            onClick={() => setCurrentTab('materials')}
            className="bg-white hover:bg-stone-50 p-6 rounded-3xl border border-stone-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center group cursor-pointer hover:border-amber-500 hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3 group-hover:scale-110 transition-transform">
              <FolderDown className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900 group-hover:text-amber-700 transition-colors mb-1">
              教材共有
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              問題用紙・実物プリント・プレビュー教材を共有する
            </p>
          </button>

          {/* Card F: クラス掲示板 */}
          <button
            onClick={() => setCurrentTab('forum')}
            className="bg-white hover:bg-stone-50 p-6 rounded-3xl border border-stone-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center group cursor-pointer hover:border-slate-700 hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-3 group-hover:scale-110 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900 group-hover:text-slate-800 transition-colors mb-1">
              クラス掲示板
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              疑問・解説質問スレッド・自習連絡を確認する
            </p>
          </button>
        </div>

        {/* Row 5: 2-Column Cards (マイページ & 設定/問題編集) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card G: マイページ */}
          <button
            onClick={() => setCurrentTab('mypage')}
            className="bg-white hover:bg-stone-50 p-6 rounded-3xl border border-stone-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center group cursor-pointer hover:border-slate-600 hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3 group-hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900 group-hover:text-slate-800 transition-colors mb-1">
              マイページ
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              出席番号・表示名・パスワード・個人の成績状況の確認
            </p>
          </button>

          {/* Card H: 設定・問題編集 */}
          <button
            onClick={() => setCurrentTab('edit')}
            className="bg-white hover:bg-stone-50 p-6 rounded-3xl border border-stone-200/80 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center group cursor-pointer hover:border-rose-500 hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3 group-hover:scale-110 transition-transform">
              <Edit3 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900 group-hover:text-rose-600 transition-colors mb-1">
              設定・問題編集
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              テスト問題や登録教科情報を管理・編集する (/edit)
            </p>
          </button>
        </div>
      </div>

      {/* 3. Modal: AIに質問する */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl space-y-4 my-8 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">AIに質問する</h3>
                  <span className="text-[10px] text-slate-400 font-bold">1年8組 AI学習アシスタント</span>
                </div>
              </div>

              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAskAiSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  分からないこと・勉強の質問内容
                </label>
                <textarea
                  rows={4}
                  placeholder="例: 数学の2次関数の頂点の求め方がわかりません、英語の仮定法過去完了のポイントを教えてください、など..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="w-full text-xs font-medium border border-stone-300 rounded-2xl p-3 bg-stone-50 focus:bg-white focus:outline-none focus:border-slate-900 leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isAskingAi || !aiQuestion.trim()}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isAskingAi ? (
                    <span>AIが回答作成中...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>質問を送信</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Answer Display */}
            {aiAnswer && (
              <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-slate-800 space-y-2 leading-relaxed animate-fadeIn">
                <span className="font-extrabold text-rose-600 block flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  AIアシスタントの回答解説:
                </span>
                <div className="whitespace-pre-wrap font-medium">{aiAnswer}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
