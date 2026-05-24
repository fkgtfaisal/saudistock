import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: followingId } = await params;
    const followerId = session.user.id;

    if (followerId === followingId) {
      return NextResponse.json({ error: "لا يمكنك متابعة نفسك" }, { status: 400 });
    }

    // Check if following user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    return NextResponse.json({ success: true, follow });
  } catch (error: any) {
    if (error.code === "P2002") {
      // Unique constraint failed, meaning already following
      return NextResponse.json({ error: "أنت تتابع هذا المستخدم بالفعل" }, { status: 400 });
    }
    console.error("Error following user:", error);
    return NextResponse.json({ error: "فشل في عملية المتابعة" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: followingId } = await params;
    const followerId = session.user.id;

    await prisma.follow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json({ error: "فشل في إلغاء المتابعة" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ isFollowing: false });
    }

    const { id: followingId } = await params;
    const followerId = session.user.id;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json({ isFollowing: false });
  }
}
