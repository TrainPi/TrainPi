'use client'

import { Bot, User } from 'lucide-react'

interface ChatMessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  /** Optional: show icon inside the bubble (default true for assistant) */
  showIcon?: boolean
  className?: string
}

// Renders **bold** text in content
function renderContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? (
      <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  )
}

export default function ChatMessageBubble({ role, content, showIcon = true, className = '' }: ChatMessageBubbleProps) {
  const isUser = role === 'user'

  if (isUser) {
    return (
      <div className={`flex justify-end ${className}`}>
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md px-4 py-3 bg-violet-600 text-white shadow-md shadow-violet-200/50">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{content}</p>
        </div>
      </div>
    )
  }

  // AI / assistant: proper box with border, shadow, and optional icon
  return (
    <div className={`flex justify-start ${className}`}>
      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-md overflow-hidden bg-white border border-slate-200/80 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow">
        <div className="px-4 py-3 flex gap-3">
          {showIcon && (
            <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-violet-600 border border-violet-100">
              <Bot size={16} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">
              {renderContent(content)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Loading dots for when AI is typing */
export function ChatLoadingBubble({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-start ${className}`}>
      <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-white border border-slate-200/80 shadow-sm shadow-slate-200/50 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
