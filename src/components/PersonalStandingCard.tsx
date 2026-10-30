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
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-2xs shrink-0"
            style={{ backgroundColor: currentStudent.avatarColor }}
          >
            {currentStudent.attendanceNumber}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base">
                {currentStudent.nickname}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                (出席番号 {currentStudent.attendanceNumber}番)
              </span>
            </div>
            <div className="text-[11px] text-rose-600 font-bold tracking-wide mt-0.5">
              1-8 SITE · マイスコアレポート
            </div>
          </div>
        </div>

        <button
          onClick={onOpenScoreInput}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>点数を入力・変更</span>
        </button>
      </div>

      {hasScore ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: 総合順位 */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Award className="w-4 h-4 text-amber-500" />
                総合順位
              </span>
              <span className="text-[11px] text-slate-400">
                {personalStanding.totalParticipants}人中
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 tabular-nums">
                  {personalStanding.rank}
                </span>
                <span className="text-xs font-bold text-slate-500">位</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-bold mt-1">
                上位 {Math.round((personalStanding.rank / personalStanding.totalParticipants) * 100)}% 以内
              </p>
            </div>
          </div>

          {/* Card 2: 成長度 */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                成長度 (前回模試比)
              </span>
              {personalStanding.growthRank && (
                <span className="text-[11px] font-bold text-emerald-700">
                  伸び率 {personalStanding.growthRank}位
                </span>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-3xl font-black tabular-nums ${
                    isPositiveGrowth
                      ? 'text-emerald-600'
                      : growthDelta < 0
                      ? 'text-rose-500'
                      : 'text-slate-700'
                  }`}
                >
                  {isPositiveGrowth ? `+${growthDelta}` : growthDelta}
                </span>
                <span className="text-xs font-bold text-slate-500">点アップ</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {isPositiveGrowth
                  ? '素晴らしい成長です！実力が定着しています'
                  : growthDelta < 0
                  ? '苦手分野を振り返って次回さらに伸ばしましょう'
                  : '安定した成績を維持しています'}
              </p>
            </div>
          </div>

          {/* Card 3: 5教科合計 */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <BookOpen className="w-4 h-4 text-sky-500" />
                5教科合計得点
              </span>
              <span className="text-[11px] text-slate-400">満点 500点</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 tabular-nums">
                  {personalStanding.totalScore}
                </span>
                <span className="text-xs font-bold text-slate-500">点</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>平均: {personalStanding.classAverage}点</span>
                <span aria-hidden="true">·</span>
                <span>最高: {personalStanding.classMax}点</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50/60 rounded-2xl p-6 text-center border border-slate-100">
          <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            {activeTestTitle} の点数がまだ登録されていません
          </p>
          <p className="text-xs text-slate-500 mt-1">
            点数を記録すると、順位と成長度が表示されます。
          </p>
          <button
            onClick={onOpenScoreInput}
            className="mt-3 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer"
          >
            今すぐ点数を記録する
          </button>
        </div>
      )}
    </div>
  );
};
