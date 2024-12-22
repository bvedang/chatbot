import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');
  const { userId } = await auth();

  if (!documentId || !userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const suggestions = await prisma.suggestion.findMany({
      where: {
        documentId,
        userId,
      },
    });

    return Response.json(suggestions, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const { suggestions } = await request.json();
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await prisma.suggestion.createMany({
      data: suggestions,
    });

    return new Response('Created', { status: 201 });
  } catch (error) {
    console.error('Failed to create suggestions:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
