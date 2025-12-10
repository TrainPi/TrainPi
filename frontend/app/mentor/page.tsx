'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function MentorPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'mentor',
      content: 'Hello! I\'m your AI mentor. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const mentorResponse = {
        id: messages.length + 2,
        role: 'mentor',
        content: 'That\'s a great question! Let me help you with that. Based on your learning path, I recommend focusing on the fundamentals first, then gradually moving to advanced topics. Would you like me to create a personalized study plan for you?',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, mentorResponse])
      setLoading(false)
    }, 1500)
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
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask your mentor anything..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>

        {/* Quick Questions */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Questions</h3>
          <div className="flex flex-wrap gap-3">
            {[
              'How do I start learning?',
              'What skills should I focus on?',
              'Help me create a study plan',
              'Review my progress'
            ].map((question) => (
              <button
                key={question}
                onClick={() => setInput(question)}
                className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition text-sm"
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

