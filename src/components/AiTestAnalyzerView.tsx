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
} from 'lucide-react';

export const AiTestAnalyzerView: React.FC = () => {
  const { currentStudent, addQuiz, setCurrentTab } = useApp();

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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1c603a] text-amber-300 flex items-center justify-center font-black shadow-xs shrink-0 mt-0.5">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-[#1c603a] uppercase tracking-wider">
                  ◎ AI TEST INTELLIGENCE
                </span>
                <span className="text-[10px] text-stone-400 font-bold">Gemini 3.8 Flash</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">過去問AI傾向分析 ＆ 予想問題生成</h1>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed font-medium">
                過去の定期テストや問題用紙の画像・PDF・テキストを分析し、重要キーワードと出題傾向を解明。そのまま挑戦できるAI予想問題を作成します。
              </p>
            </div>
          </div>
        </div>

        {/* 1. Upload Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Zone */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#1c603a]" />
                <span>過去問ファイル添付（画像・PDF）</span>
              </label>

              <div className="relative border-2 border-dashed border-stone-300 hover:border-[#1c603a] rounded-2xl p-4 bg-[#fdfbf7] hover:bg-white transition-all text-center flex flex-col items-center justify-center min-h-[130px]">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                {selectedFile ? (
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between bg-[#1c603a] text-white p-3 rounded-xl text-xs font-black shadow-xs">
                      <span className="flex items-center gap-2 truncate max-w-[200px] sm:max-w-[280px]">
                        <ImageIcon className="w-4 h-4 text-amber-300 shrink-0" />
                        <span className="truncate">{selectedFile.fileName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="text-emerald-100 hover:text-white p-1 rounded-lg cursor-pointer"
                        title="選択解除"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {selectedFile.mimeType.startsWith('image/') && (
                      <img
                        src={selectedFile.fileData}
                        alt="Preview"
                        className="max-h-24 mx-auto rounded-xl object-contain border border-stone-200"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-2xl bg-stone-200/80 text-stone-600 flex items-center justify-center mx-auto mb-1">
                      <ImageIcon className="w-5 h-5 text-stone-700" />
                    </div>
                    <p className="text-xs font-black text-slate-800">
                      タップまたはドラッグ＆ドロップでファイルを選択
                    </p>
                    <p className="text-[10px] text-stone-400 font-bold">PNG, JPG, WebP, PDF 対応</p>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Text Prompt Input */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-700" />
                <span>問題文・ノートのテキスト入力（任意）</span>
              </label>

              <textarea
                rows={5}
                placeholder="過去問の問題文、テスト範囲の単元名、公式、または気になっている出題箇所をそのまま貼り付けてください..."
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                className="w-full text-xs font-bold border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white focus:outline-none focus:border-[#1c603a] leading-relaxed resize-none shadow-2xs"
              />
            </div>
          </div>

          {/* Start Analysis Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-stone-500 font-bold">
              ◎ AIがファイルを解析し、出題傾向と予想クイズ（5〜10問）を自動生成します。
            </span>

            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || (!textPrompt.trim() && !selectedFile)}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#1c603a] hover:bg-[#154a2c] disabled:opacity-50 text-white text-xs font-black rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>AI傾向分析＆問題作成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>AI分析を開始する</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {analysisError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl p-5 text-xs font-black flex items-center justify-between">
          <span>{analysisError}</span>
          <button
            onClick={() => setAnalysisError(null)}
            className="text-rose-600 hover:text-rose-900 cursor-pointer"
          >
            閉じる
          </button>
        </div>
      )}

      {/* 2. Pop Card UI - AI Analysis Result */}
      {analysisResult && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1c603a] text-amber-300 flex items-center justify-center shadow-xs font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-[#f4f8f5] border border-[#1c603a]/30 text-[#1c603a] text-xs font-black">
                      {analysisResult.analysis.subject}
                    </span>
                    <span className="text-base font-black text-slate-900">
                      {analysisResult.analysis.unit}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-bold block mt-0.5">
                    ◎ AI過去問出題パターン解析レポート
                  </span>
                </div>
              </div>

              {!isTakingQuiz && (
                <button
                  onClick={() => setIsTakingQuiz(true)}
                  className="px-5 py-2.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>予想問題クイズ（{analysisResult.predicted_questions.length}問）に挑戦</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Keyword Tags (Max 5) */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>頻出キーワード・最重要ポイント</span>
              </span>

              <div className="flex flex-wrap gap-2">
                {analysisResult.analysis.keywords.slice(0, 5).map((kw, i) => {
                  return (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 rounded-2xl border border-stone-200 bg-[#fdfbf7] text-slate-800 text-xs font-black shadow-2xs"
                    >
                      #{kw}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Exam Trends Summary (3 bullet points) */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#1c603a]" />
                <span>出題傾向のまとめ</span>
              </span>

              <div className="space-y-2.5">
                {analysisResult.analysis.trends.map((trend, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#fdfbf7] border border-stone-200 text-xs font-bold text-slate-800 flex items-start gap-3 leading-relaxed"
                  >
                    <span className="w-6 h-6 rounded-xl bg-[#1c603a] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{trend}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Predicted Quiz Section */}
          {isTakingQuiz && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-2xl bg-[#1c603a] text-white flex items-center justify-center font-black">
                    <HelpCircle className="w-4 h-4 text-amber-300" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      AI予想問題クイズ演習 ({analysisResult.analysis.unit})
                    </h3>
                    <span className="text-[11px] text-stone-400 font-bold">
                      全 {analysisResult.predicted_questions.length} 問
                    </span>
                  </div>
                </div>

                {quizSubmitted && (
                  <span className="px-3 py-1 rounded-full bg-[#f4f8f5] border border-[#1c603a] text-[#1c603a] text-xs font-black">
                    採点完了: {correctCount} / {totalQuestions} 問正解 ({Math.round((correctCount / totalQuestions) * 100)}%)
                  </span>
                )}
              </div>

              {!quizSubmitted ? (
                /* Question Playing Mode */
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs text-stone-600 font-black">
                    <span className="text-[#1c603a]">
                      ◎ 問 {currentQIndex + 1} / {totalQuestions}
                    </span>
                    <span>選択肢を1つ選んでください</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200">
                    <div
                      className="bg-[#1c603a] h-full rounded-full transition-all duration-300"
                      style={{ width: `${((currentQIndex + 1) / totalQuestions) * 100}%` }}
                    />
                  </div>

                  {/* Question Card */}
                  <div className="bg-[#fdfbf7] rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-2xs">
                    <div className="text-[10px] font-black text-stone-400 mb-1">QUESTION {currentQIndex + 1}</div>
                    <h4 className="text-base font-black text-slate-900 leading-snug">
                      {analysisResult.predicted_questions[currentQIndex].question}
                    </h4>
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {analysisResult.predicted_questions[currentQIndex].options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQIndex] === optIdx;
                      const optLetter = ['A', 'B', 'C', 'D'][optIdx] || `${optIdx + 1}`;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full text-left p-4 min-h-[52px] rounded-2xl border-2 text-xs font-black transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#1c603a] border-[#1c603a] text-white shadow-xs'
                              : 'bg-white hover:bg-[#fdfbf7] border-stone-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-slate-700'
                              }`}
                            >
                              {optLetter}
                            </span>
                            <span>{opt}</span>
                          </div>
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 ${
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

                  {/* Next / Submit Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <button
                      onClick={() => setIsTakingQuiz(false)}
                      className="text-xs font-black text-stone-500 hover:text-slate-800 cursor-pointer"
                    >
                      閉じる
                    </button>

                    <button
                      onClick={handleNextQuestion}
                      disabled={selectedAnswers[currentQIndex] === undefined}
                      className="px-6 py-2.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] disabled:opacity-50 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        {currentQIndex === totalQuestions - 1 ? '採点して結果を見る' : '次の問題へ'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Result & Full Review Mode */
                <div className="space-y-6">
                  {/* Score Card */}
                  <div className="bg-[#1c603a] text-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs border border-[#185533]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-2xl shrink-0 shadow-2xs">
                        {correctCount}
                        <span className="text-xs font-bold text-slate-700">/{totalQuestions}</span>
                      </div>
                      <div>
                        <div className="text-xs font-black text-amber-300">◎ AI予想問題 採点結果</div>
                        <div className="text-base sm:text-lg font-black mt-0.5">
                          正答率 {Math.round((correctCount / totalQuestions) * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Class Sharing Action */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleSaveQuizToClass}
                        disabled={isQuizSavedToClass}
                        className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                          isQuizSavedToClass
                            ? 'bg-white text-[#1c603a] cursor-default font-black'
                            : 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-xs'
                        }`}
                      >
                        {isQuizSavedToClass ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-[#1c603a]" />
                            <span>1年8組小テストに保存済み！</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4" />
                            <span>1年8組小テストとして全員に共有・保存</span>
                          </>
                        )}
                      </button>

                      {isQuizSavedToClass && (
                        <button
                          onClick={() => setCurrentTab('quiz')}
                          className="px-4 py-3 rounded-2xl bg-emerald-950/80 hover:bg-emerald-950 text-white text-xs font-black transition-colors cursor-pointer"
                        >
                          定期テスト一覧へ移動
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review Questions & Explanations */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-800">◎ 全問題の解説・解答振り返り</h4>

                    {analysisResult.predicted_questions.map((q, idx) => {
                      const userAns = selectedAnswers[idx];
                      const isCorrect = userAns === q.correct_index;

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-3xl border text-xs space-y-2.5 ${
                            isCorrect ? 'bg-[#f4f8f5] border-[#1c603a]/40' : 'bg-rose-50/60 border-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-black">
                            <span className="flex items-center gap-1.5 text-slate-900">
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-[#1c603a]" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-600" />
                              )}
                              問{idx + 1}: {q.question}
                            </span>
                            <span className={isCorrect ? 'text-[#1c603a] font-black' : 'text-rose-700 font-black'}>
                              {isCorrect ? '◎ 正解' : '× 不正解'}
                            </span>
                          </div>

                          <div className="text-slate-700 space-y-1 font-medium">
                            <div>
                              あなたの解答:{' '}
                              <span className="font-black text-slate-900">
                                {userAns !== undefined ? q.options[userAns] : '未解答'}
                              </span>
                            </div>
                            {!isCorrect && (
                              <div>
                                正解:{' '}
                                <span className="font-black text-[#1c603a]">
                                  {q.options[q.correct_index]}
                                </span>
                              </div>
                            )}
                            <div className="pt-2.5 border-t border-stone-200/80 text-stone-700 font-medium leading-relaxed">
                              <span className="font-black text-slate-900 block mb-0.5">【解説】</span>
                              {q.explanation}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
