import { Section } from '@/components/section';
import { SearchSection } from '@/components/search-section';
import { AnswerSection } from '@/components/answer-section';

const Search = ({ events }: any) => {
  const { query, images, results } = events;
  return (
    <div>
      <Section>
        <SearchSection result={events} />
      </Section>
    </div>
  );
};
export default Search;
