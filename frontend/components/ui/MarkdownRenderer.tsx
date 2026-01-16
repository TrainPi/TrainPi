'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css'; // Ensure you import Katex CSS globally or here if Next.js allows

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    return (
        <div className="prose prose-indigo max-w-none dark:prose-invert">
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    // Custom components for specific elements
                    p: ({ children }) => <p className="mb-2 leading-relaxed text-gray-800">{children}</p>,
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 gradient-text">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-indigo-700 mt-4">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-bold mb-2 text-purple-700 mt-3">{children}</h3>,
                    code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !match ? (
                            <code className="bg-gray-100 text-purple-600 rounded px-1 py-0.5 font-mono text-sm" {...props}>
                                {children}
                            </code>
                        ) : (
                            <div className="relative my-4 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-800 text-gray-300 px-4 py-1 text-xs">{match[1]}</div>
                                <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            </div>
                        );
                    },
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-700">{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 italic bg-indigo-50 rounded-r-lg my-4 text-gray-700">
                            {children}
                        </blockquote>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
