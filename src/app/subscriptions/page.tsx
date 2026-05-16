import { Check, Shield } from "lucide-react";

export default function SubscriptionsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold mb-4">خطط الاشتراك</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          اختر الباقة التي تناسب أسلوب تداولك. يمكنك الترقية أو الإلغاء في أي وقت.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        
        {/* Free Plan */}
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
          <h3 className="text-2xl font-bold mb-2">الأساسية (Free)</h3>
          <p className="text-muted-foreground mb-6">للمبتدئين ومن يود تجربة المنصة الأساسية.</p>
          <div className="mb-8">
            <span className="text-4xl font-extrabold">مجاناً</span>
            <span className="text-muted-foreground"> / دائماً</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>قائمة مراقبة واحدة (حتى 20 سهم)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>عدد محدود من التنبيهات (3 نشطة)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>مؤشرات فنية محدودة (3 كحد أقصى لكل شارت)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>بيانات متأخرة 15 دقيقة (أو بنهاية اليوم)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>متابعة المحللين والمجتمع</span>
            </li>
          </ul>
          <button className="w-full bg-muted text-foreground font-bold py-3 rounded-lg hover:bg-muted/80 transition-colors">
            الخطة الحالية
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-primary/5 border border-primary relative rounded-2xl p-8 flex flex-col transform md:-translate-y-4 shadow-xl shadow-primary/10">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
            الأكثر شعبية
          </div>
          <h3 className="text-2xl font-bold mb-2">الاحترافية (Pro)</h3>
          <p className="text-muted-foreground mb-6">للمتداولين النشطين الباحثين عن أدوات احترافية.</p>
          <div className="mb-8">
            <span className="text-4xl font-extrabold">٩٩</span>
            <span className="text-muted-foreground"> ريال / شهر</span>
            <p className="text-sm text-primary font-bold mt-2">أو ٩٩٠ ريال سنوياً (توفير ٢٠٪)</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="font-bold">قوائم مراقبة متعددة ولا محدودة</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>حتى 50 تنبيه نشط (سعر ومؤشرات)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>فلترة متقدمة (Screener) وتصدير البيانات</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>حفظ قوالب ومخططات الرسم البياني بلامحدودية</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>نشر تحليلات في المجتمع بأسماء مستعارة وموثقة</span>
            </li>
          </ul>
          <button className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors">
            الترقية إلى Pro
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
          <h3 className="text-2xl font-bold mb-2">المميزة (Premium)</h3>
          <p className="text-muted-foreground mb-6">للمحترفين وصناديق الاستثمار وقادة التحليل.</p>
          <div className="mb-8">
            <span className="text-4xl font-extrabold">٢٤٩</span>
            <span className="text-muted-foreground"> ريال / شهر</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>جميع مميزات باقة Pro</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="font-bold text-foreground">تحليل الذكاء الاصطناعي للأسهم (قريباً)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>تنبيهات عبر Webhooks وتطبيقات خارجية</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>اختبار الاستراتيجيات (Backtesting)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>تقارير مالية وتلخيص لنتائج الشركات بـ PDF</span>
            </li>
          </ul>
          <button className="w-full bg-muted text-foreground font-bold py-3 rounded-lg hover:bg-muted/80 transition-colors">
            الترقية إلى Premium
          </button>
        </div>

      </div>
      
      <div className="mt-20 flex justify-center">
        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 max-w-3xl">
          <Shield className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h4 className="font-bold mb-1">دفع آمن وموثوق</h4>
            <p className="text-sm text-muted-foreground">
              جميع المدفوعات تتم عبر قنوات آمنة وموثقة. تستطيع إدارة اشتراكك بكل سهولة وتغيير الباقة في أي وقت بدون عقود ملزمة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
