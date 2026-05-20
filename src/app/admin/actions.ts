"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// التحقق من صلاحيات مدير النظام
async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any)?.subscriptionTier !== "ELITE") {
    throw new Error("غير مصرح لك بإجراء هذه العملية. يجب أن تكون مديراً للنظام.");
  }
  return session;
}

/**
 * تحديث باقة / صلاحية المستخدم
 */
export async function updateUserTierAction(targetUserId: string, newTier: string) {
  try {
    await requireAdmin();

    if (!["FREE", "PRO", "ELITE"].includes(newTier)) {
      return { success: false, error: "فئة الاشتراك المحددة غير صالحة." };
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { subscriptionTier: newTier },
    });

    revalidatePath("/admin");
    return { 
      success: true, 
      message: `تم تحديث صلاحية المستخدم "${updatedUser.name || updatedUser.email}" بنجاح إلى ${newTier}.` 
    };
  } catch (err: any) {
    return { success: false, error: err.message || "فشل تحديث باقة المستخدم." };
  }
}

/**
 * حذف مستخدم نهائياً من النظام
 */
export async function deleteUserAction(targetUserId: string) {
  try {
    const session = await requireAdmin();

    // منع المدير من حذف حسابه الشخصي
    if (session.user?.id === targetUserId) {
      return { success: false, error: "لا يمكنك حذف حسابك الشخصي الذي تستخدمه حالياً!" };
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!userToDelete) {
      return { success: false, error: "المستخدم المطلوب غير موجود." };
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    revalidatePath("/admin");
    return { 
      success: true, 
      message: `تم حذف حساب المستخدم "${userToDelete.name || userToDelete.email}" نهائياً من النظام.` 
    };
  } catch (err: any) {
    return { success: false, error: err.message || "فشل حذف المستخدم." };
  }
}
