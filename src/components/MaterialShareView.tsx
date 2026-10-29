import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudyMaterial, MaterialSubject } from '../types';
import {
  FileText,
  Image as ImageIcon,
  FileCode,
  Eye,
  Plus,
  X,
  Check,
  Printer,
  Maximize2,
  Minimize2,
  Upload,
} from 'lucide-react';
import { MATH_EXAM_PAPER_JPG, SCIENCE_EXAM_PAPER_JPG, ENGLISH_EXAM_PAPER_JPG } from '../utils/sampleTestPapers';

export const MaterialShareView: React.FC = () => {
  const { materials, addMaterial, currentStudent, setCurrentTab } = useApp();

  const [activeSubject, setActiveSubject] = useState<MaterialSubject>('all');
  const [activeMaterialId, setActiveMaterialId] = useState<string>(materials[0]?.id || '');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);

  // View mode: 'image' (JPG/PDF image sheet) vs 'text' (digital sections)
  const [viewMode, setViewMode] = useState<'image' | 'text'>('image');

  // Upload form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState<MaterialSubject>('math');
  const [newType, setNewType] = useState<'pdf' | 'image' | 'summary'>('image');
  const [newDesc, setNewDesc] = useState('');
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string>('');
  const [newSectionTitle, setNewSectionTitle] = useState('第1章：基本のポイント');
  const [newContent, setNewContent] = useState('');
  const [newFormula, setNewFormula] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Student self-check list state
  const [checkedPoints, setCheckedPoints] = useState<Record<string, boolean>>({});

  const subjectsConfig: { key: MaterialSubject; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'japanese', label: '国語' },
    { key: 'math', label: '数学' },
    { key: 'english', label: '英語' },
    { key: 'science', label: '理科' },
    { key: 'social', label: '社会' },
    { key: 'other', label: 'その他' },
  ];

  const filteredMaterials =
    activeSubject === 'all'
      ? materials
      : materials.filter((m) => m.subject === activeSubject);

  const selectedMaterial =
    materials.find((m) => m.id === activeMaterialId) || filteredMaterials[0] || materials[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedFilePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Use uploaded file or fallback to sample based on subject
    const defaultImg =
      newSubject === 'science'
        ? SCIENCE_EXAM_PAPER_JPG
        : newSubject === 'english'
        ? ENGLISH_EXAM_PAPER_JPG
        : MATH_EXAM_PAPER_JPG;

    const imgToSave = uploadedFilePreview || defaultImg;

    addMaterial({
      title: newTitle.trim(),
      subject: newSubject,
      description: newDesc.trim() || '定期テスト問題用紙・対策プリント',
      fileType: newType,
      fileSize: newType === 'pdf' ? '1.4 MB' : newType === 'image' ? '2.3 MB' : '450 KB',
      imageUrl: imgToSave,
      contentPreview: newContent.trim() || '定期考査の実物問題用紙プレビューです。',
      documentSections: [
        {
          title: newSectionTitle.trim() || '問題構成と要点',
          content: newContent.trim() || '問題用紙の実物画像を確認し、各設問の配点と時間配分を意識して演習してください。',
          formula: newFormula.trim() || undefined,
          keyPoints: ['大問ごとの時間配分（大問1: 10分、大問2: 15分）を守る', '計算ミスしやすい箇所を最後に必ず検算する'],
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
    }, 800);
  };

  const toggleCheck = (id: string) => {
    setCheckedPoints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Subject Filter */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                ダウンロード不要 · JPG/PDF実物プレビュー
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">定期テスト問題用紙 ＆ 教材ビューア</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              定期テストの実物問題用紙（JPG/PDF画像データ）をダウンロードなしでそのまま画面上で閲覧できます。
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => setCurrentTab('edit')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="小テストや定期テストの編集"
            >
              <span>問題編集 (/edit)</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>テスト用紙・画像を追加</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-4 overflow-x-auto pb-1">
          {subjectsConfig.map((sub) => (
            <button
              key={sub.key}
              onClick={() => setActiveSubject(sub.key)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeSubject === sub.key
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main 2-Column Split: Material Cards (Left) + Direct Exam Image / PDF Previewer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Material Cards List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>問題用紙・教材一覧</span>
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
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-300/60 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-1.5">
                    <span className="font-semibold text-slate-700">
                      {subjectsConfig.find((s) => s.key === mat.subject)?.label}
                    </span>
                    <span className="flex items-center gap-1">
                      {typeIcon}
                      <span className="uppercase text-[10px] font-bold text-slate-500">
                        {mat.fileType}
                      </span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1 line-clamp-1">
                    {mat.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                    {mat.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100/80">
                    <span>共有: {mat.authorNickname}</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <Eye className="w-3.5 h-3.5" />
                      <span>実物画像を表示中</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Direct Live JPG / PDF Document Paper Preview (8 cols) */}
        <div
          className={`lg:col-span-8 transition-all ${
            isFullscreenPreview
              ? 'fixed inset-4 z-50 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-300 overflow-y-auto max-w-5xl mx-auto'
              : 'bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs'
          }`}
        >
          {selectedMaterial ? (
            <div className="space-y-5">
              {/* Top View Mode Switcher & Tools */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setViewMode('image')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        viewMode === 'image'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>JPG / PDF 画像実物プレビュー</span>
                    </button>
                    <button
                      onClick={() => setViewMode('text')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        viewMode === 'text'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      <span>要点・公式解説</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                    title={isFullscreenPreview ? '通常表示に戻す' : '全画面拡大表示'}
                  >
                    {isFullscreenPreview ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title="印刷"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>印刷</span>
                  </button>
                </div>
              </div>

              {/* Title Header */}
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {subjectsConfig.find((s) => s.key === selectedMaterial.subject)?.label}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>共有者: {selectedMaterial.authorNickname}</span>
                  <span aria-hidden="true">·</span>
                  <span>更新: {selectedMaterial.createdAt}</span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedMaterial.title}
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {selectedMaterial.description}
                </p>
              </div>

              {/* View Mode 1: ACTUAL JPG / PDF IMAGE TEST SHEET DISPLAY */}
              {viewMode === 'image' && (
                <div className="space-y-3">
                  <div className="bg-slate-100/80 rounded-2xl p-2 sm:p-4 border border-slate-200 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-[11px] text-slate-500 pb-2 px-1 border-b border-slate-200/80 mb-3">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>定期テスト実物問題用紙</span>
                      </span>
                      <span>1 / 2 ページ · A4等倍プレビュー</span>
                    </div>

                    {/* The Actual Rendered Exam Paper Image / PDF */}
                    <div className="w-full max-w-2xl bg-white p-2 rounded-xl shadow-md border border-slate-300 overflow-hidden">
                      <img
                        src={
                          selectedMaterial.imageUrl ||
                          (selectedMaterial.subject === 'science'
                            ? SCIENCE_EXAM_PAPER_JPG
                            : selectedMaterial.subject === 'english'
                            ? ENGLISH_EXAM_PAPER_JPG
                            : MATH_EXAM_PAPER_JPG)
                        }
                        alt={selectedMaterial.title}
                        className="w-full h-auto rounded border border-slate-100 object-contain max-h-[750px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* View Mode 2: DIGITAL TEXT & FORMULA SECTIONS */}
              {viewMode === 'text' && (
                <div className="space-y-4">
                  {selectedMaterial.documentSections && selectedMaterial.documentSections.length > 0 ? (
                    selectedMaterial.documentSections.map((section, sIdx) => (
                      <section
                        key={sIdx}
                        className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100 space-y-3"
                      >
                        <h4 className="text-sm font-bold text-slate-900 border-l-4 border-emerald-500 pl-2.5">
                          {section.title}
                        </h4>

                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {section.content}
                        </p>

                        {section.formula && (
                          <div className="p-3 bg-white rounded-xl border border-emerald-200/80 font-mono text-xs text-emerald-900 shadow-2xs">
                            <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">
                              重要公式・構文
                            </span>
                            <span className="font-semibold">{section.formula}</span>
                          </div>
                        )}

                        {section.keyPoints && section.keyPoints.length > 0 && (
                          <div className="pt-2">
                            <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                              重要チェックポイント:
                            </span>
                            <div className="space-y-1.5">
                              {section.keyPoints.map((point, pIdx) => {
                                const checkKey = `${selectedMaterial.id}-${sIdx}-${pIdx}`;
                                const isChecked = !!checkedPoints[checkKey];
                                return (
                                  <button
                                    key={pIdx}
                                    onClick={() => toggleCheck(checkKey)}
                                    className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                      isChecked
                                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-medium'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <span>{point}</span>
                                    <span
                                      className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] shrink-0 ${
                                        isChecked
                                          ? 'border-emerald-600 bg-emerald-600 text-white font-bold'
                                          : 'border-slate-300 text-transparent'
                                      }`}
                                    >
                                      ✓
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </section>
                    ))
                  ) : (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedMaterial.contentPreview || '教材本文データです。'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              左側の一覧から教材を選択してください
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal with File Picker */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">定期テスト用紙・画像の追加</h3>
            <p className="text-xs text-slate-500 mb-4">
              PDFやJPGなどの問題用紙画像データをそのままページ上に直接表示できます。
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">タイトル</label>
                <input
                  type="text"
                  placeholder="例: 【数学】10月定期考査 二次関数 実物問題用紙"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">科目</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value as MaterialSubject)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="math">数学</option>
                    <option value="science">理科</option>
                    <option value="english">英語</option>
                    <option value="japanese">国語</option>
                    <option value="social">社会</option>
                    <option value="other">その他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">データ形式</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="image">JPG / PNG 画像データ</option>
                    <option value="pdf">PDF形式プリント</option>
                    <option value="summary">要点テキスト</option>
                  </select>
                </div>
              </div>

              {/* Direct File Picker (JPG / PNG / PDF) */}
              <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                <Upload className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                <label className="block text-xs font-bold text-slate-800 cursor-pointer">
                  <span>端末から画像・PDFファイルを選択</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  JPG, PNG, WebP, PDFファイルに対応（選択しない場合は教科の模試用紙が自動設定されます）
                </p>

                {uploadedFilePreview && (
                  <div className="mt-3 p-2 bg-white rounded-xl border border-emerald-200 inline-flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>ファイル読み込み完了！実物プレビューされます</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">概要・試験情報</label>
                <input
                  type="text"
                  placeholder="例: 制限時間50分・大問3題構成の校内実力テスト本紙です"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">解説・要点メモ</label>
                <textarea
                  rows={2}
                  placeholder="出題意図や注目すべきポイントがあれば入力してください"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={uploadSuccess}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {uploadSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      追加完了！
                    </>
                  ) : (
                    'テスト用紙を追加する'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
