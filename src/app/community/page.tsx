"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  ThumbsUp, 
  TrendingUp, 
  TrendingDown, 
  User, 
  Plus, 
  Search, 
  X, 
  Loader2, 
  MessageCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { SAUDI_STOCKS, StockInfo } from "@/lib/stocks";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    subscriptionTier: string;
  };
}

interface PostItem {
  id: string;
  title: string;
  content: string;
  symbol: string | null;
  action: string | null; // BUY, SELL, HOLD, EDUCATIONAL
  likesCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    subscriptionTier: string;
  };
  comments: CommentItem[];
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Expanded comments section state by postId
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  // New comment input by postId
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  // Submitting comment state by postId
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // New Post Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [postAction, setPostAction] = useState<"BUY" | "SELL" | "HOLD" | "EDUCATIONAL" | "">("");

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/community");
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ أثناء تحميل المشاركات.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      showToast("يرجى إدخال العنوان والمحتوى للتحليل", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle,
          content: postContent,
          symbol: selectedStock ? `${selectedStock.symbol}.SR` : null,
          action: postAction || null
        })
      });

      if (!res.ok) throw new Error("Failed to create post");

      const newPost = await res.json();
      setPosts(prev => [newPost, ...prev]);
      showToast("تم نشر تحليلك بنجاح في مجتمع تداول!");
      
      // Reset form
      setPostTitle("");
      setPostContent("");
      setSelectedStock(null);
      setPostAction("");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("فشل نشر التحليل. يرجى المحاولة لاحقاً.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/${postId}/like`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to like post");
      const data = await res.json();
      
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likesCount: data.likesCount } : p
      ));
      showToast("تم تسجيل الإعجاب بالمنشور.", "info");
    } catch (err) {
      console.error(err);
      showToast("فشل تسجيل الإعجاب.", "error");
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/community/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text })
      });

      if (!res.ok) throw new Error("Failed to add comment");

      const newComment = await res.json();
      
      // Update local state
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
      }));

      // Clear input
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      showToast("تمت إضافة تعليقك بنجاح.");
    } catch (err) {
      console.error(err);
      showToast("فشل إرسال التعليق.", "error");
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Get user profile initial or name
  const getUserDisplayName = (user: { name: string | null; email: string }) => {
    if (user.name) return user.name;
    return user.email.split("@")[0];
  };

  // Get subscription tier label & styles in Arabic
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "ELITE":
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
            <Sparkles className="h-2.5 w-2.5" />
            عضو إيليت الذهبي
          </span>
        );
      case "PRO":
        return (
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
            عضو برو المحترف
          </span>
        );
      default:
        return (
          <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
            مستكشف السوق
          </span>
        );
    }
  };

  const getActionBadge = (action: string | null) => {
    if (!action) return null;
    switch (action) {
      case "BUY":
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            توصية شراء
          </span>
        );
      case "SELL":
        return (
          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
            <TrendingDown className="h-3.5 w-3.5" />
            توصية بيع
          </span>
        );
      case "HOLD":
        return (
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-2.5 py-1 rounded-lg font-bold">
            مراقبة وتثبيت
          </span>
        );
      case "EDUCATIONAL":
        return (
          <span className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-2.5 py-1 rounded-lg font-bold">
            محتوى تعليمي
          </span>
        );
      default:
        return null;
    }
  };

  // Search stocks inside the modal
  const filteredStocks = SAUDI_STOCKS.filter(stock => 
    stock.nameAr.includes(stockSearchQuery) || 
    stock.symbol.includes(stockSearchQuery) ||
    stock.nameEn.toLowerCase().includes(stockSearchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in relative" dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-[250] border shadow-2xl rounded-2xl p-4 flex items-center gap-3 animate-slide-up duration-300 max-w-sm ${
          toast.type === "success" ? "bg-slate-900 border-emerald-500/30 text-emerald-400" :
          toast.type === "error" ? "bg-slate-900 border-rose-500/30 text-rose-400" :
          "bg-slate-900 border-slate-700 text-slate-300"
        }`}>
          {toast.type === "success" && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
          {toast.type === "error" && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          {toast.type === "info" && <CheckCircle2 className="h-5 w-5 text-sky-400 flex-shrink-0" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 bg-card border border-border p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 bg-gradient-to-l from-white to-slate-400 bg-clip-text text-transparent">
              مجتمع المتداولين الحي
            </h1>
            <p className="text-sm text-muted-foreground">
              تصفح وشارك التحليلات الفنية والآراء الاستثمارية الفورية مع زملائك المتداولين.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/95 text-primary-foreground px-5 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20 w-full md:w-auto"
        >
          <Plus className="h-4 w-4" />
          نشر تحليل جديد
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Feed */}
        <div className="flex-1 space-y-6">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">جاري تحميل منشورات ونقاشات المتداولين الحية...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-xl">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">لا توجد تحليلات منشورة بعد</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                كن أول متداول يشارك تحليله الفني اليوم وتوقع اتجاه الأسهم السعودية معنا!
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 bg-slate-900 border border-border hover:bg-slate-800 text-foreground px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                انشر أول تحليل الآن
              </button>
            </div>
          ) : (
            posts.map((post) => {
              const stockSymbolOnly = post.symbol ? post.symbol.split(".")[0] : null;
              const matchingStock = SAUDI_STOCKS.find(s => s.symbol === stockSymbolOnly);
              
              return (
                <div key={post.id} className="bg-card border border-border rounded-2xl p-6 shadow-xl transition-all hover:border-slate-800/80">
                  {/* Post User Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 border border-border rounded-full flex items-center justify-center text-primary font-black text-sm">
                        {getUserDisplayName(post.user).substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-sm text-foreground">
                            {getUserDisplayName(post.user)}
                          </p>
                          {getTierBadge(post.user.subscriptionTier)}
                        </div>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {new Date(post.createdAt).toLocaleDateString("ar-SA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                    {getActionBadge(post.action)}
                  </div>

                  {/* Post Title & Content */}
                  <h2 className="text-xl font-bold mb-3 text-slate-100">{post.title}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.symbol && (
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      <span className="bg-primary/5 text-primary border border-primary/20 text-xs px-3 py-1 rounded-full font-bold">
                        🔖 {post.symbol} - {matchingStock?.nameAr || "سهم تداول"}
                      </span>
                    </div>
                  )}

                  {/* Actions & Likes/Comments count */}
                  <div className="flex items-center gap-6 pt-4 border-t border-border/80">
                    <button 
                      onClick={() => handleLikePost(post.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors bg-slate-900 border border-border/40 px-3.5 py-2 rounded-xl"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{post.likesCount} إعجاب</span>
                    </button>

                    <button 
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-slate-900 border border-border/40 px-3.5 py-2 rounded-xl"
                    >
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span>{post.comments.length} تعليقات</span>
                      {expandedComments[post.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Comments Thread (Collapsible) */}
                  {expandedComments[post.id] && (
                    <div className="mt-6 pt-5 border-t border-border bg-slate-900/10 -mx-6 -mb-6 p-6 rounded-b-2xl space-y-4">
                      <h4 className="text-xs font-black text-slate-400 mb-3">الردود والنقاشات:</h4>
                      
                      {post.comments.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">لا توجد تعليقات على هذا التحليل بعد. شارك رأيك في السوق أدناه!</p>
                      ) : (
                        <div className="space-y-3">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="bg-card border border-border/60 p-4 rounded-xl space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-foreground">
                                    {getUserDisplayName(comment.user)}
                                  </span>
                                  {getTierBadge(comment.user.subscriptionTier)}
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleDateString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment Form */}
                      <div className="flex gap-2 pt-3">
                        <input 
                          type="text"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="أضف تعليقاً أو استفساراً..."
                          className="flex-1 bg-slate-900 border border-border/80 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-foreground"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post.id);
                          }}
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={submittingComment[post.id] || !commentInputs[post.id]?.trim()}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                        >
                          {submittingComment[post.id] ? "جاري الإرسال..." : "إرسال"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
            <h3 className="font-black text-sm mb-3 text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              إرشادات النشر والمجتمع
            </h3>
            <ul className="text-xs text-muted-foreground space-y-2.5 leading-relaxed list-disc list-inside">
              <li>احرص على إرفاق رمز السهم المرتبط بتحليلك لمساعدة الآخرين.</li>
              <li>وضح الرأي الفني بدقة (شراء/بيع/حياد) بناءً على مؤشرات حقيقية.</li>
              <li>النقاش الفني البناء يسهم في تعزيز ثقافة التداول في تاسي.</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
            <p className="text-[11px] text-muted-foreground leading-relaxed text-justify">
              <strong>إخلاء مسؤولية:</strong> جميع المنشورات والتحليلات المدرجة في مجتمع المتداولين تعبر عن وجهة نظر أصحابها فقط، ولا تمثل بأي شكل نصيحة استثمارية أو توصية مباشرة للبيع والشراء. تداول بمسؤولية ووعي تام بالمخاطر.
            </p>
          </div>
        </div>
      </div>

      {/* Modal - Create Post */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-xl text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-lg text-foreground">
                  نشر تحليل مالي جديد
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-slate-800/60 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePost} className="p-6 space-y-6">
              {/* Post Title */}
              <div className="space-y-2">
                <label htmlFor="post-title" className="text-sm font-semibold text-slate-300">
                  عنوان التحليل
                </label>
                <input 
                  id="post-title"
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="مثال: تحليل اتجاه سهم سابك عقب إعلان النتائج الربعية"
                  className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Tag Stock */}
              <div className="space-y-2 relative">
                <label className="text-sm font-semibold text-slate-300">
                  اربط مع سهم معين (اختياري)
                </label>
                
                {selectedStock ? (
                  <div className="flex items-center justify-between bg-primary/5 border border-primary/30 rounded-xl p-3.5 text-sm">
                    <span className="font-bold text-foreground">
                      {selectedStock.symbol} - {selectedStock.nameAr}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedStock(null)}
                      className="text-primary hover:text-rose-400 font-bold text-xs"
                    >
                      إلغاء الربط
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="text"
                        value={stockSearchQuery}
                        onChange={(e) => setStockSearchQuery(e.target.value)}
                        placeholder="ابحث برمز السهم أو الاسم..."
                        className="w-full bg-slate-900 border border-border rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>

                    {stockSearchQuery && (
                      <div className="absolute z-10 w-full bg-slate-900 border border-border rounded-xl mt-1 shadow-2xl divide-y divide-border overflow-hidden">
                        {filteredStocks.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            لا توجد شركات مطابقة لبحثك
                          </div>
                        ) : (
                          filteredStocks.map((stock) => (
                            <button
                              key={stock.symbol}
                              type="button"
                              onClick={() => {
                                setSelectedStock(stock);
                                setStockSearchQuery("");
                              }}
                              className="w-full text-right p-3.5 text-sm hover:bg-primary/10 transition-colors flex justify-between items-center"
                            >
                              <span className="font-bold text-foreground">{stock.nameAr}</span>
                              <span className="text-xs text-muted-foreground bg-slate-800 border border-border px-2 py-0.5 rounded font-mono">{stock.symbol}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action / Sentiment */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  توصية أو توجه التحليل
                </label>
                <select
                  value={postAction}
                  onChange={(e) => setPostAction(e.target.value as any)}
                  className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="">حيادي / بدون وسم</option>
                  <option value="BUY">شراء - BUY</option>
                  <option value="SELL">بيع - SELL</option>
                  <option value="HOLD">مراقبة وتثبيت - HOLD</option>
                  <option value="EDUCATIONAL">تعليمي - EDUCATIONAL</option>
                </select>
              </div>

              {/* Post Content */}
              <div className="space-y-2">
                <label htmlFor="post-content" className="text-sm font-semibold text-slate-300">
                  تفاصيل التحليل ومبررات الرؤية
                </label>
                <textarea 
                  id="post-content"
                  required
                  rows={5}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="اكتب الأهداف الفنية، مستويات الدعم والمقاومة، ووقف الخسارة..."
                  className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground resize-none leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border bg-slate-900/20 -mx-6 -mb-6 p-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/10"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري النشر...
                    </>
                  ) : (
                    "انشر الآن"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-900 border border-border hover:bg-slate-800 text-slate-300 py-3 rounded-xl font-bold transition-all duration-200 text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
