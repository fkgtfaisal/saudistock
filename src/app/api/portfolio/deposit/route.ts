import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { amount } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "المبلغ غير صالح" }, { status: 400 });
    }

    // Update user's balance
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `تم إيداع ${amount.toLocaleString('en-US')} ر.س بنجاح!`,
      newBalance: updatedUser.balance 
    });

  } catch (error: any) {
    console.error("Deposit Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء عملية الإيداع" },
      { status: 500 }
    );
  }
}
