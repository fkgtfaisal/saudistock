export type Badge = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
};

export function getBadges(
  netWorth: number,
  returnPercent: number,
  cashPercent: number
): Badge[] {
  const badges: Badge[] = [];

  // 1. حوت السوق
  if (netWorth >= 150000) {
    badges.push({
      id: "whale",
      name: "حوت السوق",
      icon: "🐋",
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      description: "ثروة تتجاوز 150,000 ريال",
    });
  }

  // 2. قناص الأرباح
  if (returnPercent >= 10) {
    badges.push({
      id: "sniper",
      name: "قناص الأرباح",
      icon: "🎯",
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      description: "عائد يتجاوز 10%",
    });
  } else if (returnPercent <= -10) {
    // وسام فكاهي لمن خسر كثيراً
    badges.push({
      id: "diamond-hands",
      name: "الأيدي الماسية",
      icon: "💎",
      color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      description: "صامد رغم الخسائر الثقيلة",
    });
  }

  // 3. مستثمر حذر
  if (cashPercent >= 80) {
    badges.push({
      id: "cautious",
      name: "مستثمر حذر",
      icon: "🛡️",
      color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      description: "يحتفظ بمعظم المحفظة كسيولة نقدية",
    });
  }

  // 4. مغامر
  if (cashPercent <= 5 && netWorth > 0) {
    badges.push({
      id: "adventurer",
      name: "مغامر",
      icon: "🚀",
      color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      description: "يستثمر بكامل السيولة بدون تردد",
    });
  }

  return badges;
}
