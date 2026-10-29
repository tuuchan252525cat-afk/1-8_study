import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PersonalStandingCard } from './PersonalStandingCard';
import { ScoreInputModal } from './ScoreInputModal';
import { ShieldCheck, BarChart3, TrendingUp, ListOrdered, Award, Info, Lock } from 'lucide-react';

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
      {/* 1. Private Personal Standing Card (Shown only to current logged in student) */}
      <PersonalStandingCard onOpenScoreInput={() => setIsModalOpen(true)} />

      {/* 2. Main Rankings & Analytics Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
        {/* Test Selector and Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              表示中のテスト
            </label>
            <div className="flex items-center gap-2">
              <select
                value={activeTestTitle}
                onChange={(e) => setActiveTestTitle(e.target.value)}
                className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {availableTestTitles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-400">
                （受験者: {anonymousRankings.length}名）
              </span>
            </div>
          </div>

          {/* Functional Segmented Control for Views (Button tabs) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('ranks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'ranks'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>総合順位表</span>
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'distribution'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>点数分布グラフ</span>
            </button>
            <button
              onClick={() => setActiveTab('growth')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'growth'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>成長度ランキング</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Anonymous Rankings List */}
        {activeTab === 'ranks' && (
          <div className="pt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-2">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>順位と点数のみの匿名リスト（名前・出席番号は完全非表示）</span>
              </span>
              <span>満点: 500点</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
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
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isMyScore
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300/60'
                          : 'bg-slate-50/60 hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          item.rank === 1
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : item.rank === 2
                            ? 'bg-slate-300 text-slate-800'
                            : item.rank === 3
                            ? 'bg-amber-600/30 text-amber-900'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.rank}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800 tabular-nums">
                            {item.score} <span className="text-xs font-normal text-slate-500">点</span>
                          </span>
                          {isMyScore && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                              あなた
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          得点率: {Math.round((item.score / 500) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Score Bar visualization */}
                    <div className="w-24 sm:w-32 flex flex-col items-end gap-1">
                      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMyScore
                              ? 'bg-emerald-500'
                              : isTop3
                              ? 'bg-amber-400'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${(item.score / 500) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
                });
              })()}
            </div>
          </div>
        )}

        {/* Tab 2: Score Distribution (Histogram) */}
        {activeTab === 'distribution' && (
          <div className="pt-4 space-y-4">
            <div className="text-xs text-slate-500 px-1">
              全体の点数帯ごとの人数分布です。自分がどのゾーンに位置しているか客観的に把握できます。
            </div>

            <div className="space-y-3">
              {scoreDistribution.map((bin) => {
                const isUserInBin =
                  personalStanding.totalScore >= bin.min &&
                  personalStanding.totalScore <= bin.max;

                return (
                  <div
                    key={bin.range}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isUserInBin
                        ? 'bg-emerald-50/60 border-emerald-200 ring-1 ring-emerald-200'
                        : 'bg-slate-50/50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{bin.range}</span>
                        {isUserInBin && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            あなたの得点帯
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 font-medium">
                        <span className="text-slate-800 font-bold tabular-nums">{bin.count}</span> 名
                        <span className="text-slate-400 ml-1.5 tabular-nums">({bin.percentage}%)</span>
                      </div>
                    </div>

                    {/* Distribution Bar */}
                    <div className="w-full bg-slate-200/60 h-3.5 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isUserInBin ? 'bg-emerald-500' : 'bg-teal-400/80'
                        }`}
                        style={{ width: `${Math.max(4, bin.percentage * 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span>クラス平均点: </span>
                <span className="font-bold text-slate-800 tabular-nums">
                  {personalStanding.classAverage}点
                </span>
              </div>
              <div>
                <span>最高点: </span>
                <span className="font-bold text-slate-800 tabular-nums">
                  {personalStanding.classMax}点
                </span>
              </div>
              <div>
                <span>総受験者数: </span>
                <span className="font-bold text-slate-800 tabular-nums">
                  {personalStanding.totalParticipants}名
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Growth Rankings (上がり幅ランキング) */}
        {activeTab === 'growth' && (
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>前回模試（6月）からの得点アップ幅ランキング</span>
              <span className="text-emerald-700 font-medium">成長努力をたたえ合う匿名順位</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {anonymousGrowthRankings.map((item, index) => {
                const isMyGrowth =
                  personalStanding.growthDelta !== undefined &&
                  personalStanding.growthRank === item.rank &&
                  personalStanding.growthDelta === item.delta;

                return (
                  <div
                    key={`growth-${index}-${item.delta}`}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isMyGrowth
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300/60'
                        : 'bg-slate-50/50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          item.rank === 1
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : item.rank === 2
                            ? 'bg-slate-300 text-slate-800'
                            : item.rank === 3
                            ? 'bg-amber-600/30 text-amber-900'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.rank}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold tabular-nums ${
                              item.delta > 0 ? 'text-emerald-600' : 'text-slate-600'
                            }`}
                          >
                            {item.delta > 0 ? `+${item.delta}` : item.delta} 点
                          </span>
                          {isMyGrowth && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                              あなた
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">前回比の向上幅</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-medium">
                        {item.delta >= 20 ? '大幅UP!' : item.delta > 0 ? '着実UP' : '維持'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ScoreInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
