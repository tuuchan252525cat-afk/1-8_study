import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AiAnalysisResult, WeeklyQuiz, QuizQuestion } from '../types';
import {
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Share2,
  RefreshCw,
  Tag,
  TrendingUp,
  HelpCircle,
  X,
  ChevronLeft,
  RotateCcw,
  Check,
  BookOpen,
} from 'lucide-react';

export const AiTestAnalyzerView: React.FC = () => {
  const { currentStudent, addQuiz, setCurrentTab } = useApp();

  // Mode: File upload vs Text prompt (Modeled on DAY 1 / DAY 2 tabs)
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  // Input states
  const [textPrompt, setTextPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    fileData: string;
    mimeType: string;
    fileName: string;
  } | null>(null);

  // Analysis process states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);

  // Quiz interactive state
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isQuizSavedToClass, setIsQuizSavedToClass] = useState(false);
  const [showExplanationList, setShowExplanationList] = useState(false);

  // Sample prompt presets for 1-tap fill
  const presets = [
    { label: '数学：二次関数の動く区間・最大最小', text: '二次関数の動く区間における最大値・最小値の場合分け。文字係数 a を含む放物線 y = x^2 - 2ax + 1 (0 <= x <= 2) の最大値・最小値を求める問題。' },
    { label: '数学：三角比の相互関係・余弦定理', text: '三角比の相互関係と正弦定理・余弦定理。三角形 ABC において a=7, b=5, c=8 のとき cos A の値および三角形の面積 S を求める問題。' },
    { label: '英語：動名詞と不定詞の使い分け', text: 'remember / forget + to do と -ing の意味の違い。stop -ing / to do の区別。重要構文と整序英作文の出題傾向。' },
    { label: '理科：化学基礎のモル濃度と気体体積', text: '標準状態における気体の体積（22.4L/mol）と物質量・アボガドロ定数。モル濃度計算と希釈の計算問題。' },
  ];

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedFile({
        fileData: result,
        mimeType: file.type || 'image/png',
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  // Run AI Analysis
  const handleStartAnalysis = async () => {
    if (!textPrompt.trim() && !selectedFile) {
      alert('過去問の画像、PDF、または問題文テキストのいずれかを入力してください。');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setIsTakingQuiz(false);
    setQuizSubmitted(false);
    setIsQuizSavedToClass(false);
    setSelectedAnswers([]);
    setCurrentQIndex(0);
    setShowExplanationList(false);

    try {
      const response = await fetch('/api/ai/analyze-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textPrompt: textPrompt.trim(),
          fileData: selectedFile?.fileData,
          mimeType: selectedFile?.mimeType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'AI分析サーバーの通信エラーが発生しました。');
      }

      const data: AiAnalysisResult = await response.json();
      if (!data || !data.analysis || !Array.isArray(data.predicted_questions)) {
        throw new Error('AIの解析結果フォーマットが不正です。');
      }

      setAnalysisResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI分析に失敗しました。';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Interactive Quiz Handlers
  const handleSelectOption = (optIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentQIndex] = optIndex;
    setSelectedAnswers(updated);
  };

  const handleNextQuestion = () => {
    if (!analysisResult) return;
    if (currentQIndex < analysisResult.predicted_questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setQuizSubmitted(true);
    }
  };

  // Save Quiz to Class Weekly Quizzes
  const handleSaveQuizToClass = () => {
    if (!analysisResult) return;

    const formattedQuestions: QuizQuestion[] = analysisResult.predicted_questions.map((q, idx) => ({
      id: `q-ai-${Date.now()}-${idx}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correct_index,
      explanation: q.explanation,
    }));

    const newQuiz: WeeklyQuiz = {
      id: `quiz-ai-${Date.now()}`,
      title: `【AI予想】${analysisResult.analysis.subject} (${analysisResult.analysis.unit})`,
      category: 'ai_predicted',
      weekLabel: 'AI出題傾向予想テスト',
      description: `${currentStudent?.nickname || 'クラスメイト'}が共有した過去問データより生成。傾向: ${analysisResult.analysis.trends[0] || '出題ポイント分析完了'}`,
      durationMinutes: 5,
      questions: formattedQuestions,
      createdAuthor: currentStudent?.nickname || 'クラス生徒',
      aiAnalysisSummary: analysisResult.analysis,
    };

    addQuiz(newQuiz);
    setIsQuizSavedToClass(true);
  };

  // Score Calculation
  const totalQuestions = analysisResult?.predicted_questions.length || 0;
  const correctCount = quizSubmitted
    ? analysisResult?.predicted_questions.reduce((acc, q, idx) => {
        return selectedAnswers[idx] === q.correct_index ? acc + 1 : acc;
      }, 0) || 0
    : 0;

  return (
    <div className="space-y-4">
      {/* State 1: Active Interactive Quiz Playing */}
      {isTakingQuiz && analysisResult && !quizSubmitted ? (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <button
              onClick={() => setIsTakingQuiz(false)}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-black transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>分析レポートへ戻る</span>
            </button>

            <span className="text-xs font-black text-[#1c603a] bg-[#f4f8f5] px-3 py-1 rounded-full">
              問 {currentQIndex + 1} / {totalQuestions}
            </span>
          </div>

          <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200">
            <div
              className="bg-[#1c603a] h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          <div className="bg-[#fdfbf7] rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs">
            <div className="text-[11px] font-black text-stone-400 mb-1">
              QUESTION {currentQIndex + 1}
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {analysisResult.predicted_questions[currentQIndex].question}
            </h3>
          </div>

          <div className="space-y-3">
            {analysisResult.predicted_questions[currentQIndex].options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentQIndex] === optIdx;
              const optLetter = ['A', 'B', 'C', 'D'][optIdx] || `${optIdx + 1}`;

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 text-sm sm:text-base font-black transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[#1c603a] bg-[#1c603a] text-white shadow-xs'
                      : 'border-stone-200 bg-white hover:bg-[#fdfbf7] text-slate-800 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-slate-700'
                      }`}
                    >
                      {optLetter}
                    </span>
                    <span>{opt}</span>
                  </div>
                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 ${
                      isSelected
                        ? 'border-white bg-white text-[#1c603a] font-black'
                        : 'border-stone-300 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-stone-100">
            <button
              onClick={() => setIsTakingQuiz(false)}
              className="text-xs font-black text-stone-400 hover:text-slate-800 cursor-pointer"
            >
              中止する
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={selectedAnswers[currentQIndex] === undefined}
              className={`px-7 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                selectedAnswers[currentQIndex] !== undefined
                  ? 'bg-[#1c603a] hover:bg-[#154a2c] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>
                {currentQIndex === totalQuestions - 1 ? '採点して結果を見る' : '次の問題へ'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : isTakingQuiz && analysisResult && quizSubmitted ? (
        /* State 2: Quiz Results & Actions */
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
          <div className="bg-[#1c603a] text-white rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-2xl shrink-0 shadow-2xs">
                {correctCount}
                <span className="text-xs font-bold text-slate-700">/{totalQuestions}</span>
              </div>
              <div>
                <div className="text-xs font-black text-amber-300">◎ AI予想問題 採点結果</div>
                <h3 className="text-lg sm:text-xl font-black mt-0.5">
                  正答率 {Math.round((correctCount / totalQuestions) * 100)}% 達成！
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveQuizToClass}
                disabled={isQuizSavedToClass}
                className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  isQuizSavedToClass
                    ? 'bg-white text-[#1c603a] font-black'
                    : 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-xs'
                }`}
              >
                {isQuizSavedToClass ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#1c603a]" />
                    <span>小テストに保存済み！</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>クラス全員に共有・保存</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => {
                setSelectedAnswers([]);
                setCurrentQIndex(0);
                setQuizSubmitted(false);
              }}
              className="py-3 px-3 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>もう一度解く</span>
            </button>

            <button
              onClick={() => setShowExplanationList(!showExplanationList)}
              className="py-3 px-3 rounded-2xl bg-[#fdfbf7] hover:bg-stone-100 text-slate-800 text-xs font-black border border-stone-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#1c603a]" />
              <span>{showExplanationList ? '解説を閉じる' : '全解説を見る'}</span>
            </button>

            <button
              onClick={() => setCurrentTab('quiz')}
              className="py-3 px-3 rounded-2xl bg-[#fdfbf7] hover:bg-stone-100 text-slate-800 text-xs font-black border border-stone-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>定期テスト一覧</span>
            </button>

            <button
              onClick={() => setIsTakingQuiz(false)}
              className="py-3 px-3 rounded-2xl bg-white hover:bg-stone-100 text-slate-800 text-xs font-black border border-stone-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>分析結果へ戻る</span>
            </button>
          </div>

          {showExplanationList && (
            <div className="space-y-3 pt-2">
              {analysisResult.predicted_questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correct_index;

                return (
                  <div
                    key={q.id}
                    className={`p-4 sm:p-5 rounded-2xl border text-xs space-y-2 ${
                      isCorrect ? 'bg-[#f4f8f5] border-[#1c603a]/40' : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-black text-sm">
                      <span className="flex items-center gap-2 text-slate-900">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-[#1c603a]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        問{idx + 1}: {q.question}
                      </span>
                      <span className={isCorrect ? 'text-[#1c603a]' : 'text-rose-700'}>
                        {isCorrect ? '◎ 正解' : '× 不正解'}
                      </span>
                    </div>

                    <div className="text-slate-700 space-y-1 font-bold">
                      <div>あなたの選択: {userAns !== undefined ? q.options[userAns] : '未解答'}</div>
                      {!isCorrect && (
                        <div className="text-[#1c603a]">正解: {q.options[q.correct_index]}</div>
                      )}
                    </div>

                    <div className="p-3 bg-white rounded-xl text-stone-700 border border-stone-200 font-medium leading-relaxed">
                      <span className="font-black text-slate-900">解説: </span>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* State 3: MAIN AI ANALYZER VIEW (MODELED DIRECTLY ON 39204_0.jpg) */
        <div className="space-y-4">
          {/* 1. Large DAY 1 / DAY 2 Style Segmented Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setInputMode('file')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                inputMode === 'file'
                  ? 'border-[#1c603a] bg-white ring-2 ring-[#1c603a]/20 shadow-xs'
                  : 'border-stone-300/80 bg-white hover:bg-stone-50'
              }`}
            >
              <div className="text-xs font-black text-stone-500 uppercase tracking-wider">
                INPUT METHOD 1
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 flex items-center justify-center gap-1.5">
                <Upload className="w-5 h-5 text-[#1c603a]" />
                <span>過去問ファイル添付</span>
              </div>
            </button>

            <button
              onClick={() => setInputMode('text')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                inputMode === 'text'
                  ? 'border-[#1c603a] bg-white ring-2 ring-[#1c603a]/20 shadow-xs'
                  : 'border-stone-300/80 bg-white hover:bg-stone-50'
              }`}
            >
              <div className="text-xs font-black text-stone-500 uppercase tracking-wider">
                INPUT METHOD 2
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 flex items-center justify-center gap-1.5">
                <FileText className="w-5 h-5 text-sky-700" />
                <span>問題テキスト直接入力</span>
              </div>
            </button>
          </div>

          {/* 2. "▽ 条件を選ぶ" / Presets Filter Button */}
          <div className="text-center py-1">
            <button
              onClick={() => setIsPresetsOpen(!isPresetsOpen)}
              className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full bg-white border border-stone-300 hover:border-slate-800 text-xs sm:text-sm font-black text-slate-800 shadow-2xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>▽ サンプル問題・単元プリセットを選ぶ</span>
            </button>

            {/* Quick 1-tap preset buttons */}
            {isPresetsOpen && (
              <div className="mt-2.5 p-3 bg-white rounded-2xl border border-stone-200 shadow-sm max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fadeIn text-left">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTextPrompt(p.text);
                      setInputMode('text');
                      setIsPresetsOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-[#fdfbf7] hover:bg-[#f4f8f5] hover:border-[#1c603a] border border-stone-200 text-xs font-black text-slate-800 transition-colors cursor-pointer text-left"
                  >
                    ◎ {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Input Card Section */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
            {inputMode === 'file' ? (
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-800">
                  ◎ 過去問の画像ファイル（PNG, JPG）またはPDFを選択
                </label>

                {selectedFile ? (
                  <div className="bg-[#f4f8f5] border-2 border-[#1c603a] rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-12 h-12 rounded-xl bg-[#1c603a] text-white flex items-center justify-center font-black">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-black text-stone-500 uppercase">SELECTED FILE</div>
                        <div className="text-sm font-black text-slate-900 truncate">{selectedFile.fileName}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleClearFile}
                      className="p-2 rounded-xl bg-white hover:bg-stone-100 text-rose-600 font-black text-xs border border-stone-200 cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <label className="relative border-2 border-dashed border-stone-300 hover:border-[#1c603a] bg-[#fdfbf7] hover:bg-white rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center cursor-pointer min-h-[140px] group">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-stone-200 group-hover:bg-[#1c603a]/10 text-stone-600 group-hover:text-[#1c603a] flex items-center justify-center mb-2 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-black text-slate-800">
                      ファイルを選択・アップロードする
                    </span>
                    <span className="text-xs text-stone-400 font-bold mt-1">
                      タップまたはドラッグ＆ドロップで追加
                    </span>
                  </label>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-800">
                  ◎ 過去問の問題文・範囲ノートを入力
                </label>
                <textarea
                  rows={4}
                  placeholder="問題文、公式、出題された単元名や気になっているポイントを入力してください..."
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold border border-stone-300 rounded-2xl p-3.5 bg-[#fdfbf7] focus:bg-white focus:outline-none focus:border-[#1c603a] leading-relaxed resize-none shadow-2xs"
                />
              </div>
            )}

            {/* Big Action Start Button */}
            <div className="pt-2">
              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing || (!textPrompt.trim() && !selectedFile)}
                className="w-full py-4 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] disabled:opacity-50 text-white text-sm sm:text-base font-black shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
                    <span>AIが傾向分析 ＆ 予想問題を作成中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>AI分析を開始する</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {analysisError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-black flex items-center justify-between">
              <span>{analysisError}</span>
              <button onClick={() => setAnalysisError(null)} className="text-rose-600 font-bold">
                閉じる
              </button>
            </div>
          )}

          {/* 4. Results List: Button Cards Modeled on 39204_0.jpg */}
          {analysisResult && (
            <div className="space-y-3 animate-fadeIn">
              {/* Card 1: Subject & Unit (Modeled on 39204_0.jpg card) */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-xs flex items-center gap-3.5 sm:gap-4">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 flex flex-col items-center justify-center font-black bg-[#1c603a] text-white shadow-2xs">
                  <span className="text-[10px] tracking-wider uppercase opacity-80">AI RESULT</span>
                  <span className="text-lg font-black mt-0.5">{analysisResult.analysis.subject}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                    出題単元・科目
                  </div>
                  <div className="text-base sm:text-xl font-black text-slate-900 truncate my-0.5">
                    {analysisResult.analysis.unit}
                  </div>
                  <div className="text-xs font-bold text-[#1c603a] flex items-center gap-1 mt-1">
                    <span>◎ 出題傾向の解析完了</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Keywords Pills (Button cards style) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-2">
                <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  頻出キーワード・重要ポイント
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysisResult.analysis.keywords.slice(0, 5).map((kw, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-2 rounded-xl border border-stone-200 bg-[#fdfbf7] text-slate-900 text-xs sm:text-sm font-black shadow-2xs"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card 3: Trends bullet points */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-2.5">
                <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  出題傾向のまとめ
                </div>
                <div className="space-y-2 pt-1">
                  {analysisResult.analysis.trends.map((trend, idx) => (
                    <div
                      key={idx}
                      className="p-3 sm:p-3.5 rounded-xl bg-[#fdfbf7] border border-stone-200 text-xs sm:text-sm font-bold text-slate-800 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-lg bg-[#1c603a] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{trend}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Large Launch Quiz Button Card */}
              <button
                onClick={() => {
                  setIsTakingQuiz(true);
                  setCurrentQIndex(0);
                  setSelectedAnswers([]);
                  setQuizSubmitted(false);
                }}
                className="w-full bg-[#1c603a] hover:bg-[#154a2c] text-white rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-lg">
                    🎯
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-amber-300">
                      全 {analysisResult.predicted_questions.length} 問 · 自動採点
                    </div>
                    <div className="text-base sm:text-lg font-black mt-0.5">
                      AI予想問題クイズに挑戦する
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
