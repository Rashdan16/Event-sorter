import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const chatSessions = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(chatSessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json({ error: "Failed to fetch chat sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, messages } = await request.json();

    const chatSession = await prisma.chatSession.create({
      data: {
        title: title || "New Chat",
        userId: session.user.id,
        messages: {
          create: messages?.map((msg: { role: string; content: string }) => ({
            role: msg.role,
            content: msg.content,
          })) || [],
        },
      },
      include: { messages: true },
    });

    return NextResponse.json(chatSession);
  } catch (error) {
    console.error("Error creating chat session:", error);
    return NextResponse.json({ error: "Failed to create chat session" }, { status: 500 });
  }
}
