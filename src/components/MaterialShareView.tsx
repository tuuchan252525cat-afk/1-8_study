import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MaterialSubject } from '../types';
import {
  FileText,
  Image as ImageIcon,
  FileCode,
  Plus,
  X,
  Check,
  Printer,
  Maximize2,
  Minimize2,
  Upload,
  BookOpen,
  Download,
  Trash2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';

export const MaterialShareView: React.FC = () => {
  const {
    materials,
    addMaterial,
    deleteMaterial,
    setCurrentTab,
    allSubjects,
    cloudSyncStatus,
    cloudSyncError,
    retryCloudSync,
  } = useApp();

  const [activeSubject, setActiveSubject] = useState<MaterialSubject>('all');
  const [activeMaterialId, setActiveMaterialId] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRetryingSync, setIsRetryingSync] = useState<boolean>(false);

  // View mode: 'image' (JPG/PDF image sheet) vs 'text' (digital sections)
  const [viewMode, setViewMode] = useState<'image' | 'text'>('image');

  // Upload form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState<MaterialSubject>('math');
  const [newType, setNewType] = useState<'pdf' | 'image' | 'summary'>('image');
  const [newDesc, setNewDesc] = useState('');
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [newSectionTitle, setNewSectionTitle] = useState('第1章：基本のポイント');
  const [newContent, setNewContent] = useState('');
  const [newFormula, setNewFormula] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Student self-check list state
  const [checkedPoints, setCheckedPoints] = useState<Record<string, boolean>>({});

  const subjectsConfig: { key: MaterialSubject; label: string }[] = [
    { key: 'all', label: 'すべて' },
    ...allSubjects.map((s) => ({ key: s.key as MaterialSubject, label: s.label })),
  ];

  const filteredMaterials =
    activeSubject === 'all'
      ? materials
      : materials.filter((m) => m.subject === activeSubject);

  const selectedMaterial =
    materials.find((m) => m.id === activeMaterialId) || filteredMaterials[0] || materials[0];

  // Reset image error state whenever selected material changes
  useEffect(() => {
    setImgError(false);
  }, [selectedMaterial?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          `PDFサイズが大きすぎます (${sizeInMb} MB)。Firestore同期の制限(1MB)を超える可能性があるため、800KB以下のファイルを選択するか画像としてアップロードしてください。`
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
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

      await addMaterial({
        title: newTitle.trim(),
        subject: newSubject,
        description: newDesc.trim() || '定期テスト問題用紙・対策プリント',
        fileType: finalType,
        fileSize: finalSize,
        imageUrl: isPdf ? undefined : (uploadedFilePreview || undefined),
        pdfUrl: isPdf ? (uploadedFilePreview || undefined) : undefined,
        contentPreview: newContent.trim() || '定期考査の実物問題用紙プレビューです。',
        documentSections: [
          {
            title: newSectionTitle.trim() || '問題構成と要点',
            content:
              newContent.trim() ||
              '問題用紙の実物画像・PDFを確認し、各設問の配点と時間配分を意識して演習してください。',
            formula: newFormula.trim() || undefined,
            keyPoints: [
              '大問ごとの時間配分（大問1: 10分、大問2: 15分）を守る',
              '計算ミスしやすい箇所を最後に必ず検算する',
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
      console.error('Upload failed:', err);
      setUploadError(err?.message || 'アップロードとクラウド同期に失敗しました');
      setIsSaving(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (window.confirm('この教材を削除してもよろしいですか？（クラウドからも削除されます）')) {
      try {
        await deleteMaterial(id);
        if (activeMaterialId === id) {
          const remaining = materials.filter((m) => m.id !== id);
          if (remaining.length > 0) {
            setActiveMaterialId(remaining[0].id);
          } else {
            setActiveMaterialId('');
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

  // Determine if active material is a PDF
  const isSelectedPdf =
    selectedMaterial &&
    (selectedMaterial.fileType === 'pdf' ||
      Boolean(selectedMaterial.pdfUrl) ||
      selectedMaterial.imageUrl?.startsWith('data:application/pdf') ||
      selectedMaterial.imageUrl?.toLowerCase().endsWith('.pdf'));

  const activePdfSource = selectedMaterial?.pdfUrl || selectedMaterial?.imageUrl;

  return (
    <div className="space-y-6">
      {/* 1. Header & Subject Filter */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
        {/* Cloud Sync Error Alert Banner */}
        {cloudSyncError && (
          <div className="p-3.5 sm:p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-900 animate-fadeIn">
            <div className="flex items-start sm:items-center gap-2.5 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-black text-rose-900">【Firestore同期エラー】</span>
                <span className="text-rose-800 ml-1 font-medium">{cloudSyncError}</span>
              </div>
            </div>
            <button
              onClick={handleManualSync}
              disabled={isRetryingSync}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingSync ? 'animate-spin' : ''}`} />
              <span>データを再同期</span>
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black text-[#1c603a] uppercase tracking-wider">
                ◎ 1-8 SITE ARCHIVE
              </span>
              {/* Cloud Sync Indicator Pill */}
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                  cloudSyncStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
                title="Firebase Firestoreリアルタイム同期状態"
              >
                {cloudSyncStatus === 'connected' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>全端末同期中 (Firestore)</span>
                  </>
                ) : cloudSyncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-600" />
                    <span>同期中...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5 text-rose-600" />
                    <span>同期未接続</span>
                  </>
                )}
              </div>
            </div>
            <h2 className="text-lg font-black text-slate-900">定期テスト問題用紙 ＆ 教材ビューア</h2>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              どの端末から投稿しても全校生徒・全端末で共有されます（Firebase Firestoreリアルタイム連携）。
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={handleManualSync}
              disabled={isRetryingSync}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-black transition-all cursor-pointer border border-stone-200"
              title="クラウドから最新データを取得"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingSync ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">再同期</span>
            </button>

            <button
              onClick={() => setCurrentTab('edit')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-black transition-all cursor-pointer border border-stone-200"
              title="小テストや定期テストの編集"
            >
              <span>問題編集 (/edit)</span>
            </button>

            <button
              onClick={() => {
                setUploadError(null);
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>テスト用紙・画像を追加</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div>
          <span className="block text-[11px] font-black text-stone-400 mb-1.5">▽ 科目を選ぶ</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {subjectsConfig.map((sub) => (
              <button
                key={sub.key}
                onClick={() => setActiveSubject(sub.key)}
                className={`px-3.5 py-1.5 text-xs font-black rounded-2xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSubject === sub.key
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

      {/* 2. Main Viewer & Archive Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-black text-slate-800">
            登録されている問題用紙・教材がありません
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            「テスト用紙・画像を追加」ボタンから過去のテスト問題用紙や解説プリントを追加してください。
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#1c603a] text-white text-xs font-black shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>テスト用紙を追加する</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Material Cards List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500 px-1 font-black">
              <span>◎ 問題用紙・教材一覧</span>
              <span>{filteredMaterials.length}件</span>
            </div>

            <div className="space-y-2.5">
              {filteredMaterials.map((mat) => {
                const isSelected = selectedMaterial?.id === mat.id;
                const typeIcon =
                  mat.fileType === 'pdf' ? (
                    <FileText className="w-4 h-4 text-rose-500" />
                  ) : mat.fileType === 'image' ? (
                    <ImageIcon className="w-4 h-4 text-sky-500" />
                  ) : (
                    <FileCode className="w-4 h-4 text-emerald-500" />
                  );

                return (
                  <button
                    key={mat.id}
                    onClick={() => setActiveMaterialId(mat.id)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-[#f4f8f5] border-2 border-[#1c603a] shadow-xs'
                        : 'bg-white hover:bg-[#fdfbf7] border-stone-200/90 shadow-2xs'
                    }`}
                  >
                    {/* Left Thumbnail / Icon badge */}
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                      {mat.imageUrl && !mat.imageUrl.startsWith('data:application/pdf') ? (
                        <img
                          src={mat.imageUrl}
                          alt={mat.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if thumbnail fails
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        typeIcon
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black text-stone-400 uppercase tracking-tight flex items-center gap-1.5">
                        <span>{mat.fileType.toUpperCase()}</span>
                        <span aria-hidden="true">·</span>
                        <span>{mat.fileSize}</span>
                      </div>

                      <h3 className="text-sm font-black leading-snug my-0.5 text-slate-900 truncate">
                        {mat.title}
                      </h3>

                      <div className="text-[11px] text-[#1c603a] font-black flex items-center gap-1 mt-0.5">
                        <span>◎ {subjectsConfig.find((s) => s.key === mat.subject)?.label}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-stone-500 font-bold truncate">{mat.authorNickname}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Direct Live JPG / PDF Document Paper Preview */}
          <div
            className={`lg:col-span-8 transition-all ${
              isFullscreenPreview
                ? 'fixed inset-4 z-50 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-400 overflow-y-auto max-w-5xl mx-auto'
                : 'bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs'
            }`}
          >
            {selectedMaterial ? (
              <div className="space-y-5">
                {/* Top View Mode Switcher & Tools */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
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

                  <div className="flex items-center gap-2 self-end sm:self-auto">
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
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-black transition-all cursor-pointer border border-stone-200"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>印刷</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(selectedMaterial.id)}
                      className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-stone-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-stone-500 text-xs font-black transition-all cursor-pointer border border-stone-200"
                      title="この教材を削除する"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">削除</span>
                    </button>
                  </div>
                </div>

                {/* Main Content Area: Image Sheet View vs Text Summary View */}
                {viewMode === 'image' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
                      <span className="font-black text-slate-800">{selectedMaterial.title}</span>
                      <span>
                        ファイル形式: {selectedMaterial.fileType.toUpperCase()} (
                        {selectedMaterial.fileSize})
                      </span>
                    </div>

                    {/* PDF Viewer */}
                    {isSelectedPdf && activePdfSource ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-100 rounded-2xl border border-stone-200">
                          <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                            <FileText className="w-4 h-4 text-rose-500" />
                            <span>PDF文書プレビュー</span>
                            <span className="text-[10px] text-stone-500 font-bold">
                              ({selectedMaterial.fileSize})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={activePdfSource}
                              download={`${selectedMaterial.title}.pdf`}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-200 border border-stone-300 text-slate-800 font-bold text-xs shadow-2xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>ダウンロード</span>
                            </a>
                            <a
                              href={activePdfSource}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1c603a] hover:bg-[#154a2c] text-white font-bold text-xs shadow-2xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>全画面で開く</span>
                            </a>
                          </div>
                        </div>

                        <div className="border border-stone-200 rounded-3xl overflow-hidden shadow-sm bg-stone-50 h-[600px] sm:h-[700px]">
                          <iframe
                            src={activePdfSource}
                            className="w-full h-full border-0"
                            title={selectedMaterial.title}
                          />
                        </div>
                      </div>
                    ) : imgError ? (
                      /* Image Load Error Fallback */
                      <div className="p-8 sm:p-12 text-center bg-[#fdfbf7] rounded-3xl border border-stone-200 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800">
                          プレビュー画像を表示できませんでした
                        </h4>
                        <p className="text-xs text-stone-500 max-w-md mx-auto">
                          ファイルがPDF形式であるか、ブラウザで直接プレビューできない画像形式（HEIC等）の可能性があります。ダウンロードするか、解説テキストをご確認ください。
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          {selectedMaterial.imageUrl && (
                            <a
                              href={selectedMaterial.imageUrl}
                              download={selectedMaterial.title}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>ファイルを保存 / 開く</span>
                            </a>
                          )}
                          <button
                            onClick={() => setViewMode('text')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-slate-800 text-xs font-black shadow-xs cursor-pointer"
                          >
                            <span>要点・解説を見る</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(selectedMaterial.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>この教材を削除</span>
                          </button>
                        </div>
                      </div>
                    ) : selectedMaterial.imageUrl ? (
                      /* Image View */
                      <div className="border border-stone-200 rounded-3xl overflow-hidden bg-slate-900 shadow-inner p-3 sm:p-5 text-center min-h-[350px] flex items-center justify-center">
                        <img
                          src={selectedMaterial.imageUrl}
                          alt={selectedMaterial.title}
                          onError={() => setImgError(true)}
                          className="max-h-[650px] w-auto max-w-full mx-auto object-contain rounded-2xl shadow-md bg-white"
                        />
                      </div>
                    ) : (
                      /* Empty Placeholder */
                      <div className="p-12 text-center bg-[#fdfbf7] rounded-3xl border border-stone-200 space-y-2">
                        <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
                        <p className="text-sm font-black text-slate-800">画像プレビューがありません</p>
                        <p className="text-xs text-stone-500">{selectedMaterial.contentPreview}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Digital Summary Sections View */
                  <div className="space-y-4">
                    <h3 className="text-base font-black text-slate-900">{selectedMaterial.title}</h3>
                    <p className="text-xs text-stone-700 bg-[#fdfbf7] p-3.5 rounded-2xl border border-stone-200 font-medium">
                      {selectedMaterial.description}
                    </p>

                    {selectedMaterial.documentSections?.map((sec, idx) => (
                      <div key={idx} className="border border-stone-200 rounded-3xl p-5 bg-white space-y-3">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1c603a]" />
                          <span>{sec.title}</span>
                        </h4>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                          {sec.content}
                        </p>
                        {sec.formula && (
                          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs font-mono font-black text-amber-900">
                            {sec.formula}
                          </div>
                        )}
                        {sec.keyPoints && (
                          <div className="space-y-2 pt-2 border-t border-stone-100">
                            {sec.keyPoints.map((kp, kIdx) => (
                              <label
                                key={kIdx}
                                className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-slate-900 font-medium"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!checkedPoints[`${selectedMaterial.id}-${idx}-${kIdx}`]}
                                  onChange={() => toggleCheck(`${selectedMaterial.id}-${idx}-${kIdx}`)}
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
            ) : null}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-300 shadow-2xl space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#1c603a]" />
                <span>問題用紙・教材の追加アップロード</span>
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
                <div>追加が完了しました！データを自動保存しました。</div>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {uploadError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-black text-rose-900">教材の保存・共有に失敗しました</div>
                      <div className="font-medium text-rose-700 break-words">{uploadError}</div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">タイトル</label>
                  <input
                    type="text"
                    placeholder="例: 【数学】二次関数の動く区間・最大最小プリント"
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
                      <option value="summary">まとめテキスト</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">説明・概要</label>
                  <textarea
                    rows={2}
                    placeholder="教材や問題用紙の概要を簡単に記入してください"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white font-medium focus:border-[#1c603a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    問題用紙・ファイル画像の選択（JPG, PNG, PDF）
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs border border-stone-300 rounded-2xl p-2.5 bg-[#fdfbf7] font-bold cursor-pointer"
                  />
                  {uploadedFilePreview && (
                    <div className="mt-2 p-3 bg-stone-100 rounded-2xl text-center border border-stone-200">
                      {newType === 'pdf' ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-black text-rose-600 py-2">
                          <FileText className="w-5 h-5" />
                          <span>PDFファイル選択済み: {uploadedFileName || 'ドキュメント.pdf'}</span>
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
                  <label className="block text-xs font-black text-slate-700 mb-1.5">解説・ポイント本文</label>
                  <textarea
                    rows={3}
                    placeholder="解き方の重要公式や注意点を入力してください"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white font-medium focus:border-[#1c603a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">重要公式（任意）</label>
                  <input
                    type="text"
                    placeholder="例: y = a(x - p)^2 + q"
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
                    {isSaving ? '保存中...' : '登録して共有する'}
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
