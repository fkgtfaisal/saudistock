import { MessageSquare, ThumbsUp, TrendingDown, TrendingUp, User } from "lucide-react";
import Link from "next/link";

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">مجتمع التحليلات</h1>
          <p className="text-muted-foreground">شارك أفكارك وتحليلاتك مع آلاف المتداولين في السوق السعودي.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
          نشر تحليل جديد
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Feed */}
        <div className="md:col-span-2 flex-1 space-y-6">
          
          {/* Post 1 */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">أحمد عبدالله</p>
                  <p className="text-muted-foreground text-xs">منذ ساعتين</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-success/10 text-success text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  شراء
                </span>
                <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium">1 يوم</span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-2">تحليل موجي لسهم الراجحي (1120) - اختراق مثلث صاعد</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              يلاحظ على الإطار اليومي اكتمال نموذج مثلث صاعد واختراق مستوى المقاومة عند 88.00 ريال بحجم تداول عالي. الأهداف المتوقعة عند 92.00 ثم 95.00، مع وقف خسارة بإغلاق يومي تحت 85.00 ريال.
            </p>
            
            <div className="w-full h-64 bg-muted/30 border border-border rounded-lg mb-4 flex items-center justify-center text-muted-foreground">
              صورة الرسم البياني (شارت)
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors">1120 - الراجحي</span>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors">التحليل الفني</span>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ThumbsUp className="h-4 w-4" />
                245 إعجاب
              </button>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="h-4 w-4" />
                32 تعليق
              </button>
            </div>
          </div>

          {/* Post 2 */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">سعد العتيبي</p>
                  <p className="text-muted-foreground text-xs">منذ 5 ساعات</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-muted text-foreground text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                  تعليمي
                </span>
                <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium">1 أسبوع</span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-2">شرح استراتيجية تقاطع المتوسطات المتحركة (Golden Cross)</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              في هذا الدرس نوضح كيف يمكن للمتداول استخدام تقاطع المتوسط المتحرك 50 مع المتوسط 200 كإشارة قوية للتحول في الاتجاه. لقد قمت بتطبيقها على مؤشر تاسي وتوضيح النتائج التاريخية.
            </p>

            <div className="flex items-center gap-2 mb-4">
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors">تاسي</span>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors">تعليمي</span>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ThumbsUp className="h-4 w-4" />
                128 إعجاب
              </button>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="h-4 w-4" />
                15 تعليق
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-xs text-muted-foreground leading-relaxed text-center mb-2">
              إخلاء مسؤولية: جميع البيانات والتحليلات المنشورة في قسم المجتمع هي لأغراض معلوماتية وتعليمية فقط، ولا تعد بأي حال من الأحوال توصية بالبيع أو الشراء. التداول في الأسواق المالية ينطوي على مخاطر.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold mb-4">أهم المحللين</h3>
            <ul className="space-y-4">
              {[1, 2, 3].map((item) => (
                <li key={item} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">محلل رقم {item}</p>
                      <p className="text-muted-foreground text-xs">15.2k متابع</p>
                    </div>
                  </div>
                  <button className="text-xs text-primary font-bold hover:underline">متابعة</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
