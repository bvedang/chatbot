'use client';

import { SearchResults } from './search-result';
import { DefaultSkeleton } from './default-skeleton';
import { SearchResultsImageSection } from './search-result-image';
import { Section } from './section';
import { ToolBadge } from './tool-badge';
import type {
  SearchResults as TypeSearchResults,
  SearXNGSearchResults,
} from '@/lib/types';
import { StreamableValue, useStreamableValue } from 'ai/rsc';
import { AnswerSection } from '@/components/answer-section';

export type SearchSectionProps = {
  result?: SearXNGSearchResults;
  includeDomains?: string[];
};

export function SearchSection({ result, includeDomains }: SearchSectionProps) {
  const includeDomainsString = includeDomains
    ? ` [${includeDomains.join(', ')}]`
    : '';

  return (
    <div>
      {result ? (
        <>
          <Section size="sm" className="pt-2 pb-0">
            <ToolBadge tool="search">{`${result.query}${includeDomainsString}`}</ToolBadge>
          </Section>
          {result.images && result.images.length > 0 && (
            <Section title="Images">
              <SearchResultsImageSection
                images={result.images}
                query={result.query}
              />
            </Section>
          )}
          <Section title="Sources">
            <SearchResults results={result.results} />
          </Section>
        </>
      ) : (
        <DefaultSkeleton />
      )}
    </div>
  );
}
