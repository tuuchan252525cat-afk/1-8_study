import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PersonalStandingCard } from './PersonalStandingCard';
import { ScoreInputModal } from './ScoreInputModal';
import { PUBLIC_TOP_LIMIT } from '../utils/privacyRankings';
import { Plus, Award, Trophy, ShieldCheck } from 'lucide-react';

export const ScoreManagementView: React.FC = () => {
  const {
    availableTestTitles,
    activeTestTitle,
    setActiveTestTitle,
    anonymousRankings,
    anonymousGrowthRankings,
    topScoreSummary,
    personalStanding,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ranks' | 'comparison' | 'growth'>('ranks');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Defensive UI-level guard: never render rank > PUBLIC_TOP_LIMIT in DOM
  const visibleTopRankings = anonymousRankings
    .filter((item) => item.rank >= 1 && item.rank <= PUBLIC_TOP_LIMIT)
    .slice(0, PUBLIC_TOP_LIMIT);

  const visibleTopGrowthRankings = anonymousGrowthRankings
    .filter((item) => item.rank >= 1 && item.rank <= PUBLIC_TOP_LIMIT)
    .slice(0, PUBLIC_TOP_LIMIT);

  const totalRecordCount = Math.max(personalStanding.totalParticipants, visibleTopRankings.length);

  return (
    <div className="space-y-6">
      {/* 1. Private Personal Standing Card (Visible ONLY to Logged-in User) */}
      <PersonalStandingCard onOpenScoreInput={() => setIsModalOpen(true)} />

      {/* 2. Main TOP-N Public Rankings & Summary Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
        {/* Test Selector and Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div>
            <span className="block text-[11px] font-black text-stone-400 uppercase tracking-wider mb-1">
              TARGET TEST
            </span>
            <div className="flex items-center gap-2 flex-wrap">
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
              <span className="text-xs text-stone-500 font-bold bg-stone-100 px-2.5 py-1 rounded-xl tabular-nums">
                {totalRecordCount}件の記録
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

        {/* Segmented Tabs */}
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
            onClick={() => setActiveTab('comparison')}
            className={`py-3 px-2 sm:px-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${
              activeTab === 'comparison'
                ? 'border-[#1c603a] bg-[#1c603a] text-white shadow-xs'
                : 'border-stone-200 bg-white hover:bg-stone-50 text-slate-700'
            }`}
          >
            <span className="block text-[10px] font-black tracking-wider uppercase opacity-80">
              TAB 2
            </span>
            <span className="block text-xs sm:text-sm font-black mt-0.5 truncate">
              上位スコア比較
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

        {/* Tab 1: Anonymous TOP-N Rankings List */}
        {activeTab === 'ranks' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 mb-3 px-1 font-bold">
              <span className="text-slate-800 flex items-center gap-1">
                <span>◎ 匿名順位一覧（氏名・出席番号は完全非公開）</span>
              </span>
              <span className="text-[#1c603a] bg-[#f4f8f5] border border-[#1c603a]/20 px-2.5 py-0.5 rounded-lg font-black">
                上位{PUBLIC_TOP_LIMIT}名限定公開（TOP {PUBLIC_TOP_LIMIT}）
              </span>
            </div>

            {visibleTopRankings.length === 0 ? (
              <div className="p-8 text-center bg-[#fdfbf7] rounded-3xl border border-stone-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">
                    「{activeTestTitle}」の記録がまだありません
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    「点数を記録・追加」ボタンからテスト結果を保存すると、成績上位者のランキングが公開されます。
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
                  return visibleTopRankings.map((item, index) => {
                    const itemMax = item.maxScore && item.maxScore > 0 ? item.maxScore : 500;
                    const itemRate =
                      item.scoreRate !== undefined
                        ? item.scoreRate
                        : Math.round((item.score / itemMax) * 1000) / 10;

                    const isMatch =
                      personalStanding.rank > 0 &&
                      personalStanding.rank <= PUBLIC_TOP_LIMIT &&
                      personalStanding.rank === item.rank &&
                      personalStanding.totalScore === item.score &&
                      (!personalStanding.totalMaxScore ||
                        !item.maxScore ||
                        personalStanding.totalMaxScore === item.maxScore);
                    const isMyScore = isMatch && !userRankShown;
                    if (isMyScore) userRankShown = true;

                    const isTop3 = item.rank <= 3;

                    return (
                      <div
                        key={`rank-${index}-${item.score}-${itemMax}`}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                          isMyScore
                            ? 'bg-[#f4f8f5] border-[#1c603a] ring-2 ring-[#1c603a]/20 shadow-xs'
                            : 'bg-white hover:bg-[#fdfbf7] border-stone-200/90 shadow-2xs'
                        }`}
                      >
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

                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-black text-stone-400 uppercase tracking-tight">
                            TOTAL SCORE
                          </div>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                              {item.score}{' '}
                              <span className="text-xs font-bold text-stone-500">
                                / {itemMax}点
                              </span>
                            </span>
                            {isMyScore && (
                              <span className="text-[10px] font-black text-white bg-[#1c603a] px-2 py-0.5 rounded-md">
                                あなた
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 font-bold mt-0.5 flex items-center gap-1">
                            <span>◎ 1年8組</span>
                            <span aria-hidden="true">·</span>
                            <span>得点率 {itemRate}%</span>
                          </div>
                        </div>

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
                              style={{ width: `${Math.min(100, Math.max(5, itemRate))}%` }}
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

        {/* Tab 2: Top Scorers Comparison & Average Summary (No lower-tier distribution) */}
        {activeTab === 'comparison' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 font-bold bg-[#fdfbf7] p-3.5 rounded-2xl border border-stone-200/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1c603a] shrink-0" />
                <span>
                  ◎ プライバシー保護のため、上位者（TOP {PUBLIC_TOP_LIMIT}）のみのスコア比較と平均点サマリーを表示しています。
                </span>
              </div>
              <span className="text-[#1c603a] bg-[#f4f8f5] border border-[#1c603a]/20 px-2 py-0.5 rounded-lg font-black text-[11px]">
                上位{PUBLIC_TOP_LIMIT}名限定公開（TOP {PUBLIC_TOP_LIMIT}）
              </span>
            </div>

            {!topScoreSummary || visibleTopRankings.length === 0 ? (
              <div className="p-8 text-center bg-[#fdfbf7] rounded-3xl border border-stone-200 space-y-2">
                <div className="w-11 h-11 rounded-full bg-emerald-50 text-[#1c603a] flex items-center justify-center mx-auto">
                  <Trophy className="w-5 h-5" />
                </div>
                <p className="text-sm font-black text-slate-800">
                  「{activeTestTitle}」の上位スコアデータがまだありません
                </p>
                <p className="text-xs text-stone-500">
                  点数を記録すると、成績上位者（TOP {PUBLIC_TOP_LIMIT}）の平均点サマリーと比較グラフが表示されます。
                </p>
              </div>
            ) : (
              <>
                {/* Top-N Summary Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#fdfbf7] rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
                    <span className="text-[11px] font-black text-stone-500 block">
                      TOP {topScoreSummary.topCount} 平均点
                    </span>
                    <div className="text-2xl font-black text-[#1c603a] mt-1 tabular-nums">
                      {topScoreSummary.topAverageScore}
                      <span className="text-xs font-bold text-stone-500 ml-1">点</span>
                    </div>
                    <span className="text-[11px] font-bold text-stone-500 mt-0.5 block tabular-nums">
                      平均得点率 {topScoreSummary.topAverageRate}%
                    </span>
                  </div>

                  <div className="bg-[#fdfbf7] rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
                    <span className="text-[11px] font-black text-stone-500 block">
                      トップ 1位スコア
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                      {topScoreSummary.topMaxScore}
                      <span className="text-xs font-bold text-stone-500 ml-1">
                        / {topScoreSummary.topMaxTotal}点
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 mt-0.5 block tabular-nums">
                      最高得点率 {topScoreSummary.topMaxRate}%
                    </span>
                  </div>

                  <div className="bg-[#fdfbf7] rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
                    <span className="text-[11px] font-black text-stone-500 block">
                      TOP {topScoreSummary.topCount} ボーダーライン
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                      {topScoreSummary.topCutoffScore}
                      <span className="text-xs font-bold text-stone-500 ml-1">
                        / {topScoreSummary.topCutoffTotal}点
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-stone-500 mt-0.5 block tabular-nums">
                      入賞ライン {topScoreSummary.topCutoffRate}%
                    </span>
                  </div>
                </div>

                {/* Anonymous Comparison Bars for TOP-N ONLY */}
                <div className="space-y-2.5 pt-1">
                  {(() => {
                    let userBarShown = false;
                    return visibleTopRankings.map((item, idx) => {
                      const itemMax = item.maxScore && item.maxScore > 0 ? item.maxScore : 500;
                      const itemRate =
                        item.scoreRate !== undefined
                          ? item.scoreRate
                          : Math.round((item.score / itemMax) * 1000) / 10;

                      const isMatch =
                        personalStanding.rank > 0 &&
                        personalStanding.rank <= PUBLIC_TOP_LIMIT &&
                        personalStanding.rank === item.rank &&
                        personalStanding.totalScore === item.score;
                      const isMyBar = isMatch && !userBarShown;
                      if (isMyBar) userBarShown = true;

                      return (
                        <div
                          key={`cmp-${idx}-${item.rank}-${item.score}`}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isMyBar
                              ? 'bg-[#f4f8f5] border-[#1c603a] ring-2 ring-[#1c603a]/20'
                              : 'bg-[#fdfbf7] border-stone-200/80'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                                  item.rank === 1
                                    ? 'bg-amber-400 text-amber-950'
                                    : item.rank <= 3
                                    ? 'bg-stone-200 text-slate-800'
                                    : 'bg-stone-100 text-slate-700'
                                }`}
                              >
                                {item.rank}位
                              </span>
                              <span className="font-black text-slate-800">
                                匿名上位メンバー
                              </span>
                              {isMyBar && (
                                <span className="text-[10px] font-black text-white bg-[#1c603a] px-2 py-0.5 rounded-md">
                                  あなた
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-slate-900 font-black text-xs sm:text-sm tabular-nums">
                              {item.score} / {itemMax}点 ({itemRate}%)
                            </span>
                          </div>
                          <div className="w-full bg-stone-200/80 h-3 rounded-full overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isMyBar
                                  ? 'bg-[#1c603a]'
                                  : item.rank === 1
                                  ? 'bg-amber-400'
                                  : 'bg-slate-700'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(4, itemRate))}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: TOP-N Growth Rankings */}
        {activeTab === 'growth' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 font-bold mb-3 px-1">
              <span className="text-slate-800">
                ◎ 前回テスト比較 · 伸び率ランキング（氏名・出席番号は完全非公開）
              </span>
              <span className="text-[#1c603a] bg-[#f4f8f5] border border-[#1c603a]/20 px-2.5 py-0.5 rounded-lg font-black">
                上位{PUBLIC_TOP_LIMIT}名限定公開（TOP {PUBLIC_TOP_LIMIT}）
              </span>
            </div>

            {visibleTopGrowthRankings.length === 0 ? (
              <div className="p-8 text-center bg-[#fdfbf7] rounded-3xl border border-stone-200 space-y-2">
                <p className="text-sm font-black text-slate-800">成長度データは集計中です</p>
                <p className="text-xs text-stone-500">
                  点数を記録すると、成績上位者（前回比の伸び率TOP {PUBLIC_TOP_LIMIT}）のランキングが公開されます。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleTopGrowthRankings.map((item, index) => {
                  const isMyGrowth =
                    personalStanding.growthRank !== undefined &&
                    personalStanding.growthRank <= PUBLIC_TOP_LIMIT &&
                    personalStanding.growthRank === item.rank &&
                    personalStanding.growthDelta === item.delta;

                  const deltaLabel = item.delta > 0 ? `+${item.delta}` : `${item.delta}`;
                  const rateLabel =
                    item.rateDelta !== undefined
                      ? `得点率 ${item.rateDelta > 0 ? `+${item.rateDelta}` : item.rateDelta}%`
                      : null;

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
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span
                              className={`text-base font-black tabular-nums ${
                                item.delta >= 0 ? 'text-[#1c603a]' : 'text-rose-600'
                              }`}
                            >
                              {deltaLabel}
                            </span>
                            <span className="text-xs font-bold text-stone-500">
                              {item.delta > 0 ? '点アップ' : '点'}
                            </span>
                            {rateLabel && (
                              <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md tabular-nums">
                                {rateLabel}
                              </span>
                            )}
                            {isMyGrowth && (
                              <span className="text-[10px] font-black text-white bg-[#1c603a] px-2 py-0.5 rounded-md ml-1">
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
