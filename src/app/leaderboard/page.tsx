import { requireProOrElite } from "@/lib/auth-helpers";
import LeaderboardClient from "@/components/LeaderboardClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "بطولة التداول الوهمي | SaudiStock",
  description: "لوحة متصدري التداول الافتراضي للمشتركين",
};

export default async function LeaderboardPage() {
  // Protect route - Only PRO & ELITE
  await requireProOrElite();

  return (
    <div className="min-h-screen bg-background">
      <LeaderboardClient />
    </div>
  );
}
