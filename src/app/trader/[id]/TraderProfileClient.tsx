"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserPlus, UserCheck, Shield, TrendingUp, TrendingDown, Users, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Holding = {
  symbol: string;
  value: number;
  percent: number;
};

type TraderProps = {
  trader: {
    id: string;
    name: string;
    tier: string;
    followersCount: number;
    followingCount: number;
    returnPercent: number;
    holdings: Holding[];
    cashPercent: number;
  };
};

export default function TraderProfileClient({ trader }: TraderProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(trader.followersCount);

  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    // Check if following
    async function checkFollow() {
      try {
        const res = await fetch(`/api/users/${trader.id}/follow`);
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (err) {
        console.error("Failed to check follow status", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkFollow();
  }, [currentUserId, trader.id]);

  const toggleFollow = async () => {
    if (!currentUserId) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${trader.id}/follow`, { method });
      
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
      } else {
        const data = await res.json();
        alert(data.error || "حدث خطأ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isOwnProfile = currentUserId === trader.id;

  // Chart Data Preparation
  const COLORS = ["#d4af37", "#0ea5e9", "#10b981", "#ec4899", "#8b5cf6", "#f59e0b", "#ef4444"];
  const chartData = trader.holdings.map(h => ({
    name: h.symbol.replace(".SR", ""),
    value: h.percent
  }));

  if (trader.cashPercent > 0) {
    chartData.push({
      name: "سيولة نقدية (Cash)",
      value: trader.cashPercent
    });
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl animate-fade-in" dir="rtl">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-3xl p-8 shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-4xl font-black text-slate-300 shadow-2xl">
            {trader.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 text-center md:text-right space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl font-extrabold text-foreground">{trader.name}</h1>
              {trader.tier !== "FREE" && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${trader.tier === "ELITE" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                  <Shield className="w-3 h-3" />
                  {trader.tier}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-6 text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400" />
                <span className="text-foreground font-bold">{followersCount}</span> متابع
              </div>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-bold">{trader.followingCount}</span> يتابع
              </div>
            </div>

            <div className="pt-2">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${trader.returnPercent >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`} dir="ltr">
                {trader.returnPercent >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {trader.returnPercent.toFixed(2)}% إجمالي العائد
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto">
            {!isOwnProfile && (
              <button
                onClick={toggleFollow}
                disabled={isLoading}
                className={`w-full md:w-40 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isFollowing 
                    ? "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-5 h-5" />
                    أنت تتابعه
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    متابعة
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Allocation Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[400px]">
          <div>
            <h3 className="font-extrabold text-xl text-foreground mb-1 flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              توزيع المحفظة (Allocation)
            </h3>
            <p className="text-sm text-muted-foreground mb-6">يتم عرض النسب المئوية للحفاظ على الخصوصية والمبالغ الفردية.</p>
          </div>

          <div className="flex-1 w-full min-h-[300px] relative">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#0b0f19", 
                      borderColor: "#1e293b", 
                      borderRadius: "12px", 
                      color: "#fff",
                      textAlign: "right"
                    }} 
                    formatter={(value: any) => [`${parseFloat(value).toFixed(2)}%`, "النسبة"]}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: "13px", paddingTop: "20px", fontWeight: "bold" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                المحفظة فارغة حالياً.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Top Holdings List */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col">
          <h3 className="font-extrabold text-lg text-foreground mb-6 border-b border-border pb-4">
            أكبر المراكز المالية
          </h3>
          
          <div className="space-y-4 overflow-y-auto pr-2">
            {trader.holdings.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-10">لا توجد أسهم حالياً.</p>
            ) : (
              trader.holdings.slice(0, 5).map((holding, i) => (
                <div key={holding.symbol} className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                      {i + 1}
                    </div>
                    <span className="font-bold text-foreground font-mono">{holding.symbol.replace(".SR", "")}</span>
                  </div>
                  <span className="font-bold text-primary font-mono bg-primary/10 px-3 py-1 rounded-lg">
                    {holding.percent.toFixed(1)}%
                  </span>
                </div>
              ))
            )}

            {trader.cashPercent > 0 && (
              <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-xs text-emerald-400 border border-emerald-500/30">
                    $
                  </div>
                  <span className="font-bold text-foreground">السيولة (كاش)</span>
                </div>
                <span className="font-bold text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                  {trader.cashPercent.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
