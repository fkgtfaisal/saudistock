"use client";

import { ArrowDownRight, ArrowUpRight, BarChart3, Bell, Filter, LayoutDashboard, LineChart, MessageSquare, Shield, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-24 md:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0"></div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight"
          >
            ذكاء الأسهم السعودية <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-blue-400">
              في متناول يدك
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 px-4"
          >
            منصة تحليل احترافية مصممة خصيصاً لسوق الأسهم السعودي (تاسي ونمو). رسوم بيانية متقدمة، تنبيهات فورية، وتحليل مالي دقيق.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
          >
            <Link href="/markets/saudi" className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition-all w-full sm:w-auto shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 text-center">
              ابدأ التصفح مجاناً
            </Link>
            <Link href="#features" className="bg-secondary text-secondary-foreground px-8 py-4 rounded-xl font-bold hover:bg-secondary/80 transition-all w-full sm:w-auto text-center border border-border/50">
              اكتشف المميزات
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-16 relative mx-auto max-w-5xl rounded-2xl border border-border/50 bg-card/30 p-2 shadow-2xl backdrop-blur-sm"
          >
            <div className="overflow-hidden rounded-xl border border-border bg-muted/10">
              <Image
                src="/images/hero.webp"
                alt="منصة تحليل الأسهم"
                width={1200}
                height={600}
                priority
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -inset-0.5 -z-10 rounded-2xl bg-gradient-to-t from-primary/10 to-transparent blur-lg" />
          </motion.div>
        </div>
      </section>

      {/* Market Overview Ticker/Cards */}
      <section className="py-8 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <MarketCard name="تاسي (TASI)" value="12,450.25" change="+1.2%" isUp={true} />
            <MarketCard name="نمو (NOMU)" value="26,120.40" change="-0.5%" isUp={false} />
            <MarketCard name="إم تي 30 (MT30)" value="1,850.10" change="+0.8%" isUp={true} />
          </div>
        </div>
      </section>

      {/* Top Movers Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">حركة السوق</h2>
            <Link href="/markets/saudi" className="text-primary hover:underline font-bold text-sm">عرض الكل</Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <StockList title="الأكثر ارتفاعاً" stocks={topGainers} type="gain" />
            <StockList title="الأكثر انخفاضاً" stocks={topLosers} type="loss" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">كل ما تحتاجه لتتخذ قرارات استثمارية صائبة</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              أدوات احترافية متكاملة تغنيك عن تشتت المنصات المختلفة. صممت بعناية لتلبي احتياجات المتداول والمستثمر في السوق السعودي.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard 
              icon={<LineChart className="h-7 w-7 md:h-8 md:w-8 text-primary" />}
              title="رسوم بيانية متقدمة"
              description="أكثر من 100 مؤشر فني وأدوات رسم احترافية مدعومة من مكتبات TradingView."
            />
            <FeatureCard 
              icon={<Filter className="h-7 w-7 md:h-8 md:w-8 text-primary" />}
              title="فلاتر الأسهم (Screener)"
              description="فلترة السوق بالكامل بناءً على التحليل الفني والمالي في ثوانٍ معدودة."
            />
            <FeatureCard 
              icon={<Bell className="h-7 w-7 md:h-8 md:w-8 text-primary" />}
              title="تنبيهات مخصصة"
              description="لا تفوت أي فرصة. تنبيهات بناءً على السعر، المؤشرات، أو أحجام التداول."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-7 w-7 md:h-8 md:w-8 text-primary" />}
              title="قوائم مالية مفصلة"
              description="بيانات مالية تاريخية، مكررات الربحية، وتوزيعات الأرباح للشركات."
            />
            <FeatureCard 
              icon={<Zap className="h-7 w-7 md:h-8 md:w-8 text-primary" />}
              title="بيانات وتحديثات سريعة"
              description="سرعة فائقة في جلب وعرض بيانات الأسهم والأخبار."
            />
            <FeatureCard 
              icon={<MessageSquare className="h-7 w-7 md:h-8 md:w-8 text-primary" />}
              title="مجتمع المتداولين"
              description="شارك تحليلاتك وتابع آراء أفضل المحللين في السوق السعودي."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">خطط تناسب جميع المستثمرين</h2>
            <p className="text-sm md:text-base text-muted-foreground">ابدأ مجاناً وقم بالترقية عندما تحتاج إلى أدوات أكثر احترافية.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            <PricingCard 
              title="الأساسية"
              price="مجاناً"
              features={["قائمة مراقبة واحدة", "رسوم بيانية أساسية", "بيانات نهاية اليوم", "أخبار السوق"]}
              cta="سجل الآن"
              href="/register"
            />
            <PricingCard 
              title="الاحترافية (Pro)"
              price="٩٩ ريال / شهر"
              features={["قوائم مراقبة غير محدودة", "فلاتر متقدمة", "حفظ قوالب الرسم البياني", "تصدير البيانات", "تنبيهات لا محدودة"]}
              cta="اشترك في Pro"
              href="/subscriptions"
              highlighted={true}
            />
            <PricingCard 
              title="النخبة (Elite)"
              price="٢٤٩ ريال / شهر"
              features={["جميع ميزات Pro", "تحليل الذكاء الاصطناعي", "اختبار الاستراتيجيات (Backtesting)", "تقارير PDF مخصصة"]}
              cta="اشترك في Elite"
              href="/subscriptions"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">جاهز للارتقاء بتداولاتك؟</h2>
          <p className="text-primary-foreground/80 mb-10 max-w-2xl mx-auto text-base md:text-lg">
            انضم إلى آلاف المتداولين والمستثمرين الذين يعتمدون على منصتنا يومياً لاتخاذ قراراتهم في السوق السعودي.
          </p>
          <Link href="/register" className="inline-block bg-background text-foreground px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-background/90 transition-all shadow-lg active:scale-95 text-center">
            أنشئ حسابك مجاناً
          </Link>
        </div>
      </section>
    </div>
  );
}

// Dummy Data
const topGainers = [
  { symbol: "2222", name: "أرامكو السعودية", price: "32.40", change: "1.20", changePercent: "3.8%" },
  { symbol: "1120", name: "الراجحي", price: "88.50", change: "2.10", changePercent: "2.4%" },
  { symbol: "2010", name: "سابك", price: "82.10", change: "1.80", changePercent: "2.2%" },
  { symbol: "7010", name: "اس تي سي", price: "40.20", change: "0.80", changePercent: "2.0%" },
];

const topLosers = [
  { symbol: "4190", name: "جرير", price: "14.20", change: "-0.40", changePercent: "-2.7%" },
  { symbol: "2280", name: "المراعي", price: "55.30", change: "-1.10", changePercent: "-1.9%" },
  { symbol: "1180", name: "الأهلي", price: "38.90", change: "-0.60", changePercent: "-1.5%" },
  { symbol: "4003", name: "إكسترا", price: "81.00", change: "-1.20", changePercent: "-1.4%" },
];

// Components
function MarketCard({ name, value, change, isUp }: { name: string, value: string, change: string, isUp: boolean }) {
  return (
    <div className="p-6 rounded-xl bg-background border border-border flex items-center justify-between">
      <div>
        <h3 className="text-muted-foreground font-medium mb-2">{name}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${isUp ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
        {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        {change}
      </div>
    </div>
  );
}

function StockList({ title, stocks, type }: { title: string, stocks: any[], type: 'gain' | 'loss' }) {
  const isGain = type === 'gain';
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border bg-muted/30">
        <h3 className="text-xl font-bold flex items-center gap-2">
          {isGain ? <TrendingUp className="text-success h-5 w-5" /> : <TrendingUp className="text-destructive h-5 w-5 transform scale-y-[-1]" />}
          {title}
        </h3>
      </div>
      <div className="divide-y divide-border">
        {stocks.map((stock) => (
          <Link key={stock.symbol} href={`/symbols/${stock.symbol}`} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors cursor-pointer block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center font-bold text-xs text-muted-foreground">
                {stock.symbol}
              </div>
              <div>
                <p className="font-bold">{stock.name}</p>
                <p className="text-sm text-muted-foreground">{stock.symbol}</p>
              </div>
            </div>
            <div className="text-left" dir="ltr">
              <p className="font-bold">{stock.price}</p>
              <p className={`text-sm font-medium ${isGain ? 'text-success' : 'text-destructive'}`}>
                {isGain ? '+' : ''}{stock.changePercent}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors group">
      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function PricingCard({ title, price, features, cta, href = "/subscriptions", highlighted = false }: { title: string, price: string, features: string[], cta: string, href?: string, highlighted?: boolean }) {
  return (
    <div className={`p-8 rounded-2xl border ${highlighted ? 'border-primary bg-primary/5 relative' : 'border-border bg-card'}`}>
      {highlighted && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
          الأكثر شعبية
        </div>
      )}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <div className="mb-6">
        <span className="text-3xl font-extrabold">{price}</span>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link href={href} className={`block text-center w-full py-3 rounded-lg font-bold transition-colors ${highlighted ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-foreground hover:bg-muted/80'}`}>
        {cta}
      </Link>
    </div>
  );
}
