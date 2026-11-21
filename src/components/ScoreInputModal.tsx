import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, Edit3, CheckSquare, Square, Plus, Trash2, AlertCircle, Lock } from 'lucide-react';
import { SubjectScores } from '../types';
import { getFixedMaxScore, getDefaultMaxScore } from '../constants/subjects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreInputModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    availableTestTitles,
    activeTestTitle,
    saveMyScore,
    testRecords,
    currentStudent,
    allSubjects,
    addCustomSubject,
    deleteCustomSubject,
  } = useApp();

  const [testTitle, setTestTitle] = useState(activeTestTitle || availableTestTitles[0] || '');
  const [testDate, setTestDate] = useState('2026-10-18');

  // New Custom Subject inline modal state
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [customSubjectMaxInput, setCustomSubjectMaxInput] = useState('100');

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

  const [subjectMaxScores, setSubjectMaxScores] = useState<Record<string, number>>({
    japanese: 200,
    math: 200,
    english: 200,
    geography: 100,
    history: 100,
  });

  // Draft input strings so users can clear & retype numbers cleanly without jumping
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [maxScoreInputs, setMaxScoreInputs] = useState<Record<string, string>>({});

  const [validationNotice, setValidationNotice] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Track last initialized context so adding a custom subject doesn't reset unsaved edits
  const lastInitKeyRef = useRef<string>('');

  // Reset initialization marker when modal closes
  useEffect(() => {
    if (!isOpen) {
      lastInitKeyRef.current = '';
      setValidationNotice(null);
    }
  }, [isOpen]);

  // Keep selected testTitle strictly synchronized with availableTestTitles (never keep a deleted test)
  useEffect(() => {
    if (availableTestTitles.length === 0) {
      if (testTitle !== '') setTestTitle('');
      return;
    }
    if (!testTitle || !availableTestTitles.includes(testTitle)) {
      const nextTitle =
        activeTestTitle && availableTestTitles.includes(activeTestTitle)
          ? activeTestTitle
          : availableTestTitles[0];
      setTestTitle(nextTitle);
    }
  }, [isOpen, availableTestTitles, activeTestTitle, testTitle]);

  // Sync scores, maxScores, and subject selection when modal opens or testTitle / student changes
  useEffect(() => {
    if (!isOpen || !currentStudent) return;

    const existing = testRecords.find(
      (r) => r.testTitle === testTitle && r.studentNumber === currentStudent.attendanceNumber
    );
    const initKey = `${testTitle}::${currentStudent.attendanceNumber}::${existing?.updatedAt || existing?.id || 'none'}`;
    if (lastInitKeyRef.current === initKey) {
      // Only ensure any newly added custom subjects exist in maps without resetting user edits
      setSubjectScores((prev) => {
        const next = { ...prev };
        allSubjects.forEach((s) => {
          if (next[s.key] === undefined) next[s.key] = 80;
        });
        return next;
      });
      setSubjectMaxScores((prev) => {
        const next = { ...prev };
        allSubjects.forEach((s) => {
          const fixedMax = getFixedMaxScore(s.key);
          if (fixedMax !== undefined) {
            next[s.key] = fixedMax;
          } else if (next[s.key] === undefined) {
            next[s.key] = getDefaultMaxScore(s.key);
          }
        });
        return next;
      });
      return;
    }

    lastInitKeyRef.current = initKey;

    const newSel: Record<string, boolean> = {};
    const newScores: Record<string, number> = {};
    const newMaxScores: Record<string, number> = {};
    const newScoreInputs: Record<string, string> = {};
    const newMaxInputs: Record<string, string> = {};

    if (existing && existing.scores) {
      if (existing.testDate) {
        setTestDate(existing.testDate);
      }
      allSubjects.forEach((subj) => {
        const val = existing.scores[subj.key as keyof SubjectScores];
        const detailMax = existing.subjectDetails?.find(
          (d) => d.subjectKey === subj.key || d.subject === subj.label
        )?.maxScore;
        const storedMax = existing.maxScores?.[subj.key as keyof SubjectScores] ?? detailMax;
        const fixedMax = getFixedMaxScore(subj.key);
        const resolvedMax =
          fixedMax ??
          (storedMax !== undefined && storedMax !== null && Number(storedMax) >= 1
            ? Math.floor(Number(storedMax))
            : getDefaultMaxScore(subj.key));

        if (val !== undefined && val !== null) {
          const clampedScore = Math.max(0, Math.min(resolvedMax, Number(val)));
          newSel[subj.key] = true;
          newScores[subj.key] = clampedScore;
          newMaxScores[subj.key] = resolvedMax;
          newScoreInputs[subj.key] = String(clampedScore);
          newMaxInputs[subj.key] = String(resolvedMax);
        } else {
          const defaultMax = getDefaultMaxScore(subj.key);
          newSel[subj.key] = false;
          newScores[subj.key] = 80;
          newMaxScores[subj.key] = defaultMax;
          newScoreInputs[subj.key] = '80';
          newMaxInputs[subj.key] = String(defaultMax);
        }
      });
    } else {
      // Default selection (5 main subjects; 国語/数学/英語 fixed at 200, others default 100)
      allSubjects.forEach((subj) => {
        const isDefaultMain = ['japanese', 'math', 'english', 'geography', 'history'].includes(subj.key);
        const defaultMax = getDefaultMaxScore(subj.key);
        newSel[subj.key] = isDefaultMain;
        newScores[subj.key] = 80;
        newMaxScores[subj.key] = defaultMax;
        newScoreInputs[subj.key] = '80';
        newMaxInputs[subj.key] = String(defaultMax);
      });
    }

    setSelectedSubjects(newSel);
    setSubjectScores(newScores);
    setSubjectMaxScores(newMaxScores);
    setScoreInputs(newScoreInputs);
    setMaxScoreInputs(newMaxInputs);
    setValidationNotice(null);
  }, [isOpen, testTitle, testRecords, currentStudent, allSubjects]);

  if (!isOpen) return null;

  const toggleSubjectSelection = (key: string) => {
    setSelectedSubjects((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setValidationNotice(null);
  };

  const handleScoreInputChange = (key: string, raw: string, label: string) => {
    if (raw === '') {
      setScoreInputs((prev) => ({ ...prev, [key]: '' }));
      setSubjectScores((prev) => ({ ...prev, [key]: 0 }));
      setValidationNotice(null);
      return;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;

    const maxVal = getFixedMaxScore(key) ?? Math.max(1, subjectMaxScores[key] ?? getDefaultMaxScore(key));
    if (parsed < 0) {
      setSubjectScores((prev) => ({ ...prev, [key]: 0 }));
      setScoreInputs((prev) => ({ ...prev, [key]: '0' }));
      setValidationNotice(`「${label}」の得点は0点以上で入力してください。`);
      return;
    }

    if (parsed > maxVal) {
      setSubjectScores((prev) => ({ ...prev, [key]: maxVal }));
      setScoreInputs((prev) => ({ ...prev, [key]: String(maxVal) }));
      setValidationNotice(`「${label}」の得点が満点（${maxVal}点）を超えたため、上限値（${maxVal}点）に調整しました。`);
      return;
    }

    const floored = Math.floor(parsed);
    setSubjectScores((prev) => ({ ...prev, [key]: floored }));
    setScoreInputs((prev) => ({ ...prev, [key]: String(floored) }));
    setValidationNotice(null);
  };

  const handleScoreBlur = (key: string) => {
    const raw = scoreInputs[key];
    if (raw === undefined || raw === '') {
      setScoreInputs((prev) => ({ ...prev, [key]: '0' }));
      setSubjectScores((prev) => ({ ...prev, [key]: 0 }));
    }
  };

  const handleMaxScoreInputChange = (key: string, raw: string, label: string) => {
    const fixedMax = getFixedMaxScore(key);
    if (fixedMax !== undefined) {
      setSubjectMaxScores((prev) => ({ ...prev, [key]: fixedMax }));
      setMaxScoreInputs((prev) => ({ ...prev, [key]: String(fixedMax) }));
      return;
    }

    setMaxScoreInputs((prev) => ({ ...prev, [key]: raw }));

    if (raw === '') {
      setValidationNotice(`「${label}」の満点は1以上の数値を入力してください。`);
      return;
    }

    const parsed = Math.floor(Number(raw));
    if (!Number.isFinite(parsed)) return;

    if (parsed < 1) {
      setValidationNotice(`「${label}」の満点は1以上の数値のみ設定できます。`);
      return;
    }

    setSubjectMaxScores((prev) => ({ ...prev, [key]: parsed }));

    // Clamp existing score if it now exceeds the reduced maxScore
    const currentScore = subjectScores[key] ?? 0;
    if (currentScore > parsed) {
      setSubjectScores((prev) => ({ ...prev, [key]: parsed }));
      setScoreInputs((prev) => ({ ...prev, [key]: String(parsed) }));
      setValidationNotice(
        `「${label}」の満点を${parsed}点に変更したため、得点を上限の${parsed}点に調整しました。`
      );
    } else {
      setValidationNotice(null);
    }
  };

  const handleMaxScoreBlur = (key: string) => {
    const fixedMax = getFixedMaxScore(key);
    if (fixedMax !== undefined) {
      setSubjectMaxScores((prev) => ({ ...prev, [key]: fixedMax }));
      setMaxScoreInputs((prev) => ({ ...prev, [key]: String(fixedMax) }));
      return;
    }

    const raw = maxScoreInputs[key];
    const parsed = Math.floor(Number(raw));
    if (raw === undefined || raw === '' || !Number.isFinite(parsed) || parsed < 1) {
      const fallback = raw === '' ? 100 : 1;
      setSubjectMaxScores((prev) => ({ ...prev, [key]: fallback }));
      setMaxScoreInputs((prev) => ({ ...prev, [key]: String(fallback) }));
      if ((subjectScores[key] ?? 0) > fallback) {
        setSubjectScores((prev) => ({ ...prev, [key]: fallback }));
        setScoreInputs((prev) => ({ ...prev, [key]: String(fallback) }));
      }
      setValidationNotice(null);
    } else {
      setMaxScoreInputs((prev) => ({ ...prev, [key]: String(parsed) }));
    }
  };

  // User adds custom subject
  const handleCreateCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;

    const parsedMax = Math.floor(Number(customSubjectMaxInput));
    const initialMax = Number.isFinite(parsedMax) && parsedMax >= 1 ? parsedMax : 100;

    const newOption = addCustomSubject(trimmed);
    const resolvedMax = getFixedMaxScore(newOption.key) ?? initialMax;
    const initialScore = Math.min(80, resolvedMax);

    // Automatically check & initialize score + maxScore for new custom subject
    setSelectedSubjects((prev) => ({ ...prev, [newOption.key]: true }));
    setSubjectMaxScores((prev) => ({ ...prev, [newOption.key]: resolvedMax }));
    setMaxScoreInputs((prev) => ({ ...prev, [newOption.key]: String(resolvedMax) }));
    setSubjectScores((prev) => ({ ...prev, [newOption.key]: initialScore }));
    setScoreInputs((prev) => ({ ...prev, [newOption.key]: String(initialScore) }));

    setCustomSubjectInput('');
    setCustomSubjectMaxInput('100');
    setIsAddSubjectOpen(false);
    setValidationNotice(null);
  };

  // Presets
  const selectAll = () => {
    const newSel: Record<string, boolean> = {};
    allSubjects.forEach((s) => { newSel[s.key] = true; });
    setSelectedSubjects(newSel);
    setValidationNotice(null);
  };

  const selectFiveMain = () => {
    const newSel: Record<string, boolean> = {};
    allSubjects.forEach((s) => {
      newSel[s.key] = ['japanese', 'math', 'english', 'geography', 'history'].includes(s.key);
    });
    setSelectedSubjects(newSel);
    setValidationNotice(null);
  };

  // Calculate totals for active selected subjects only
  const activeSubjects = allSubjects.filter((s) => selectedSubjects[s.key]);
  const activeKeys = activeSubjects.map((s) => s.key);
  const activeCount = activeKeys.length;

  const hasInvalidMax = activeSubjects.some((subj) => {
    if (getFixedMaxScore(subj.key) !== undefined) return false;
    const raw = maxScoreInputs[subj.key];
    if (raw === '') return true;
    if (raw !== undefined) {
      const n = Math.floor(Number(raw));
      return !Number.isFinite(n) || n < 1;
    }
    return (subjectMaxScores[subj.key] ?? getDefaultMaxScore(subj.key)) < 1;
  });

  const maxTotalScore = activeKeys.reduce<number>(
    (acc, k) => acc + (getFixedMaxScore(k) ?? Math.max(1, subjectMaxScores[k] ?? getDefaultMaxScore(k))),
    0
  );

  const currentTotalScore = activeKeys.reduce<number>(
    (acc, k) =>
      acc +
      Math.min(
        subjectScores[k] ?? 0,
        getFixedMaxScore(k) ?? Math.max(1, subjectMaxScores[k] ?? getDefaultMaxScore(k))
      ),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle || !availableTestTitles.includes(testTitle)) {
      setValidationNotice('対象の定期テストが選択されていません。「定期テスト日程一覧」からテストを追加してください。');
      return;
    }
    if (activeCount === 0) {
      setValidationNotice('少なくとも1教科を選択してください。');
      return;
    }

    if (hasInvalidMax) {
      setValidationNotice('選択中の教科の満点はすべて1以上の数値を入力してください。');
      return;
    }

    const finalScores: SubjectScores = {};
    const finalMaxScores: SubjectScores = {};
    activeKeys.forEach((key) => {
      const maxVal = getFixedMaxScore(key) ?? Math.max(1, Math.floor(subjectMaxScores[key] ?? getDefaultMaxScore(key)));
      const scoreVal = Math.max(0, Math.min(maxVal, Math.floor(subjectScores[key] ?? 0)));
      finalScores[key as keyof SubjectScores] = scoreVal;
      finalMaxScores[key as keyof SubjectScores] = maxVal;
    });

    saveMyScore(testTitle, testDate, finalScores, finalMaxScores);
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
          テストに含まれる教科を選択し、得点を入力してください。国語・数学・英語は200点満点固定、その他の教科は満点を変更できます（初期値100点）。
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Test Selector */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">対象の定期テスト・模試</label>
            <select
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              disabled={availableTestTitles.length === 0}
              className="w-full text-xs font-black border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white focus:outline-none focus:border-[#1c603a] cursor-pointer shadow-2xs disabled:opacity-60"
            >
              {availableTestTitles.length === 0 ? (
                <option value="">テストが登録されていません（「問題編集」から追加）</option>
              ) : (
                availableTestTitles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))
              )}
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
                ◎ テスト教科の選択 ＆ 得点・満点入力
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

            {validationNotice && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{validationNotice}</span>
              </div>
            )}

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
                    className="text-stone-400 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="例: 情報Ⅰ、保健体育、プログラミング"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    className="flex-1 text-xs border border-stone-300 rounded-xl p-2.5 bg-white font-bold focus:outline-none focus:border-[#1c603a]"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-xl px-2.5 py-1.5">
                      <span className="text-[11px] font-bold text-stone-500 shrink-0">満点</span>
                      <input
                        type="number"
                        min={1}
                        value={customSubjectMaxInput}
                        onChange={(e) => setCustomSubjectMaxInput(e.target.value)}
                        className="w-14 text-center text-xs font-black focus:outline-none tabular-nums"
                        aria-label="追加教科の満点"
                      />
                      <span className="text-[11px] font-bold text-stone-400 shrink-0">点</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateCustomSubject}
                      className="px-4 py-2.5 bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      追加する
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Subject Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {allSubjects.map((subj) => {
                const isChecked = Boolean(selectedSubjects[subj.key]);
                const fixedMax = getFixedMaxScore(subj.key);
                const isFixedMax = fixedMax !== undefined;
                const scoreVal = subjectScores[subj.key] ?? 0;
                const maxVal = fixedMax ?? (subjectMaxScores[subj.key] ?? getDefaultMaxScore(subj.key));
                const rawMaxStr = maxScoreInputs[subj.key];
                const isMaxInvalid =
                  !isFixedMax &&
                  (rawMaxStr === '' ||
                    (rawMaxStr !== undefined && (!Number.isFinite(Number(rawMaxStr)) || Number(rawMaxStr) < 1)));

                return (
                  <div
                    key={subj.key}
                    className={`p-2.5 sm:p-3 rounded-2xl border transition-all relative group ${
                      isChecked
                        ? isMaxInvalid
                          ? 'bg-white border-rose-400 ring-2 ring-rose-200 shadow-xs'
                          : 'bg-white border-[#1c603a] ring-2 ring-[#1c603a]/20 shadow-xs'
                        : 'bg-[#fdfbf7] border-stone-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => toggleSubjectSelection(subj.key)}
                        className="flex-1 flex items-center justify-between text-left cursor-pointer mr-1 min-w-0"
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
                          className="text-stone-300 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                          title="このカスタム教科を削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isChecked ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 px-0.5">
                          <span>得点</span>
                          {isFixedMax ? (
                            <span className="inline-flex items-center gap-0.5 text-stone-500">
                              <Lock className="w-2.5 h-2.5" />
                              <span>満点固定</span>
                            </span>
                          ) : (
                            <span>満点</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={maxVal}
                            value={scoreInputs[subj.key] ?? String(scoreVal)}
                            onChange={(e) => handleScoreInputChange(subj.key, e.target.value, subj.label)}
                            onBlur={() => handleScoreBlur(subj.key)}
                            aria-label={`${subj.label}の得点`}
                            className="flex-1 min-w-0 text-center text-xs sm:text-sm font-black border border-stone-300 rounded-xl px-1 py-1.5 bg-stone-50 focus:bg-white focus:outline-none focus:border-[#1c603a] tabular-nums"
                            required
                          />
                          <span className="text-xs font-black text-stone-400 shrink-0">/</span>
                          {isFixedMax ? (
                            <div
                              aria-label={`${subj.label}の満点（${maxVal}点固定）`}
                              title={`${subj.label}の満点は${maxVal}点に固定されています`}
                              className="flex-1 min-w-0 text-center text-xs sm:text-sm font-black border border-stone-200 rounded-xl px-1 py-1.5 bg-stone-100 text-slate-600 tabular-nums select-none"
                            >
                              {maxVal}
                            </div>
                          ) : (
                            <input
                              type="number"
                              min={1}
                              value={maxScoreInputs[subj.key] ?? String(maxVal)}
                              onChange={(e) => handleMaxScoreInputChange(subj.key, e.target.value, subj.label)}
                              onBlur={() => handleMaxScoreBlur(subj.key)}
                              aria-label={`${subj.label}の満点`}
                              className={`flex-1 min-w-0 text-center text-xs sm:text-sm font-black border rounded-xl px-1 py-1.5 focus:bg-white focus:outline-none tabular-nums ${
                                isMaxInvalid
                                  ? 'border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-500'
                                  : 'border-stone-200 bg-[#fdfbf7] text-slate-700 focus:border-[#1c603a]'
                              }`}
                              required
                            />
                          )}
                          <span className="text-[10px] font-black text-stone-400 shrink-0">点</span>
                        </div>
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
              disabled={savedSuccess || activeCount === 0 || hasInvalidMax || !testTitle}
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
