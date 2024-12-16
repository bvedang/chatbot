"use client";

import { FC } from "react";
import { MemoizedReactMarkdown } from "./ui/markdown";
import rehypeExternalLinks from "rehype-external-links";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { CodeBlock } from "./ui/codeblock";
import { Components } from "react-markdown";
import type { Element } from "hast";
import type { Parent } from "unist";

interface BotMessageProps {
  content: string;
}

export const BotMessage: FC<BotMessageProps> = ({ content }) => {
  // Check if the content contains LaTeX patterns
  const containsLaTeX = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/.test(
    content || "",
  );

  // Modify the content to render LaTeX equations if LaTeX patterns are found
  const processedData = preprocessLaTeX(content || "");

  // Define properly typed components object
  const components: Components = {
    code({ node, className, children, ...props }) {
      const childContent = Array.isArray(children) ? children[0] : children;

      if (childContent != null) {
        if (childContent === "▍") {
          return <span className="mt-1 cursor-default animate-pulse">▍</span>;
        }

        if (typeof childContent === "string") {
          children = [childContent.replace("`▍`", "▍")];
        }
      }

      const parentNode = (node as unknown as { parent: Parent | null }).parent;
      const isInline = !(
        parentNode && (parentNode as Element).tagName === "pre"
      );
      const match = /language-(\w+)/.exec(className || "");

      if (isInline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      return (
        <CodeBlock
          key={Math.random()}
          language={(match && match[1]) || ""}
          value={String(children || "").replace(/\n$/, "")}
          {...props}
        />
      );
    },
  };

  if (containsLaTeX) {
    return (
      <MemoizedReactMarkdown
        rehypePlugins={[
          [rehypeExternalLinks, { target: "_blank" }],
          [rehypeKatex],
        ]}
        remarkPlugins={[remarkGfm, remarkMath]}
        className="prose-sm prose-neutral prose-a:text-accent-foreground/50"
      >
        {processedData}
      </MemoizedReactMarkdown>
    );
  }

  return (
    <MemoizedReactMarkdown
      rehypePlugins={[[rehypeExternalLinks, { target: "_blank" }]]}
      remarkPlugins={[remarkGfm]}
      className="prose-sm prose-neutral prose-a:text-accent-foreground/50"
      components={components}
    >
      {content}
    </MemoizedReactMarkdown>
  );
};

const preprocessLaTeX = (content: string): string => {
  const blockProcessedContent = content.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, equation) => `$$${equation}$$`,
  );
  const inlineProcessedContent = blockProcessedContent.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, equation) => `$${equation}$`,
  );
  return inlineProcessedContent;
};
