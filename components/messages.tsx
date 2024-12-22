'use client';
import type { ChatRequestOptions, Message } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Overview } from './overview';
import type { UIBlock } from './block';
import { type Dispatch, memo, type SetStateAction } from 'react';
import type { Vote } from '@prisma/client';
import { useEffect, useRef } from 'react';

interface MessagesProps {
  chatId: string;
  block: UIBlock;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  isLoading: boolean;
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
}

function PureMessages({
  chatId,
  block,
  setBlock,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>('');

  useEffect(() => {
    // Only scroll to bottom for new messages, not for UI updates
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.id !== lastMessageRef.current) {
      lastMessageRef.current = lastMessage.id;
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
    >
      {messages.length === 0 && <Overview />}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          block={block}
          setBlock={setBlock}
          isLoading={isLoading && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      <div ref={endRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
    </div>
  );
}

function areEqual(prevProps: MessagesProps, nextProps: MessagesProps) {
  if (
    prevProps.block.status === 'streaming' &&
    nextProps.block.status === 'streaming'
  ) {
    return true;
  }

  return false;
}

export const Messages = memo(PureMessages, areEqual);
