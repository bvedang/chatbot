'use client';

import { Section } from './section';
import { BotMessage } from '@/components/bot-message';
import { DefaultSkeleton } from './default-skeleton';

export type AnswerSectionProps = {
  result?: string;
  hasHeader?: boolean;
};

export function AnswerSection({ result }: AnswerSectionProps) {
  return (
    <div>
      {result ? (
        <Section title="Answer">
          <BotMessage content={result} />
        </Section>
      ) : (
        <DefaultSkeleton />
      )}
    </div>
  );
}
