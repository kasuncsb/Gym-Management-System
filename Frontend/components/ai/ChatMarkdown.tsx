'use client';

import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import type { Components } from 'react-markdown';

type Variant = 'assistant' | 'user';

export function ChatMarkdown({
  text,
  className = '',
  variant = 'assistant',
}: {
  text: string;
  className?: string;
  variant?: Variant;
}) {
  const strongCls = variant === 'user' ? 'font-semibold text-white' : 'font-semibold text-zinc-50';
  const linkCls =
    variant === 'user'
      ? 'font-medium text-red-200 underline underline-offset-2 hover:text-white'
      : 'font-medium text-red-400 underline underline-offset-2 hover:text-red-300';

  const components: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className={strongCls}>{children}</strong>,
    em: ({ children }) => <em className="italic opacity-95">{children}</em>,
    ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1 marker:text-zinc-500">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1 marker:text-zinc-500">{children}</ol>,
    li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
        {children}
      </a>
    ),
    h1: ({ children }) => <p className="mb-1 mt-2 text-sm font-semibold text-zinc-100 first:mt-0">{children}</p>,
    h2: ({ children }) => <p className="mb-1 mt-2 text-sm font-semibold text-zinc-100 first:mt-0">{children}</p>,
    h3: ({ children }) => <p className="mb-1 mt-1.5 text-sm font-semibold text-zinc-200 first:mt-0">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="my-2 border-l-2 border-zinc-600 pl-3 text-zinc-400">{children}</blockquote>
    ),
    hr: () => <hr className="my-3 border-zinc-700/80" />,
    code: ({ className: codeClass, children }) => {
      const isBlock = Boolean(codeClass?.includes('language-'));
      if (isBlock) {
        return (
          <pre className="my-2 max-h-48 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-700/60 bg-zinc-950/90 p-2.5">
            <code className="text-[11px] leading-snug text-zinc-300">{children}</code>
          </pre>
        );
      }
      return (
        <code className="rounded bg-zinc-950/90 px-1 py-0.5 font-mono text-[0.85em] text-zinc-200">{children}</code>
      );
    },
  };

  return (
    <div className={`min-w-0 break-words ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
