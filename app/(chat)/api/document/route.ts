import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!document) {
    return new Response("Not Found", { status: 404 });
  }

  return Response.json([document], { status: 200 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { content, title } = await request.json();

  const document = await prisma.document.upsert({
    where: { id },
    update: {
      content,
      title,
    },
    create: {
      id,
      content,
      title,
      userId,
      createdAt: new Date(),
    },
  });

  return Response.json(document, { status: 200 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const { timestamp } = await request.json();

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const document = await prisma.document.findFirst({
    where: { id, userId },
  });

  if (!document) {
    return new Response("Unauthorized", { status: 401 });
  }

  await prisma.document.deleteMany({
    where: {
      id,
      createdAt: {
        gt: new Date(timestamp),
      },
    },
  });

  return new Response("Deleted", { status: 200 });
}
