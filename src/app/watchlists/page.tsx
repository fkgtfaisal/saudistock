export default function WatchlistsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">قوائم المراقبة</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
          إنشاء قائمة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar for Watchlist Names */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-bold mb-4 text-muted-foreground px-2">قوائمي</h2>
          <ul className="space-y-1">
            <li>
              <button className="w-full text-right px-3 py-2 bg-primary/10 text-primary rounded-lg font-bold">
                الأسهم الاستثمارية
              </button>
            </li>
            <li>
              <button className="w-full text-right px-3 py-2 text-foreground hover:bg-muted/50 rounded-lg font-medium transition-colors">
                أسهم للمضاربة
              </button>
            </li>
            <li>
              <button className="w-full text-right px-3 py-2 text-foreground hover:bg-muted/50 rounded-lg font-medium transition-colors">
                قطاع البتروكيماويات
              </button>
            </li>
          </ul>
        </div>

        {/* Watchlist Content */}
        <div className="md:col-span-3 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <h2 className="text-xl font-bold">الأسهم الاستثمارية</h2>
            <p className="text-sm text-muted-foreground">4 أسهم</p>
          </div>
          
          {/* Table Placeholder */}
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
                <tr>
                  <th className="p-4 font-medium">الرمز</th>
                  <th className="p-4 font-medium">الشركة</th>
                  <th className="p-4 font-medium">السعر</th>
                  <th className="p-4 font-medium">التغير</th>
                  <th className="p-4 font-medium">ملاحظات</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-bold">2222</td>
                  <td className="p-4">أرامكو السعودية</td>
                  <td className="p-4 font-bold" dir="ltr">32.40</td>
                  <td className="p-4 text-success font-bold" dir="ltr">+1.20</td>
                  <td className="p-4 text-sm text-muted-foreground">استثمار طويل المدى</td>
                  <td className="p-4 text-left">
                    <button className="text-muted-foreground hover:text-destructive">حذف</button>
                  </td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-bold">1120</td>
                  <td className="p-4">الراجحي</td>
                  <td className="p-4 font-bold" dir="ltr">88.50</td>
                  <td className="p-4 text-success font-bold" dir="ltr">+2.10</td>
                  <td className="p-4 text-sm text-muted-foreground">متابعة توزيعات الأرباح</td>
                  <td className="p-4 text-left">
                    <button className="text-muted-foreground hover:text-destructive">حذف</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
