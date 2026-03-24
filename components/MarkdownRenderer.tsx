
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2 text-stone-900 dark:text-stone-50 border-b border-stone-200 dark:border-stone-700 pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-3 mb-2 text-stone-800 dark:text-stone-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold mt-3 mb-1 text-stone-800 dark:text-stone-200">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-bold mt-2 mb-1 text-stone-700 dark:text-stone-300">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-stone-900 dark:text-stone-50">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-stone-700 dark:text-stone-300">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-400 dark:border-amber-500 pl-4 py-1 my-2 bg-amber-50/50 dark:bg-amber-900/10 rounded-r-lg italic text-stone-600 dark:text-stone-400">
              {children}
            </blockquote>
          ),
          code: ({ className: languageClass, children, ...props }) => {
            const isInline = !languageClass;
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 text-amber-700 dark:text-amber-400 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            const language = languageClass?.replace('language-', '') ?? '';
            return (
              <div className="my-3 rounded-xl overflow-hidden shadow-md">
                {language && (
                  <div className="flex items-center justify-between px-4 py-2 bg-stone-800 dark:bg-stone-900 text-xs text-stone-400 font-mono">
                    <span className="text-amber-400 font-semibold uppercase tracking-wider">{language}</span>
                    <span className="text-stone-500">code</span>
                  </div>
                )}
                <pre className="overflow-x-auto p-4 bg-stone-900 dark:bg-stone-950 text-stone-100 text-sm font-mono leading-relaxed">
                  <code>{children}</code>
                </pre>
              </div>
            );
          },
          pre: ({ children }) => <>{children}</>,
          hr: () => (
            <hr className="my-3 border-stone-200 dark:border-stone-700" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-stone-100 dark:bg-stone-700">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-stone-200 dark:border-stone-700">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-bold text-stone-700 dark:text-stone-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-stone-700 dark:text-stone-300">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
