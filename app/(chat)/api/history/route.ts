import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  const chats = await prisma.chat.findMany({
    where: { userId },
  });

  return Response.json(chats);
}
