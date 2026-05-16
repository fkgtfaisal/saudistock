import { Bell, Plus, Settings2, Trash2 } from "lucide-react";

export default function AlertsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">التنبيهات</h1>
          <p className="text-muted-foreground">أدر تنبيهات الأسعار والمؤشرات الفنية للأسهم الخاصة بك.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          تنبيه جديد
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            تنبيهاتي النشطة
          </h2>
          <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">3 تنبيهات</span>
        </div>
        
        <div className="divide-y divide-border">
          {/* Alert Item 1 */}
          <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-lg">2222 - أرامكو السعودية</span>
                <span className="bg-success/10 text-success text-xs px-2 py-1 rounded font-bold">نشط</span>
              </div>
              <p className="text-muted-foreground text-sm">
                تنبيه إذا كان <strong className="text-foreground">السعر</strong> يتقاطع صعوداً مع <strong className="text-foreground">35.00 SAR</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-muted-foreground hover:text-foreground bg-muted/50 rounded-md transition-colors">
                <Settings2 className="h-4 w-4" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-destructive bg-muted/50 rounded-md transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Alert Item 2 */}
          <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-lg">1120 - الراجحي</span>
                <span className="bg-success/10 text-success text-xs px-2 py-1 rounded font-bold">نشط</span>
              </div>
              <p className="text-muted-foreground text-sm">
                تنبيه إذا كان <strong className="text-foreground">RSI (14)</strong> أقل من <strong className="text-foreground">30</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-muted-foreground hover:text-foreground bg-muted/50 rounded-md transition-colors">
                <Settings2 className="h-4 w-4" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-destructive bg-muted/50 rounded-md transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Alert Item 3 */}
          <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-lg">2010 - سابك</span>
                <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-bold">متوقف</span>
              </div>
              <p className="text-muted-foreground text-sm">
                تنبيه إذا كان <strong className="text-foreground">حجم التداول</strong> يتجاوز <strong className="text-foreground">10M</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-muted-foreground hover:text-foreground bg-muted/50 rounded-md transition-colors">
                <Settings2 className="h-4 w-4" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-destructive bg-muted/50 rounded-md transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
