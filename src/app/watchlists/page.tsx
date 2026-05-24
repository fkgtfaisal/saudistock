"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Trash2,
  Plus,
  RefreshCw,
  Mail,
  BellOff,
  Loader2,
  Search,
} from "lucide-react";
import { SAUDI_STOCKS, StockInfo } from "@/lib/stocks";

type WatchlistItem = {
  id: string;
  symbol: string;
};

type Watchlist = {
  id: string;
  name: string;
  items: WatchlistItem[];
};

type MarketStock = {
  symbol: string;
  nameAr?: string;
  name?: string;
  price?: number;
  change?: number;
  isUp?: boolean;
};

type MarketMap = Record<string, MarketStock>;

export default function WatchlistsPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MarketMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState("");
  const [newListName, setNewListName] = useState("");
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [isUpdatingAlerts, setIsUpdatingAlerts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);

  const filteredStocks = useMemo(() => {
    if (!stockSearchQuery) return [];
    return SAUDI_STOCKS.filter(stock => 
      stock.nameAr.includes(stockSearchQuery) || 
      stock.symbol.includes(stockSearchQuery) ||
      stock.nameEn.toLowerCase().includes(stockSearchQuery.toLowerCase())
    ).slice(0, 5);
  }, [stockSearchQuery]);

  const activeList = useMemo(() => {
    return watchlists.find((watchlist) => watchlist.id === activeListId) ?? null;
  }, [watchlists, activeListId]);

  const fetchWatchlists = async () => {
    try {
      const res = await fetch("/api/watchlists", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("فشل تحميل قوائم المراقبة");
      }

      const data: Watchlist[] = await res.json();

      setWatchlists(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length > 0) {
        setActiveListId((currentId) => currentId ?? data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل قوائم المراقبة.");
    }
  };

  const fetchMarketData = async () => {
    try {
      const res = await fetch("/api/market", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("فشل تحميل بيانات السوق");
      }

      const data: { stocks?: MarketStock[] } = await res.json();
      const map: MarketMap = {};

      data.stocks?.forEach((stock) => {
        if (!stock.symbol) return;

        const cleanSymbol = stock.symbol.replace(".SR", "");

        map[stock.symbol] = stock;
        map[cleanSymbol] = stock;
      });

      setMarketData(map);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل بيانات السوق.");
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/user/preferences", {
        cache: "no-store",
      });

      if (!res.ok) {
        return;
      }

      const data: { emailAlertsEnabled?: boolean } = await res.json();

      if (typeof data.emailAlertsEnabled === "boolean") {
        setEmailAlertsEnabled(data.emailAlertsEnabled);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPageData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchWatchlists(),
        fetchMarketData(),
        fetchPreferences(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const createWatchlist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = newListName.trim();

    if (!name) return;

    try {
      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        throw new Error("فشل إنشاء القائمة");
      }

      setNewListName("");
      await fetchWatchlists();
    } catch (err) {
      console.error(err);
      setError("تعذر إنشاء قائمة مراقبة جديدة.");
    }
  };

  const toggleEmailAlerts = async () => {
    if (isUpdatingAlerts) return;

    setIsUpdatingAlerts(true);

    const newValue = !emailAlertsEnabled;

    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailAlertsEnabled: newValue }),
      });

      if (!res.ok) {
        throw new Error("فشل تحديث تفضيلات البريد");
      }

      setEmailAlertsEnabled(newValue);
    } catch (err) {
      console.error(err);
      setError("تعذر تحديث حالة الملخص البريدي.");
    } finally {
      setIsUpdatingAlerts(false);
    }
  };

  const normalizeSaudiSymbol = (value: string) => {
    const symbol = value.trim().toUpperCase();

    if (!symbol) return "";

    if (/^\d{4}$/.test(symbol)) {
      return `${symbol}.SR`;
    }

    return symbol;
  };

  const addSymbol = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!activeListId) return;

    const symbolToSave = selectedStock ? normalizeSaudiSymbol(selectedStock.symbol) : normalizeSaudiSymbol(stockSearchQuery);

    if (!symbolToSave) return;

    try {
      const res = await fetch(`/api/watchlists/${activeListId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol: symbolToSave }),
      });

      if (!res.ok) {
        throw new Error("فشل إضافة السهم");
      }

      setStockSearchQuery("");
      setSelectedStock(null);
      await fetchWatchlists();
    } catch (err) {
      console.error(err);
      setError("تعذر إضافة السهم إلى القائمة.");
    }
  };

  const removeSymbol = async (symbol: string) => {
    if (!activeListId) return;

    try {
      const encodedSymbol = encodeURIComponent(symbol);

      const res = await fetch(
        `/api/watchlists/${activeListId}/items?symbol=${encodedSymbol}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error("فشل حذف السهم");
      }

      await fetchWatchlists();
    } catch (err) {
      console.error(err);
      setError("تعذر حذف السهم من القائمة.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">قوائم المراقبة</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            أنشئ قوائمك الخاصة وتابع أسهم السوق السعودي بسهولة.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleEmailAlerts}
          disabled={isUpdatingAlerts}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${emailAlertsEnabled
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
              : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
        >
          {isUpdatingAlerts ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : emailAlertsEnabled ? (
            <Mail className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}

          <span>
            {emailAlertsEnabled
              ? "الملخص البريدي: مفعل"
              : "الملخص البريدي: معطل"}
          </span>
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <aside className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2 px-2">
            <h2 className="font-bold text-muted-foreground">قوائمي</h2>

            <button
              type="button"
              onClick={loadPageData}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="تحديث"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <ul className="max-h-[400px] space-y-1 overflow-y-auto">
            {watchlists.length === 0 ? (
              <li className="rounded-lg bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
                لا توجد قوائم حتى الآن.
              </li>
            ) : (
              watchlists.map((list) => (
                <li key={list.id}>
                  <button
                    type="button"
                    onClick={() => setActiveListId(list.id)}
                    className={`w-full rounded-lg px-3 py-2 text-right font-medium transition-colors ${activeListId === list.id
                        ? "bg-primary/10 font-bold text-primary"
                        : "text-foreground hover:bg-muted/50"
                      }`}
                  >
                    {list.name}
                  </button>
                </li>
              ))
            )}
          </ul>

          <form
            onSubmit={createWatchlist}
            className="mt-auto border-t border-border pt-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="اسم القائمة..."
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />

              <button
                type="submit"
                className="rounded-md bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20"
                title="إضافة قائمة"
              >
                <Plus size={18} />
              </button>
            </div>
          </form>
        </aside>

        <main className="flex min-h-[500px] flex-col overflow-hidden rounded-xl border border-border bg-card md:col-span-3">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <RefreshCw className="animate-spin text-muted-foreground" />
            </div>
          ) : activeList ? (
            <>
              <div className="flex items-center justify-between border-b border-border bg-muted/20 p-4">
                <div>
                  <h2 className="text-xl font-bold">{activeList.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeList.items.length} أسهم
                  </p>
                </div>
              </div>

              <div className="border-b border-border bg-background p-4 relative">
                <form onSubmit={addSymbol} className="flex max-w-sm gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="ابحث باسم الشركة أو رمز السهم (مثال: أرامكو أو 2222)"
                      className="w-full rounded-md border border-border bg-card pr-9 pl-3 py-2 text-sm focus:border-primary focus:outline-none"
                      value={selectedStock ? selectedStock.nameAr : stockSearchQuery}
                      onChange={(e) => {
                        setSelectedStock(null);
                        setStockSearchQuery(e.target.value);
                        setShowStockDropdown(true);
                      }}
                      onFocus={() => setShowStockDropdown(true)}
                      onBlur={() => setTimeout(() => setShowStockDropdown(false), 200)}
                    />
                    
                    {/* Dropdown Menu */}
                    {showStockDropdown && stockSearchQuery && !selectedStock && (
                      <div className="absolute top-full mt-1 right-0 w-full z-[100] bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto divide-y divide-border">
                        {filteredStocks.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">لا توجد نتائج مطابقة</div>
                        ) : (
                          filteredStocks.map((stock) => (
                            <button
                              key={stock.symbol}
                              type="button"
                              onMouseDown={() => {
                                setSelectedStock(stock);
                                setStockSearchQuery(stock.symbol);
                                setShowStockDropdown(false);
                              }}
                              className="w-full text-right p-3 hover:bg-muted/50 transition-colors flex justify-between items-center text-sm"
                            >
                              <span className="font-bold text-foreground">{stock.nameAr}</span>
                              <span className="text-xs text-muted-foreground font-mono">{stock.symbol}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedStock && !stockSearchQuery.trim()}
                    className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إضافة
                  </button>
                </form>
              </div>

              <div className="flex-1 overflow-x-auto">
                {activeList.items.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>القائمة فارغة. أضف أسهمك الأولى بالأعلى.</p>
                  </div>
                ) : (
                  <table className="w-full text-right">
                    <thead className="border-b border-border bg-muted/50 text-sm text-muted-foreground">
                      <tr>
                        <th className="p-4 font-medium">الرمز</th>
                        <th className="p-4 font-medium">الشركة</th>
                        <th className="p-4 font-medium">السعر</th>
                        <th className="p-4 font-medium">التغير</th>
                        <th className="p-4 font-medium">إجراء</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {activeList.items.map((item) => {
                        const cleanSymbol = item.symbol.replace(".SR", "");
                        const stockData =
                          marketData[item.symbol] ?? marketData[cleanSymbol];

                        const companyName =
                          stockData?.nameAr ??
                          stockData?.name ??
                          "غير متوفر";

                        const price =
                          typeof stockData?.price === "number"
                            ? stockData.price.toFixed(2)
                            : "-";

                        const change =
                          typeof stockData?.change === "number"
                            ? `${stockData.change > 0 ? "+" : ""}${stockData.change.toFixed(2)}`
                            : "-";

                        const isPositive =
                          typeof stockData?.change === "number"
                            ? stockData.change >= 0
                            : stockData?.isUp;

                        return (
                          <tr
                            key={item.id}
                            className="transition-colors hover:bg-muted/20"
                          >
                            <td className="p-4 font-bold">
                              <Link
                                href={`/chart/${cleanSymbol}`}
                                className="transition-colors hover:text-primary"
                              >
                                {cleanSymbol}
                              </Link>
                            </td>

                            <td className="p-4">{companyName}</td>

                            <td className="p-4 font-bold" dir="ltr">
                              {price}
                            </td>

                            <td
                              className={`p-4 font-bold ${isPositive
                                  ? "text-emerald-500"
                                  : "text-destructive"
                                }`}
                              dir="ltr"
                            >
                              {change}
                            </td>

                            <td className="p-4 text-left">
                              <button
                                type="button"
                                onClick={() => removeSymbol(item.symbol)}
                                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                title="حذف السهم"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-4 text-center text-muted-foreground">
              <p>قم بإنشاء أو اختيار قائمة لعرض بياناتها.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}