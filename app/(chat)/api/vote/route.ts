import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { getVotesByChatId, voteMessage } from "@/lib/db/queries";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new Response("chatId is required", { status: 400 });
  }

  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const votes = await getVotesByChatId({ id: chatId });
    return NextResponse.json(votes, { status: 200 });
  } catch (error) {
    return new Response("Failed to fetch votes", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { chatId, messageId, type } = await request.json();

  if (!chatId || !messageId || !type) {
    return new Response("messageId and type are required", { status: 400 });
  }

  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await voteMessage({
      chatId,
      messageId,
      type: type === "upvote" ? "up" : "down",
    });
    return new Response("Message voted", { status: 200 });
  } catch (error) {
    return new Response("Failed to vote message", { status: 500 });
  }
}
