'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { Send } from 'lucide-react'
import { chatAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const QUICK_QUESTIONS = [
  'Analyze my operational readiness for a SOC Analyst role',
  'What are the key gaps in my cybersecurity knowledge?',
  'Walk me through a phishing investigation workflow',
  'What does MFA/IAM mean inside a real organization?',
]

export default function MentorPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'mentor',
      content: "Hello! I'm your AI Operational Readiness Mentor. Tell me about your background and your target role — I'll assess your operational gaps and guide you toward becoming workforce-ready in cybersecurity.",
      timestamp: new Date().toISOString()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  const handleSend = async (messageText?: string) => {
    const text = (messageText ?? input).trim()
    if (!text) return

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await chatAPI.sendMessage(text)
      const mentorResponse = {
        id: messages.length + 2,
        role: 'mentor',
        content: res.response,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, mentorResponse])
    } catch (err: any) {
      const code = err?.code ?? err?.response?.data?.detail
      if (code === 'INSUFFICIENT_CREDITS') {
        toast.error('Out of credits. Add your Gemini API key or buy credits.')
      } else {
        toast.error(err?.response?.data?.detail ?? err?.message ?? 'Failed to get a response.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 transition">Dashboard</Link>
              <Link href="/learn" className="text-gray-700 hover:text-indigo-600 transition">Learn</Link>
              <Link href="/career" className="text-gray-700 hover:text-indigo-600 transition">Career</Link>
              <Link href="/mentor" className="text-indigo-600 font-semibold">Mentor</Link>
              <Link href="/profile" className="text-gray-700 hover:text-indigo-600 transition">Profile</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Mentor Consultation</h1>
          <p className="text-gray-600">Get personalized guidance and support for your learning journey</p>
        </div>

        {/* Chat Container */}
        <div className="flex-1 card-modern p-6 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p>{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
              placeholder="Describe your background or ask about cybersecurity workflows..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="btn-primary p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send"
            >
              <Send size={20} />
            </button>
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Quick Questions */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Questions</h3>
          <div className="flex flex-wrap gap-3">
            {QUICK_QUESTIONS.map((question) => (
              <button
                key={question}
                onClick={() => handleSend(question)}
                disabled={loading}
                className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition text-sm disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

