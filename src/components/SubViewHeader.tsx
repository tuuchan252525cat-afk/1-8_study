import React from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, Home } from 'lucide-react';

interface SubViewHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export const SubViewHeader: React.FC<SubViewHeaderProps> = ({ title, subtitle, onBack }) => {
  const { setCurrentTab } = useApp();

  const handleGoHome = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentTab('portal');
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* 1. Green Mini Header Banner */}
      <div className="bg-[#1c603a] text-white rounded-2xl px-5 py-3.5 shadow-sm border border-[#185533] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 via-amber-500 to-teal-500 flex items-center justify-center text-white font-black text-[10px]">
            1-8
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base text-white block leading-none">
              いちはちさいと <span className="text-amber-300 text-xs">2026</span>
            </span>
            <span className="text-[10px] text-emerald-100 font-semibold block mt-0.5">
              まなぶことは、つながること。
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Page Navigation Header Bar (Modeled on 39204_0_b6de3a0e.jpg) */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200/80 shadow-xs flex items-center justify-between">
        <button
          onClick={handleGoHome}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs sm:text-sm font-extrabold transition-all cursor-pointer border border-stone-200 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>戻る</span>
        </button>

        <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight text-center truncate px-2">
          {title}
        </h1>

        <div className="w-16 sm:w-20 shrink-0 text-right">
          {subtitle && (
            <span className="text-[10px] font-bold text-slate-400 block truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const ReturnToHomeButton: React.FC = () => {
  const { setCurrentTab } = useApp();

  return (
    <div className="mt-8 pt-4 border-t border-stone-300/60 text-center">
      <button
        onClick={() => setCurrentTab('portal')}
        className="w-full max-w-md mx-auto py-3.5 px-6 rounded-2xl bg-white hover:bg-stone-100 text-slate-900 text-sm font-black border border-stone-300 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-slate-700"
      >
        <Home className="w-4 h-4 text-slate-700" />
        <span>ホームに戻る</span>
      </button>
    </div>
  );
};
