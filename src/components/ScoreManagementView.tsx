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
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-300/80 shadow-md space-y-5">
        {/* Test Selector and Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              表示中のテスト
            </label>
            <div className="flex items-center gap-2">
              <select
                value={activeTestTitle}
                onChange={(e) => setActiveTestTitle(e.target.value)}
                className="text-sm font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                {availableTestTitles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500 font-semibold">
                （記録数: {anonymousRankings.length}件）
              </span>
            </div>
          </div>

          {/* Functional Segmented Control */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setActiveTab('ranks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'ranks'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>総合順位表</span>
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'distribution'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>点数分布グラフ</span>
            </button>
            <button
              onClick={() => setActiveTab('growth')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'growth'
                  ? 'bg-slate-900 text-white shadow-2xs'
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
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1 font-semibold">
              <span className="text-slate-700">総合順位一覧（名前・出席番号は非表示）</span>
              <span>満点: 500点</span>
            </div>

            {anonymousRankings.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <Award className="w-10 h-10 text-slate-400 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    「{activeTestTitle}」の記録がまだありません
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    「点数を入力・変更」ボタンからテスト結果を記録すると、個人順位や分布が反映されます。
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>点数を記録する</span>
                </button>
              </div>
            ) : (
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
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          isMyScore
                            ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300/60 shadow-2xs'
                            : 'bg-slate-50 hover:bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                              item.rank === 1
                                ? 'bg-amber-400 text-amber-950 shadow-2xs'
                                : item.rank === 2
                                ? 'bg-slate-300 text-slate-800'
                                : item.rank === 3
                                ? 'bg-amber-600/30 text-amber-900'
                                : 'bg-white text-slate-600 border border-slate-300'
                            }`}
                          >
                            {item.rank}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-900 tabular-nums">
                                {item.score} <span className="text-xs font-normal text-slate-500">点</span>
                              </span>
                              {isMyScore && (
                                <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                                  あなた
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                              得点率: {Math.round((item.score / 500) * 100)}%
                            </span>
                          </div>
                        </div>

                        {/* Score Bar visualization */}
                        <div className="w-24 sm:w-32 flex flex-col items-end gap-1">
                          <div className="w-full bg-slate-200/90 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isMyScore
                                  ? 'bg-rose-500'
                                  : isTop3
                                  ? 'bg-amber-400'
                                  : 'bg-slate-500'
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
            )}
          </div>
        )}

        {/* Tab 2: Score Distribution (Histogram) */}
        {activeTab === 'distribution' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500 font-medium">
              全体の点数帯ごとの人数分布です。自分がどのゾーンに位置しているか客観的に把握できます。
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
                  <div key={bin.range} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-bold ${
                          isMyBin ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {bin.range} {isMyBin && ' (あなたはこのゾーンです)'}
                      </span>
                      <span className="font-mono text-slate-500 font-bold">{bin.count}人</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMyBin ? 'bg-rose-500' : 'bg-slate-700'
                        }`}
                        style={{ width: `${Math.max(percent, 2)}%` }}
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
            <div className="text-xs text-slate-500 mb-3 font-semibold">
              前回テストと比較した全体の得点アップ（伸び率）ランキングです。
            </div>

            {anonymousGrowthRankings.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-sm font-bold text-slate-700">成長度データは集計中です</p>
                <p className="text-xs text-slate-500">2回以上のテスト結果が記録されると自動で伸び率が計算されます。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {anonymousGrowthRankings.map((item, idx) => (
                  <div
                    key={`growth-${idx}`}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                        {item.rank}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {item.delta > 0 ? `+${item.delta}` : item.delta} 点アップ
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">前回の結果と比較</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Score Input Modal */}
      <ScoreInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
