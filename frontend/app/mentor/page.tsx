'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import { Send, Sparkles, Gauge, Target, LibraryBig, ShieldCheck, RotateCcw, Lightbulb } from 'lucide-react'
import { chatAPI } from '@/lib/api'
import ChatMessageBubble, { ChatLoadingBubble } from '@/components/ui/ChatMessageBubble'
import toast from 'react-hot-toast'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const QUICK_QUESTIONS = [
  { label: 'Analyze my readiness for a SOC Analyst role', icon: Gauge },
  { label: 'Walk me through a phishing investigation workflow', icon: ShieldCheck },
  { label: 'What does MFA/IAM mean inside a real organization?', icon: Sparkles },
  { label: 'Build me a 4-week plan to become job-ready', icon: Target },
  { label: 'How do I write a good SOC ticket?', icon: LibraryBig },
  { label: 'What gaps are in my cybersecurity knowledge?', icon: Lightbulb },
]

const WELCOME_MESSAGE: Message = {
  id: 1,
  role: 'assistant',
  content:
    "Hi — I'm your **AI Operational Readiness Mentor**. I help you become job-ready for real security/IT roles, not just course-complete.\n\nTell me:\n• Your **target role** (e.g. SOC Analyst, IAM Specialist, IT-to-Cyber transition)\n• Your **current background** (tools you've touched, OS you're comfortable with, prior security exposure)\n\nOr jump in with one of the quick questions on the right →",
  timestamp: new Date().toISOString(),
}

export default function MentorPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (messageText?: string) => {
    const text = (messageText ?? input).trim()
    if (!text || loading) return

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await chatAPI.sendMessage(text)
      const mentorResponse: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, mentorResponse])
    } catch {
      toast.error('Mentor unavailable — please try again.')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE])
    toast.success('Conversation reset')
  }

  if (!mounted) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6 max-w-7xl mx-auto">
      {/* Chat column */}
      <div className="space-y-4 min-w-0">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <span className="text-xs font-black uppercase tracking-widest text-violet-600">AI Mentor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Operational Readiness Mentor</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Role-specific guidance. Workflow-aware. Not generic.</p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 font-bold text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Conversation */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[480px] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50/40 to-white">
            {messages.map((m) => (
              <ChatMessageBubble key={m.id} role={m.role} content={m.content} />
            ))}
            {loading && <ChatLoadingBubble />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 bg-white p-4">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.currentTarget.style.height = 'auto'
                  e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 160)}px`
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your target role, workflows, or readiness gaps…"
                disabled={loading}
                className="flex-1 min-w-0 resize-none px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-300 text-sm font-medium placeholder:text-slate-400 max-h-40"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-3.5 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-violet-200 hover:scale-105 disabled:opacity-30 disabled:scale-100 transition-all"
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 px-1">Mentor responses are AI-generated. Workflow-style guidance, not legal advice.</p>
          </div>
        </div>
      </div>

      {/* Side rail */}
      <aside className="space-y-4 lg:sticky lg:top-24 self-start">
        {/* Quick questions */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Try a quick question</p>
          <div className="space-y-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.label}
                onClick={() => handleSend(q.label)}
                disabled={loading}
                className="w-full text-left p-3 rounded-2xl bg-slate-50/70 hover:bg-violet-50 border border-slate-100 hover:border-violet-200 transition group flex items-start gap-2.5 disabled:opacity-50"
              >
                <q.icon className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                <span className="text-xs font-bold text-slate-700 group-hover:text-violet-700 leading-snug">
                  {q.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl shadow-xl shadow-violet-200 p-5 text-white">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-200 mb-3">Mentor companions</p>
          <Link href="/dashboard/readiness" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition group">
            <Gauge className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-black">See your readiness score</p>
              <p className="text-xs text-violet-200">Where you stand vs the role</p>
            </div>
          </Link>
          <Link href="/scenarios" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition group mt-2">
            <Target className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-black">Run a scenario</p>
              <p className="text-xs text-violet-200">Practice live decisions</p>
            </div>
          </Link>
          <Link href="/workflows" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition group mt-2">
            <LibraryBig className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-black">Browse workflows</p>
              <p className="text-xs text-violet-200">How analysts work</p>
            </div>
          </Link>
        </div>
      </aside>
    </div>
  )
}
