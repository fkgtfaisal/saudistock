"use client";

import React, { useState, useEffect } from "react";
import { Check, Shield, Loader2, CheckCircle2, AlertCircle, X, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { upgradeSubscriptionAction } from "./actions";

export default function SubscriptionsPage() {
  const { data: session, update } = useSession();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Active subscription tier in database (fallback to session)
  const currentTier = mounted ? ((session?.user as any)?.subscriptionTier || "FREE") : "FREE";

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleUpgrade = async (targetTier: string) => {
    if (!session) {
      showToast("يجب تسجيل الدخول أولاً لتغيير باقة الاشتراك.", "error");
      setTimeout(() => {
        window.location.href = `/login?callbackUrl=/subscriptions`;
      }, 2000);
      return;
    }

    if (currentTier === targetTier) {
      showToast("أنت مشترك بالفعل في هذه الباقة.", "success");
      return;
    }

    if (targetTier !== "FREE") {
      setLoadingTier(targetTier);
      window.location.href = `/checkout?tier=${targetTier}&cycle=${billingCycle}`;
      return;
    }

    setLoadingTier(targetTier);
    try {
      const res = await upgradeSubscriptionAction(targetTier);
      
      if (!res.success) {
        throw new Error(res.error || "حدث خطأ أثناء ترقية الاشتراك");
      }

      showToast(res.message || "تمت ترقية الاشتراك بنجاح", "success");
      
      // Update NextAuth session client-side to reflect new tier instantly across the whole site
      await update({
        ...session,
        user: {
          ...session?.user,
          subscriptionTier: res.subscriptionTier
        }
      });

      // Simple brief delay then reload to refresh all server components & navbar cleanly
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      showToast(err.message || "فشلت عملية الترقية. يرجى المحاولة لاحقاً.", "error");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl animate-fade-in relative" dir="rtl">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-[250] border shadow-2xl rounded-2xl p-4 flex items-center gap-3 animate-slide-up duration-300 max-w-md ${
          toast.type === "success" ? "bg-slate-900 border-emerald-500/30 text-emerald-400" :
          "bg-slate-900 border-rose-500/30 text-rose-400"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold leading-relaxed">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground mr-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Title Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black mb-4 bg-gradient-to-l from-white to-slate-400 bg-clip-text text-transparent">
          اختر باقة تداولك الذكية
        </h1>
        <p className="text-muted-foreground text-base max-w-2xl mx-auto mb-8">
          احصل على تحليلات متقدمة مدعومة بالذكاء الاصطناعي، واختبر استراتيجياتك التاريخية فورياً، وفعّل تنبيهات الأسعار اللحظية.
        </p>

        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="bg-slate-900/50 p-1.5 rounded-2xl border border-border inline-flex relative">
            <div className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-primary rounded-xl transition-all duration-300 shadow-sm ${billingCycle === "monthly" ? "right-1.5" : "left-1.5"}`} />
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`relative z-10 px-6 py-2.5 text-sm font-bold rounded-xl transition-colors ${billingCycle === "monthly" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              دفع شهري
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`relative z-10 px-6 py-2.5 text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${billingCycle === "yearly" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              دفع سنوي
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${billingCycle === "yearly" ? "bg-white/20 text-white" : "bg-primary/20 text-primary"}`}>توفير ٢٠٪</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        
        {/* Free Plan */}
        <div className={`bg-card border rounded-2xl p-8 flex flex-col transition-all relative overflow-hidden ${
          currentTier === "FREE" 
            ? "border-primary ring-2 ring-primary/30 shadow-2xl shadow-primary/10" 
            : "border-border hover:border-slate-800"
        }`}>
          {currentTier === "FREE" && (
            <div className="absolute top-0 right-0 bg-primary/10 text-primary border-b border-l border-primary/20 px-3 py-1 text-[10px] font-bold rounded-bl-xl">
              الباقة النشطة
            </div>
          )}

          <h3 className="text-2xl font-bold mb-2 text-foreground">الأساسية (Free)</h3>
          <p className="text-muted-foreground text-sm mb-6">للمبتدئين ومن يود تجربة المنصة الأساسية ومراقبة السوق.</p>
          
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-foreground">مجاناً</span>
            <span className="text-muted-foreground text-sm"> / دائماً</span>
          </div>

          <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>مستخدم واحد (حساب شخصي)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>قائمة مراقبة واحدة (حتى 20 سهم)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>عدد محدود من التنبيهات (3 نشطة)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>مؤشرات فنية محدودة (3 كحد أقصى لكل شارت)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>بيانات متأخرة 15 دقيقة (أو بنهاية اليوم)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>متابعة المحللين والمجتمع</span>
            </li>
          </ul>

          <button 
            onClick={() => handleUpgrade("FREE")}
            disabled={loadingTier !== null || currentTier === "FREE"}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
              currentTier === "FREE"
                ? "bg-slate-900 border border-border text-primary cursor-default"
                : "bg-slate-900 border border-border hover:bg-slate-800 text-slate-300"
            }`}
          >
            {loadingTier === "FREE" ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : currentTier === "FREE" ? (
              "الخطة الحالية"
            ) : (
              "الرجوع للباقة الأساسية"
            )}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`bg-card border rounded-2xl p-8 flex flex-col transition-all relative overflow-hidden ${
          currentTier === "PRO" 
            ? "border-primary ring-2 ring-primary/30 shadow-2xl shadow-primary/10 md:-translate-y-4" 
            : "border-border hover:border-slate-800 transition-all duration-300 md:-translate-y-4"
        }`}>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-b-xl text-[10px] font-black tracking-wider uppercase">
            {currentTier === "PRO" ? "الباقة النشطة حالياً" : "الأكثر شعبية"}
          </div>

          <h3 className="text-2xl font-bold mb-2 mt-2 text-foreground flex items-center gap-1.5">
            الاحترافية (Pro)
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </h3>
          <p className="text-muted-foreground text-sm mb-6">للمتداولين النشطين الباحثين عن أدوات تحليل فنية متقدمة وفلاتر قوية.</p>
          
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-foreground font-mono">{billingCycle === "monthly" ? "٩٩" : "٩٩٠"}</span>
            <span className="text-muted-foreground text-sm"> ريال / {billingCycle === "monthly" ? "شهر" : "سنة"}</span>
            {billingCycle === "monthly" && <p className="text-[11px] text-primary font-black mt-2">أو ٩٩٠ ريال سنوياً (توفير ٢٠٪)</p>}
          </div>

          <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-200">
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span className="font-bold">إمكانية إضافة حتى 3 مستخدمين فرعيين</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span className="font-bold">قوائم مراقبة متعددة ولا محدودة</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>حتى 50 تنبيه نشط (سعر ومؤشرات)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>فلترة متقدمة (Screener) وتصدير البيانات</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>حفظ قوالب ومخططات الرسم البياني بلا حدود</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>نشر تحليلات في المجتمع بأسماء موثقة وشارات احترافية</span>
            </li>
          </ul>

          <button 
            onClick={() => handleUpgrade("PRO")}
            disabled={loadingTier !== null}
            className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all duration-200 ${
              currentTier === "PRO"
                ? "bg-primary/20 text-primary border border-primary/30 cursor-default"
                : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/20"
            }`}
          >
            {loadingTier === "PRO" ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : currentTier === "PRO" ? (
              "الخطة الحالية"
            ) : currentTier === "ELITE" ? (
              "الرجوع للباقة الاحترافية"
            ) : (
              "الترقية إلى Pro"
            )}
          </button>
        </div>

        {/* Elite Plan */}
        <div className={`bg-card border rounded-2xl p-8 flex flex-col transition-all relative overflow-hidden ${
          currentTier === "ELITE" 
            ? "border-primary ring-2 ring-primary/30 shadow-2xl shadow-primary/10" 
            : "border-border hover:border-slate-800"
        }`}>
          {currentTier === "ELITE" && (
            <div className="absolute top-0 right-0 bg-primary/10 text-primary border-b border-l border-primary/20 px-3 py-1 text-[10px] font-bold rounded-bl-xl">
              الباقة النشطة
            </div>
          )}

          <h3 className="text-2xl font-bold mb-2 text-foreground">النخبة (Elite)</h3>
          <p className="text-muted-foreground text-sm mb-6">للمحترفين وصناديق الاستثمار وقادة التحليل المالي المتكامل.</p>
          
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-foreground font-mono">{billingCycle === "monthly" ? "٢٤٩" : "٢٤٩٠"}</span>
            <span className="text-muted-foreground text-sm"> ريال / {billingCycle === "monthly" ? "شهر" : "سنة"}</span>
            {billingCycle === "monthly" && <p className="text-[11px] text-primary font-black mt-2">أو ٢٤٩٠ ريال سنوياً (توفير ٢٠٪)</p>}
          </div>

          <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>جميع مميزات باقة Pro الاحترافية</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span className="font-bold text-foreground">حسابات متعددة لـ 8 مستخدمين</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span className="font-bold text-foreground">تحليل وتقييم الذكاء الاصطناعي للأسهم</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>تنبيهات فنية متكاملة ومؤتمتة</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span className="font-bold">اختبار الاستراتيجيات التاريخية (Backtesting)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <span>إنشاء محفظة تداول تجريبي غير محدودة</span>
            </li>
          </ul>

          <button 
            onClick={() => handleUpgrade("ELITE")}
            disabled={loadingTier !== null}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
              currentTier === "ELITE"
                ? "bg-primary/20 text-primary border border-primary/30 cursor-default"
                : "bg-slate-900 border border-border hover:bg-slate-800 text-slate-300"
            }`}
          >
            {loadingTier === "ELITE" ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : currentTier === "ELITE" ? (
              "الخطة الحالية"
            ) : (
              "الترقية إلى Elite"
            )}
          </button>
        </div>

      </div>
      
      {/* Trust Seal */}
      <div className="mt-20 flex justify-center">
        <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4 max-w-3xl shadow-xl">
          <Shield className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h4 className="font-bold mb-1 text-slate-100">دفع آمن وموثوق بنسبة 100%</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              جميع المدفوعات والمعاملات تتم بأقصى درجات الأمان المالي. يمكنك ترقية وتعديل باقة اشتراكك أو إلغائها فورياً بضغطة زر واحدة في أي وقت وبكل سلاسة وسهولة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
