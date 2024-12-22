import { createStreamableUI } from 'ai/rsc';
import { retrieveTool } from './retrieve';
import { searchTool } from './search';
import { StreamData } from 'ai';

export interface ToolProps {
  streamingData: StreamData;
  fullResponse: string;
}

export const getTools = ({ streamingData, fullResponse }: ToolProps) => {
  const tools: any = {
    search: searchTool({
      streamingData,
      fullResponse,
    }),
    retrieve: retrieveTool({
      streamingData,
      fullResponse,
    }),
  };

  return tools;
};
