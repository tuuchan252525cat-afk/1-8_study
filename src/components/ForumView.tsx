import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getLastSeenAt, markSectionSeen, isItemUnseenNew } from '../utils/newBadge';
import {
  MessageSquare,
  ThumbsUp,
  Heart,
  Lightbulb,
  Send,
  Plus,
  MessageCircle,
  X,
} from 'lucide-react';

export const ForumView: React.FC = () => {
  const { posts, addPost, addComment, toggleReaction, allSubjects, students } = useApp();

  const initialLastSeenRef = useRef<number>(getLastSeenAt('forum'));
  useEffect(() => {
    markSectionSeen('forum');
  }, [posts.length]);

  const [activeTag, setActiveTag] = useState<string>('すべて');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTag, setNewTag] = useState('数学');
  const [newContent, setNewContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const tags = [
    'すべて',
    ...allSubjects.map((s) => s.label),
    '自習・連絡',
    '質問',
  ];

  const filteredPosts =
    activeTag === 'すべて' ? posts : posts.filter((p) => p.subjectTag === activeTag);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    addPost(newTag, newTitle.trim(), newContent.trim());
    setIsNewPostOpen(false);
    setNewTitle('');
    setNewContent('');
  };

  const handleCommentSubmit = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    addComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  const toggleCommentsView = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header and Tag Filters */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="text-[10px] font-black text-[#1c603a] uppercase tracking-wider mb-0.5">
              ◎ 1-8 SITE COMMUNITY
            </div>
            <h2 className="text-lg font-black text-slate-900">クラス学習掲示板</h2>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              勉強の質問・解法の疑問・自習の連絡を気楽に相談できるクラス専用スレッド
            </p>
          </div>

          <button
            onClick={() => setIsNewPostOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>スレッドを立てる</span>
          </button>
        </div>

        {/* Tags (Modeled on 39204_0_b6de3a0e.jpg filter buttons) */}
        <div>
          <span className="block text-[11px] font-black text-stone-400 mb-1.5">▽ カテゴリを選ぶ</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3.5 py-1.5 text-xs font-black rounded-2xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTag === tag
                    ? 'bg-[#1c603a] text-white shadow-xs'
                    : 'bg-[#fdfbf7] hover:bg-stone-100 text-slate-700 border border-stone-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-stone-200/90 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#1c603a]/10 text-[#1c603a] flex items-center justify-center mx-auto shadow-2xs">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">投稿スレッドがまだありません</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed font-medium">
              勉強の疑問や模試の解法、自習室の利用など、クラスみんなに質問や相談をしてみましょう。
            </p>
          </div>
          <button
            onClick={() => setIsNewPostOpen(true)}
            className="px-6 py-3 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>最初のスレッドを投稿する</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const isCommentsOpen = !!expandedComments[post.id];
            const commentText = commentInputs[post.id] || '';

            return (
              <div
                key={post.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-4"
              >
                {/* Post Header (Modeled on 39204_0_b6de3a0e.jpg Card Info) */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-[11px] font-black text-stone-400 uppercase tracking-tight flex items-center gap-1.5 flex-wrap">
                    <span>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      投稿者:{' '}
                      {(post.studentNumber &&
                        students.find((s) => s.attendanceNumber === post.studentNumber)?.nickname) ||
                        post.authorNickname}
                    </span>
                    {isItemUnseenNew(post, initialLastSeenRef.current) && (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black tracking-normal">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-black text-[#1c603a] bg-[#f4f8f5] px-2.5 py-0.5 rounded-full border border-[#1c603a]/20">
                    ◎ {post.subjectTag}
                  </span>
                </div>

                {/* Title & Body */}
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug mb-1.5">
                    {post.title}
                  </h3>
                  <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {post.content}
                  </p>
                </div>

                {/* Reactions & Comment Count */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReaction(post.id, 'like')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#fdfbf7] hover:bg-[#f4f8f5] text-slate-700 hover:text-[#1c603a] text-xs font-black border border-stone-200 transition-colors cursor-pointer"
                      title="参考になった！"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-[#1c603a]" />
                      <span className="tabular-nums">{post.reactions.like}</span>
                    </button>

                    <button
                      onClick={() => toggleReaction(post.id, 'heart')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#fdfbf7] hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-black border border-stone-200 transition-colors cursor-pointer"
                      title="共感・応援"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span className="tabular-nums">{post.reactions.heart}</span>
                    </button>

                    <button
                      onClick={() => toggleReaction(post.id, 'lightbulb')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#fdfbf7] hover:bg-amber-50 text-slate-700 hover:text-amber-700 text-xs font-black border border-stone-200 transition-colors cursor-pointer"
                      title="ひらめき・なるほど"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span className="tabular-nums">{post.reactions.lightbulb}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => toggleCommentsView(post.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-[#1c603a] font-black cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-stone-400" />
                    <span>返信 ({post.comments.length})</span>
                  </button>
                </div>

                {/* Comments Section */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-stone-100 space-y-3">
                    {post.comments.length > 0 && (
                      <div className="space-y-2.5 bg-[#fdfbf7] p-4 rounded-2xl border border-stone-200">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="text-xs space-y-1">
                            <div className="flex items-center gap-2 text-[11px] text-stone-400 font-bold">
                              <span className="text-slate-800 font-black">
                                {(comment.studentNumber &&
                                  students.find((s) => s.attendanceNumber === comment.studentNumber)
                                    ?.nickname) ||
                                  comment.authorNickname}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {new Date(comment.createdAt).toLocaleTimeString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-slate-800 leading-relaxed pl-2.5 border-l-2 border-[#1c603a] font-medium">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add comment input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="返信を入力..."
                        value={commentText}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommentSubmit(post.id);
                        }}
                        className="flex-1 text-xs border border-stone-300 rounded-2xl px-3.5 py-2.5 bg-[#fdfbf7] focus:bg-white focus:outline-none focus:border-[#1c603a] font-bold"
                      />
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        className="p-2.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white transition-colors cursor-pointer shadow-2xs"
                        title="送信"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Post Modal */}
      {isNewPostOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-300 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#1c603a]" />
                <span>新しい学習スレッドを立てる</span>
              </h3>
              <button
                onClick={() => setIsNewPostOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">ジャンル・教科</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] font-black focus:border-[#1c603a] focus:outline-none cursor-pointer"
                >
                  {allSubjects.map((s) => (
                    <option key={s.key} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                  <option value="自習・連絡">自習・連絡</option>
                  <option value="質問">質問</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">スレッドのタイトル</label>
                <input
                  type="text"
                  placeholder="例: 二次関数の動く区間問題について"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white font-bold focus:border-[#1c603a] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">本文・相談内容</label>
                <textarea
                  rows={4}
                  placeholder="疑問点や工夫している勉強法、クラス連絡などを書いてみましょう"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-2xl p-3 bg-[#fdfbf7] focus:bg-white font-medium focus:border-[#1c603a] focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-stone-100 text-slate-700 text-xs font-black hover:bg-stone-200 cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  投稿する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
