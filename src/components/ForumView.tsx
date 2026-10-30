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
  const { posts, addPost, addComment, toggleReaction } = useApp();

  const [activeTag, setActiveTag] = useState<string>('すべて');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTag, setNewTag] = useState('数学');
  const [newContent, setNewContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
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
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-300/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">クラス学習掲示板</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              LINEよりも気楽に、勉強の質問・解法の疑問・自習の連絡を相談できるスレッド
            </p>
          </div>

          <button
            onClick={() => setIsNewPostOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto cursor-pointer"
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
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTag === tag
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300/80'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-300/80 shadow-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">投稿スレッドがまだありません</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              勉強の疑問や模試の解法、自習室の利用など、クラスみんなに質問や相談をしてみましょう。
            </p>
          </div>
          <button
            onClick={() => setIsNewPostOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
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
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-300/80 shadow-md space-y-4"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">
                      {post.subjectTag}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold text-slate-800">{post.authorNickname}</span>
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
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* Reactions & Comment Count */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReaction(post.id, 'like')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                      title="参考になった！"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="tabular-nums font-bold">{post.reactions.like}</span>
                    </button>

                    <button
                      onClick={() => toggleReaction(post.id, 'heart')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                      title="共感・応援"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span className="tabular-nums font-bold">{post.reactions.heart}</span>
                    </button>

                    <button
                      onClick={() => toggleReaction(post.id, 'lightbulb')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                      title="ひらめき・なるほど"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span className="tabular-nums font-bold">{post.reactions.lightbulb}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => toggleCommentsView(post.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>返信 ({post.comments.length})</span>
                  </button>
                </div>

                {/* Comments Section */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {post.comments.length > 0 && (
                      <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="text-xs space-y-1">
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-bold text-slate-800">
                                {comment.authorNickname}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {new Date(comment.createdAt).toLocaleTimeString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-slate-800 leading-relaxed pl-2 border-l-2 border-rose-400 font-medium">
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
                        className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 font-medium"
                      />
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white transition-colors cursor-pointer"
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-300 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-600" />
                <span>新しい学習スレッドを立てる</span>
              </h3>
              <button
                onClick={() => setIsNewPostOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ジャンル・教科</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-medium focus:border-slate-900 focus:outline-none cursor-pointer"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">スレッドのタイトル</label>
                <input
                  type="text"
                  placeholder="例: 二次関数の動く区間問題について"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-medium focus:border-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">本文・相談内容</label>
                <textarea
                  rows={4}
                  placeholder="疑問点や工夫している勉強法、クラス連絡などを書いてみましょう"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-medium focus:border-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold shadow-sm cursor-pointer"
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
