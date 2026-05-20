"use client";

import { useState, useTransition, useMemo } from "react";
import { 
  Activity, 
  AlertTriangle, 
  FileText, 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  Users, 
  Database, 
  Zap, 
  Search, 
  Trash2, 
  ShieldAlert, 
  UserCheck, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  SearchX, 
  DollarSign, 
  ArrowLeft,
  X
} from "lucide-react";
import { SAUDI_STOCKS, StockInfo } from "@/lib/stocks";
import { updateUserTierAction, deleteUserAction } from "./actions";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: string;
  createdAt: string | Date;
}

interface AdminDashboardClientProps {
  initialUsers: AdminUser[];
  initialStats: {
    totalUsers: number;
    activeSubs: number;
    stockCount: number;
    portfolioCount: number;
    freeCount: number;
    proCount: number;
    eliteCount: number;
  };
  currentUserEmail: string | null;
}

export default function AdminDashboardClient({ 
  initialUsers, 
  initialStats,
  currentUserEmail
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "stocks" | "subscriptions" | "settings">("overview");
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [stats, setStats] = useState(initialStats);
  
  // Interactive search & filter states
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"ALL" | "FREE" | "PRO" | "ELITE">("ALL");
  const [stockSearch, setStockSearch] = useState("");
  const [stockSectorFilter, setStockSectorFilter] = useState("ALL");
  
  // Toast notifications state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // System refresh loading state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState<Array<{ id: string; text: string; time: string; type: "success" | "info" | "error" }>>([
    { id: "1", text: "تم بدء تشغيل لوحة التحكم ومزامنة حالة الأمان.", time: "قبل دقيقة", type: "success" },
    { id: "2", text: "تحديث بيانات إغلاق الأسهم بنجاح عبر مزود البيانات.", time: "قبل 15 دقيقة", type: "info" },
    { id: "3", text: "مزامنة قاعدة بيانات المشتركين والمحافظ.", time: "قبل ساعة", type: "success" },
  ]);

  // Transition for Server Actions
  const [isPending, startTransition] = useTransition();

  // Show Toast helper
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Update User Tier (Server Action Wrapper)
  const handleUpdateTier = async (userId: string, newTier: string) => {
    startTransition(async () => {
      const res = await updateUserTierAction(userId, newTier);
      if (res.success) {
        showToast(res.message || "تم التحديث بنجاح!", "success");
        // Update local state
        setUsers(prev => 
          prev.map(u => u.id === userId ? { ...u, subscriptionTier: newTier } : u)
        );
        // Recalculate stats locally
        setStats(prev => {
          const oldUser = users.find(u => u.id === userId);
          if (!oldUser) return prev;
          
          let freeDiff = 0, proDiff = 0, eliteDiff = 0;
          
          // Decrement old tier
          if (oldUser.subscriptionTier === "FREE") freeDiff--;
          if (oldUser.subscriptionTier === "PRO") proDiff--;
          if (oldUser.subscriptionTier === "ELITE") eliteDiff--;
          
          // Increment new tier
          if (newTier === "FREE") freeDiff++;
          if (newTier === "PRO") proDiff++;
          if (newTier === "ELITE") eliteDiff++;

          const oldSubs = (oldUser.subscriptionTier === "PRO" || oldUser.subscriptionTier === "ELITE") ? 1 : 0;
          const newSubs = (newTier === "PRO" || newTier === "ELITE") ? 1 : 0;
          const subDiff = newSubs - oldSubs;
          
          return {
            ...prev,
            activeSubs: prev.activeSubs + subDiff,
            freeCount: prev.freeCount + freeDiff,
            proCount: prev.proCount + proDiff,
            eliteCount: prev.eliteCount + eliteDiff
          };
        });
      } else {
        showToast(res.error || "حدث خطأ أثناء التحديث.", "error");
      }
    });
  };

  // Delete User (Server Action Wrapper)
  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`هل أنت متأكد من رغبتك في حذف حساب "${user.name || user.email}" نهائياً من النظام؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      startTransition(async () => {
        const res = await deleteUserAction(userId);
        if (res.success) {
          showToast(res.message || "تم حذف المستخدم بنجاح.", "success");
          
          // Update local state
          setUsers(prev => prev.filter(u => u.id !== userId));
          
          // Recalculate stats locally
          setStats(prev => {
            let freeDiff = 0, proDiff = 0, eliteDiff = 0;
            if (user.subscriptionTier === "FREE") freeDiff--;
            if (user.subscriptionTier === "PRO") proDiff--;
            if (user.subscriptionTier === "ELITE") eliteDiff--;
            
            const subDiff = (user.subscriptionTier === "PRO" || user.subscriptionTier === "ELITE") ? -1 : 0;
            
            return {
              ...prev,
              totalUsers: prev.totalUsers - 1,
              activeSubs: prev.activeSubs + subDiff,
              freeCount: prev.freeCount + freeDiff,
              proCount: prev.proCount + proDiff,
              eliteCount: prev.eliteCount + eliteDiff
            };
          });
        } else {
          showToast(res.error || "فشل حذف المستخدم.", "error");
        }
      });
    }
  };

  // Filtered Users computation
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
        (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase()));
      
      const matchesFilter = 
        userFilter === "ALL" || 
        u.subscriptionTier === userFilter;
        
      return matchesSearch && matchesFilter;
    });
  }, [users, userSearch, userFilter]);

  // Unique sectors for filter dropdown
  const sectors = useMemo(() => {
    const allSectors = SAUDI_STOCKS.map(s => s.sector);
    return ["ALL", ...Array.from(new Set(allSectors))];
  }, []);

  // Filtered Stocks computation
  const filteredStocks = useMemo(() => {
    return SAUDI_STOCKS.filter(s => {
      const matchesSearch = 
        s.symbol.includes(stockSearch) || 
        s.nameAr.includes(stockSearch) || 
        s.nameEn.toLowerCase().includes(stockSearch.toLowerCase());
      
      const matchesSector = 
        stockSectorFilter === "ALL" || 
        s.sector === stockSectorFilter;
        
      return matchesSearch && matchesSector;
    });
  }, [stockSearch, stockSectorFilter]);

  // System Sync / Refresh Simulation
  const handleSystemRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const newLog = {
        id: Date.now().toString(),
        text: "تم إجراء مزامنة أسعار الأسهم اللحظية وتحديث الـ Cache بنجاح.",
        time: "الآن",
        type: "success" as const
      };
      setLogs(prev => [newLog, ...prev]);
      showToast("تم مزامنة بيانات المنصة وتحديث الأسعار بنجاح!", "success");
    }, 1500);
  };

  // Mock Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    cacheTime: "300",
    enableNotifications: true,
    apiKey: "••••••••••••••••••••••••••••",
  });
  
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("تم حفظ إعدادات النظام وتحديث الحساب بنجاح!", "success");
    const newLog = {
      id: Date.now().toString(),
      text: "تم تحديث إعدادات النظام وحفظ التخزين المؤقت الجديد.",
      time: "الآن",
      type: "info" as const
    };
    setLogs(prev => [newLog, ...prev]);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground relative font-sans">
      
      {/* SUCCESS/ERROR TOAST */}
      {toast && (
        <div className={`fixed bottom-5 left-5 z-[500] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border transition-all duration-300 animate-in slide-in-from-bottom-5 ${
          toast.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400" 
            : "bg-destructive/10 border-destructive/35 text-destructive"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <ShieldAlert className="h-5 w-5 shrink-0" />}
          <span className="text-sm font-bold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="hover:opacity-80 ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-card border-l border-border hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <ShieldAlert className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">لوحة الإدارة</h2>
            <p className="text-[10px] text-muted-foreground font-mono">Saudi Stock Admin v0.1</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "overview" 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-3">
              <LayoutDashboard className="h-4 w-4" />
              الرئيسية
            </span>
            <ArrowLeft className={`h-3.5 w-3.5 transition-transform ${activeTab === "overview" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}`} />
          </button>

          <button 
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "users" 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-3">
              <Users className="h-4 w-4" />
              إدارة المستخدمين
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === "users" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {users.length}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab("stocks")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "stocks" 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-3">
              <Database className="h-4 w-4" />
              إدارة الأسهم (الرموز)
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === "stocks" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {SAUDI_STOCKS.length}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab("subscriptions")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "subscriptions" 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-3">
              <Zap className="h-4 w-4" />
              الاشتراكات والباقات
            </span>
            <ArrowLeft className={`h-3.5 w-3.5 transition-transform ${activeTab === "subscriptions" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}`} />
          </button>

          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "settings" 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-3">
              <SettingsIcon className="h-4 w-4" />
              إعدادات النظام
            </span>
            <ArrowLeft className={`h-3.5 w-3.5 transition-transform ${activeTab === "settings" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}`} />
          </button>
        </nav>

        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>متصل بقاعدة البيانات</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 overflow-y-auto bg-muted/10 p-6 sm:p-8 flex flex-col gap-8">
        
        {/* TOP BAR / TITLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">
              {activeTab === "overview" && "نظرة عامة (Overview)"}
              {activeTab === "users" && "إدارة المستخدمين"}
              {activeTab === "stocks" && "إدارة الأسهم المدرجة"}
              {activeTab === "subscriptions" && "توزيع الاشتراكات والخطط"}
              {activeTab === "settings" && "إعدادات النظام والتحليلات"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {activeTab === "overview" && "ملخص فوري لعمليات منصة تداول وأداء الاشتراكات."}
              {activeTab === "users" && "البحث عن المستخدمين، ترقية باقاتهم، وتأمين حسابات المنصة."}
              {activeTab === "stocks" && "عرض قطاعات السوق ورموز الشركات المدرجة في تداول السعودية."}
              {activeTab === "subscriptions" && "إحصائيات توزيع باقات المشتركين: FREE، PRO، ELITE."}
              {activeTab === "settings" && "تكوين مفاتيح النظام، فترات التخزين المؤقت، وحالة الاتصال."}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSystemRefresh}
              disabled={isRefreshing}
              className="bg-card hover:bg-muted text-foreground border border-border px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <RefreshCw className="h-4 w-4 text-primary" />
              )}
              {isRefreshing ? "مزامنة البيانات..." : "تحديث البيانات"}
            </button>
          </div>
        </div>

        {/* ======================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ======================================= */}
        {activeTab === "overview" && (
          <>
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-bold text-muted-foreground">إجمالي المشتركين</span>
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-black mb-1">{stats.totalUsers}</p>
                <div className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <span>نشطين في النظام</span>
                </div>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-violet-500/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-bold text-muted-foreground">الاشتراكات المدفوعة</span>
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-black mb-1">{stats.activeSubs}</p>
                <div className="text-xs font-bold text-violet-400 flex items-center gap-1">
                  <span>باقة PRO و ELITE</span>
                </div>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-bold text-muted-foreground">الأسهم المدعومة</span>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Database className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-black mb-1">{stats.stockCount}</p>
                <div className="text-xs font-bold text-amber-500">
                  محدثة لحظياً
                </div>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-bold text-muted-foreground">إجمالي المحافظ</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-black mb-1">{stats.portfolioCount}</p>
                <div className="text-xs font-bold text-emerald-400">
                  تفاعلية للمشتركين
                </div>
              </div>
            </div>

            {/* LOWER CONTENT: RECENT SIGNUPS & SYSTEM FEED */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Recent signups table (8 columns) */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-xl flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    أحدث الأعضاء المسجلين
                  </h2>
                  <button 
                    onClick={() => setActiveTab("users")}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    عرض الكل
                    <ArrowLeft className="h-3 w-3 shrink-0" />
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-4 font-bold">الاسم</th>
                        <th className="p-4 font-bold">البريد الإلكتروني</th>
                        <th className="p-4 font-bold text-center">تاريخ التسجيل</th>
                        <th className="p-4 font-bold text-center">باقة العضوية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {users.slice(0, 5).map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-bold text-foreground">
                            {user.name || <span className="text-muted-foreground italic font-normal text-xs">بدون اسم</span>}
                          </td>
                          <td className="p-4 font-mono text-muted-foreground text-xs" dir="ltr">
                            {user.email}
                          </td>
                          <td className="p-4 text-center text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${
                              user.subscriptionTier === "ELITE" 
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                                : user.subscriptionTier === "PRO"
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}>
                              {user.subscriptionTier}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* System status logs (4 columns) */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-4 flex flex-col">
                <h2 className="font-bold text-xl mb-5 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  سجل نشاط النظام
                </h2>
                
                <div className="flex-1 space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 text-xs leading-relaxed">
                      <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                        log.type === "success" ? "bg-emerald-500 animate-pulse" : log.type === "error" ? "bg-destructive" : "bg-primary"
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-foreground/90">{log.text}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted/30 border border-dashed border-border rounded-xl">
                  <h3 className="font-bold text-xs mb-1 text-primary">TODO: الربط مع البث المباشر</h3>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    يتم حالياً سحب إحصائيات مستخدمي تداول والمحافظ لحظياً من قاعدة البيانات. سيتم ربط واجهات إدارة المراقبة بشكل أوسع في الفترات القادمة.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ======================================= */}
        {/* TAB 2: USER MANAGEMENT */}
        {/* ======================================= */}
        {activeTab === "users" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            
            {/* FILTERS & SEARCH */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search input */}
              <div className="relative w-full md:w-96 flex items-center bg-muted/40 border border-border rounded-xl px-3 py-1.5 focus-within:border-primary/50 transition-all">
                <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-transparent border-none text-sm py-1 focus:outline-none font-bold text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-center justify-end">
                <span className="text-xs text-muted-foreground font-bold shrink-0">باقة الاشتراك:</span>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="ALL">الكل</option>
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="ELITE">ELITE (المدراء)</option>
                </select>
              </div>
            </div>

            {/* USERS TABLE */}
            <div className="overflow-x-auto rounded-xl border border-border/60">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <SearchX className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">لا توجد نتائج بحث</h3>
                    <p className="text-xs text-muted-foreground mt-1">تأكد من كتابة البريد الإلكتروني أو الاسم بشكل صحيح أو جرب تغيير فلتر الباقة.</p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-right text-sm">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-4 font-bold">الاسم</th>
                      <th className="p-4 font-bold">البريد الإلكتروني</th>
                      <th className="p-4 font-bold text-center">تاريخ التسجيل</th>
                      <th className="p-4 font-bold text-center">الباقة الحالية</th>
                      <th className="p-4 font-bold text-center">تعديل الصلاحية</th>
                      <th className="p-4 font-bold text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-bold text-foreground">
                          {user.name || <span className="text-muted-foreground italic font-normal text-xs">بدون اسم</span>}
                        </td>
                        <td className="p-4 font-mono text-muted-foreground text-xs" dir="ltr">
                          {user.email}
                          {user.email === currentUserEmail && (
                            <span className="mr-2 text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-sans font-bold">
                              أنت حالياً
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${
                            user.subscriptionTier === "ELITE" 
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                              : user.subscriptionTier === "PRO"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}>
                            {user.subscriptionTier}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateTier(user.id, "FREE")}
                              disabled={isPending || user.subscriptionTier === "FREE"}
                              className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${
                                user.subscriptionTier === "FREE"
                                  ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                  : "bg-muted hover:bg-muted-foreground/20 text-foreground"
                              }`}
                            >
                              Free
                            </button>
                            <button
                              onClick={() => handleUpdateTier(user.id, "PRO")}
                              disabled={isPending || user.subscriptionTier === "PRO"}
                              className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${
                                user.subscriptionTier === "PRO"
                                  ? "bg-primary/20 text-primary border border-primary/10 cursor-not-allowed"
                                  : "bg-primary/10 hover:bg-primary/25 text-primary"
                              }`}
                            >
                              Pro
                            </button>
                            <button
                              onClick={() => handleUpdateTier(user.id, "ELITE")}
                              disabled={isPending || user.subscriptionTier === "ELITE"}
                              className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${
                                user.subscriptionTier === "ELITE"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/10 cursor-not-allowed"
                                  : "bg-amber-500/10 hover:bg-amber-500/25 text-amber-400"
                              }`}
                            >
                              Elite
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isPending || user.email === currentUserEmail}
                            className={`p-2 rounded-lg text-muted-foreground transition-all ${
                              user.email === currentUserEmail 
                                ? "opacity-35 cursor-not-allowed" 
                                : "hover:bg-destructive/10 hover:text-destructive"
                            }`}
                            title="حذف المستخدم نهائياً"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 3: STOCK MANAGEMENT */}
        {/* ======================================= */}
        {activeTab === "stocks" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96 flex items-center bg-muted/40 border border-border rounded-xl px-3 py-1.5 focus-within:border-primary/50 transition-all">
                <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                <input
                  type="text"
                  placeholder="ابحث بالرمز، الاسم العربي أو الإنجليزي..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full bg-transparent border-none text-sm py-1 focus:outline-none font-bold text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <span className="text-xs text-muted-foreground font-bold shrink-0">تصفية حسب القطاع:</span>
                <select
                  value={stockSectorFilter}
                  onChange={(e) => setStockSectorFilter(e.target.value)}
                  className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary/50"
                >
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>
                      {sector === "ALL" ? "جميع القطاعات" : sector}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* STOCKS TABLE */}
            <div className="overflow-x-auto rounded-xl border border-border/60">
              {filteredStocks.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <SearchX className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">لا توجد أسهم مطابقة</h3>
                    <p className="text-xs text-muted-foreground mt-1">تأكد من كتابة الاسم أو الرمز بشكل صحيح.</p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-right text-sm">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-4 font-bold text-center">الرمز</th>
                      <th className="p-4 font-bold">اسم الشركة العربي</th>
                      <th className="p-4 font-bold">اسم الشركة الإنجليزي</th>
                      <th className="p-4 font-bold">القطاع</th>
                      <th className="p-4 font-bold text-center">Ticker (Yahoo)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredStocks.map((stock) => (
                      <tr key={stock.symbol} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 text-center font-bold font-mono text-primary">
                          {stock.symbol}
                        </td>
                        <td className="p-4 font-bold text-foreground">
                          {stock.nameAr}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {stock.nameEn}
                        </td>
                        <td className="p-4 text-xs font-bold">
                          <span className="bg-muted px-2.5 py-1 rounded-full border border-border">
                            {stock.sector}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-xs text-muted-foreground" dir="ltr">
                          {stock.yahooTicker}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 4: SUBSCRIPTIONS */}
        {/* ======================================= */}
        {activeTab === "subscriptions" && (
          <div className="space-y-8">
            
            {/* Visual breakdown ratio progress-bar */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <h2 className="font-bold text-lg mb-4">توزيع نسب الاشتراكات النشطة في المنصة</h2>
              
              {/* Complex custom HTML5 progress bar indicator */}
              <div className="h-6 w-full rounded-full overflow-hidden flex bg-muted mb-4 border border-border">
                {stats.totalUsers > 0 ? (
                  <>
                    <div 
                      style={{ width: `${(stats.freeCount / stats.totalUsers) * 100}%` }}
                      className="bg-muted-foreground/35 flex items-center justify-center text-[10px] font-black text-foreground"
                      title={`باقة FREE: ${stats.freeCount} مستخدم`}
                    >
                      {stats.freeCount > 0 && `${Math.round((stats.freeCount / stats.totalUsers) * 100)}%`}
                    </div>
                    <div 
                      style={{ width: `${(stats.proCount / stats.totalUsers) * 100}%` }}
                      className="bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground"
                      title={`باقة PRO: ${stats.proCount} مستخدم`}
                    >
                      {stats.proCount > 0 && `${Math.round((stats.proCount / stats.totalUsers) * 100)}%`}
                    </div>
                    <div 
                      style={{ width: `${(stats.eliteCount / stats.totalUsers) * 100}%` }}
                      className="bg-amber-500 flex items-center justify-center text-[10px] font-black text-amber-950"
                      title={`باقة ELITE: ${stats.eliteCount} مستخدم`}
                    >
                      {stats.eliteCount > 0 && `${Math.round((stats.eliteCount / stats.totalUsers) * 100)}%`}
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center text-xs text-muted-foreground">لا يوجد مستخدمين بعد</div>
                )}
              </div>

              {/* Legends */}
              <div className="flex flex-wrap gap-6 text-xs font-bold justify-center sm:justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-muted-foreground/35 border border-border" />
                  <span>باقة FREE: {stats.freeCount} مستخدم</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-primary" />
                  <span>باقة PRO (المدفوعة): {stats.proCount} مستخدم</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-amber-500" />
                  <span>باقة ELITE (الإدارة والشركاء): {stats.eliteCount} مستخدم</span>
                </div>
              </div>
            </div>

            {/* THREE CARDS PLAN DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Plan 1: FREE */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
                <h3 className="text-xl font-black mb-1">الباقة المجانية</h3>
                <span className="text-xs text-muted-foreground mb-4">الباقة القياسية لزوار المنصة</span>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl font-black text-foreground">0</span>
                  <span className="text-sm font-bold text-muted-foreground">ريال / شهرياً</span>
                </div>
                <ul className="text-xs font-bold text-muted-foreground space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    عرض الرسوم البيانية القياسية
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    قراءة الأخبار وتصفح السوق
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-4 w-4 text-muted-foreground shrink-0 opacity-40" />
                    التحليل المالي المتطور بالـ AI (مغلق)
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-4 w-4 text-muted-foreground shrink-0 opacity-40" />
                    محرك محاكاة الاستراتيجيات (مغلق)
                  </li>
                </ul>
                <div className="mt-auto pt-4 border-t border-border/60">
                  <span className="text-xs text-muted-foreground block text-center">إجمالي المستخدمين في هذه الباقة:</span>
                  <span className="text-lg font-black text-center block text-foreground mt-1">{stats.freeCount} مستخدم</span>
                </div>
              </div>

              {/* Plan 2: PRO */}
              <div className="bg-card border-primary/30 border-2 p-6 rounded-2xl shadow-xl flex flex-col relative overflow-hidden bg-primary/[0.02]">
                <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-black tracking-wide px-2 py-0.5 rounded-full uppercase">
                  الأكثر طلباً
                </div>
                <h3 className="text-xl font-black mb-1 text-primary">الباقة الاحترافية (PRO)</h3>
                <span className="text-xs text-muted-foreground mb-4">للمستثمرين والمضاربين النشطين</span>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl font-black text-foreground">99</span>
                  <span className="text-sm font-bold text-muted-foreground">ريال / شهرياً</span>
                </div>
                <ul className="text-xs font-bold text-muted-foreground space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    جميع ميزات الباقة المجانية
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    مستشار الذكاء الاصطناعي للأسهم (AI Analyst)
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    محرك محاكاة واستراتيجيات التداول اللحظي
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    تنبيهات فورية ومخصصة عبر الواتساب/البريد
                  </li>
                </ul>
                <div className="mt-auto pt-4 border-t border-border/60">
                  <span className="text-xs text-muted-foreground block text-center">إجمالي المستخدمين في هذه الباقة:</span>
                  <span className="text-lg font-black text-center block text-primary mt-1">{stats.proCount} مستخدم</span>
                </div>
              </div>

              {/* Plan 3: ELITE */}
              <div className="bg-card border-amber-500/30 border-2 p-6 rounded-2xl shadow-sm flex flex-col relative overflow-hidden bg-amber-500/[0.01]">
                <div className="absolute top-3 left-3 bg-amber-500 text-amber-950 text-[10px] font-black tracking-wide px-2 py-0.5 rounded-full uppercase">
                  أعلى فئة
                </div>
                <h3 className="text-xl font-black mb-1 text-amber-500">باقة النخبة (ELITE)</h3>
                <span className="text-xs text-muted-foreground mb-4">للشركاء ومسؤولي الإدارة العليا</span>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl font-black text-foreground">499</span>
                  <span className="text-sm font-bold text-muted-foreground">ريال / شهرياً</span>
                </div>
                <ul className="text-xs font-bold text-muted-foreground space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                    صلاحيات الدخول الكاملة للوحة الإدارة والتحكم
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                    تحديث ومزامنة بيانات السوق اللحظية
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                    إدارة حسابات وأعضاء المنصة والاشتراكات
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                    تخصيص كامل ومتقدم لمؤشرات التحليلات الفنية
                  </li>
                </ul>
                <div className="mt-auto pt-4 border-t border-border/60">
                  <span className="text-xs text-muted-foreground block text-center">إجمالي المستخدمين في هذه الباقة:</span>
                  <span className="text-lg font-black text-center block text-amber-500 mt-1">{stats.eliteCount} مستخدم</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 5: SYSTEM SETTINGS */}
        {/* ======================================= */}
        {activeTab === "settings" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <h2 className="font-bold text-xl flex items-center gap-2 border-b border-border pb-4">
              <SettingsIcon className="h-5 w-5 text-primary" />
              تكوين إعدادات المنصة
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-muted-foreground mb-2">مدة التخزين المؤقت لبيانات الأسهم (بالثواني):</label>
                  <input
                    type="number"
                    value={settingsForm.cacheTime}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, cacheTime: e.target.value }))}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    يساعد التخزين المؤقت (Caching) في منع حظر الطلبات من مزودي البيانات وتسريع تصفح الأسهم للزوار.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-muted-foreground mb-2">حالة مفاتيح API الخارجية:</label>
                  <input
                    type="text"
                    disabled
                    value="Yahoo Finance Server Connection (ACTIVE)"
                    className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-400 opacity-80 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    يتم ربط وحقن المفاتيح تلقائياً عبر متغيرات البيئة الآمنة (`.env`).
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-muted-foreground mb-2">مفتاح تشفير الجلسة والمصادقة الأمنية:</label>
                <input
                  type="text"
                  disabled
                  value={settingsForm.apiKey}
                  className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-muted-foreground opacity-60 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enable_notif"
                  checked={settingsForm.enableNotifications}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, enableNotifications: e.target.checked }))}
                  className="h-4.5 w-4.5 rounded border-border bg-muted/40 text-primary focus:ring-primary focus:ring-offset-background"
                />
                <label htmlFor="enable_notif" className="text-xs font-bold text-foreground cursor-pointer">
                  تفعيل تسجيل نشاط المحافظ وتحديث بيانات الإغلاق في لوحة التحكم بشكل دوري
                </label>
              </div>

              <div className="border-t border-border pt-6 flex justify-end">
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-primary/10 transition-all scale-100 hover:scale-[1.02] active:scale-[0.98]"
                >
                  حفظ الإعدادات
                </button>
              </div>

            </form>
          </div>
        )}

      </main>
    </div>
  );
}
