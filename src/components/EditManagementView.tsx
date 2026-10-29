import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WeeklyQuiz, QuizQuestion } from '../types';
import {
  Edit3,
  BookOpen,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  Calendar,
  Sparkles,
  Layers,
  HelpCircle,
  FileText,
  Save,
} from 'lucide-react';

export const EditManagementView: React.FC = () => {
  const {
    quizzes,
    updateQuiz,
    addQuiz,
    deleteQuiz,
    availableTestTitles,
    addPeriodicTest,
    materials,
    updateMaterial,
    setCurrentTab,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'quizzes' | 'periodic' | 'materials'>('quizzes');

  // Quiz Editor State
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || '');
  const activeQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];

  const [editTitle, setEditTitle] = useState(activeQuiz?.title || '');
  const [editCategory, setEditCategory] = useState<'english' | 'mizoblue'>(activeQuiz?.category || 'english');
  const [editWeekLabel, setEditWeekLabel] = useState(activeQuiz?.weekLabel || '今週の定期テスト');
  const [editDesc, setEditDesc] = useState(activeQuiz?.description || '');
  const [editDuration, setEditDuration] = useState(activeQuiz?.durationMinutes || 5);
  const [editQuestions, setEditQuestions] = useState<QuizQuestion[]>(activeQuiz?.questions || []);
  const [quizSaved, setQuizSaved] = useState(false);

  // Sync state when active quiz changes
  const handleSelectQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    const q = quizzes.find((item) => item.id === quizId);
    if (q) {
      setEditTitle(q.title);
      setEditCategory(q.category);
      setEditWeekLabel(q.weekLabel);
      setEditDesc(q.description);
      setEditDuration(q.durationMinutes);
      setEditQuestions(q.questions);
    }
  };

  // Add question to active quiz
  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-custom-${Date.now()}`,
      question: '新しい問題文を入力してください',
      options: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
      correctIndex: 0,
      explanation: 'ここに正解の根拠や詳しい解説を記入します。',
    };
    setEditQuestions([...editQuestions, newQ]);
  };

  const handleUpdateQuestion = (index: number, updated: Partial<QuizQuestion>) => {
    const list = [...editQuestions];
    list[index] = { ...list[index], ...updated };
    setEditQuestions(list);
  };

  const handleDeleteQuestion = (index: number) => {
    if (editQuestions.length <= 1) {
      alert('問題は最低1問必要です');
      return;
    }
    const list = editQuestions.filter((_, i) => i !== index);
    setEditQuestions(list);
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    updateQuiz({
      ...activeQuiz,
      title: editTitle.trim(),
      category: editCategory,
      weekLabel: editWeekLabel.trim(),
      description: editDesc.trim(),
      durationMinutes: Number(editDuration),
      questions: editQuestions,
    });

    setQuizSaved(true);
    setTimeout(() => setQuizSaved(false), 1500);
  };

  // Create new Quiz
  const [isNewQuizOpen, setIsNewQuizOpen] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizCategory, setNewQuizCategory] = useState<'english' | 'mizoblue'>('mizoblue');

  const handleCreateNewQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;

    const newQ: WeeklyQuiz = {
      id: `quiz-custom-${Date.now()}`,
      title: newQuizTitle.trim(),
      category: newQuizCategory,
      weekLabel: '第5週 定期テスト（新規）',
      description: '新しく追加されたクラス小テストです。',
      durationMinutes: 5,
      questions: [
        {
          id: `q-init-1`,
          question: '第1問のテスト問題を入力してください',
          options: ['正解の選択肢', '誤答1', '誤答2', '誤答3'],
          correctIndex: 0,
          explanation: '正解の解説を記入してください。',
        },
      ],
    };

    addQuiz(newQ);
    setSelectedQuizId(newQ.id);
    setEditTitle(newQ.title);
    setEditCategory(newQ.category);
    setEditWeekLabel(newQ.weekLabel);
    setEditDesc(newQ.description);
    setEditDuration(newQ.durationMinutes);
    setEditQuestions(newQ.questions);
    setIsNewQuizOpen(false);
    setNewQuizTitle('');
  };

  // Periodic Test Creation State
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestDate, setNewTestDate] = useState('2026-11-15');
  const [periodicTestSaved, setPeriodicTestSaved] = useState(false);

  const handleAddPeriodicTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim()) return;

    addPeriodicTest(newTestTitle.trim(), newTestDate);
    setPeriodicTestSaved(true);
    setNewTestTitle('');
    setTimeout(() => setPeriodicTestSaved(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              /edit 管理画面
            </span>
            <span className="text-xs text-slate-400">URL直接アクセス可能</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            定期テスト一覧 ＆ 小テスト問題編集エディタ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            英単語・ミゾブルー小テストの問題文・選択肢・解説、および定期テストの登録を編集できます。
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>アプリ画面に戻る</span>
        </button>
      </div>

      {/* Editor Section Tabs */}
      <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSection('quizzes')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeSection === 'quizzes'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>小テスト問題編集（英単語・ミゾブルー）</span>
        </button>

        <button
          onClick={() => setActiveSection('periodic')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeSection === 'periodic'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-sky-600" />
          <span>定期テスト（模試）一覧・日程</span>
        </button>
      </div>

      {/* Section 1: Quizzes Problem Editor */}
      {activeSection === 'quizzes' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
          {/* Quiz Selector & New Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                編集する小テストを選択
              </label>
              <select
                value={selectedQuizId}
                onChange={(e) => handleSelectQuiz(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.questions.length}問)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsNewQuizOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>小テストを新規作成</span>
            </button>
          </div>

          {/* Quiz Form */}
          <form onSubmit={handleSaveQuiz} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">テスト名</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">カテゴリ</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="english">英単語ターゲット</option>
                  <option value="mizoblue">ミゾブルー理科教養</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">表示ラベル</label>
                <input
                  type="text"
                  value={editWeekLabel}
                  onChange={(e) => setEditWeekLabel(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">説明文・ねらい</label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Questions List */}
            <div className="pt-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>出題問題一覧（全{editQuestions.length}問）</span>
                  <span className="text-xs font-normal text-slate-400">
                    ※正解の選択肢に「正解」ラジオを付けてください
                  </span>
                </h3>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>問題を追加</span>
                </button>
              </div>

              <div className="space-y-4">
                {editQuestions.map((q, qIndex) => (
                  <div
                    key={q.id || qIndex}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        問 {qIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(qIndex)}
                        className="text-xs text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                        title="この問題を削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>削除</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        問題文
                      </label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleUpdateQuestion(qIndex, { question: e.target.value })}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    {/* 4 Choices */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        選択肢と正解の指定（ラジオボタンで正解を選択）
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-2 rounded-xl border bg-white ${
                              q.correctIndex === optIdx
                                ? 'border-emerald-400 ring-1 ring-emerald-300'
                                : 'border-slate-200'
                            }`}
                          >
                            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                              <input
                                type="radio"
                                name={`correct-${q.id || qIndex}`}
                                checked={q.correctIndex === optIdx}
                                onChange={() => handleUpdateQuestion(qIndex, { correctIndex: optIdx })}
                                className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="text-[11px] font-bold text-slate-500">
                                {optIdx + 1}.
                              </span>
                            </label>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...q.options];
                                newOpts[optIdx] = e.target.value;
                                handleUpdateQuestion(qIndex, { options: newOpts });
                              }}
                              className="w-full text-xs border-none focus:outline-none"
                              required
                            />
                            {q.correctIndex === optIdx && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                                正解
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        解答後の詳しい解説文
                      </label>
                      <textarea
                        rows={2}
                        value={q.explanation}
                        onChange={(e) =>
                          handleUpdateQuestion(qIndex, { explanation: e.target.value })
                        }
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                保存すると「定期テスト」タブに即時反映されます
              </span>

              <button
                type="submit"
                disabled={quizSaved}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {quizSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>保存完了！</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>小テストの変更を保存</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 2: Periodic Test List & Creation */}
      {activeSection === 'periodic' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">定期テスト（校内模試）一覧</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              実施された定期考査や模試のリストです。新しいテストを追加してクラス全員のスコア集計を行えます。
            </p>
          </div>

          <div className="space-y-3">
            {availableTestTitles.map((title, idx) => (
              <div
                key={title}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                    <span className="text-[11px] text-slate-400">
                      5教科（国・数・英・理・社）各100点 満点500点
                    </span>
                  </div>
                </div>

                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  登録済
                </span>
              </div>
            ))}
          </div>

          {/* Add Periodic Test Form */}
          <form
            onSubmit={handleAddPeriodicTest}
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4"
          >
            <h4 className="text-sm font-bold text-slate-900">＋ 新規定期テストを追加</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  テスト名・考査名
                </label>
                <input
                  type="text"
                  placeholder="例: 第3回 校内実力模試（11月）"
                  value={newTestTitle}
                  onChange={(e) => setNewTestTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">実施日</label>
                <input
                  type="date"
                  value={newTestDate}
                  onChange={(e) => setNewTestDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={periodicTestSaved}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {periodicTestSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>追加しました！</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>定期テストを追加登録</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Quiz Modal */}
      {isNewQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">小テストの新規作成</h3>
            <p className="text-xs text-slate-500 mb-4">
              クラス用の新しい週替わりテストを作成します。
            </p>

            <form onSubmit={handleCreateNewQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">テスト名</label>
                <input
                  type="text"
                  placeholder="例: 第5週 英文法最重要イディオム演習"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ジャンル</label>
                <select
                  value={newQuizCategory}
                  onChange={(e) => setNewQuizCategory(e.target.value as any)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="english">英単語・英語ターゲット</option>
                  <option value="mizoblue">ミゾブルー（理科・教養）</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewQuizOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
                >
                  作成して編集開始
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
