import { BrainCircuit, Lock, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function AIAnalysisPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            تحليلات الذكاء الاصطناعي <Sparkles className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-muted-foreground">قم بتحليل الأسهم وقراءة القوائم المالية بشكل آلي ودقيق مدعوم بـ AI.</p>
        </div>
      </div>

      {/* Restricted Access Banner (Simulating that user needs Premium) */}
      <div className="bg-gradient-to-r from-primary/20 to-background border border-primary rounded-xl p-8 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BrainCircuit className="h-32 w-32" />
        </div>
        <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">هذه الميزة متاحة حصرياً لباقة Premium</h2>
        <p className="text-foreground max-w-2xl mx-auto mb-6">
          ارتقِ بتداولاتك من خلال محرك الذكاء الاصطناعي الخاص بنا والذي يقوم بتحليل القوائم المالية، قراءة الأخبار، وإصدار توقعات للأسهم بناءً على النماذج الفنية والأساسية.
        </p>
        <Link href="/subscriptions" className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-bold hover:bg-primary/90 transition-colors inline-block">
          الترقية إلى Premium
        </Link>
      </div>

      <h3 className="text-2xl font-bold mb-6">كيف يعمل الذكاء الاصطناعي لدينا؟</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
        <div className="bg-card border border-border p-6 rounded-xl">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <FileTextIcon className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-bold text-lg mb-2">قراءة القوائم المالية</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">
            يقوم النظام بقراءة آلاف الصفحات من القوائم المالية وتلخيص الأداء المالي، المخاطر، والفرص في ثوانٍ.
          </p>
        </div>
        
        <div className="bg-card border border-border p-6 rounded-xl">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-bold text-lg mb-2">اكتشاف الأنماط الفنية</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">
            التعرف التلقائي على النماذج الفنية (مثل الرأس والكتفين، الأعلام، المثلثات) وإعطاء إشارات استباقية.
          </p>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <ChatBubbleIcon className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-bold text-lg mb-2">تحليل المشاعر (Sentiment Analysis)</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">
            تحليل الأخبار اليومية وتغريدات المحللين لمعرفة الانطباع العام (إيجابي، سلبي، محايد) حول السهم.
          </p>
        </div>
      </div>
      
      {/* TODO: Connect Backtesting API */}
      <div className="mt-12 p-6 bg-card border border-border rounded-xl">
        <h3 className="font-bold text-xl mb-4 text-foreground">اختبار الاستراتيجيات (Backtesting)</h3>
        <p className="text-muted-foreground mb-4">
          قم بكتابة شروط استراتيجيتك، وسيقوم النظام باختبارها على بيانات السوق التاريخية (لآخر 10 سنوات) وإعطائك نسبة نجاح الاستراتيجية.
        </p>
        <div className="p-4 bg-muted/50 border border-dashed border-border rounded-lg inline-block">
          <h4 className="font-bold text-sm mb-1 text-primary">TODO: بناء واجهة Backtesting</h4>
          <p className="text-xs text-muted-foreground">
            جاري العمل على محرك اختبار الاستراتيجيات. سيتم دمجها في الإصدارات القادمة بمجرد توفر البيانات التاريخية الدقيقة.
          </p>
        </div>
      </div>

    </div>
  );
}

function FileTextIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ChatBubbleIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
