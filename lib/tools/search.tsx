import { tool } from "ai";
import { createStreamableUI } from "ai/rsc";
import { createStreamableValue } from "ai/rsc";
import { searchSchema } from "@/lib/schema/search";
import { SearchSection } from "@/components/search-section";
import {
  SearchResultImage,
  SearchResults,
  SearchResultItem,
  SearXNGResponse,
  SearXNGResult,
} from "@/lib/types";

export interface ToolProps {
  uiStream: ReturnType<typeof createStreamableUI>;
  fullResponse: string;
}

export const searchTool = ({ uiStream, fullResponse }: ToolProps) =>
  tool({
    description: "Search the web for information",
    parameters: searchSchema,
    execute: async ({
      query,
      max_results,
      search_depth,
      include_domains,
      exclude_domains,
    }) => {
      let hasError = false;
      const streamResults = createStreamableValue<string>();
      uiStream.append(
        <SearchSection
          result={streamResults.value}
          includeDomains={include_domains}
        />
      );

      // Tavily API requires a minimum of 5 characters in the query
      const filledQuery =
        query.length < 5 ? query + " ".repeat(5 - query.length) : query;
      let searchResult: SearchResults;

      const effectiveSearchDepth =
        process.env.SEARXNG_DEFAULT_DEPTH === "advanced"
          ? "advanced"
          : search_depth || "basic";

      try {
        if (effectiveSearchDepth === "advanced") {
          // API route for advanced SearXNG search
          const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
          const response = await fetch(`${baseUrl}/api/advanced-search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: filledQuery,
              maxResults: max_results,
              searchDepth: effectiveSearchDepth,
              includeDomains: include_domains,
              excludeDomains: exclude_domains,
            }),
          });
          if (!response.ok) {
            throw new Error(
              `Advanced search API error: ${response.status} ${response.statusText}`
            );
          }
          searchResult = await response.json();
        } else {
          searchResult = await searxngSearch(
            filledQuery,
            max_results,
            effectiveSearchDepth === "advanced" ? "advanced" : "basic",
            include_domains,
            exclude_domains
          );
        }
      } catch (error) {
        console.error("Search API error:", error);
        hasError = true;
        searchResult = {
          results: [],
          query: filledQuery,
          images: [],
          number_of_results: 0,
        };
      }

      if (hasError) {
        fullResponse = `An error occurred while searching for "${filledQuery}".`;
        uiStream.update(null);
        streamResults.done();
        return searchResult;
      }

      streamResults.done(JSON.stringify(searchResult));
      return searchResult;
    },
  });

async function searxngSearch(
  query: string,
  maxResults: number = 10,
  searchDepth: string,
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiUrl = process.env.SEARXNG_API_URL;
  if (!apiUrl) {
    throw new Error("SEARXNG_API_URL is not set in the environment variables");
  }

  try {
    // Construct the URL with query parameters
    const url = new URL(`${apiUrl}/search`);
    url.searchParams.append("q", query);
    url.searchParams.append("format", "json");
    url.searchParams.append("categories", "general,images");

    // Apply search depth settings
    if (searchDepth === "advanced") {
      url.searchParams.append("time_range", "");
      url.searchParams.append("safesearch", "0");
      url.searchParams.append("engines", "google,bing,duckduckgo,wikipedia");
    } else {
      url.searchParams.append("time_range", "year");
      url.searchParams.append("safesearch", "1");
      url.searchParams.append("engines", "google,bing");
    }

    // Fetch results from SearXNG
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SearXNG API error (${response.status}):`, errorText);
      throw new Error(
        `SearXNG API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: SearXNGResponse = await response.json();

    // Separate general results and image results, and limit to maxResults
    const generalResults = data.results
      .filter((result) => !result.img_src)
      .slice(0, maxResults);
    const imageResults = data.results
      .filter((result) => result.img_src)
      .slice(0, maxResults);

    // Format the results to match the expected SearchResults structure
    return {
      results: generalResults.map(
        (result: SearXNGResult): SearchResultItem => ({
          title: result.title,
          url: result.url,
          content: result.content,
        })
      ),
      query: data.query,
      images: imageResults
        .map((result) => {
          const imgSrc = result.img_src || "";
          return imgSrc.startsWith("http") ? imgSrc : `${apiUrl}${imgSrc}`;
        })
        .filter(Boolean),
      number_of_results: data.number_of_results,
    };
  } catch (error) {
    console.error("SearXNG API error:", error);
    throw error;
  }
}
