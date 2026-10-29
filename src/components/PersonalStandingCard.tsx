import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, TrendingUp, Award, Edit3, Lock } from 'lucide-react';

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
    <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-3xl p-5 sm:p-7 border border-emerald-100/80 shadow-sm relative overflow-hidden">
      {/* Decorative gentle pastel blur in background */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-emerald-200/20 blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <span
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
            style={{ backgroundColor: currentStudent.avatarColor }}
          >
            {currentStudent.attendanceNumber}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">
                {currentStudent.nickname}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                (出席番号 {currentStudent.attendanceNumber}番)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>マイ個別ステータス（本人にのみ非公開表示）</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenScoreInput}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>点数を入力・変更</span>
        </button>
      </div>

      {hasScore ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: 総合順位 */}
          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-slate-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1 font-medium">
                <Award className="w-4 h-4 text-amber-500" />
                あなたの総合順位
              </span>
              <span className="text-[11px] text-slate-400">
                {personalStanding.totalParticipants}人中
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {personalStanding.rank}
                </span>
                <span className="text-xs font-bold text-slate-500">位</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                上位 {Math.round((personalStanding.rank / personalStanding.totalParticipants) * 100)}% 以内
              </p>
            </div>
          </div>

          {/* Card 2: 成長度（上がり幅） */}
          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-slate-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1 font-medium">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                成長度（前回模試比）
              </span>
              {personalStanding.growthRank && (
                <span className="text-[11px] text-emerald-700 font-semibold">
                  伸び率 {personalStanding.growthRank}位
                </span>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-3xl font-extrabold tabular-nums ${
                    isPositiveGrowth ? 'text-emerald-600' : 'text-slate-800'
                  }`}
                >
                  {isPositiveGrowth ? `+${growthDelta}` : growthDelta}
                </span>
                <span className="text-xs font-bold text-slate-500">点アップ</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isPositiveGrowth
                  ? '素晴らしい成長です！着実に実力が定着しています'
                  : '苦手分野を振り返って次回さらに伸ばしましょう'}
              </p>
            </div>
          </div>

          {/* Card 3: 5教科合計と平均比 */}
          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-slate-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">5教科合計得点</span>
              <span className="text-[11px] text-slate-400">満点 500点</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {personalStanding.totalScore}
                </span>
                <span className="text-xs font-semibold text-slate-500">点</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                <span>クラス平均: {personalStanding.classAverage}点</span>
                <span aria-hidden="true">·</span>
                <span>最高: {personalStanding.classMax}点</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 rounded-2xl p-6 text-center border border-slate-100">
          <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            {activeTestTitle} の点数がまだ登録されていません
          </p>
          <p className="text-xs text-slate-500 mt-1">
            点数を非公開で記録すると、あなただけの順位と成長度が表示されます。
          </p>
          <button
            onClick={onOpenScoreInput}
            className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
          >
            今すぐ点数を記録する
          </button>
        </div>
      )}
    </div>
  );
};
