import { openai } from "@ai-sdk/openai";
import { deepseek } from "@ai-sdk/deepseek";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

export const customModel = (apiIdentifier: string) => {
  switch (apiIdentifier) {
    case "gpt-4o-mini":
      return wrapLanguageModel({
        model: openai(apiIdentifier),
        middleware: customMiddleware,
      });
    case "gpt-4o":
      return wrapLanguageModel({
        model: openai(apiIdentifier),
        middleware: customMiddleware,
      });
    case "deepseek-chat":
      return wrapLanguageModel({
        //@ts-expect-error
        model: deepseek("deepseek-chat"),
        middleware: customMiddleware,
      });

    default:
      throw new Error(`Unsupported model: ${apiIdentifier}`);
  }
};
