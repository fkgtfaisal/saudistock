"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Crown, TrendingUp, TrendingDown, Users } from "lucide-react";

type LeaderboardEntry = {
  id: string;
  name: string;
  balance: number;
  portfolioValue: number;
  netWorth: number;
  returnPercent: number;
};

export default function LeaderboardClient() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setLeaders(data);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Trophy className="w-16 h-16 text-muted-foreground/30 animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-muted-foreground">جاري حساب القيمة الصافية والمراكز...</h2>
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">لا يوجد منافسين بعد!</h2>
        <p className="text-muted-foreground">يبدو أن المتداولين في إجازة، لم يتم العثور على أي متداول لديه محفظة أو كاش.</p>
      </div>
    );
  }

  const top3 = leaders.slice(0, 3);
  const others = leaders.slice(3);

  return (
    <div className="container mx-auto px-4 py-12" dir="rtl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-300 mb-4 inline-flex items-center gap-4">
          <Trophy className="w-10 h-10 text-yellow-500" />
          بطولة التداول
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          المتصدرون في التداول الافتراضي، يتم الترتيب بناءً على إجمالي الثروة (الكاش + قيمة المحفظة الحالية بسعر السوق الحي).
        </p>
      </div>

      {/* Podium for Top 3 */}
      {top3.length > 0 && (
        <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-8 mb-16 h-auto md:h-72">
          
          {/* Second Place */}
          {top3[1] && (
            <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-48 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              <div className="bg-slate-800/80 p-4 rounded-t-xl w-full border-t-4 border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.2)] text-center relative z-10">
                <Medal className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-lg truncate">{top3[1].name}</h3>
                <div className="font-mono mt-2 text-slate-200">{(top3[1].netWorth).toLocaleString('en-US')} ر.س</div>
                <div className={`flex items-center justify-center gap-1 font-bold mt-1 ${top3[1].returnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`} dir="ltr">
                  {top3[1].returnPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {top3[1].returnPercent.toFixed(2)}%
                </div>
              </div>
              <div className="bg-slate-700 w-full h-24 md:h-32 rounded-b-lg"></div>
            </div>
          )}

          {/* First Place */}
          {top3[0] && (
            <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-56 animate-in fade-in slide-in-from-bottom-12 duration-700">
              <div className="bg-amber-900/40 p-5 rounded-t-xl w-full border-t-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)] text-center relative z-20 transform -translate-y-4">
                <Crown className="w-14 h-14 text-yellow-400 mx-auto mb-2 animate-bounce" />
                <h3 className="font-extrabold text-xl truncate text-yellow-100">{top3[0].name}</h3>
                <div className="font-mono mt-3 text-lg text-yellow-500 font-bold">{(top3[0].netWorth).toLocaleString('en-US')} ر.س</div>
                <div className={`flex items-center justify-center gap-1 font-bold mt-1 text-lg ${top3[0].returnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`} dir="ltr">
                  {top3[0].returnPercent >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {top3[0].returnPercent.toFixed(2)}%
                </div>
              </div>
              <div className="bg-amber-800/80 w-full h-32 md:h-48 rounded-b-lg flex items-center justify-center relative">
                <span className="text-6xl font-black text-amber-900/50 absolute bottom-4">1</span>
              </div>
            </div>
          )}

          {/* Third Place */}
          {top3[2] && (
            <div className="order-3 md:order-3 flex flex-col items-center w-full md:w-48 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="bg-orange-950/40 p-4 rounded-t-xl w-full border-t-4 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)] text-center relative z-10">
                <Medal className="w-10 h-10 text-orange-500 mx-auto mb-2" />
                <h3 className="font-bold text-lg truncate">{top3[2].name}</h3>
                <div className="font-mono mt-2 text-orange-200">{(top3[2].netWorth).toLocaleString('en-US')} ر.س</div>
                <div className={`flex items-center justify-center gap-1 font-bold mt-1 ${top3[2].returnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`} dir="ltr">
                  {top3[2].returnPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {top3[2].returnPercent.toFixed(2)}%
                </div>
              </div>
              <div className="bg-orange-900/50 w-full h-20 md:h-24 rounded-b-lg"></div>
            </div>
          )}
        </div>
      )}

      {/* The Rest of the Leaderboard */}
      {others.length > 0 && (
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-1000 delay-300">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-4 px-6 font-semibold w-20">المركز</th>
                  <th className="py-4 px-6 font-semibold">المتداول</th>
                  <th className="py-4 px-6 font-semibold">الثروة الإجمالية</th>
                  <th className="py-4 px-6 font-semibold">قيمة المحفظة</th>
                  <th className="py-4 px-6 font-semibold">العائد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {others.map((leader, index) => (
                  <tr key={leader.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-muted-foreground">
                      #{index + 4}
                    </td>
                    <td className="py-4 px-6 font-bold text-foreground">
                      {leader.name}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold" dir="ltr">
                      {leader.netWorth.toLocaleString('en-US')}
                    </td>
                    <td className="py-4 px-6 font-mono text-muted-foreground" dir="ltr">
                      {leader.portfolioValue.toLocaleString('en-US')}
                    </td>
                    <td className="py-4 px-6 font-bold" dir="ltr">
                      <div className={`flex items-center justify-end gap-1 ${leader.returnPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {leader.returnPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {leader.returnPercent.toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
