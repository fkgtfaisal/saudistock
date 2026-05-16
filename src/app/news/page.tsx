import { Calendar, Clock, Newspaper } from "lucide-react";
import Link from "next/link";

export default function NewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">أخبار السوق السعودي</h1>
          <p className="text-muted-foreground">آخر التحديثات والإعلانات للشركات المدرجة في تداول ونمو.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Main News Feed */}
        <div className="md:col-span-2 flex-1 space-y-6">
          
          {/* News Item 1 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-bold">توزيعات أرباح</span>
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                منذ ساعتين
              </span>
            </div>
            <h2 className="text-xl font-bold mb-2">
              <Link href="#" className="hover:text-primary transition-colors">
                أرامكو السعودية تعلن عن توزيع أرباح نقدية على المساهمين عن الربع الثاني
              </Link>
            </h2>
            <p className="text-muted-foreground mb-4">
              أعلنت شركة الزيت العربية السعودية (أرامكو السعودية) عن توزيع أرباح أساسية بقيمة 76.1 مليار ريال (20.3 مليار دولار) على المساهمين عن الربع الثاني من عام 2024.
            </p>
            <div className="flex items-center gap-2">
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium">2222 - أرامكو السعودية</span>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium">قطاع الطاقة</span>
            </div>
          </div>

          {/* News Item 2 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-secondary/20 text-secondary-foreground text-xs px-2 py-1 rounded font-bold">نتائج مالية</span>
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                منذ 5 ساعات
              </span>
            </div>
            <h2 className="text-xl font-bold mb-2">
              <Link href="#" className="hover:text-primary transition-colors">
                ارتفاع أرباح الراجحي إلى 4.2 مليار ريال خلال الربع الثاني
              </Link>
            </h2>
            <p className="text-muted-foreground mb-4">
              أعلن مصرف الراجحي عن ارتفاع صافي الأرباح بنسبة 8% خلال الربع الثاني من العام الحالي مقارنة بنفس الفترة من العام الماضي، بدعم من نمو العمليات التمويلية.
            </p>
            <div className="flex items-center gap-2">
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium">1120 - الراجحي</span>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium">قطاع البنوك</span>
            </div>
          </div>

          {/* News Item 3 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-accent/20 text-accent-foreground text-xs px-2 py-1 rounded font-bold">اقتصاد</span>
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                أمس
              </span>
            </div>
            <h2 className="text-xl font-bold mb-2">
              <Link href="#" className="hover:text-primary transition-colors">
                تاسي يغلق مرتفعاً بـ 120 نقطة بدعم من قطاعي البنوك والمواد الأساسية
              </Link>
            </h2>
            <p className="text-muted-foreground mb-4">
              أنهى مؤشر السوق السعودي (تاسي) جلسة أمس على ارتفاع ملحوظ، مسجلاً مستويات جديدة بفضل تدفق السيولة الشرائية على القياديات.
            </p>
            <div className="flex items-center gap-2">
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium">السوق الرئيسي</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              أحداث قادمة
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-12 h-12 bg-muted rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-destructive">أغسطس</span>
                  <span className="text-lg font-extrabold">15</span>
                </div>
                <div>
                  <p className="font-bold text-sm">استحقاق أرباح</p>
                  <p className="text-muted-foreground text-xs">اس تي سي (7010)</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-12 h-12 bg-muted rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-destructive">أغسطس</span>
                  <span className="text-lg font-extrabold">20</span>
                </div>
                <div>
                  <p className="font-bold text-sm">إعلان نتائج الربع الثاني</p>
                  <p className="text-muted-foreground text-xs">معادن (1211)</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              تصنيفات الأخبار
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors">نتائج مالية</span>
              <span className="bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors">توزيعات</span>
              <span className="bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors">اكتتابات</span>
              <span className="bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors">عقود ومشاريع</span>
              <span className="bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors">اقتصاد</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
