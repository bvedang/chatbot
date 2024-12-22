import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const { userId } = await auth();

  if (chat.visibility === 'private') {
    if (!userId) {
      notFound();
    }

    if (userId !== chat.userId) {
      notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <Chat
      id={chat.id}
      initialMessages={convertToUIMessages(messagesFromDb)}
      selectedModelId={selectedModelId}
      selectedVisibilityType={chat.visibility}
      isReadonly={userId !== chat.userId}
    />
  );
}
