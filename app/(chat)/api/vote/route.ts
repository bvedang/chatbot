import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

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

  const votes = await prisma.vote.findMany({
    where: {
      chatId: chatId,
    },
  });

  return Response.json(votes, { status: 200 });
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

  const isUpvoted = type === "upvote";

  await prisma.vote.upsert({
    where: {
      chatId_messageId: {
        chatId: chatId,
        messageId: messageId,
      },
    },
    update: {
      isUpvoted: isUpvoted,
    },
    create: {
      chatId: chatId,
      messageId: messageId,
      isUpvoted: isUpvoted,
    },
  });

  return new Response("Message voted", { status: 200 });
}
