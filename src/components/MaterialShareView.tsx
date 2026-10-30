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
  BookOpen,
} from 'lucide-react';

export const MaterialShareView: React.FC = () => {
  const { materials, addMaterial, currentStudent, setCurrentTab } = useApp();

  const [activeSubject, setActiveSubject] = useState<MaterialSubject>('all');
  const [activeMaterialId, setActiveMaterialId] = useState<string>('');
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
  const [isSaving, setIsSaving] = useState(false);

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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await addMaterial({
        title: newTitle.trim(),
        subject: newSubject,
        description: newDesc.trim() || '定期テスト問題用紙・対策プリント',
        fileType: newType,
        fileSize: newType === 'pdf' ? '1.4 MB' : newType === 'image' ? '2.3 MB' : '450 KB',
        imageUrl: uploadedFilePreview || undefined,
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
        setIsSaving(false);
      }, 800);
    } catch (err) {
      console.error('Upload failed:', err);
      setIsSaving(false);
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedPoints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Subject Filter */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-300/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">定期テスト問題用紙 ＆ 教材ビューア</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              定期テストの問題用紙や対策プリントを閲覧・共有できます。
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => setCurrentTab('edit')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer border border-slate-200"
              title="小テストや定期テストの編集"
            >
              <span>問題編集 (/edit)</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
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
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeSubject === sub.key
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300/80'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Area: Empty State vs 2-Column Split */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-300/80 shadow-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
            <Upload className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">教材・問題用紙がまだありません</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              定期テストの実物問題用紙や対策プリントをアップロードしましょう。追加した教材はサイトを離れても自動保存されます。
            </p>
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>最初の教材・テスト用紙を追加する</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Material Cards List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
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
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-300/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs mb-1.5 opacity-90">
                      <span className={`font-bold ${isSelected ? 'text-amber-300' : 'text-slate-700'}`}>
                        {subjectsConfig.find((s) => s.key === mat.subject)?.label}
                      </span>
                      <span className="flex items-center gap-1">
                        {typeIcon}
                        <span className="uppercase text-[10px] font-bold">
                          {mat.fileType}
                        </span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold leading-snug mb-1 line-clamp-1">
                      {mat.title}
                    </h3>

                    <p className={`text-xs line-clamp-2 mb-2 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {mat.description}
                    </p>

                    <div className={`flex items-center justify-between text-[11px] pt-2 border-t ${isSelected ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-400'}`}>
                      <span>共有: {mat.authorNickname}</span>
                      <span className={`flex items-center gap-1 font-semibold ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        <Eye className="w-3.5 h-3.5" />
                        <span>プレビュー表示</span>
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
                ? 'fixed inset-4 z-50 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-400 overflow-y-auto max-w-5xl mx-auto'
                : 'bg-white rounded-3xl p-5 sm:p-7 border border-slate-300/80 shadow-md'
            }`}
          >
            {selectedMaterial ? (
              <div className="space-y-5">
                {/* Top View Mode Switcher & Tools */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setViewMode('image')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          viewMode === 'image'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>JPG / PDF 実物プレビュー</span>
                      </button>
                      <button
                        onClick={() => setViewMode('text')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          viewMode === 'text'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
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
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer border border-slate-200"
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>印刷</span>
                    </button>
                  </div>
                </div>

                {/* Main Content Area: Image Sheet View vs Text Summary View */}
                {viewMode === 'image' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-slate-800">{selectedMaterial.title}</span>
                      <span>ファイル形式: {selectedMaterial.fileType.toUpperCase()} ({selectedMaterial.fileSize})</span>
                    </div>

                    {selectedMaterial.imageUrl ? (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900/90 shadow-inner p-2 sm:p-4 text-center">
                        <img
                          src={selectedMaterial.imageUrl}
                          alt={selectedMaterial.title}
                          className="max-h-[600px] w-auto mx-auto object-contain rounded-xl shadow-md bg-white"
                        />
                      </div>
                    ) : (
                      <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                        <p className="text-sm font-bold text-slate-700">画像プレビューがありません</p>
                        <p className="text-xs text-slate-500">{selectedMaterial.contentPreview}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-slate-900">{selectedMaterial.title}</h3>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {selectedMaterial.description}
                    </p>

                    {selectedMaterial.documentSections?.map((sec, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>{sec.title}</span>
                        </h4>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {sec.content}
                        </p>
                        {sec.formula && (
                          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs font-mono font-bold text-amber-900">
                            {sec.formula}
                          </div>
                        )}
                        {sec.keyPoints && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            {sec.keyPoints.map((kp, kIdx) => (
                              <label
                                key={kIdx}
                                className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!checkedPoints[`${selectedMaterial.id}-${idx}-${kIdx}`]}
                                  onChange={() => toggleCheck(`${selectedMaterial.id}-${idx}-${kIdx}`)}
                                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-300 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-rose-600" />
                <span>問題用紙・教材の追加アップロード</span>
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccess ? (
              <div className="p-6 text-center text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200 font-bold text-sm space-y-2">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <div>追加が完了しました！データを自動保存しました。</div>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">タイトル</label>
                  <input
                    type="text"
                    placeholder="例: 【数学】二次関数の動く区間・最大最小プリント"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-medium focus:border-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">教科</label>
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value as MaterialSubject)}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-medium focus:border-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="japanese">国語</option>
                      <option value="math">数学</option>
                      <option value="english">英語</option>
                      <option value="science">理科</option>
                      <option value="social">社会</option>
                      <option value="other">その他</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">形式</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as 'pdf' | 'image' | 'summary')}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-medium focus:border-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="image">画像 (JPG/PNG)</option>
                      <option value="pdf">PDF</option>
                      <option value="summary">まとめテキスト</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">説明・概要</label>
                  <textarea
                    rows={2}
                    placeholder="教材や問題用紙の概要を簡単に記入してください"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-medium focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    問題用紙・ファイル画像の選択
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-slate-50 font-medium cursor-pointer"
                  />
                  {uploadedFilePreview && (
                    <div className="mt-2 p-2 bg-slate-100 rounded-xl text-center border border-slate-200">
                      <img
                        src={uploadedFilePreview}
                        alt="Preview"
                        className="max-h-32 mx-auto rounded object-contain"
                      />
                      <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                        画像が読み込まれました（自動圧縮保存されます）
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">解説・ポイント本文</label>
                  <textarea
                    rows={3}
                    placeholder="解き方の重要公式や注意点を入力してください"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-medium focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? '保存中...' : '追加保存する'}
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
