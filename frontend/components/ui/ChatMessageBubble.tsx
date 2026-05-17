'use client'

import { Bot } from 'lucide-react'

interface ChatMessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  /** Optional: show icon inside the bubble (default true for assistant) */
  showIcon?: boolean
  className?: string
}

/** Inline formatting: **bold** and `code`. */
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-black text-slate-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={`${keyPrefix}-c-${i}`} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[0.9em] font-mono">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={`${keyPrefix}-t-${i}`}>{part}</span>
  })
}

/**
 * Render assistant content as light markdown:
 *  - lines starting with `• ` or `- ` → bullet list
 *  - lines starting with `1. `, `2. ` → numbered list
 *  - `**bold**` and `` `code` `` inline
 *  - blank line → paragraph break
 */
function renderRichContent(content: string) {
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let bulletBuf: string[] = []
  let numberBuf: string[] = []

  const flushBullets = () => {
    if (bulletBuf.length) {
      const items = bulletBuf.slice()
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 space-y-1.5 pl-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-violet-500 font-bold mt-0.5 shrink-0">•</span>
              <span className="flex-1">{renderInline(item, `ul${blocks.length}-${i}`)}</span>
            </li>
          ))}
        </ul>
      )
      bulletBuf = []
    }
  }

  const flushNumbers = () => {
    if (numberBuf.length) {
      const items = numberBuf.slice()
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="my-2 space-y-1.5 pl-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-violet-600 font-black tabular-nums shrink-0 min-w-[1.25rem]">{i + 1}.</span>
              <span className="flex-1">{renderInline(item, `ol${blocks.length}-${i}`)}</span>
            </li>
          ))}
        </ol>
      )
      numberBuf = []
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trimStart()
    const bulletMatch = /^[•\-]\s+(.+)$/.exec(trimmed)
    const numberMatch = /^(\d+)\.\s+(.+)$/.exec(trimmed)

    if (bulletMatch) {
      flushNumbers()
      bulletBuf.push(bulletMatch[1])
    } else if (numberMatch) {
      flushBullets()
      numberBuf.push(numberMatch[2])
    } else if (trimmed === '') {
      flushBullets()
      flushNumbers()
      blocks.push(<div key={`sp-${idx}`} className="h-2" />)
    } else {
      flushBullets()
      flushNumbers()
      blocks.push(
        <p key={`p-${idx}`} className="leading-relaxed">
          {renderInline(trimmed, `p${idx}`)}
        </p>
      )
    }
  })
  flushBullets()
  flushNumbers()

  return blocks
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

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="max-w-[90%] sm:max-w-[80%] rounded-2xl rounded-bl-md overflow-hidden bg-white border border-slate-200/80 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow">
        <div className="px-4 py-3 flex gap-3">
          {showIcon && (
            <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-violet-600 border border-violet-100">
              <Bot size={16} />
            </div>
          )}
          <div className="min-w-0 flex-1 text-[15px] text-slate-800 space-y-1">
            {renderRichContent(content)}
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
