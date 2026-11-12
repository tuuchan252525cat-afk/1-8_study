import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { WeeklyQuiz, QuizQuestion, AiAnalysisResult, MaterialSubject, StudentPrediction } from '../types';
import { isStaticDeployment } from '../utils/navigation';
import {
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tag,
  Upload,
  FileText,
  Clock,
  Layers,
  Award,
  Check,
  Plus,
  Image as ImageIcon,
  FileCode,
  X,
  Printer,
  Maximize2,
  Minimize2,
  Download,
  Trash2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  WifiOff,
  Search,
  ArrowUpDown,
  Eye,
} from 'lucide-react';

export const PeriodicPredictedQuestionsView: React.FC = () => {
  const {
    quizzes,
    addQuiz,
    submitQuiz,
    getMyQuizStanding,
    getQuizAnonymousRankings,
    allSubjects,
    setCurrentTab,
    studentPredictions,
    addStudentPrediction,
    deleteStudentPrediction,
    currentStudent,
    currentStudentNum,
    students,
    cloudSyncStatus,
    cloudSyncError,
    retryCloudSync,
  } = useApp();

  // Top Segmented Mode: 'list' (AI Exam Prediction) vs 'student_predictions' (Student Created Predictions)
  const [activeSegment, setActiveSegment] = useState<'list' | 'student_predictions'>('list');

  // Filter state for AI quizzes
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // New AI Question Creation Drawer/Accordion
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'text'>('text');
  const [textPrompt, setTextPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    fileData: string;
    mimeType: string;
    fileName: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Active quiz runner state for AI quizzes
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanationList, setShowExplanationList] = useState(false);
  const [showRankings, setShowRankings] = useState(false);

  // ==========================================
  // Student Predictions Local States
  // ==========================================
  const [predSubject, setPredSubject] = useState<MaterialSubject>('all');
  const [predSearchQuery, setPredSearchQuery] = useState<string>('');
  const [activePredId, setActivePredId] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'image' | 'text'>('image');
  const [imgError, setImgError] = useState<boolean>(false);

  // Student Prediction upload form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState<MaterialSubject>('math');
  const [newType, setNewType] = useState<'pdf' | 'image' | 'summary'>('image');
  const [newDesc, setNewDesc] = useState('');
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [newSectionTitle, setNewSectionTitle] = useState('予想問題・出題ポイント');
  const [newContent, setNewContent] = useState('');
  const [newFormula, setNewFormula] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [checkedPoints, setCheckedPoints] = useState<Record<string, boolean>>({});

  const presets = [
    { label: '数学：二次関数の動く区間・最大最小', text: '二次関数の動く区間における最大値・最小値の場合分け。文字係数 a を含む放物線 y = x^2 - 2ax + 1 (0 <= x <= 2) の最大値・最小値を求める問題。' },
    { label: '英語：関係代名詞・前置詞＋関係詞', text: 'whose の用法、前置詞＋関係代名詞（in which, with whom）、関係副詞 where/when の使い分けと差がつく整序英作文。' },
    { label: '化学：酸化還元反応と滴定計算', text: '過マンガン酸カリウムとシュウ酸の酸化還元滴定。半反応式の作成と電子のやり取り、当量関係に基づくモル濃度計算問題。' },
    { label: '物理：等加速度直線運動と落体の運動', text: '等加速度直線運動の公式3つ、自由落下・鉛直投げ上げの最高点・落下時間の計算とグラフ（v-t図）の読み取り問題。' },
  ];

  const subjectsConfig: { key: MaterialSubject; label: string }[] = [
    { key: 'all', label: 'すべて' },
    ...allSubjects.map((s) => ({ key: s.key as MaterialSubject, label: s.label })),
  ];

  // All predicted quizzes: filter by category 'ai_predicted'
  const predictedQuizzes = quizzes.filter(
    (q) => q.category === 'ai_predicted' || q.weekLabel.includes('定期テスト予想問題')
  );

  // Filtered by subject for AI quizzes
  const displayedQuizzes = predictedQuizzes.filter((quiz) => {
    if (selectedSubject === 'all') return true;
    const summarySubject = quiz.aiAnalysisSummary?.subject || '';
    const titleMatch = quiz.title.toLowerCase().includes(selectedSubject.toLowerCase());
    const subjectMatch = summarySubject.toLowerCase().includes(selectedSubject.toLowerCase());
    return titleMatch || subjectMatch;
  });

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId);

  // Student Predictions filtering
  const filteredStudentPredictions = useMemo(() => {
    return studentPredictions
      .filter((p) => {
        if (predSubject !== 'all' && p.subject !== predSubject) return false;
        if (predSearchQuery.trim()) {
          const q = predSearchQuery.trim().toLowerCase();
          const matchesTitle = (p.title || '').toLowerCase().includes(q);
          const matchesAuthor = (p.authorNickname || '').toLowerCase().includes(q);
          const matchesDesc = (p.description || '').toLowerCase().includes(q);
          const matchesContent = (p.contentPreview || '').toLowerCase().includes(q);
          return matchesTitle || matchesAuthor || matchesDesc || matchesContent;
        }
        return true;
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [studentPredictions, predSubject, predSearchQuery]);

  const selectedPrediction: StudentPrediction | undefined =
    studentPredictions.find((p) => p.id === activePredId) ||
    filteredStudentPredictions[0] ||
    studentPredictions[0];

  useEffect(() => {
    setImgError(false);
  }, [selectedPrediction?.id]);

  const handlePredCardClick = (id: string) => {
    setActivePredId(id);
    setIsMobileDetailOpen(true);
  };

  // AI Quiz File Upload Handler
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

  // Student Prediction File Upload Handler
  const handlePredFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError(null);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const detectedType = isPdf ? 'pdf' : 'image';
      setNewType(detectedType);
      setUploadedFileName(file.name);

      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      setUploadedFileSize(`${sizeInMb} MB`);

      if (isPdf && file.size > 800 * 1024) {
        setUploadError(
          `PDFサイズが大きすぎます (${sizeInMb} MB)。800KB以下のファイルを選択するか画像としてアップロードしてください。`
        );
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedFilePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI Generation
  const handleCreateNewPredictedQuiz = async () => {
    if (!textPrompt.trim() && !selectedFile) {
      alert('過去問の画像、PDF、または問題文テキストを入力してください。');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    if (isStaticDeployment()) {
      setTimeout(() => {
        const prompt = textPrompt.trim();
        const subject = prompt.includes('英語') ? '英語' : prompt.includes('化学') ? '化学基礎' : prompt.includes('国語') ? '現代文' : '数学I・A';
        const unit = prompt.includes('二次関数') ? '二次関数とグラフ' : prompt.includes('三角比') ? '三角比と図形の計量' : '定期考査・重要予想テーマ';

        const sampleQuestions: QuizQuestion[] = [
          {
            id: `q-pred-${Date.now()}-1`,
            question: `${subject}における頻出重要公式の適用条件として最も留意すべき点はどれか。`,
            options: ['定義域と前提条件を最初に確認する', '直感のみで選択肢を決める', '計算過程の符号を省略する', '問題文の条件を無視する'],
            correctIndex: 0,
            explanation: '公式を適用する際は、定義域や分母が0でないこと、判別式の正負など前提条件の吟味が最重要です。',
          },
          {
            id: `q-pred-${Date.now()}-2`,
            question: '定期テスト本番で高得点を確保するために最も有効な見直し手法はどれか。',
            options: ['途中式の変形と代入による検算', '見直しをせずに終了を待つ', '解答欄の記号を適当に変える', '問題用紙を見ない'],
            correctIndex: 0,
            explanation: '逆算や特定値の代入による検算を行うことで、計算ミスや転記ミスを確実に防ぐことができます。',
          },
          {
            id: `q-pred-${Date.now()}-3`,
            question: '記述式問題で減点を防ぐための答案作成のポイントとして正しいものはどれか。',
            options: ['立式の根拠となる公式や定理を明記する', '答えの数字だけを書く', '途中式を一切書かない', '文字の定義を省く'],
            correctIndex: 0,
            explanation: 'どの公式や条件を用いたかを明記することで、採点官に論理展開が明確に伝わり部分点も確保できます。',
          },
        ];

        const aiSummary = {
          subject,
          unit,
          keywords: ['公式の適用条件', '途中式の記述', '場合分けの吟味', '代入検算', '時間配分'],
          trends: [
            '標準問題における計算過程の正確性と符号ミス防止が合否を分けます',
            '文字係数を含む条件や定義域の端点処理が差のつくポイントです',
            '各大問の配点に応じた適切な時間配分を守りましょう',
          ],
        };

        const newQuiz: WeeklyQuiz = {
          id: `quiz-pred-${Date.now()}`,
          title: `${subject}：${unit} 厳選予想問題`,
          category: 'ai_predicted',
          weekLabel: '定期テスト予想問題',
          durationMinutes: 10,
          description: `過去の傾向から重要ポイントを厳選した${subject}の定期テスト対策問題。`,
          aiAnalysisSummary: aiSummary,
          questions: sampleQuestions,
        };

        addQuiz(newQuiz);
        setIsCreateOpen(false);
        setTextPrompt('');
        setSelectedFile(null);
        startQuiz(newQuiz.id);
        setIsAnalyzing(false);
      }, 700);
      return;
    }

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

      const formattedQuestions: QuizQuestion[] = data.predicted_questions.map((q, idx) => ({
        id: `q-pred-${Date.now()}-${idx}`,
        question: q.question,
        options: q.options,
        correctIndex: q.correct_index,
        explanation: q.explanation,
      }));

      const newQuiz: WeeklyQuiz = {
        id: `quiz-pred-${Date.now()}`,
        title: `${data.analysis.subject || '定期テスト'}：${data.analysis.unit || '予想問題'}`,
        category: 'ai_predicted',
        weekLabel: '定期テスト予想問題',
        description: data.analysis.trends?.[0] || 'AIが過去問の傾向から自動生成した定期テスト対策予想問題です。',
        durationMinutes: 10,
        questions: formattedQuestions,
        createdAuthor: 'AI分析作成',
        aiAnalysisSummary: data.analysis,
      };

      addQuiz(newQuiz);
      setIsCreateOpen(false);
      setTextPrompt('');
      setSelectedFile(null);
      startQuiz(newQuiz.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '予想問題の生成に失敗しました。';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit Student Prediction
  const handlePredUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSaving) return;

    setUploadError(null);
    setIsSaving(true);
    try {
      const isPdf =
        newType === 'pdf' ||
        uploadedFileName.toLowerCase().endsWith('.pdf') ||
        uploadedFilePreview.startsWith('data:application/pdf');

      if (isPdf && uploadedFilePreview.length > 900 * 1024) {
        throw new Error(
          'PDFファイルの容量が大きすぎます（約' +
            uploadedFileSize +
            '）。Firestoreの上限（1MB）に収めるため、800KB以下のPDFを選択してください。'
        );
      }

      const finalType: 'pdf' | 'image' | 'summary' = isPdf ? 'pdf' : newType;
      const finalSize =
        uploadedFileSize ||
        (finalType === 'pdf' ? '1.4 MB' : finalType === 'image' ? '1.2 MB' : '450 KB');

      await addStudentPrediction({
        title: newTitle.trim(),
        subject: newSubject,
        description: newDesc.trim() || '生徒作成・テスト直前予想問題プリント',
        fileType: finalType,
        fileSize: finalSize,
        imageUrl: isPdf ? undefined : (uploadedFilePreview || undefined),
        pdfUrl: isPdf ? (uploadedFilePreview || undefined) : undefined,
        contentPreview: newContent.trim() || '自作の定期考査予想問題プレビューです。',
        documentSections: [
          {
            title: newSectionTitle.trim() || '予想問題と解法ポイント',
            content:
              newContent.trim() ||
              '出題頻度の高い解法パターンと注意点を意識して演習してください。',
            formula: newFormula.trim() || undefined,
            keyPoints: [
              '出題されやすいひっかけパターンに気をつける',
              '計算過程の式変形を正しく記述する',
            ],
          },
        ],
      });

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setIsUploadOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewContent('');
        setNewFormula('');
        setUploadedFilePreview('');
        setUploadedFileName('');
        setUploadedFileSize('');
        setUploadError(null);
        setIsSaving(false);
      }, 800);
    } catch (err: any) {
      console.error('Student prediction upload failed:', err);
      setUploadError(err?.message || 'アップロードとクラウド同期に失敗しました');
      setIsSaving(false);
    }
  };

  // Delete Student Prediction
  const handleDeletePred = async (id: string, authorNum?: number) => {
    if (authorNum && authorNum !== currentStudentNum) {
      alert('自分が投稿した予想問題のみ削除できます。');
      return;
    }
    if (window.confirm('この自作予想問題を削除してもよろしいですか？（クラウドから削除されます）')) {
      try {
        await deleteStudentPrediction(id);
        if (activePredId === id) {
          const remaining = studentPredictions.filter((p) => p.id !== id);
          if (remaining.length > 0) {
            setActivePredId(remaining[0].id);
          } else {
            setActivePredId('');
            setIsMobileDetailOpen(false);
          }
        }
      } catch (err: any) {
        alert('削除エラー: ' + (err?.message || '削除に失敗しました'));
      }
    }
  };

  const handleManualSync = async () => {
    setIsRetryingSync(true);
    try {
      await retryCloudSync();
    } catch (e: any) {
      console.error('Manual sync failed:', e);
    } finally {
      setIsRetryingSync(false);
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedPoints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Interactive Quiz Runner Handlers
  const startQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
    setIsPlaying(true);
    setCurrentQIndex(0);
    setSelectedAnswers([]);
    setIsSubmitted(false);
    setShowExplanationList(false);
    setShowRankings(false);
  };

  const handleSelectOption = (optIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentQIndex] = optIndex;
    setSelectedAnswers(updated);
  };

  const handleNextOrSubmit = () => {
    if (!activeQuiz) return;
    if (currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      submitQuiz(activeQuiz.id, selectedAnswers);
      setIsSubmitted(true);
    }
  };

  const backToList = () => {
    setIsPlaying(false);
    setActiveQuizId(null);
    setIsSubmitted(false);
    setShowExplanationList(false);
    setShowRankings(false);
  };

  // Subject icon helper
  const getSubjectColorBadge = (title: string, subjectName?: string) => {
    const combined = `${title} ${subjectName || ''}`.toLowerCase();
    if (combined.includes('数学') || combined.includes('math')) {
      return { bg: 'bg-blue-900 text-white', label: '数学', border: 'border-blue-800' };
    }
    if (combined.includes('英語') || combined.includes('english')) {
      return { bg: 'bg-emerald-800 text-white', label: '英語', border: 'border-emerald-700' };
    }
    if (combined.includes('化学') || combined.includes('chem')) {
      return { bg: 'bg-amber-600 text-white', label: '化学', border: 'border-amber-500' };
    }
    if (combined.includes('物理') || combined.includes('phys')) {
      return { bg: 'bg-sky-800 text-white', label: '物理', border: 'border-sky-700' };
    }
    if (combined.includes('国語') || combined.includes('現文')) {
      return { bg: 'bg-rose-800 text-white', label: '国語', border: 'border-rose-700' };
    }
    return { bg: 'bg-[#1c603a] text-white', label: '定期対策', border: 'border-[#154a2c]' };
  };

  // Student Prediction PDF/Image preview helper
  const isSelectedPredPdf =
    selectedPrediction &&
    (selectedPrediction.fileType === 'pdf' ||
      Boolean(selectedPrediction.pdfUrl) ||
      selectedPrediction.imageUrl?.startsWith('data:application/pdf') ||
      selectedPrediction.imageUrl?.toLowerCase().endsWith('.pdf'));

  const activePredPdfSource = selectedPrediction?.pdfUrl || selectedPrediction?.imageUrl;

  const renderPredPreviewContent = (isMobileModal: boolean = false) => {
    if (!selectedPrediction) return null;

    const isAuthor = currentStudentNum === selectedPrediction.authorStudentNumber;
    const authorName =
      (selectedPrediction.authorStudentNumber &&
        students.find((s) => s.attendanceNumber === selectedPrediction.authorStudentNumber)
          ?.nickname) ||
      selectedPrediction.authorNickname;

    return (
      <div className="space-y-4">
        {/* Top View Mode Switcher & Tools */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200">
              <button
                onClick={() => setViewMode('image')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  viewMode === 'image'
                    ? 'bg-[#1c603a] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>実物プレビュー</span>
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  viewMode === 'text'
                    ? 'bg-[#1c603a] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>要点・公式解説</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {!isMobileModal && (
              <button
                onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                className="p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 transition-all cursor-pointer border border-stone-200"
                title={isFullscreenPreview ? '全画面表示を解除' : '全画面で拡大表示'}
              >
                {isFullscreenPreview ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-black transition-all cursor-pointer border border-stone-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>印刷</span>
            </button>
            {isAuthor && (
              <button
                onClick={() =>
                  handleDeletePred(selectedPrediction.id, selectedPrediction.authorStudentNumber)
                }
                className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-stone-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-stone-500 text-xs font-black transition-all cursor-pointer border border-stone-200"
                title="投稿した予想問題を削除する"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>削除</span>
              </button>
            )}
          </div>
        </div>

        {/* Prediction Content Area */}
        {viewMode === 'image' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
              <span className="font-black text-slate-800">{selectedPrediction.title}</span>
              <span>
                投稿者: {authorName} ({selectedPrediction.fileType.toUpperCase()})
              </span>
            </div>

            {/* PDF Viewer */}
            {isSelectedPredPdf && activePredPdfSource ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-100 rounded-2xl border border-stone-200">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span>自作予想問題 PDF文書</span>
                    <span className="text-[10px] text-stone-500 font-bold">
                      ({selectedPrediction.fileSize})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={activePredPdfSource}
                      download={`${selectedPrediction.title}.pdf`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-200 border border-stone-300 text-slate-800 font-bold text-xs shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>保存</span>
                    </a>
                    <a
                      href={activePredPdfSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1c603a] hover:bg-[#154a2c] text-white font-bold text-xs shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>全画面で開く</span>
                    </a>
                  </div>
                </div>

                <div
                  className={`border border-stone-200 rounded-3xl overflow-hidden shadow-xs bg-stone-50 ${
                    isMobileModal ? 'h-[420px]' : 'h-[550px] sm:h-[650px]'
                  }`}
                >
                  <iframe
                    src={activePredPdfSource}
                    className="w-full h-full border-0"
                    title={selectedPrediction.title}
                  />
                </div>
              </div>
            ) : imgError ? (
              <div className="p-8 sm:p-12 text-center bg-[#fdfbf7] rounded-3xl border border-stone-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-800">
                  プレビュー画像を表示できませんでした
                </h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  ファイルがPDF形式であるか、直接表示できない画像形式の可能性があります。「要点・公式解説」タブをご確認ください。
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setViewMode('text')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1c603a] text-white text-xs font-black shadow-xs cursor-pointer"
                  >
                    <span>要点・解説を見る</span>
                  </button>
                </div>
              </div>
            ) : selectedPrediction.imageUrl ? (
              <div className="border border-stone-200 rounded-3xl overflow-hidden bg-slate-900 shadow-inner p-2 sm:p-4 text-center min-h-[300px] flex items-center justify-center">
                <img
                  src={selectedPrediction.imageUrl}
                  alt={selectedPrediction.title}
                  onError={() => setImgError(true)}
                  className="max-h-[580px] w-auto max-w-full mx-auto object-contain rounded-2xl shadow-md bg-white"
                />
              </div>
            ) : (
              <div className="p-12 text-center bg-[#fdfbf7] rounded-3xl border border-stone-200 space-y-2">
                <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
                <p className="text-sm font-black text-slate-800">画像プレビューがありません</p>
                <p className="text-xs text-stone-500">{selectedPrediction.contentPreview}</p>
              </div>
            )}
          </div>
        ) : (
          /* Text Explanation Section */
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900">{selectedPrediction.title}</h3>
            <p className="text-xs text-stone-700 bg-[#fdfbf7] p-3.5 rounded-2xl border border-stone-200 font-medium leading-relaxed">
              {selectedPrediction.description}
            </p>

            {selectedPrediction.documentSections?.map((sec, idx) => (
              <div
                key={idx}
                className="border border-stone-200 rounded-3xl p-4 sm:p-5 bg-white space-y-3"
              >
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1c603a]" />
                  <span>{sec.title}</span>
                </h4>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                  {sec.content}
                </p>
                {sec.formula && (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs font-mono font-black text-amber-900 overflow-x-auto">
                    {sec.formula}
                  </div>
                )}
                {sec.keyPoints && (
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <span className="block text-[10px] font-black text-stone-400 uppercase tracking-tight">
                      ▽ 出題ポイント・セルフチェック
                    </span>
                    {sec.keyPoints.map((kp, kIdx) => (
                      <label
                        key={kIdx}
                        className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-slate-900 font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={!!checkedPoints[`pred-${selectedPrediction.id}-${idx}-${kIdx}`]}
                          onChange={() => toggleCheck(`pred-${selectedPrediction.id}-${idx}-${kIdx}`)}
                          className="mt-0.5 rounded text-[#1c603a] focus:ring-[#1c603a]"
                        />
                        <span>{kp}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Box */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="text-[10px] font-black text-[#1c603a] uppercase tracking-wider mb-0.5">
              ◎ 1-8 SITE PREDICTION ARCHIVE
            </div>
            <h2 className="text-lg font-black text-slate-900">
              定期考査 対策予想問題 ＆ 生徒自作問題共有
            </h2>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              AIが生成した頻出予想問題と、クラスメイトが自作・共有したテスト予想問題を解くことができます。
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setCurrentTab('edit')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-black transition-all cursor-pointer border border-stone-200"
            >
              <span>問題編集 (/edit)</span>
            </button>
          </div>
        </div>

        {/* 2. Top Segment Tabs: AI Exam Prediction vs Student Predictions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveSegment('list')}
            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
              activeSegment === 'list'
                ? 'border-[#1c603a] bg-white ring-2 ring-[#1c603a]/20 shadow-xs'
                : 'border-stone-300/80 bg-white hover:bg-stone-50'
            }`}
          >
            <div className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>EXAM PREDICTION</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              全教科 予想問題（AI作成）
            </div>
          </button>

          <button
            onClick={() => setActiveSegment('student_predictions')}
            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
              activeSegment === 'student_predictions'
                ? 'border-[#1c603a] bg-white ring-2 ring-[#1c603a]/20 shadow-xs'
                : 'border-stone-300/80 bg-white hover:bg-stone-50'
            }`}
          >
            <div className="text-xs font-black text-[#1c603a] uppercase tracking-wider flex items-center justify-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#1c603a]" />
              <span>STUDENT PREDICTIONS</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              みんなの予想問題（生徒作成）
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SEGMENT 1: AI GENERATED PREDICTED QUIZZES */}
      {/* ============================================================== */}
      {activeSegment === 'list' && (
        <div className="space-y-4">
          {isPlaying && activeQuiz ? (
            /* Interactive Quiz Runner Component */
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
              {/* Quiz Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                <div>
                  <button
                    onClick={backToList}
                    className="inline-flex items-center gap-1 text-xs font-black text-stone-500 hover:text-slate-900 mb-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>予想問題一覧に戻る</span>
                  </button>
                  <h2 className="text-lg font-black text-slate-900">{activeQuiz.title}</h2>
                  <p className="text-xs text-stone-500 font-medium">{activeQuiz.description}</p>
                </div>
              </div>

              {/* Quiz Questions Runner / Results */}
              {!isSubmitted ? (
                <div className="space-y-6">
                  {/* Progress Indicator */}
                  <div className="flex items-center justify-between text-xs font-black text-stone-500">
                    <span>
                      問題 {currentQIndex + 1} / {activeQuiz.questions.length}
                    </span>
                    <span>選択中: {selectedAnswers[currentQIndex] !== undefined ? '回答完了' : '未選択'}</span>
                  </div>

                  {/* Question Body */}
                  <div className="bg-[#fdfbf7] p-5 sm:p-6 rounded-2xl border border-stone-200 space-y-4">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-relaxed">
                      {activeQuiz.questions[currentQIndex]?.question}
                    </h3>

                    {/* Options */}
                    <div className="space-y-2.5">
                      {activeQuiz.questions[currentQIndex]?.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-3.5 sm:p-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                            selectedAnswers[currentQIndex] === idx
                              ? 'bg-[#1c603a] text-white border-[#1c603a] shadow-xs'
                              : 'bg-white hover:bg-stone-50 text-slate-800 border-stone-200'
                          }`}
                        >
                          <span>{opt}</span>
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${
                              selectedAnswers[currentQIndex] === idx
                                ? 'border-white bg-white/20 text-white font-black'
                                : 'border-stone-300 text-stone-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Footer */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQIndex === 0}
                      className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-black disabled:opacity-40 cursor-pointer"
                    >
                      前の問題
                    </button>

                    <button
                      onClick={handleNextOrSubmit}
                      disabled={selectedAnswers[currentQIndex] === undefined}
                      className="px-6 py-2.5 rounded-xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-40"
                    >
                      {currentQIndex === activeQuiz.questions.length - 1 ? '採点する' : '次の問題へ'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Quiz Submitted Results View */
                <div className="space-y-6 text-center animate-fadeIn">
                  <div className="p-6 bg-[#f4f8f5] rounded-3xl border border-[#1c603a]/30 space-y-2 max-w-md mx-auto">
                    <Award className="w-12 h-12 text-[#1c603a] mx-auto" />
                    <h3 className="text-xl font-black text-slate-900">採点結果</h3>
                    <div className="text-3xl font-black text-[#1c603a]">
                      {getMyQuizStanding(activeQuiz.id)?.myScore} / {activeQuiz.questions.length}点
                    </div>
                    <p className="text-xs text-stone-500 font-bold">
                      解答が完了しました！マイページにも記録が反映されています。
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={startQuiz.bind(null, activeQuiz.id)}
                      className="px-5 py-2.5 rounded-2xl bg-[#1c603a] text-white text-xs font-black shadow-xs hover:bg-[#154a2c] cursor-pointer"
                    >
                      もう一度挑戦する
                    </button>
                    <button
                      onClick={backToList}
                      className="px-5 py-2.5 rounded-2xl bg-stone-100 text-slate-700 text-xs font-black hover:bg-stone-200 cursor-pointer border border-stone-200"
                    >
                      予想問題一覧に戻る
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* AI Quizzes List & AI Generator Header */
            <div className="space-y-4">
              {/* Filter & Add AI Quiz Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-[#fdfbf7] border border-stone-200 hover:border-slate-800 text-xs font-black text-slate-800 shadow-2xs cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-stone-600" />
                  <span>
                    {selectedSubject === 'all'
                      ? '▽ 教科を選ぶ (すべて)'
                      : `▽ 教科: ${
                          allSubjects.find((s) => s.key === selectedSubject)?.label || selectedSubject
                        }`}
                  </span>
                </button>

                <button
                  onClick={() => setIsCreateOpen(!isCreateOpen)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black shadow-2xs transition-all cursor-pointer ${
                    isCreateOpen
                      ? 'bg-slate-900 text-white'
                      : 'bg-[#1c603a] text-white hover:bg-[#154a2c]'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreateOpen ? 'AIフォームを閉じる' : 'AIで新しい予想問題を追加'}</span>
                </button>
              </div>

              {/* Subject Filter Pills */}
              {isFilterOpen && (
                <div className="p-3 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-wrap items-center gap-1.5 animate-fadeIn">
                  <button
                    onClick={() => {
                      setSelectedSubject('all');
                      setIsFilterOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                      selectedSubject === 'all'
                        ? 'bg-[#1c603a] text-white'
                        : 'text-slate-700 hover:bg-stone-100'
                    }`}
                  >
                    すべて
                  </button>
                  {allSubjects.map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => {
                        setSelectedSubject(sub.key);
                        setIsFilterOpen(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                        selectedSubject === sub.key
                          ? 'bg-[#1c603a] text-white'
                          : 'text-slate-700 hover:bg-stone-100'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}

              {/* AI Prediction Generator Form */}
              {isCreateOpen && (
                <div className="bg-[#fdfbf7] p-5 sm:p-6 rounded-3xl border-2 border-[#1c603a]/40 shadow-xs space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <h3 className="text-sm sm:text-base font-black text-slate-900">
                        AIが過去問の傾向から定期テスト予想問題を自動作成
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {presets.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTextPrompt(p.text)}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-stone-100 text-[11px] font-black text-slate-700 border border-stone-200 transition-colors cursor-pointer"
                        >
                          ⚡ {p.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      placeholder="過去問の問題文や、テスト対策したい単元・重要テーマを入力してください。"
                      className="w-full p-3.5 rounded-2xl border border-stone-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1c603a]"
                    />
                  </div>

                  {analysisError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-black text-rose-700">
                      {analysisError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCreateNewPredictedQuiz}
                    disabled={isAnalyzing}
                    className="w-full py-3 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{isAnalyzing ? 'AIが過去問を分析＆予想問題作成中...' : '予想問題を生成して一覧に追加'}</span>
                  </button>
                </div>
              )}

              {/* AI Quizzes List */}
              <div className="space-y-3">
                {displayedQuizzes.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-stone-200/90 shadow-xs space-y-3">
                    <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
                    <p className="text-sm font-black text-slate-800">
                      該当する定期テスト予想問題がありません
                    </p>
                  </div>
                ) : (
                  displayedQuizzes.map((quiz) => {
                    const standing = getMyQuizStanding(quiz.id);
                    const hasTaken = standing && standing.myScore !== null;
                    const badge = getSubjectColorBadge(quiz.title, quiz.aiAnalysisSummary?.subject);

                    return (
                      <button
                        key={quiz.id}
                        onClick={() => startQuiz(quiz.id)}
                        className="w-full bg-white hover:bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs transition-all duration-150 flex items-center gap-4 text-left group cursor-pointer hover:border-slate-400 hover:shadow-sm"
                      >
                        <div
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0 flex flex-col items-center justify-center p-2 text-center shadow-2xs border ${badge.bg} ${badge.border}`}
                        >
                          <BookOpen className="w-6 h-6 mb-0.5 opacity-90" />
                          <span className="text-[10px] font-black tracking-tight leading-tight">
                            {badge.label}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-black text-slate-700">
                              定期テスト対策 · 制限時間 {quiz.durationMinutes}分
                            </span>
                            {hasTaken ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[#1c603a] text-[10px] font-extrabold flex items-center gap-0.5">
                                <Check className="w-3 h-3" />
                                <span>{standing.myScore}点 受験済</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-bold">
                                未受験 (全{quiz.questions.length}問)
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#1c603a] transition-colors truncate">
                            {quiz.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-500">
                            <span>◎ {quiz.aiAnalysisSummary?.unit || quiz.weekLabel}</span>
                          </div>
                        </div>

                        <div className="shrink-0 text-stone-300 group-hover:text-slate-800 transition-colors pr-1">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SEGMENT 2: STUDENT CREATED TEST PREDICTIONS ARCHIVE */}
      {/* ============================================================== */}
      {activeSegment === 'student_predictions' && (
        <div className="space-y-5">
          {/* Sub Header Box: Search, Subject Filters & Post Button */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
            {cloudSyncError && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-xs text-rose-900">
                <span>【同期エラー】 {cloudSyncError}</span>
                <button
                  onClick={handleManualSync}
                  disabled={isRetryingSync}
                  className="px-3 py-1 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  再同期
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-[#1c603a] uppercase tracking-wider">
                    ◎ STUDENT CREATED ARCHIVE
                  </span>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>全端末リアルタイム共有中 (Firestore)</span>
                  </div>
                </div>
                <h3 className="text-base font-black text-slate-900">
                  みんなの自作テスト予想問題アーカイブ
                </h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  クラスメイトが投稿したオリジナルの予想問題・直前チェックプリントです。
                </p>
              </div>

              <button
                onClick={() => {
                  setUploadError(null);
                  setIsUploadOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>＋ 自作の予想問題を投稿</span>
              </button>
            </div>

            {/* Search & Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={predSearchQuery}
                  onChange={(e) => setPredSearchQuery(e.target.value)}
                  placeholder="予想問題タイトル・投稿者名・教科で検索..."
                  className="w-full pl-9 pr-8 py-2.5 text-xs rounded-2xl bg-[#fdfbf7] border border-stone-200 focus:bg-white focus:border-[#1c603a] font-medium outline-none transition-all shadow-2xs"
                />
                {predSearchQuery && (
                  <button
                    onClick={() => setPredSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black text-stone-400">▽ 教科で絞り込む</span>
                  <span className="text-xs font-bold text-stone-500">
                    {filteredStudentPredictions.length}件の予想問題
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {subjectsConfig.map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => setPredSubject(sub.key)}
                      className={`px-3.5 py-1.5 text-xs font-black rounded-2xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        predSubject === sub.key
                          ? 'bg-[#1c603a] text-white shadow-xs'
                          : 'bg-[#fdfbf7] hover:bg-stone-100 text-slate-700 border border-stone-200'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Predictions Grid */}
          {filteredStudentPredictions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
              <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-black text-slate-800">
                {predSearchQuery
                  ? `「${predSearchQuery}」に一致する自作予想問題が見つかりませんでした`
                  : '生徒作成の予想問題がまだ投稿されていません'}
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                上の「＋ 自作の予想問題を投稿」ボタンから、自作の予想問題プリントや手書きノート画像を投稿してください。
              </p>
              <button
                onClick={() => {
                  setUploadError(null);
                  setIsUploadOpen(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#1c603a] text-white text-xs font-black shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>最初の予想問題を投稿する</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Predictions Cards List */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-500 px-1 font-black">
                  <span>◎ 生徒作成 予想問題一覧</span>
                  <span className="lg:hidden text-[11px] text-[#1c603a] font-bold">
                    ※ タップしてプレビューを表示
                  </span>
                  <span className="hidden lg:inline">{filteredStudentPredictions.length}件</span>
                </div>

                <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                  {filteredStudentPredictions.map((pred) => {
                    const isSelected = selectedPrediction?.id === pred.id;
                    const authorName =
                      (pred.authorStudentNumber &&
                        students.find((s) => s.attendanceNumber === pred.authorStudentNumber)
                          ?.nickname) ||
                      pred.authorNickname;

                    const typeIcon =
                      pred.fileType === 'pdf' ? (
                        <FileText className="w-4 h-4 text-rose-500" />
                      ) : pred.fileType === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-sky-500" />
                      ) : (
                        <FileCode className="w-4 h-4 text-emerald-500" />
                      );

                    return (
                      <button
                        key={pred.id}
                        onClick={() => handlePredCardClick(pred.id)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3.5 group ${
                          isSelected
                            ? 'bg-[#f4f8f5] border-2 border-[#1c603a] shadow-xs'
                            : 'bg-white hover:bg-[#fdfbf7] border-stone-200/90 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                            {pred.imageUrl && !pred.imageUrl.startsWith('data:application/pdf') ? (
                              <img
                                src={pred.imageUrl}
                                alt={pred.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              typeIcon
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-black text-stone-400 uppercase tracking-tight flex items-center gap-1.5">
                              <span>{pred.fileType.toUpperCase()}</span>
                              <span aria-hidden="true">·</span>
                              <span>{pred.fileSize}</span>
                            </div>

                            <h3 className="text-sm font-black leading-snug my-0.5 text-slate-900 truncate group-hover:text-[#1c603a] transition-colors">
                              {pred.title}
                            </h3>

                            <div className="text-[11px] text-[#1c603a] font-black flex items-center gap-1 mt-0.5">
                              <span>◎ {subjectsConfig.find((s) => s.key === pred.subject)?.label}</span>
                              <span aria-hidden="true">·</span>
                              <span className="text-stone-500 font-bold truncate">{authorName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="lg:hidden shrink-0 flex items-center text-stone-400 group-hover:text-[#1c603a] transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Desktop Permanent Preview (LG ONLY) */}
              <div className="hidden lg:block lg:col-span-8">
                <div
                  className={`transition-all ${
                    isFullscreenPreview
                      ? 'fixed inset-4 z-50 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-400 overflow-y-auto max-w-5xl mx-auto'
                      : 'bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs'
                  }`}
                >
                  {selectedPrediction ? (
                    renderPredPreviewContent(false)
                  ) : (
                    <div className="p-12 text-center text-stone-400 font-bold text-xs">
                      予想問題を選択してください
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Slide-Up Modal Sheet (< LG) */}
      {isMobileDetailOpen && selectedPrediction && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn"
          onClick={() => setIsMobileDetailOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl max-h-[90vh] w-full flex flex-col shadow-2xl border-t border-stone-200 animate-slideUp overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-2.5 pb-2 px-5 border-b border-stone-100 bg-[#fdfbf7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#1c603a]" />
                <span className="text-xs font-black text-slate-900">
                  {subjectsConfig.find((s) => s.key === selectedPrediction.subject)?.label} · 自作予想問題詳細
                </span>
              </div>
              <button
                onClick={() => setIsMobileDetailOpen(false)}
                className="p-1.5 rounded-full bg-stone-200/80 hover:bg-stone-300 text-slate-700 transition-all cursor-pointer flex items-center gap-1 text-xs font-black"
              >
                <span className="text-[11px] px-1">閉じる</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {renderPredPreviewContent(true)}

              <div className="pt-4 pb-2 border-t border-stone-100">
                <button
                  onClick={() => setIsMobileDetailOpen(false)}
                  className="w-full py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>予想問題一覧に戻る</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal for Student Prediction */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-300 shadow-2xl space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#1c603a]" />
                <span>＋ 自作テスト予想問題の投稿</span>
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccess ? (
              <div className="p-6 text-center text-emerald-800 bg-[#f4f8f5] rounded-3xl border border-[#1c603a] font-black text-sm space-y-2">
                <Check className="w-8 h-8 text-[#1c603a] mx-auto" />
                <div>投稿が完了しました！全端末に自動共有されました。</div>
              </div>
            ) : (
              <form onSubmit={handlePredUploadSubmit} className="space-y-4">
                {uploadError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-black text-rose-900">予想問題の投稿に失敗しました</div>
                      <div className="font-medium text-rose-700 break-words">{uploadError}</div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">タイトル</label>
                  <input
                    type="text"
                    placeholder="例: 【化学基礎】中間考査直前・酸化還元反応 予想プリント"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white font-bold focus:border-[#1c603a] focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">教科</label>
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value as MaterialSubject)}
                      className="w-full text-xs border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] font-black focus:border-[#1c603a] focus:outline-none cursor-pointer"
                    >
                      {allSubjects.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">形式</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as 'pdf' | 'image' | 'summary')}
                      className="w-full text-xs border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] font-black focus:border-[#1c603a] focus:outline-none cursor-pointer"
                    >
                      <option value="image">画像 (JPG/PNG)</option>
                      <option value="pdf">PDF文書</option>
                      <option value="summary">要点テキスト</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">説明・想定範囲</label>
                  <textarea
                    rows={2}
                    placeholder="予想問題の出題範囲や対象テストを簡単に記入してください"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white font-medium focus:border-[#1c603a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    予想問題プリント画像・PDFファイル選択
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={handlePredFileChange}
                    className="w-full text-xs border border-stone-300 rounded-2xl p-2.5 bg-[#fdfbf7] font-bold cursor-pointer"
                  />
                  {uploadedFilePreview && (
                    <div className="mt-2 p-3 bg-stone-100 rounded-2xl text-center border border-stone-200">
                      {newType === 'pdf' ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-black text-rose-600 py-2">
                          <FileText className="w-5 h-5" />
                          <span>PDFファイル選択済み: {uploadedFileName || '予想問題.pdf'}</span>
                        </div>
                      ) : (
                        <img
                          src={uploadedFilePreview}
                          alt="Preview"
                          className="max-h-32 mx-auto rounded-xl object-contain"
                        />
                      )}
                      <span className="text-[10px] text-[#1c603a] font-black block mt-1">
                        ◎ ファイルを認識しました（自動保存されます）
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    解法・重要ポイント解説
                  </label>
                  <textarea
                    rows={3}
                    placeholder="問題の解説や、解答時の注意点を入力してください"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white font-medium focus:border-[#1c603a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">重要公式・要点（任意）</label>
                  <input
                    type="text"
                    placeholder="例: KMnO4 + 8H+ + 5e- -> Mn2+ + 4H2O"
                    value={newFormula}
                    onChange={(e) => setNewFormula(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white font-mono font-bold focus:border-[#1c603a] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-black cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? '保存中...' : '投稿して全クラス共有'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
