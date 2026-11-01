import React from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, Award, Edit3, Lock, BookOpen } from 'lucide-react';

interface Props {
  onOpenScoreInput: () => void;
}

export const PersonalStandingCard: React.FC<Props> = ({ onOpenScoreInput }) => {
  const { currentStudent, personalStanding, activeTestTitle } = useApp();

  if (!currentStudent) return null;

  const hasScore = personalStanding.totalScore > 0;
  const growthDelta = personalStanding.growthDelta ?? 0;
  const isPositiveGrowth = growthDelta > 0;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs relative overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-xs shrink-0"
            style={{ backgroundColor: currentStudent.avatarColor }}
          >
            {currentStudent.attendanceNumber}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-lg">
                {currentStudent.nickname}
              </span>
              <span className="text-xs text-stone-500 font-bold bg-stone-100 px-2 py-0.5 rounded-md">
                出席番号 {currentStudent.attendanceNumber}番
              </span>
            </div>
            <div className="text-[11px] text-[#1c603a] font-extrabold tracking-wide mt-0.5 flex items-center gap-1">
              <span>◎ 1-8 SITE</span>
              <span aria-hidden="true">·</span>
              <span>マイスコアレポート</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenScoreInput}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs transition-all cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>点数を入力・変更</span>
        </button>
      </div>

      {hasScore ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: 総合順位 */}
          <div className="bg-[#fdfbf7] rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Award className="w-4 h-4" />
                </div>
                <span className="font-black text-slate-800 text-xs">総合順位</span>
              </div>
              <span className="text-[11px] font-bold text-stone-400">
                {personalStanding.totalParticipants}人中
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-black text-slate-900 tabular-nums">
                  {personalStanding.rank}
                </span>
                <span className="text-xs font-black text-slate-600">位</span>
              </div>
              <p className="text-[11px] text-[#1c603a] font-extrabold mt-1.5 flex items-center gap-1">
                <span>◎ 上位 {Math.round((personalStanding.rank / personalStanding.totalParticipants) * 100)}% 以内</span>
              </p>
            </div>
          </div>

          {/* Card 2: 成長度 */}
          <div className="bg-[#fdfbf7] rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="font-black text-slate-800 text-xs">成長度 (前回比)</span>
              </div>
              {personalStanding.growthRank && (
                <span className="text-[11px] font-extrabold text-[#1c603a]">
                  伸び率 {personalStanding.growthRank}位
                </span>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span
                  className={`text-3xl font-black tabular-nums ${
                    isPositiveGrowth
                      ? 'text-[#1c603a]'
                      : growthDelta < 0
                      ? 'text-rose-600'
                      : 'text-slate-800'
                  }`}
                >
                  {isPositiveGrowth ? `+${growthDelta}` : growthDelta}
                </span>
                <span className="text-xs font-black text-slate-600">点アップ</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1.5 font-bold line-clamp-1">
                {isPositiveGrowth
                  ? '◎ 素晴らしい成長です！実力が定着しています'
                  : growthDelta < 0
                  ? '◎ 苦手分野を振り返って次回さらに伸ばしましょう'
                  : '◎ 安定した成績を維持しています'}
              </p>
            </div>
          </div>

          {/* Card 3: 合計得点 */}
          <div className="bg-[#fdfbf7] rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="font-black text-slate-800 text-xs">合計得点</span>
              </div>
              <span className="text-[11px] font-bold text-stone-400">総合スコア</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-black text-slate-900 tabular-nums">
                  {personalStanding.totalScore}
                </span>
                <span className="text-xs font-black text-slate-600">点</span>
              </div>
              <div className="text-[11px] text-stone-500 font-bold mt-1.5 flex items-center gap-1.5">
                <span>平均: {personalStanding.classAverage}点</span>
                <span aria-hidden="true">·</span>
                <span>最高: {personalStanding.classMax}点</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#fdfbf7] rounded-2xl p-6 text-center border border-stone-200/80">
          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-2 text-stone-500">
            <Lock className="w-5 h-5" />
          </div>
          <p className="text-sm font-black text-slate-800">
            {activeTestTitle} の点数がまだ登録されていません
          </p>
          <p className="text-xs text-stone-500 font-medium mt-1">
            点数を記録すると、順位と成長度が表示されます。
          </p>
          <button
            onClick={onOpenScoreInput}
            className="mt-3.5 px-5 py-2.5 text-xs font-black text-white bg-[#1c603a] hover:bg-[#154a2c] rounded-2xl transition-colors cursor-pointer shadow-xs"
          >
            今すぐ点数を記録する
          </button>
        </div>
      )}
    </div>
  );
};
