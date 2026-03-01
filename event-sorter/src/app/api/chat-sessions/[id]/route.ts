import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const chatSession = await prisma.chatSession.findFirst({
      where: { id, userId: session.user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    return NextResponse.json(chatSession);
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return NextResponse.json({ error: "Failed to fetch chat session" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.chatSession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    const { messages, eventId } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (eventId !== undefined) updateData.eventId = eventId;

    if (messages && Array.isArray(messages)) {
      await prisma.chatMessage.createMany({
        data: messages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
          chatSessionId: id,
        })),
      });
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.chatSession.update({
        where: { id },
        data: updateData,
      });
    }

    const updated = await prisma.chatSession.findFirst({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating chat session:", error);
    return NextResponse.json({ error: "Failed to update chat session" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.chatSession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    await prisma.chatSession.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return NextResponse.json({ error: "Failed to delete chat session" }, { status: 500 });
  }
}
