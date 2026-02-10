'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import Image from 'next/image'
import { ArrowRight, Send, Check, Sparkles } from 'lucide-react'
import ChatMessageBubble, { ChatLoadingBubble } from '@/components/ui/ChatMessageBubble'
import { DEMO_CAREERS, DEMO_WEEKLY_GOALS, getDemoStatsWithSelections } from '@/lib/demoData'
import { getMockChatResponse } from '@/lib/chatMockResponses'
import { chatAPI } from '@/lib/api'
import { MOCK_ONLY } from '@/lib/mockConfig'
import toast from 'react-hot-toast'

const STEPS = ['Welcome', 'Career', 'Goal', 'Dashboard & AI Mentor'] as const

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function DemoPage() {
  const [step, setStep] = useState(0)
  const [career, setCareer] = useState<string | null>(null)
  const [weeklyGoal, setWeeklyGoal] = useState(3)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)

  const stats = getDemoStatsWithSelections(career, weeklyGoal)

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    const userMsg = inputMessage
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setInputMessage('')
    setIsChatLoading(true)
    if (MOCK_ONLY) {
      await new Promise((r) => setTimeout(r, 600))
      setMessages((prev) => [...prev, { role: 'assistant', content: getMockChatResponse(userMsg) }])
    } else {
      try {
        const data = await chatAPI.sendMessage(userMsg)
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
        if (data.response?.includes('All AI quota is temporarily used')) {
          toast.error('AI at capacity. Try again later or buy credits.', { duration: 5000 })
        }
      } catch (error: any) {
        if (error?.code === 'INSUFFICIENT_CREDITS' || error?.message === 'INSUFFICIENT_CREDITS') {
          setMessages((prev) => [...prev, { role: 'assistant', content: "You're out of credits. Sign in and buy more at Dashboard → Manage Credits." }])
          toast.error('Out of credits. Sign in and buy more to continue.', { duration: 4000 })
        } else {
          setMessages((prev) => [...prev, { role: 'assistant', content: getMockChatResponse(userMsg) }])
        }
      }
    }
    setIsChatLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Logo />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Demo</span>
            <span className="text-slate-300">•</span>
            <span>Step {step + 1} of {STEPS.length}</span>
          </div>
        </div>
        {/* Progress */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {step === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Product demo
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Welcome to TrainPi
            </h1>
            <p className="text-xl text-slate-600 max-w-xl mx-auto mb-10">
              A quick walkthrough: choose your career path, set a goal, then chat with your AI Career Mentor.
            </p>
            <button
              onClick={() => setStep(1)}
              className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg shadow-lg shadow-indigo-200"
            >
              Start demo <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Choose your career path</h2>
            <p className="text-slate-600 mb-8">Select one to continue. You can change this later.</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {DEMO_CAREERS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCareer(c.id)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    career === c.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{c.id}</h3>
                      <p className="text-sm text-slate-600 mt-1">{c.description}</p>
                      <p className="text-xs text-slate-500 mt-2">{c.skills.join(', ')}</p>
                    </div>
                    {career === c.id && <Check className="w-6 h-6 text-indigo-600 shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={() => career && setStep(2)}
                disabled={!career}
                className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Set goal
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Set your weekly goal</h2>
            <p className="text-slate-600 mb-8">How many lessons do you want to complete each week?</p>
            <div className="flex gap-4 mb-10">
              {DEMO_WEEKLY_GOALS.map((n) => (
                <button
                  key={n}
                  onClick={() => setWeeklyGoal(n)}
                  className={`flex-1 py-6 rounded-2xl border-2 font-semibold transition-all ${
                    weeklyGoal === n
                      ? 'border-violet-500 bg-violet-50 text-violet-800'
                      : 'border-slate-200 bg-white hover:border-violet-200'
                  }`}
                >
                  {n} lessons
                  {n === 3 && <span className="block text-xs font-normal text-slate-500 mt-1">(Recommended)</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn-primary px-6 py-2.5"
              >
                Next: Dashboard & AI Mentor
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Your dashboard</h2>
              <p className="text-slate-600 mb-6">
                Summary for <span className="font-semibold">{career || '—'}</span>, goal: {weeklyGoal} lessons/week.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{stats.courses_completed}</div>
                  <div className="text-xs text-slate-500">Courses completed</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{stats.lessons_in_progress}</div>
                  <div className="text-xs text-slate-500">In progress</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{stats.skills_acquired}</div>
                  <div className="text-xs text-slate-500">Skills acquired</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{stats.roadmap_completion}%</div>
                  <div className="text-xs text-slate-500">Roadmap</div>
                </div>
              </div>
            </div>

            {/* AI Career Mentor — main demo finale */}
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Image src="/aa.png" alt="AI Mentor" width={48} height={48} className="object-contain rounded-xl" />
                AI Career Mentor
              </h2>
              <p className="text-slate-600 mb-4">
                Ask anything about your path, weekly plan, or skills. Powered by your API key when backend is running.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 h-[380px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                      <p className="mb-4">Try: &quot;Help me choose a career path&quot; or &quot;Create a weekly plan&quot;</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {['Help me choose a career path', 'Create a weekly plan', 'What skills should I learn first?'].map(
                          (q) => (
                            <button
                              key={q}
                              onClick={() => setInputMessage(q)}
                              className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-full hover:bg-indigo-100"
                            >
                              {q}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <ChatMessageBubble key={idx} role={msg.role} content={msg.content} />
                  ))}
                  {isChatLoading && <ChatLoadingBubble />}
                </div>
                <div className="p-4 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask for advice..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={isChatLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isChatLoading}
                    className="btn-primary p-2.5 rounded-xl disabled:opacity-50"
                    title="Send"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <Link
                href="/dashboard"
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
              >
                Go to full dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
