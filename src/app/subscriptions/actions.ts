"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function upgradeSubscriptionAction(newTier: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "يجب تسجيل الدخول أولاً للترقية." };
    }
    const userId = session.user.id;

    if (!["FREE", "PRO", "ELITE"].includes(newTier)) {
      return { success: false, error: "فئة الاشتراك المحددة غير صالحة." };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: newTier },
    });

    revalidatePath("/subscriptions");
    revalidatePath("/");
    
    return {
      success: true,
      message: `تهانينا! تم تحديث اشتراكك بنجاح إلى الباقة ${newTier === "PRO" ? "الاحترافية (Pro)" : newTier === "ELITE" ? "النخبة (Elite)" : "الأساسية (Free)"}.`,
      subscriptionTier: updatedUser.subscriptionTier
    };
  } catch (err: any) {
    console.error("Upgrade Subscription Error:", err);
    return { success: false, error: err.message || "فشل ترقية الاشتراك." };
  }
}
