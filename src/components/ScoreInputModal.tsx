import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, Edit3 } from 'lucide-react';
import { ALL_SUBJECTS } from '../constants/subjects';
import { SubjectScores } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreInputModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { availableTestTitles, saveMyScore, testRecords, currentStudent } = useApp();

  const [testTitle, setTestTitle] = useState(availableTestTitles[0] || '第2回 校内実力模試（10月）');
  const [testDate, setTestDate] = useState('2026-10-18');

  const [subjectScores, setSubjectScores] = useState<SubjectScores>({
    japanese: 80,
    math: 85,
    english: 88,
    geography: 75,
    history: 78,
    biology: 82,
    chemistry: 80,
    physics: 76,
    home: 90,
    kimiron: 85,
    other: 80,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync scores when target test selection or testRecords change
  useEffect(() => {
    if (!currentStudent) return;
    const existing = testRecords.find(
      (r) => r.testTitle === testTitle && r.studentNumber === currentStudent.attendanceNumber
    );
    if (existing) {
      setSubjectScores({
        japanese: existing.scores.japanese ?? 80,
        math: existing.scores.math ?? 85,
        english: existing.scores.english ?? 88,
        geography: existing.scores.geography ?? 75,
        history: existing.scores.history ?? 78,
        biology: existing.scores.biology ?? 82,
        chemistry: existing.scores.chemistry ?? 80,
        physics: existing.scores.physics ?? 76,
        home: existing.scores.home ?? 90,
        kimiron: existing.scores.kimiron ?? 85,
        other: existing.scores.other ?? 80,
      });
    }
  }, [testTitle, testRecords, currentStudent]);

  if (!isOpen) return null;

  const handleScoreChange = (key: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setSubjectScores((prev) => ({ ...prev, [key]: clamped }));
  };

  const total = Object.values(subjectScores).reduce<number>((acc, v) => acc + (Number(v) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMyScore(testTitle, testDate, subjectScores);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Edit3 className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">定期テスト成績入力（全11教科対応）</h2>
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          国語 / 数学 / 英語 / 地理 / 歴史 / 生物 / 化学 / 物理 / 家庭 / きみろん / その他の得点を入力してください。
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">対象テスト</label>
            <select
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full text-sm font-medium border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {availableTestTitles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="11月中間テスト（追加）">11月中間テスト（新規追加）</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">実施日</label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-emerald-800">全教科総合得点</span>
              <span className="text-2xl font-black text-emerald-700 tabular-nums">
                {total} <span className="text-xs font-semibold text-emerald-600">/ 1100点満点</span>
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <span className="text-xs font-bold text-slate-800 block">
              各教科の得点（100点満点）
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {ALL_SUBJECTS.map((subj) => {
                const val = (subjectScores as Record<string, number | undefined>)[subj.key] ?? 0;
                return (
                  <div key={subj.key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {subj.label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={val}
                      onChange={(e) => handleScoreChange(subj.key, Number(e.target.value))}
                      className="w-full text-center text-sm font-bold border border-slate-300 rounded-lg p-1.5 bg-white focus:outline-none focus:border-emerald-500 tabular-nums"
                      required
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={savedSuccess}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-rose-600 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  保存完了！
                </>
              ) : (
                '成績を保存する'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
