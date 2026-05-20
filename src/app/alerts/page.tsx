"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  BellOff,
  BellRing,
  Plus, 
  Trash2, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Volume2
} from "lucide-react";
import { SAUDI_STOCKS, StockInfo } from "@/lib/stocks";

interface AlertItem {
  id: string;
  symbol: string;
  type: string; // PRICE_ABOVE, PRICE_BELOW
  value: number;
  status: string; // ACTIVE, TRIGGERED, INACTIVE
  createdAt: string;
}

interface StockMarketData {
  symbol: string;
  nameAr: string;
  price: number | null;
  changePercent: number | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [marketPrices, setMarketPrices] = useState<Record<string, StockMarketData>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info" | "trigger"; message: string } | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertType, setAlertType] = useState<"PRICE_ABOVE" | "PRICE_BELOW">("PRICE_ABOVE");
  const [targetPrice, setTargetPrice] = useState("");

  const showToast = (message: string, type: "success" | "error" | "info" | "trigger" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch alerts and market prices
  const fetchData = async () => {
    try {
      // 1. Fetch user alerts
      const resAlerts = await fetch("/api/alerts");
      if (!resAlerts.ok) throw new Error("Failed to fetch alerts");
      const alertsData: AlertItem[] = await resAlerts.json();
      setAlerts(alertsData);

      // 2. Fetch market data for prices
      const resMarket = await fetch("/api/market");
      if (resMarket.ok) {
        const marketData = await resMarket.json();
        const priceMap: Record<string, StockMarketData> = {};
        if (marketData && Array.isArray(marketData.stocks)) {
          marketData.stocks.forEach((stock: any) => {
            priceMap[stock.symbol] = {
              symbol: stock.symbol,
              nameAr: stock.nameAr,
              price: stock.price,
              changePercent: stock.changePercent
            };
          });
        }
        setMarketPrices(priceMap);
        
        // 3. Dynamic check for triggered alerts
        checkAlertsTrigger(alertsData, priceMap);
      }
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ أثناء تحميل البيانات.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 30 seconds for price updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if any active alerts are triggered by current prices
  const checkAlertsTrigger = async (activeAlerts: AlertItem[], prices: Record<string, StockMarketData>) => {
    const activeOnly = activeAlerts.filter(a => a.status === "ACTIVE");
    for (const alert of activeOnly) {
      const liveData = prices[alert.symbol];
      if (!liveData || liveData.price === null) continue;

      let isTriggered = false;
      if (alert.type === "PRICE_ABOVE" && liveData.price >= alert.value) {
        isTriggered = true;
      } else if (alert.type === "PRICE_BELOW" && liveData.price <= alert.value) {
        isTriggered = true;
      }

      if (isTriggered) {
        // Play notification sound if possible
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
          audio.volume = 0.4;
          audio.play().catch(() => {});
        } catch (e) {}

        const stockInfo = SAUDI_STOCKS.find(s => s.symbol === alert.symbol);
        const stockName = stockInfo ? stockInfo.nameAr : alert.symbol;
        const conditionText = alert.type === "PRICE_ABOVE" ? "تجاوز صعوداً" : "تراجع هبوطاً تحت";
        
        // Show Toast
        showToast(
          `🔔 تنبيه سعر: سهم ${stockName} (${alert.symbol}) ${conditionText} ${alert.value} ر.س! السعر الحالي: ${liveData.price} ر.س`, 
          "trigger"
        );

        // Update alert status on DB to TRIGGERED
        try {
          const res = await fetch(`/api/alerts/${alert.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "TRIGGERED" })
          });
          if (res.ok) {
            // Update local state state
            setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: "TRIGGERED" } : a));
          }
        } catch (e) {
          console.error("Failed to update trigger status:", e);
        }
      }
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) {
      showToast("يرجى اختيار شركة أولاً", "error");
      return;
    }
    const val = parseFloat(targetPrice);
    if (isNaN(val) || val <= 0) {
      showToast("يرجى إدخال سعر مستهدف صحيح", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedStock.symbol,
          type: alertType,
          value: val
        })
      });

      if (!res.ok) throw new Error("Failed to create alert");
      
      const newAlert = await res.json();
      setAlerts(prev => [newAlert, ...prev]);
      showToast(`تم إنشاء التنبيه لسهم ${selectedStock.nameAr} بنجاح.`);
      setIsModalOpen(false);
      setSelectedStock(null);
      setTargetPrice("");
      setSearchQuery("");
      
      // Refresh prices immediately
      fetchData();
    } catch (err) {
      console.error(err);
      showToast("فشل إنشاء التنبيه. حاول مرة أخرى.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete alert");

      setAlerts(prev => prev.filter(a => a.id !== id));
      showToast("تم حذف التنبيه بنجاح.", "info");
    } catch (err) {
      console.error(err);
      showToast("فشل حذف التنبيه.", "error");
    }
  };

  // Filter stocks based on search query
  const filteredStocks = SAUDI_STOCKS.filter(stock => 
    stock.nameAr.includes(searchQuery) || 
    stock.symbol.includes(searchQuery) ||
    stock.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in relative" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-[250] border shadow-2xl rounded-2xl p-4 flex items-center gap-3 animate-slide-up duration-300 max-w-md ${
          toast.type === "success" ? "bg-slate-900 border-emerald-500/30 text-emerald-400" :
          toast.type === "error" ? "bg-slate-900 border-rose-500/30 text-rose-400" :
          toast.type === "trigger" ? "bg-amber-950/90 border-amber-500/40 text-amber-300 shadow-amber-500/10" :
          "bg-slate-900 border-slate-700 text-slate-300"
        }`}>
          {toast.type === "success" && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
          {toast.type === "error" && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          {toast.type === "trigger" && <BellRing className="h-5 w-5 flex-shrink-0 text-amber-400 animate-bounce" />}
          {toast.type === "info" && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          
          <span className="text-sm font-semibold leading-relaxed">
            {toast.message}
          </span>
          <button onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground mr-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 bg-card border border-border p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 bg-gradient-to-l from-white to-slate-400 bg-clip-text text-transparent">
              نظام التنبيهات الذكي
            </h1>
            <p className="text-sm text-muted-foreground">
              تلقّ تنبيهات فورية عندما تصل أسهمك المفضلة إلى مستويات الأسعار المستهدفة.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/95 text-primary-foreground px-5 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20 w-full md:w-auto"
        >
          <Plus className="h-4 w-4" />
          تنبيه جديد
        </button>
      </div>

      {/* Main Alerts List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-border flex justify-between items-center bg-slate-900/40">
          <h2 className="font-extrabold flex items-center gap-2 text-foreground">
            <Bell className="h-5 w-5 text-primary" />
            تنبيهاتي النشطة والمطلقة
          </h2>
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-black">
            {alerts.length} تنبيهات إجمالاً
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">جاري تحميل تنبيهاتك النشطة ومستويات الأسعار...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="bg-slate-900/60 p-4 rounded-full border border-border mb-4">
              <BellOff className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              لا توجد تنبيهات نشطة
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              لم تقم بإنشاء أي تنبيهات سعرية حتى الآن. أنشئ تنبيهاً جديداً لتلقي إشعارات فورية عند وصول الأسعار لأهدافك.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 bg-slate-900 border border-border hover:bg-slate-800 text-foreground px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
            >
              أنشئ تنبيهاً الآن
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {alerts.map((alert) => {
              const stockInfo = SAUDI_STOCKS.find(s => s.symbol === alert.symbol);
              const livePrice = marketPrices[alert.symbol];
              
              return (
                <div 
                  key={alert.id} 
                  className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-extrabold text-lg text-foreground">
                        {alert.symbol} - {stockInfo?.nameAr || "سهم غير معروف"}
                      </span>
                      
                      {alert.status === "ACTIVE" ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          نشط
                        </span>
                      ) : alert.status === "TRIGGERED" ? (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <BellRing className="h-3 w-3 animate-pulse" />
                          تم إطلاقه
                        </span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 border border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          معطل
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-muted-foreground">
                      <p>
                        شرط التنبيه:{" "}
                        <strong className="text-foreground">
                          السعر {alert.type === "PRICE_ABOVE" ? "يتجاوز صعوداً" : "يتراجع هبوطاً تحت"}
                        </strong>
                        {" "}
                        <span className="text-primary font-black dir-ltr inline-block">
                          {alert.value.toFixed(2)} ر.س
                        </span>
                      </p>
                      
                      {livePrice && livePrice.price !== null && (
                        <p className="flex items-center gap-1.5 bg-slate-900 border border-border px-2 py-0.5 rounded-lg text-xs">
                          <span>السعر الفوري الحالي:</span>
                          <strong className="text-foreground">{livePrice.price.toFixed(2)} ر.س</strong>
                          <span className={livePrice.changePercent! >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            ({livePrice.changePercent! >= 0 ? "+" : ""}{livePrice.changePercent?.toFixed(2)}%)
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button 
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all duration-200"
                      title="حذف التنبيه"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal - New Alert Creation */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-xl text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-lg text-foreground">
                  إنشاء تنبيه سعر جديد
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-slate-800/60 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateAlert} className="p-6 space-y-6">
              {/* Select Stock Ticker */}
              <div className="space-y-2 relative">
                <label className="text-sm font-semibold text-slate-300">
                  ابحث عن الشركة أو الرمز
                </label>
                
                {selectedStock ? (
                  <div className="flex items-center justify-between bg-primary/5 border border-primary/30 rounded-xl p-3.5 text-sm">
                    <span className="font-bold text-foreground">
                      {selectedStock.symbol} - {selectedStock.nameAr}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedStock(null)}
                      className="text-primary hover:text-rose-400 font-bold text-xs"
                    >
                      تغيير الشركة
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث برقم الرمز أو اسم الشركة (مثال: أرامكو أو 2222)"
                        className="w-full bg-slate-900 border border-border rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                        autoFocus
                      />
                    </div>

                    {searchQuery && (
                      <div className="absolute z-10 w-full bg-slate-900 border border-border rounded-xl mt-1 shadow-2xl divide-y divide-border overflow-hidden">
                        {filteredStocks.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            لا توجد شركات مطابقة لبحثك
                          </div>
                        ) : (
                          filteredStocks.map((stock) => (
                            <button
                              key={stock.symbol}
                              type="button"
                              onClick={() => {
                                setSelectedStock(stock);
                                setSearchQuery("");
                              }}
                              className="w-full text-right p-3.5 text-sm hover:bg-primary/10 transition-colors flex justify-between items-center"
                            >
                              <span className="font-bold text-foreground">{stock.nameAr}</span>
                              <span className="text-xs text-muted-foreground bg-slate-800 border border-border px-2 py-0.5 rounded font-mono">{stock.symbol}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Alert Type (Above / Below) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  نوع التنبيه (الشرط)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAlertType("PRICE_ABOVE")}
                    className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                      alertType === "PRICE_ABOVE"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-slate-900 border-border text-muted-foreground hover:bg-slate-800"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    السعر أعلى من
                  </button>

                  <button
                    type="button"
                    onClick={() => setAlertType("PRICE_BELOW")}
                    className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                      alertType === "PRICE_BELOW"
                        ? "bg-rose-500/10 border-rose-500 text-rose-400"
                        : "bg-slate-900 border-border text-muted-foreground hover:bg-slate-800"
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    السعر أقل من
                  </button>
                </div>
              </div>

              {/* Target Price Value */}
              <div className="space-y-2">
                <label htmlFor="target-price" className="text-sm font-semibold text-slate-300 flex justify-between">
                  <span>السعر المستهدف (ر.س)</span>
                  {selectedStock && marketPrices[selectedStock.symbol] && (
                    <span className="text-xs text-muted-foreground">
                      السعر الحالي: {marketPrices[selectedStock.symbol].price?.toFixed(2)} ر.س
                    </span>
                  )}
                </label>
                <input 
                  id="target-price"
                  type="number"
                  step="0.01"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-mono text-center"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border bg-slate-900/20 -mx-6 -mb-6 p-6">
                <button
                  type="submit"
                  disabled={submitting || !selectedStock}
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/10"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    "حفظ التنبيه"
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-900 border border-border hover:bg-slate-800 text-slate-300 py-3 rounded-xl font-bold transition-all duration-200 text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
