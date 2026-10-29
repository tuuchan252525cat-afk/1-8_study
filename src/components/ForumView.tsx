import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  ThumbsUp,
  Heart,
  Lightbulb,
  Send,
  Plus,
  MessageCircle,
  X,
  Check,
} from 'lucide-react';

export const ForumView: React.FC = () => {
  const { posts, addPost, addComment, toggleReaction, currentStudent } = useApp();

  const [activeTag, setActiveTag] = useState<string>('すべて');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTag, setNewTag] = useState('数学');
  const [newContent, setNewContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({
    'post-1': true,
    'post-2': true,
  });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const tags = ['すべて', '数学', '英語', '理科', '国語', '社会', '自習・連絡', '質問'];

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
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">緩やかな学習掲示板</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              LINEよりも気楽に、勉強の質問・解法の疑問・自習の連絡を相談できるクラススレッド
            </p>
          </div>

          <button
            onClick={() => setIsNewPostOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>スレッドを立てる</span>
          </button>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 pt-4 overflow-x-auto pb-1">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTag === tag
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const isCommentsOpen = !!expandedComments[post.id];
          const commentText = commentInputs[post.id] || '';

          return (
            <div
              key={post.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {post.subjectTag}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-800">{post.authorNickname}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>

              {/* Title & Body */}
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Reactions & Comment Count */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleReaction(post.id, 'like')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
                    title="参考になった！"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="tabular-nums">{post.reactions.like}</span>
                  </button>

                  <button
                    onClick={() => toggleReaction(post.id, 'heart')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
                    title="共感・応援"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span className="tabular-nums">{post.reactions.heart}</span>
                  </button>

                  <button
                    onClick={() => toggleReaction(post.id, 'lightbulb')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
                    title="ひらめき・なるほど"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span className="tabular-nums">{post.reactions.lightbulb}</span>
                  </button>
                </div>

                <button
                  onClick={() => toggleCommentsView(post.id)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>返信 ({post.comments.length})</span>
                </button>
              </div>

              {/* Comments Section */}
              {isCommentsOpen && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {post.comments.length > 0 && (
                    <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="text-xs space-y-1">
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-700">
                              {comment.authorNickname}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{new Date(comment.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed pl-2 border-l-2 border-emerald-300">
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
                      placeholder="返信やアドバイスをひとこと..."
                      value={commentText}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommentSubmit(post.id);
                      }}
                      className="flex-1 text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleCommentSubmit(post.id)}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                      title="送信"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Post Modal */}
      {isNewPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-100">
            <button
              onClick={() => setIsNewPostOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">スレッドを立てる</h3>
            <p className="text-xs text-slate-500 mb-4">
              匿名性（ニックネーム管理）が守られているので、気軽に質問・共有できます。
            </p>

            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">科目・ジャンル</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="数学">数学</option>
                  <option value="英語">英語</option>
                  <option value="理科">理科</option>
                  <option value="国語">国語</option>
                  <option value="社会">社会</option>
                  <option value="自習・連絡">自習・連絡</option>
                  <option value="質問">質問</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">スレッドのタイトル</label>
                <input
                  type="text"
                  placeholder="例: 数学のこの問題の解き方が分かりません！"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">投稿内容</label>
                <textarea
                  rows={4}
                  placeholder="詳しい状況や疑問点を書いてみましょう"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
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
