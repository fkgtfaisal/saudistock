import { Activity, AlertTriangle, FileText, LayoutDashboard, Settings, Users, Database, Zap } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar Admin Navigation */}
      <aside className="w-64 bg-card border-l border-border hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShieldIcon className="h-5 w-5 text-primary" />
            لوحة الإدارة
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <NavItem icon={<LayoutDashboard className="h-4 w-4" />} label="الرئيسية" active />
          <NavItem icon={<Users className="h-4 w-4" />} label="إدارة المستخدمين" />
          <NavItem icon={<Database className="h-4 w-4" />} label="إدارة الأسهم (الرموز)" />
          <NavItem icon={<FileText className="h-4 w-4" />} label="إدارة الأخبار" />
          <NavItem icon={<Activity className="h-4 w-4" />} label="التحليلات المجتمعية" />
          <NavItem icon={<Zap className="h-4 w-4" />} label="الاشتراكات والباقات" />
          <NavItem icon={<AlertTriangle className="h-4 w-4" />} label="مراقبة التنبيهات" />
          <NavItem icon={<Settings className="h-4 w-4" />} label="إعدادات النظام" />
        </nav>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto bg-muted/10 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">نظرة عامة (Overview)</h1>
            <p className="text-muted-foreground">ملخص لعمليات المنصة والمشتركين.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-full">
              آخر تحديث: قبل دقيقة
            </span>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
              تحديث البيانات
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="إجمالي المشتركين" value="12,450" trend="+12% هذا الشهر" />
          <StatCard title="الاشتراكات النشطة (Pro/Premium)" value="3,120" trend="+5% هذا الشهر" />
          <StatCard title="الأسهم المدرجة" value="234" trend="محدثة" />
          <StatCard title="التنبيهات المرسلة (اليوم)" value="8,402" trend="+20% عن الأمس" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold text-xl mb-4">أحدث التسجيلات</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="text-muted-foreground border-b border-border">
                  <tr>
                    <th className="pb-3 font-medium">الاسم</th>
                    <th className="pb-3 font-medium">البريد الإلكتروني</th>
                    <th className="pb-3 font-medium">الباقة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/10">
                    <td className="py-3">سعود الدوسري</td>
                    <td className="py-3 text-muted-foreground" dir="ltr">saud@example.com</td>
                    <td className="py-3"><span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">Pro</span></td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="py-3">محمد القحطاني</td>
                    <td className="py-3 text-muted-foreground" dir="ltr">m.q@example.com</td>
                    <td className="py-3"><span className="bg-muted px-2 py-0.5 rounded text-xs font-bold">Free</span></td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="py-3">عبدالله الفهد</td>
                    <td className="py-3 text-muted-foreground" dir="ltr">abdullah@example.com</td>
                    <td className="py-3"><span className="bg-accent/10 text-accent-foreground px-2 py-0.5 rounded text-xs font-bold">Premium</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button className="w-full text-center text-primary text-sm font-bold mt-4 hover:underline">عرض جميع المستخدمين</button>
          </div>

          {/* System Status / Logs */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold text-xl mb-4">حالة النظام و Audit Logs</h2>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm">
                <span className="text-success mt-0.5 flex-shrink-0">●</span>
                <div>
                  <p className="font-medium">تم تحديث بيانات الإغلاق للسوق بنجاح.</p>
                  <p className="text-xs text-muted-foreground">قبل 15 دقيقة</p>
                </div>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="text-primary mt-0.5 flex-shrink-0">●</span>
                <div>
                  <p className="font-medium">مشترك جديد انضم لباقة Premium (معرف: #4920).</p>
                  <p className="text-xs text-muted-foreground">قبل ساعة</p>
                </div>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="text-destructive mt-0.5 flex-shrink-0">●</span>
                <div>
                  <p className="font-medium">فشل في جلب البيانات من مزود الأخبار (محاولة إعادة اتصال).</p>
                  <p className="text-xs text-muted-foreground">قبل ساعتين</p>
                </div>
              </li>
            </ul>
            
            {/* TODO: Connect Real-Time API */}
            <div className="mt-6 p-4 bg-muted/50 border border-dashed border-border rounded-lg">
              <h3 className="font-bold text-sm mb-1 text-primary">TODO: مزود البيانات الرسمي</h3>
              <p className="text-xs text-muted-foreground">
                في هذه المرحلة يتم استخدام بيانات تجريبية. سيتم لاحقاً دمج API مزود بيانات مرخص لجلب وتحديث أسعار الأسهم اللحظية (Realtime Data).
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
      {icon}
      {label}
    </button>
  );
}

function StatCard({ title, value, trend }: { title: string, value: string, trend: string }) {
  return (
    <div className="bg-card border border-border p-5 rounded-xl">
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <p className="text-3xl font-extrabold mb-1">{value}</p>
      <p className="text-xs font-medium text-success">{trend}</p>
    </div>
  );
}

function ShieldIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
