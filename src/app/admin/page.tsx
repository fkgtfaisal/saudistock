import prisma from "@/lib/prisma";
import { SAUDI_STOCKS } from "@/lib/stocks";
import AdminDashboardClient from "./AdminDashboardClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await auth();

  // التحقق من صلاحيات مدير النظام (ELITE)
  if (!session || (session.user as any)?.subscriptionTier !== "ELITE") {
    redirect("/");
  }

  // جلب البيانات الحقيقية من قاعدة البيانات بشكل لحظي
  const totalUsers = await prisma.user.count();
  const activeSubs = await prisma.user.count({
    where: {
      subscriptionTier: {
        in: ["PRO", "ELITE"]
      }
    }
  });
  const portfolioCount = await prisma.portfolio.count();
  const freeCount = await prisma.user.count({
    where: {
      subscriptionTier: "FREE"
    }
  });
  const proCount = await prisma.user.count({
    where: {
      subscriptionTier: "PRO"
    }
  });
  const eliteCount = await prisma.user.count({
    where: {
      subscriptionTier: "ELITE"
    }
  });

  // جلب قائمة المستخدمين
  const rawUsers = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionTier: true,
      createdAt: true
    }
  });

  // تحويل تواريخ الأعضاء إلى سلاسل نصية لتجنب مشاكل نقل الكائنات المعقدة بين الخادم والعميل
  const users = rawUsers.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString()
  }));

  const stats = {
    totalUsers,
    activeSubs,
    stockCount: SAUDI_STOCKS.length,
    portfolioCount,
    freeCount,
    proCount,
    eliteCount
  };

  return (
    <AdminDashboardClient 
      initialUsers={users}
      initialStats={stats}
      currentUserEmail={session.user?.email || null}
    />
  );
}
