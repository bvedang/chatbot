import Link from "next/link";
import React, { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const components: Partial<Components> = {
    // @ts-expect-error
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        // @ts-expect-error
        <pre
          {...props}
          className={`${className} font-mono text-sm w-[80dvw] md:max-w-[500px] overflow-x-scroll bg-zinc-100/80 p-4 rounded-xl my-4 shadow-sm backdrop-blur-sm dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700`}
        >
          <code className={`language-${match[1]} font-geist-mono`}>
            {children}
          </code>
        </pre>
      ) : (
        <code
          className={`${className} font-mono text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-2 rounded-md border border-zinc-200 dark:border-zinc-700`}
          {...props}
        >
          {children}
        </code>
      );
    },
    p: ({ node, children, ...props }) => (
      <p
        className="leading-7 [&:not(:first-child)]:mt-4 text-zinc-700 dark:text-zinc-300"
        {...props}
      >
        {children}
      </p>
    ),
    blockquote: ({ node, children, ...props }) => (
      <blockquote
        className="mt-6 border-l-4 border-zinc-300 dark:border-zinc-700 pl-6 italic text-zinc-800 dark:text-zinc-200"
        {...props}
      >
        {children}
      </blockquote>
    ),
    ol: ({ node, children, ...props }) => (
      <ol
        className="list-decimal list-outside ml-6 space-y-2 marker:text-zinc-500 dark:marker:text-zinc-400"
        {...props}
      >
        {children}
      </ol>
    ),
    ul: ({ node, children, ...props }) => (
      <ul
        className="list-disc list-outside ml-6 space-y-2 marker:text-zinc-500 dark:marker:text-zinc-400"
        {...props}
      >
        {children}
      </ul>
    ),
    li: ({ node, children, ...props }) => (
      <li className="leading-7 text-zinc-700 dark:text-zinc-300" {...props}>
        {children}
      </li>
    ),
    strong: ({ node, children, ...props }) => (
      <strong
        className="font-semibold text-zinc-900 dark:text-zinc-100"
        {...props}
      >
        {children}
      </strong>
    ),
    em: ({ node, children, ...props }) => (
      <em className="italic text-zinc-800 dark:text-zinc-200" {...props}>
        {children}
      </em>
    ),
    a: ({ node, children, ...props }) => (
      // @ts-expect-error
      <Link
        className="font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-4 hover:underline transition-colors"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    ),
    h1: ({ node, children, ...props }) => (
      <h1
        className="scroll-m-20 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-8 mb-4"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ node, children, ...props }) => (
      <h2
        className="scroll-m-20 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-8 mb-4"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ node, children, ...props }) => (
      <h3
        className="scroll-m-20 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-8 mb-4"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ node, children, ...props }) => (
      <h4
        className="scroll-m-20 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-6 mb-4"
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({ node, children, ...props }) => (
      <h5
        className="scroll-m-20 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-6 mb-4"
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({ node, children, ...props }) => (
      <h6
        className="scroll-m-20 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-6 mb-4"
        {...props}
      >
        {children}
      </h6>
    ),
    hr: ({ ...props }) => (
      <hr className="my-8 border-zinc-200 dark:border-zinc-800" {...props} />
    ),
    table: ({ children, ...props }) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full border-collapse text-sm" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead
        className="border-b border-zinc-300 dark:border-zinc-700"
        {...props}
      >
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th
        className="py-3 px-4 text-left font-medium text-zinc-900 dark:text-zinc-100"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="py-3 px-4 border-b border-zinc-200 dark:border-zinc-800"
        {...props}
      >
        {children}
      </td>
    ),
  };

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
