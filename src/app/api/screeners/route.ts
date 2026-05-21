import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedScreeners = await prisma.savedScreener.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(savedScreeners);
  } catch (error: any) {
    console.error("Error fetching saved screeners:", error);
    return NextResponse.json({ error: "Failed to fetch screeners" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, criteria } = await req.json();

    if (!name || !criteria) {
      return NextResponse.json({ error: "Name and criteria are required" }, { status: 400 });
    }

    // Check if a screener with the same name already exists for this user
    const existing = await prisma.savedScreener.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name: name,
        },
      },
    });

    if (existing) {
      // Update existing
      const updatedScreener = await prisma.savedScreener.update({
        where: { id: existing.id },
        data: { criteria },
      });
      return NextResponse.json(updatedScreener);
    }

    const newScreener = await prisma.savedScreener.create({
      data: {
        userId: session.user.id,
        name,
        criteria,
      },
    });

    return NextResponse.json(newScreener);
  } catch (error: any) {
    console.error("Error saving screener:", error);
    return NextResponse.json({ error: "Failed to save screener" }, { status: 500 });
  }
}
