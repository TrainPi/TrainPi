'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, Circle, Play, Lock,
  Send, MessageSquare, Loader2
} from 'lucide-react'
import YouTubePlayer from '@/components/YouTubePlayer'
import { getCourse, getCompletionPct } from '@/lib/courseCatalog'
import { catalogAPI, chatAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import DashboardShell from '@/components/layout/DashboardShell'
import toast from 'react-hot-toast'

interface Enrollment {
  course_id: string
  completed_units: number[]
  completed: boolean
}

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

export default function CourseViewerPage({ params }: { params: { courseId: string } }) {
  const { courseId } = params
  const course = getCourse(courseId)
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [activeUnit, setActiveUnit] = useState(0)
  const [marking, setMarking] = useState(false)

  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login?next=/catalog/' + courseId); return }
    if (!course) { router.replace('/catalog'); return }
    catalogAPI.getEnrollments()
      .then((list: Enrollment[]) => {
        const found = list.find((e) => e.course_id === courseId)
        if (found) setEnrollment(found)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuthenticated, courseId, course, router])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  if (!course) return null

  const completedUnits: number[] = enrollment?.completed_units ?? []
  const pct = getCompletionPct(completedUnits, course.units.length)
  const unit = course.units[activeUnit]

  const switchUnit = (idx: number) => {
    setActiveUnit(idx)
  }

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      const res = await catalogAPI.enroll(courseId)
      setEnrollment(res)
      toast.success('Enrolled! Start watching.')
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Could not enroll — try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!enrollment) return
    if (completedUnits.includes(activeUnit)) {
      if (activeUnit < course.units.length - 1) switchUnit(activeUnit + 1)
      return
    }
    setMarking(true)
    try {
      const res = await catalogAPI.completeUnit(courseId, activeUnit)
      setEnrollment(res)
      toast.success('Unit complete!')
      if (activeUnit < course.units.length - 1) switchUnit(activeUnit + 1)
    } catch {
      toast.error('Failed to save progress.')
    } finally {
      setMarking(false)
    }
  }

  const handleSendChat = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setChatInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setChatLoading(true)
    try {
      const context = `The user is taking a course called "${course.title}", currently on unit "${unit.title}": ${unit.description}.`
      const data = await chatAPI.sendMessage(`${context}\n\nStudent question: ${text}`)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, couldn't answer that right now. Try again." }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/catalog" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-violet-600 transition">
              <ArrowLeft size={18} />
            </Link>
            <span className="text-2xl">{course.icon}</span>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{course.title}</h1>
              <p className="text-xs text-slate-500">Unit {activeUnit + 1} of {course.units.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {enrollment && (
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-violet-600">{pct}%</span>
              </div>
            )}
            {!loading && !enrollment && (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 transition"
              >
                {enrolling ? 'Enrolling…' : 'Enroll Free'}
              </button>
            )}
          </div>
        </div>

        {/* Main 3-column grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px_320px] gap-4 items-start">

          {/* Video player */}
          <div className="space-y-3">
            {enrollment ? (
              <YouTubePlayer query={unit.search} title={unit.title} />
            ) : (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800" style={{ aspectRatio: '16/9' }}>
                <div className="w-full h-full flex flex-col items-center justify-center text-white gap-3">
                  <Lock size={28} className="opacity-40" />
                  <p className="text-sm opacity-50">Enroll to start watching</p>
                </div>
              </div>
            )}

            {/* Unit info bar */}
            {enrollment && (
              <div className="bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 text-sm">{unit.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{unit.description}</p>
                  </div>
                  <button
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition ${
                      completedUnits.includes(activeUnit)
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-violet-600 text-white hover:bg-violet-700'
                    } disabled:opacity-50`}
                  >
                    {marking ? '…' : completedUnits.includes(activeUnit)
                      ? (activeUnit < course.units.length - 1 ? '✓ Next →' : '✓ Done!')
                      : 'Mark Complete'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lesson list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <p className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50">
              Lessons
            </p>
            <div className="overflow-y-auto max-h-[500px] divide-y divide-slate-50">
              {course.units.map((u, i) => {
                const done = completedUnits.includes(i)
                const active = i === activeUnit
                return (
                  <button
                    key={i}
                    onClick={() => enrollment && switchUnit(i)}
                    disabled={!enrollment}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition ${
                      active ? 'bg-violet-50' : 'hover:bg-slate-50'
                    } ${!enrollment ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="shrink-0">
                      {done
                        ? <CheckCircle2 size={14} className="text-emerald-500" />
                        : active
                        ? <Play size={14} className="text-violet-600 fill-violet-600" />
                        : <Circle size={14} className="text-slate-200" />}
                    </div>
                    <span className={`text-xs truncate ${active ? 'font-bold text-violet-700' : done ? 'text-slate-400' : 'text-slate-700'}`}>
                      {i + 1}. {u.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* AI Chat */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col" style={{ height: 500 }}>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 shrink-0">
              <MessageSquare size={14} className="text-violet-600" />
              <span className="text-sm font-black text-slate-900">AI Tutor</span>
              <span className="text-[10px] text-slate-400 ml-auto">Ask about this lesson</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <MessageSquare size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Ask anything about what you&apos;re watching</p>
                  <div className="mt-3 space-y-1.5">
                    {['Explain this simply', 'Give me an example', 'What should I practise?'].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setChatInput(s) }}
                        className="block w-full text-left px-3 py-1.5 rounded-xl bg-slate-50 text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2">
                    <Loader2 size={13} className="animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-slate-100 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder={enrollment ? 'Ask a question…' : 'Enroll to chat'}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-300 disabled:opacity-50"
                  disabled={!enrollment || chatLoading}
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || chatLoading || !enrollment}
                  className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
