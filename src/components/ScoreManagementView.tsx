import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PersonalStandingCard } from './PersonalStandingCard';
import { ScoreInputModal } from './ScoreInputModal';
import { BarChart3, TrendingUp, ListOrdered, Plus, Award } from 'lucide-react';

export const ScoreManagementView: React.FC = () => {
  const {
    availableTestTitles,
    activeTestTitle,
    setActiveTestTitle,
    anonymousRankings,
    anonymousGrowthRankings,
    scoreDistribution,
    personalStanding,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ranks' | 'distribution' | 'growth'>('ranks');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* 1. Private Personal Standing Card */}
      <PersonalStandingCard onOpenScoreInput={() => setIsModalOpen(true)} />

      {/* 2. Main Rankings & Analytics Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
        {/* Test Selector and Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div>
            <span className="block text-[11px] font-black text-stone-400 uppercase tracking-wider mb-1">
              TARGET TEST
            </span>
            <div className="flex items-center gap-2">
              <select
                value={activeTestTitle}
                onChange={(e) => setActiveTestTitle(e.target.value)}
                className="text-sm font-black text-slate-900 bg-[#fdfbf7] border border-stone-300 rounded-2xl py-2 px-3.5 focus:outline-none focus:border-[#1c603a] cursor-pointer shadow-2xs"
              >
                {availableTestTitles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="text-xs text-stone-500 font-bold bg-stone-100 px-2.5 py-1 rounded-xl">
                {anonymousRankings.length}件の記録
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-stone-300 hover:border-[#1c603a] text-slate-900 hover:text-[#1c603a] text-xs font-black transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#1c603a]" />
            <span>点数を記録・追加</span>
          </button>
        </div>

        {/* DAY 1 / DAY 2 Inspired Segmented Tabs (Modeled on 39204_0_b6de3a0e.jpg) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('ranks')}
            className={`py-3 px-2 sm:px-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${
              activeTab === 'ranks'
                ? 'border-[#1c603a] bg-[#1c603a] text-white shadow-xs'
                : 'border-stone-200 bg-white hover:bg-stone-50 text-slate-700'
            }`}
          >
            <span className="block text-[10px] font-black tracking-wider uppercase opacity-80">
              TAB 1
            </span>
            <span className="block text-xs sm:text-sm font-black mt-0.5 truncate">
              総合順位表
            </span>
          </button>

          <button
            onClick={() => setActiveTab('distribution')}
            className={`py-3 px-2 sm:px-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${
              activeTab === 'distribution'
                ? 'border-[#1c603a] bg-[#1c603a] text-white shadow-xs'
                : 'border-stone-200 bg-white hover:bg-stone-50 text-slate-700'
            }`}
          >
            <span className="block text-[10px] font-black tracking-wider uppercase opacity-80">
              TAB 2
            </span>
            <span className="block text-xs sm:text-sm font-black mt-0.5 truncate">
              得点分布グラフ
            </span>
          </button>

          <button
            onClick={() => setActiveTab('growth')}
            className={`py-3 px-2 sm:px-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${
              activeTab === 'growth'
                ? 'border-[#1c603a] bg-[#1c603a] text-white shadow-xs'
                : 'border-stone-200 bg-white hover:bg-stone-50 text-slate-700'
            }`}
          >
            <span className="block text-[10px] font-black tracking-wider uppercase opacity-80">
              TAB 3
            </span>
            <span className="block text-xs sm:text-sm font-black mt-0.5 truncate">
              成長度ランキング
            </span>
          </button>
        </div>

        {/* Tab 1: Anonymous Rankings List (Modeled on 39204_0_b6de3a0e.jpg Cards) */}
        {activeTab === 'ranks' && (
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 mb-3 px-1 font-bold">
              <span className="text-slate-800 flex items-center gap-1">
                <span>◎ 匿名順位一覧（氏名・出席番号は完全非公開）</span>
              </span>
              <span className="text-stone-400">1〜{anonymousRankings.length}位</span>
            </div>

            {anonymousRankings.length === 0 ? (
              <div className="p-8 text-center bg-[#fdfbf7] rounded-3xl border border-stone-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">
                    「{activeTestTitle}」の記録がまだありません
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    「点数を記録・追加」ボタンからテスト結果を保存すると、全体の順位表が生成されます。
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2.5 bg-[#1c603a] hover:bg-[#154a2c] text-white font-black text-xs rounded-2xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>点数を記録する</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(() => {
                  let userRankShown = false;
                  return anonymousRankings.map((item, index) => {
                    const isMatch =
                      personalStanding.totalScore > 0 &&
                      personalStanding.rank === item.rank &&
                      personalStanding.totalScore === item.score;
                    const isMyScore = isMatch && !userRankShown;
                    if (isMyScore) userRankShown = true;

                    const isTop3 = item.rank <= 3;

                    return (
                      <div
                        key={`rank-${index}-${item.score}`}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                          isMyScore
                            ? 'bg-[#f4f8f5] border-[#1c603a] ring-2 ring-[#1c603a]/20 shadow-xs'
                            : 'bg-white hover:bg-[#fdfbf7] border-stone-200/90 shadow-2xs'
                        }`}
                      >
                        {/* Left Icon Badge (Marugotosai circle badge) */}
                        <div
                          className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                            item.rank === 1
                              ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                              : item.rank === 2
                              ? 'bg-stone-300 text-slate-800'
                              : item.rank === 3
                              ? 'bg-amber-700/20 text-amber-900 border border-amber-600/30'
                              : 'bg-stone-100 text-slate-700 border border-stone-200'
                          }`}
                        >
                          <span className="text-[9px] leading-none opacity-80">RANK</span>
                          <span className="text-sm font-black leading-none mt-0.5">{item.rank}</span>
                        </div>

                        {/* Middle Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-black text-stone-400 uppercase tracking-tight">
                            TOTAL SCORE
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                              {item.score} <span className="text-xs font-bold text-stone-500">点</span>
                            </span>
                            {isMyScore && (
                              <span className="text-[10px] font-black text-white bg-[#1c603a] px-2 py-0.5 rounded-full">
                                あなた
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 font-bold mt-0.5 flex items-center gap-1">
                            <span>◎ 1年8組</span>
                            <span aria-hidden="true">·</span>
                            <span>得点率 {Math.round((item.score / 500) * 100)}%</span>
                          </div>
                        </div>

                        {/* Score Bar visualization */}
                        <div className="w-20 sm:w-28 flex flex-col items-end gap-1 shrink-0">
                          <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-stone-200">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isMyScore
                                  ? 'bg-[#1c603a]'
                                  : isTop3
                                  ? 'bg-amber-400'
                                  : 'bg-slate-700'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, (item.score / 500) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Score Distribution (Histogram) */}
        {activeTab === 'distribution' && (
          <div className="space-y-4">
            <div className="text-xs text-stone-600 font-bold bg-[#fdfbf7] p-3 rounded-2xl border border-stone-200/80">
              ◎ 全体の点数帯ごとの人数分布です。自分がどのゾーンに位置しているか客観的に把握できます。
            </div>

            <div className="space-y-3 pt-2">
              {scoreDistribution.map((bin) => {
                const maxCount = Math.max(...scoreDistribution.map((b) => b.count), 1);
                const percent = (bin.count / maxCount) * 100;
                const isMyBin =
                  personalStanding.totalScore > 0 &&
                  personalStanding.totalScore >= bin.min &&
                  personalStanding.totalScore <= bin.max;

                return (
                  <div
                    key={bin.range}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isMyBin
                        ? 'bg-[#f4f8f5] border-[#1c603a] ring-2 ring-[#1c603a]/20'
                        : 'bg-[#fdfbf7] border-stone-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span
                        className={`font-black ${
                          isMyBin ? 'text-[#1c603a]' : 'text-slate-800'
                        }`}
                      >
                        {bin.range} {isMyBin && ' (◎ あなたの得点帯)'}
                      </span>
                      <span className="font-mono text-slate-800 font-black text-sm">{bin.count}人</span>
                    </div>
                    <div className="w-full bg-stone-200/80 h-3.5 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMyBin ? 'bg-[#1c603a]' : 'bg-slate-700'
                        }`}
                        style={{ width: `${Math.max(percent, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Growth Rankings */}
        {activeTab === 'growth' && (
          <div>
            <div className="text-xs text-stone-600 font-bold bg-[#fdfbf7] p-3 rounded-2xl border border-stone-200/80 mb-3">
              ◎ 前回テストと比較した全体の得点アップ（伸び率）ランキングです。
            </div>

            {anonymousGrowthRankings.length === 0 ? (
              <div className="p-8 text-center bg-[#fdfbf7] rounded-3xl border border-stone-200 space-y-2">
                <p className="text-sm font-black text-slate-800">成長度データは集計中です</p>
                <p className="text-xs text-stone-500">2回以上のテスト結果が記録されると自動で伸び率が計算されます。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {anonymousGrowthRankings.map((item, index) => {
                  const isMyGrowth =
                    personalStanding.growthRank !== null &&
                    personalStanding.growthRank === item.rank &&
                    personalStanding.growthDelta === item.delta;

                  return (
                    <div
                      key={`growth-${index}`}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        isMyGrowth
                          ? 'bg-[#f4f8f5] border-[#1c603a] ring-2 ring-[#1c603a]/20 shadow-xs'
                          : 'bg-white hover:bg-[#fdfbf7] border-stone-200/90 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center font-black text-xs shrink-0 ${
                            item.rank === 1
                              ? 'bg-emerald-500 text-white shadow-2xs'
                              : 'bg-stone-100 text-slate-700 border border-stone-200'
                          }`}
                        >
                          <span className="text-[9px] leading-none opacity-80">UP</span>
                          <span className="text-xs font-black leading-none mt-0.5">{item.rank}位</span>
                        </div>

                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-[#1c603a] tabular-nums">
                              +{item.delta}
                            </span>
                            <span className="text-xs font-bold text-stone-500">点アップ</span>
                            {isMyGrowth && (
                              <span className="text-[10px] font-black text-white bg-[#1c603a] px-2 py-0.5 rounded-full ml-1">
                                あなた
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-stone-500 font-bold block mt-0.5">
                            ◎ 前回模試からの向上スコア
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Score Input Modal */}
      {isModalOpen && <ScoreInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};
