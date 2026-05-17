"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function WatchlistsPage() {
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState("");
  const [newListName, setNewListName] = useState("");

  const fetchWatchlists = async () => {
    try {
      const res = await fetch("/api/watchlists");
      const data = await res.json();
      setWatchlists(data);
      if (data.length > 0 && !activeListId) {
        setActiveListId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMarketData = async () => {
    try {
      const res = await fetch("/api/market");
      const data = await res.json();
      const map: any = {};
      data.stocks?.forEach((s: any) => { 
        // Create lookup for both "1120" and "1120.SR" to be safe
        map[s.symbol] = s;
        map[s.symbol.replace('.SR', '')] = s; 
      });
      setMarketData(map);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchWatchlists(), fetchMarketData()]).then(() => setIsLoading(false));
  }, []);

  const createWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName.trim() })
    });
    setNewListName("");
    fetchWatchlists();
  };

  const addSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || !activeListId) return;
    
    // Auto-append .SR if it's just a number
    let symbolToSave = newSymbol.trim();
    if (/^\d{4}$/.test(symbolToSave)) {
      symbolToSave += '.SR';
    }

    await fetch(`/api/watchlists/${activeListId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: symbolToSave })
    });
    setNewSymbol("");
    fetchWatchlists();
  };

  const removeSymbol = async (symbol: string) => {
    if (!activeListId) return;
    await fetch(`/api/watchlists/${activeListId}/items?symbol=${symbol}`, {
      method: "DELETE"
    });
    fetchWatchlists();
  };

  const activeList = watchlists.find(w => w.id === activeListId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">قوائم المراقبة</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar for Watchlist Names */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
          <h2 className="font-bold text-muted-foreground px-2">قوائمي</h2>
          
          <ul className="space-y-1 overflow-y-auto max-h-[400px]">
            {watchlists.map(list => (
              <li key={list.id}>
                <button 
                  onClick={() => setActiveListId(list.id)}
                  className={`w-full text-right px-3 py-2 rounded-lg font-medium transition-colors ${
                    activeListId === list.id 
                      ? "bg-primary/10 text-primary font-bold" 
                      : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  {list.name}
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={createWatchlist} className="mt-auto border-t border-border pt-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="اسم القائمة..." 
                className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              <button type="submit" className="bg-primary/10 text-primary p-2 rounded-md hover:bg-primary/20">
                <Plus size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Watchlist Content */}
        <div className="md:col-span-3 bg-card border border-border rounded-xl overflow-hidden flex flex-col min-h-[500px]">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw className="animate-spin text-muted-foreground" />
            </div>
          ) : activeList ? (
            <>
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                <h2 className="text-xl font-bold">{activeList.name}</h2>
                <p className="text-sm text-muted-foreground">{activeList.items.length} أسهم</p>
              </div>
              
              <div className="p-4 bg-background border-b border-border">
                <form onSubmit={addSymbol} className="flex gap-2 max-w-sm">
                  <input 
                    type="text" 
                    placeholder="رمز السهم (مثال: 1120)" 
                    className="flex-1 bg-card border border-border rounded-md px-3 py-2 focus:outline-none focus:border-primary"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                  />
                  <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90">
                    إضافة
                  </button>
                </form>
              </div>
              
              <div className="overflow-x-auto flex-1">
                {activeList.items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>القائمة فارغة. أضف أسهمك الأولى بالأعلى.</p>
                  </div>
                ) : (
                  <table className="w-full text-right">
                    <thead className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
                      <tr>
                        <th className="p-4 font-medium">الرمز</th>
                        <th className="p-4 font-medium">الشركة</th>
                        <th className="p-4 font-medium">السعر</th>
                        <th className="p-4 font-medium">التغير</th>
                        <th className="p-4 font-medium">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeList.items.map((item: any) => {
                        const sData = marketData[item.symbol];
                        const cleanSymbol = item.symbol.replace('.SR', '');
                        
                        return (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-4 font-bold">
                              <Link href={`/chart/${cleanSymbol}`} className="hover:text-primary transition-colors">
                                {cleanSymbol}
                              </Link>
                            </td>
                            <td className="p-4">{sData?.nameAr || 'جاري التحميل...'}</td>
                            <td className="p-4 font-bold" dir="ltr">
                              {sData?.price?.toFixed(2) || '-'}
                            </td>
                            <td className={`p-4 font-bold ${sData?.isUp ? 'text-success' : 'text-destructive'}`} dir="ltr">
                              {sData?.change ? `${sData.change > 0 ? '+' : ''}${sData.change.toFixed(2)}` : '-'}
                            </td>
                            <td className="p-4 text-left">
                              <button 
                                onClick={() => removeSymbol(item.symbol)}
                                className="text-muted-foreground hover:text-destructive p-2 rounded-full hover:bg-destructive/10 transition-colors"
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
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>قم بإنشاء أو اختيار قائمة لعرض بياناتها.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
