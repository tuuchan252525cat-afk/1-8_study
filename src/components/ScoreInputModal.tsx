import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Check, Edit3 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreInputModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { availableTestTitles, saveMyScore, testRecords, currentStudent } = useApp();

  const [testTitle, setTestTitle] = useState(availableTestTitles[0] || '第2回 校内実力模試（10月）');
  const [testDate, setTestDate] = useState('2026-10-18');

  // Find existing score for this user if available
  const existing = testRecords.find(
    (r) => r.testTitle === testTitle && r.studentNumber === currentStudent?.attendanceNumber
  );

  const [japanese, setJapanese] = useState<number>(existing?.scores.japanese ?? 84);
  const [math, setMath] = useState<number>(existing?.scores.math ?? 88);
  const [english, setEnglish] = useState<number>(existing?.scores.english ?? 90);
  const [science, setScience] = useState<number>(existing?.scores.science ?? 78);
  const [social, setSocial] = useState<number>(existing?.scores.social ?? 78);

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const total = Number(japanese || 0) + Number(math || 0) + Number(english || 0) + Number(science || 0) + Number(social || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMyScore(testTitle, testDate, {
      japanese: Number(japanese),
      math: Number(math),
      english: Number(english),
      science: Number(science),
      social: Number(social),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Edit3 className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">成績入力</h2>
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          各教科の得点を入力してください。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">対象テスト</label>
            <select
              value={testTitle}
              onChange={(e) => {
                const t = e.target.value;
                setTestTitle(t);
                const rec = testRecords.find(
                  (r) => r.testTitle === t && r.studentNumber === currentStudent?.attendanceNumber
                );
                if (rec) {
                  setJapanese(rec.scores.japanese);
                  setMath(rec.scores.math);
                  setEnglish(rec.scores.english);
                  setScience(rec.scores.science);
                  setSocial(rec.scores.social);
                }
              }}
              className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
            >
              {availableTestTitles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="11月中間テスト（追加）">11月中間テスト（新規追加）</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 flex flex-col justify-center">
              <span className="text-[11px] font-medium text-emerald-800">5教科合計点</span>
              <span className="text-xl font-bold text-emerald-700 tabular-nums">
                {total} <span className="text-xs font-normal text-emerald-600">/ 500点</span>
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-slate-700">各教科の得点（各100点満点）</span>
            <div className="grid grid-cols-5 gap-2">
              <div>
                <label className="block text-center text-[11px] text-slate-500 mb-1">国語</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={japanese}
                  onChange={(e) => setJapanese(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-full text-center text-sm font-semibold border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-emerald-500 tabular-nums"
                  required
                />
              </div>
              <div>
                <label className="block text-center text-[11px] text-slate-500 mb-1">数学</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={math}
                  onChange={(e) => setMath(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-full text-center text-sm font-semibold border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-emerald-500 tabular-nums"
                  required
                />
              </div>
              <div>
                <label className="block text-center text-[11px] text-slate-500 mb-1">英語</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={english}
                  onChange={(e) => setEnglish(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-full text-center text-sm font-semibold border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-emerald-500 tabular-nums"
                  required
                />
              </div>
              <div>
                <label className="block text-center text-[11px] text-slate-500 mb-1">理科</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={science}
                  onChange={(e) => setScience(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-full text-center text-sm font-semibold border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-emerald-500 tabular-nums"
                  required
                />
              </div>
              <div>
                <label className="block text-center text-[11px] text-slate-500 mb-1">社会</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={social}
                  onChange={(e) => setSocial(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-full text-center text-sm font-semibold border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-emerald-500 tabular-nums"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={savedSuccess}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  保存完了！
                </>
              ) : (
                '保存する'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
