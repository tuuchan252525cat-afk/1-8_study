import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, Edit3, CheckSquare, Square, Plus, Trash2 } from 'lucide-react';
import { SubjectScores } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreInputModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    availableTestTitles,
    saveMyScore,
    testRecords,
    currentStudent,
    allSubjects,
    addCustomSubject,
    deleteCustomSubject,
  } = useApp();

  const [testTitle, setTestTitle] = useState(availableTestTitles[0] || '第2回 校内実力模試（10月）');
  const [testDate, setTestDate] = useState('2026-10-18');

  // New Custom Subject inline modal state
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // Track which subjects are included in this test
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>({
    japanese: true,
    math: true,
    english: true,
    geography: true,
    history: true,
  });

  const [subjectScores, setSubjectScores] = useState<Record<string, number>>({
    japanese: 80,
    math: 85,
    english: 88,
    geography: 75,
    history: 78,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync scores and subject selection when test title or student record changes
  useEffect(() => {
    if (!currentStudent) return;
    const existing = testRecords.find(
      (r) => r.testTitle === testTitle && r.studentNumber === currentStudent.attendanceNumber
    );

    const newSel: Record<string, boolean> = {};
    const newScores: Record<string, number> = {};

    if (existing && existing.scores) {
      allSubjects.forEach((subj) => {
        const val = existing.scores[subj.key as keyof SubjectScores];
        if (val !== undefined && val !== null) {
          newSel[subj.key] = true;
          newScores[subj.key] = Number(val);
        } else {
          newSel[subj.key] = false;
          newScores[subj.key] = 80;
        }
      });
    } else {
      // Default selection (5 main subjects)
      allSubjects.forEach((subj) => {
        const isDefaultMain = ['japanese', 'math', 'english', 'geography', 'history'].includes(subj.key);
        newSel[subj.key] = isDefaultMain;
        newScores[subj.key] = 80;
      });
    }

    setSelectedSubjects(newSel);
    setSubjectScores(newScores);
  }, [testTitle, testRecords, currentStudent, allSubjects]);

  if (!isOpen) return null;

  const toggleSubjectSelection = (key: string) => {
    setSelectedSubjects((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleScoreChange = (key: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setSubjectScores((prev) => ({ ...prev, [key]: clamped }));
  };

  // User adds custom subject
  const handleCreateCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;

    const newOption = addCustomSubject(trimmed);

    // Automatically check & initialize score for new custom subject
    setSelectedSubjects((prev) => ({ ...prev, [newOption.key]: true }));
    setSubjectScores((prev) => ({ ...prev, [newOption.key]: 80 }));

    setCustomSubjectInput('');
    setIsAddSubjectOpen(false);
  };

  // Presets
  const selectAll = () => {
    const newSel: Record<string, boolean> = {};
    allSubjects.forEach((s) => { newSel[s.key] = true; });
    setSelectedSubjects(newSel);
  };

  const selectFiveMain = () => {
    const newSel: Record<string, boolean> = {};
    allSubjects.forEach((s) => {
      newSel[s.key] = ['japanese', 'math', 'english', 'geography', 'history'].includes(s.key);
    });
    setSelectedSubjects(newSel);
  };

  // Calculate totals for active selected subjects only
  const activeKeys = allSubjects.filter((s) => selectedSubjects[s.key]).map((s) => s.key);
  const activeCount = activeKeys.length;
  const maxTotalScore = activeCount * 100;

  const currentTotalScore = activeKeys.reduce<number>(
    (acc, k) => acc + (subjectScores[k] ?? 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCount === 0) {
      alert('少なくとも1教科を選択してください。');
      return;
    }

    const finalScores: SubjectScores = {};
    activeKeys.forEach((key) => {
      finalScores[key as keyof SubjectScores] = subjectScores[key] ?? 0;
    });

    saveMyScore(testTitle, testDate, finalScores);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-stone-200/90 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-slate-800 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 rounded-2xl bg-[#1c603a] text-white flex items-center justify-center font-black shadow-2xs">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">成績記録・教科追加選択</h2>
            <div className="text-[11px] font-black text-[#1c603a]">
              ◎ 1-8 SITE · SCORE MANAGEMENT
            </div>
          </div>
        </div>

        <p className="text-xs text-stone-500 mb-4 leading-relaxed font-medium">
          テストに含まれる教科を選択し、得点を入力してください。ユーザー独自のカスタム教科も自由に追加できます。
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Test Selector */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">対象の定期テスト・模試</label>
            <select
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full text-xs font-black border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white focus:outline-none focus:border-[#1c603a] cursor-pointer shadow-2xs"
            >
              {availableTestTitles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="11月中間テスト（追加）">11月中間テスト（新規追加）</option>
            </select>
          </div>

          {/* Test Date & Dynamic Total Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">実施日</label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full text-xs font-bold border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white focus:outline-none focus:border-[#1c603a] shadow-2xs"
                required
              />
            </div>

            {/* Dynamic Total Score Box */}
            <div className="bg-[#1c603a] text-white rounded-2xl p-3.5 flex flex-col justify-center border border-[#185533] shadow-xs">
              <div className="flex items-center justify-between text-[11px] text-emerald-100 mb-0.5">
                <span className="font-black text-amber-300">◎ 合計得点</span>
                <span className="font-bold text-emerald-100">
                  {activeCount} 教科選択中
                </span>
              </div>
              <div className="text-2xl font-black tabular-nums">
                {currentTotalScore}{' '}
                <span className="text-xs font-bold text-emerald-200">
                  / {maxTotalScore}点満点
                </span>
              </div>
            </div>
          </div>

          {/* Subject Selection Presets & Add Button */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-800">
                ◎ テスト教科の選択 ＆ 得点入力
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={selectFiveMain}
                  className="px-3 py-1.5 text-[11px] font-black rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 transition-colors shrink-0 cursor-pointer border border-stone-200"
                >
                  主要5教科
                </button>
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-3 py-1.5 text-[11px] font-black rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 transition-colors shrink-0 cursor-pointer border border-stone-200"
                >
                  全教科選択
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(true)}
                  className="px-3 py-1.5 text-[11px] font-black rounded-xl bg-[#1c603a] hover:bg-[#154a2c] text-white transition-colors shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  教科を追加
                </button>
              </div>
            </div>

            {/* Modal to create a new custom subject */}
            {isAddSubjectOpen && (
              <div className="bg-[#fdfbf7] p-4 rounded-2xl border-2 border-[#1c603a] space-y-2.5 my-2 animate-fadeIn shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#1c603a]">
                    ◎ 新しい独自の教科を追加登録
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectOpen(false)}
                    className="text-stone-400 hover:text-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="例: 情報Ⅰ、保健体育、プログラミング"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    className="flex-1 text-xs border border-stone-300 rounded-xl p-2.5 bg-white font-bold focus:outline-none focus:border-[#1c603a]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomSubject}
                    className="px-4 py-2.5 bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    追加する
                  </button>
                </div>
              </div>
            )}

            {/* Subject Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {allSubjects.map((subj) => {
                const isChecked = Boolean(selectedSubjects[subj.key]);
                const scoreVal = subjectScores[subj.key] ?? 0;

                return (
                  <div
                    key={subj.key}
                    className={`p-3 rounded-2xl border transition-all relative group ${
                      isChecked
                        ? 'bg-white border-[#1c603a] ring-2 ring-[#1c603a]/20 shadow-xs'
                        : 'bg-[#fdfbf7] border-stone-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => toggleSubjectSelection(subj.key)}
                        className="flex-1 flex items-center justify-between text-left cursor-pointer mr-1"
                      >
                        <span
                          className={`text-xs font-black line-clamp-1 transition-colors ${
                            isChecked ? 'text-slate-900' : 'text-stone-500'
                          }`}
                        >
                          {subj.label}
                        </span>
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#1c603a] shrink-0 ml-1" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
                        )}
                      </button>

                      {subj.isCustom && (
                        <button
                          type="button"
                          onClick={() => deleteCustomSubject(subj.key)}
                          className="text-stone-300 hover:text-rose-600 p-0.5 rounded transition-colors"
                          title="このカスタム教科を削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isChecked ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scoreVal}
                          onChange={(e) => handleScoreChange(subj.key, Number(e.target.value))}
                          className="w-full text-center text-sm font-black border border-stone-300 rounded-xl p-1.5 bg-stone-50 focus:bg-white focus:outline-none focus:border-[#1c603a] tabular-nums"
                          required
                        />
                        <span className="text-[11px] font-black text-stone-400">点</span>
                      </div>
                    ) : (
                      <div className="text-center text-[10px] font-bold text-stone-400 py-2 bg-stone-100 rounded-xl border border-dashed border-stone-200">
                        対象外
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-black text-stone-600 hover:text-slate-800 rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={savedSuccess || activeCount === 0}
              className="px-6 py-2.5 text-xs font-black text-white bg-[#1c603a] hover:bg-[#154a2c] rounded-2xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
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
