import { tool } from "ai";
import { retrieveSchema } from "@/lib/schema/retrieve";
import { ToolProps } from "./index";
import { SearchResults as SearchResultsType } from "@/lib/types";

const CONTENT_CHARACTER_LIMIT = 10000;

async function fetchJinaReaderData(
  url: string
): Promise<SearchResultsType | null> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-With-Generated-Alt": "true",
      },
    });
    const json = await response.json();
    if (!json.data || json.data.length === 0) {
      return null;
    }

    const content = json.data.content.slice(0, CONTENT_CHARACTER_LIMIT);

    return {
      results: [
        {
          title: json.data.title,
          content,
          url: json.data.url,
        },
      ],
      query: "",
      images: [],
    };
  } catch (error) {
    console.error("Jina Reader API error:", error);
    return null;
  }
}

export const retrieveTool = ({ streamingData, fullResponse }: ToolProps) =>
  tool({
    description: "Retrieve content from the web",
    parameters: retrieveSchema,
    execute: async ({ url }) => {
      // Append the search section
      streamingData.append({
        type: "retrieve-start",
        content: {
          url,
          status: "loading",
        },
      });

      let results: SearchResultsType | null;

      results = await fetchJinaReaderData(url);
      if (!results) {
        fullResponse = `An error occurred while retrieving "${url}".`;
        streamingData.append({
          type: "retrieve-data",
          content: { status: "error", url },
        });
        return results;
      }

      streamingData.append({
        type: "retrieve-data",
        content: { status: "complete", data: results },
      });

      return results;
    },
  });
