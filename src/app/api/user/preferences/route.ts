import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailAlertsEnabled: true },
    });

    return NextResponse.json({ emailAlertsEnabled: user?.emailAlertsEnabled ?? true });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emailAlertsEnabled } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { emailAlertsEnabled },
      select: { emailAlertsEnabled: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
