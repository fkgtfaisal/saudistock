import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const screener = await prisma.savedScreener.findUnique({
      where: { id },
    });

    if (!screener || screener.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 });
    }

    await prisma.savedScreener.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting screener:", error);
    return NextResponse.json({ error: "Failed to delete screener" }, { status: 500 });
  }
}
