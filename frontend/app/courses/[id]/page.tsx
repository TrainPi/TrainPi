'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { aiFeaturesAPI, chatAPI, lessonsAPI, roadmapAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { buildTrainPiLessonTopic, getRoadmapLessonId, setRoadmapLessonId } from '@/lib/trainpiLearning'
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2,
  ChevronRight, Clock, Loader2, MessageSquare,
  Send, Sparkles, Target, X, Youtube, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

// ─── helpers ──────────────────────────────────────────────────────────────────

function clampPct(n: any) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(100, x))
}

function getCurrentStep(course: any) {
  const steps = Array.isArray(course?.steps) ? course.steps : []
  const cur = Number.isFinite(course?.current_step) ? Number(course.current_step) : 0
  return steps[cur] || steps[0] || null
}

function isValidYouTubeId(id: string | null | undefined): boolean {
  return !!id && /^[A-Za-z0-9_-]{11}$/.test(id)
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('?')[0]
      return isValidYouTubeId(id) ? id : null
    }
    if (u.hostname.includes('youtube.com')) {
      // Reject search/results/channel/playlist pages — they have no single video
      if (u.pathname.startsWith('/results') || u.pathname.startsWith('/channel') || u.pathname.startsWith('/playlist') || u.pathname === '/') return null
      const v = u.searchParams.get('v')
      if (isValidYouTubeId(v)) return v
      if (u.pathname.startsWith('/embed/') || u.pathname.startsWith('/shorts/')) {
        const seg = u.pathname.split('/').pop()
        return isValidYouTubeId(seg) ? seg! : null
      }
      return null
    }
  } catch { /* ignore */ }
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return m && isValidYouTubeId(m[1]) ? m[1] : null
}

function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname.includes('youtube.com') || u.hostname === 'youtu.be'
  } catch { return false }
}

interface YouTubeResource { type: 'embed'; id: string; name: string }
interface YouTubeLinkResource { type: 'link'; url: string; name: string }
type YouTubeItem = YouTubeResource | YouTubeLinkResource

function getYouTubeItems(step: any): YouTubeItem[] {
  const items: YouTubeItem[] = []
  if (!Array.isArray(step?.resources)) return items
  for (const r of step.resources) {
    const url = String(r?.url || r?.link || '')
    if (!url) continue
    const id = extractYouTubeId(url)
    if (id) {
      items.push({ type: 'embed', id, name: String(r?.name || 'Video') })
    } else if (isYouTubeUrl(url)) {
      items.push({ type: 'link', url, name: String(r?.name || 'YouTube') })
    }
  }
  return items
}

interface ChatMsg { role: 'user' | 'assistant'; content: string }

// ─── component ────────────────────────────────────────────────────────────────

export default function CourseReaderPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [loading, setLoading] = useState(true)
  const [roadmap, setRoadmap] = useState<any>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [updating, setUpdating] = useState(false)
  const [launchingLesson, setLaunchingLesson] = useState(false)
  const [savedLessonId, setSavedLessonId] = useState<number | null>(null)

  // Chat
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    const rid = Number(id)
    if (!Number.isFinite(rid)) return
    setLoading(true)
    roadmapAPI.getMyRoadmap(rid)
      .then((r) => {
        setRoadmap(r)
        const cur = Number.isFinite(r?.current_step) ? Number(r.current_step) : 0
        setActiveIdx(Math.max(0, cur))
      })
      .finally(() => setLoading(false))
  }, [id, isAuthenticated])

  const steps = useMemo(() => (Array.isArray(roadmap?.steps) ? roadmap.steps : []), [roadmap])
  const pct = Math.round(clampPct(roadmap?.completion_percentage))
  const active = steps[activeIdx] || null
  const activeStepNumber = Number.isFinite(active?.step_number) ? Number(active.step_number) : activeIdx + 1
  const completedCount = Number.isFinite(roadmap?.current_step) ? Number(roadmap.current_step) : 0
  const ytItems = useMemo(() => getYouTubeItems(active), [active])
  const videos = useMemo(() => ytItems.filter((v): v is YouTubeResource => v.type === 'embed'), [ytItems])
  const ytLinks = useMemo(() => ytItems.filter((v): v is YouTubeLinkResource => v.type === 'link'), [ytItems])

  useEffect(() => {
    if (!roadmap?.id) return
    setSavedLessonId(getRoadmapLessonId(roadmap.id, activeStepNumber))
  }, [roadmap?.id, activeStepNumber])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const markCompleteAndNext = async () => {
    if (!roadmap?.id) return
    setUpdating(true)
    try {
      const res = await roadmapAPI.updateProgress(roadmap.id, activeIdx + 1)
      const nextIdx = Math.min(steps.length - 1, activeIdx + 1)
      setRoadmap({
        ...roadmap,
        current_step: activeIdx + 1,
        completion_percentage: res?.completion_percentage ?? roadmap.completion_percentage,
      })
      setActiveIdx(nextIdx)
      toast.success('Step completed! Keep it up 🎉')
    } finally {
      setUpdating(false)
    }
  }

  const openTrainPiLesson = async () => {
    if (!roadmap?.id || !active) return
    const existingId = savedLessonId || getRoadmapLessonId(roadmap.id, activeStepNumber)
    if (existingId) { router.push(`/learn/${existingId}`); return }
    setLaunchingLesson(true)
    try {
      const generated = await aiFeaturesAPI.generateLesson(
        buildTrainPiLessonTopic(roadmap.career_path || 'career learner', active)
      )
      if (!generated?.title || !Array.isArray(generated.modules))
        throw new Error('Could not build lesson.')
      const created = await lessonsAPI.createFromAI({
        title: generated.title,
        modules: generated.modules,
        quiz_questions: generated.quiz_questions ?? [],
      })
      setRoadmapLessonId(roadmap.id, activeStepNumber, created.id)
      setSavedLessonId(created.id)
      toast.success('Lesson ready!')
      router.push(`/learn/${created.id}`)
    } catch (error: any) {
      const msg = error?.response?.data?.detail ?? error?.message ?? 'Failed to launch lesson.'
      toast.error(msg)
      if (error?.response?.status === 402 || /credit|quota/i.test(String(msg)))
        toast('Buy credits at Manage Credits.', { icon: '💳' })
    } finally {
      setLaunchingLesson(false)
    }
  }

  const sendChatMessage = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setChatInput('')
    setChatLoading(true)
    try {
      const ctx = roadmap
        ? `You are an AI tutor for the TrainPi course "${roadmap.career_path}", current step: "${active?.title || ''}". Be concise and helpful. Student: ${text}`
        : text
      const data = await chatAPI.sendMessage(ctx)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, could not respond. Try again.' }])
    } finally { setChatLoading(false) }
  }

  // ── guards ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 font-medium">Loading course…</p>
      </div>
    )
  }

  if (!roadmap) {
    return (
      <div className="card-premium p-12 text-center">
        <p className="text-slate-700 font-bold mb-6">Course not found.</p>
        <button onClick={() => router.push('/courses')} className="btn-primary">Back to courses</button>
      </div>
    )
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">

      {/* ── Top progress bar ──────────────────────────────────────────────── */}
      <div className="h-1 bg-slate-200 fixed top-0 left-0 right-0 z-50">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* ── Course header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 pt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/courses')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors shrink-0"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest truncate">{roadmap.career_path}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-xs">
              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-black text-indigo-600 shrink-0">{pct}% complete</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setChatOpen(o => !o)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${chatOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
        >
          <MessageSquare size={15} />
          <span className="hidden sm:inline">AI Tutor</span>
        </button>
      </div>

      {/* ── Main 2-col layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1">

        {/* ── LEFT: Curriculum sidebar ──────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-slate-200 bg-white sticky top-[57px] self-start h-[calc(100vh-57px)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Course Curriculum</p>
            <p className="text-sm font-black text-slate-900">{steps.length} Steps</p>
          </div>
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
            {steps.map((step: any, idx: number) => {
              const isDone = idx < completedCount
              const isActive = idx === activeIdx
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`w-full text-left rounded-2xl px-4 py-3.5 border transition-all group ${isActive ? 'bg-indigo-600 border-indigo-600 text-white' : isDone ? 'bg-emerald-50 border-emerald-100 text-slate-700 hover:border-emerald-200' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${isActive ? 'bg-white text-indigo-600' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {isDone ? <CheckCircle2 size={13} /> : idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-black uppercase tracking-widest mb-0.5 ${isActive ? 'text-indigo-200' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                        Step {step?.step_number ?? idx + 1}
                      </p>
                      <p className={`text-sm font-bold line-clamp-2 ${isActive ? 'text-white' : ''}`}>
                        {step?.title || 'Untitled'}
                      </p>
                      {step?.estimated_time && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                          <Clock size={10} />{step.estimated_time}
                        </p>
                      )}
                    </div>
                    {isActive && <ChevronRight size={14} className="shrink-0 mt-1 text-indigo-300 ml-auto" />}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* ── RIGHT: Content area ───────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-8 max-w-4xl mx-auto w-full">

          {active ? (
            <div className="space-y-6">

              {/* Step label + title */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest">
                    Step {activeStepNumber} of {steps.length}
                  </span>
                  {activeIdx < completedCount && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center gap-1">
                      <CheckCircle2 size={11} /> Completed
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{active.title}</h1>
                {active.estimated_time && (
                  <p className="text-slate-500 text-sm font-medium mt-2 flex items-center gap-2">
                    <Clock size={14} /> {active.estimated_time} estimated
                  </p>
                )}
              </div>

              {/* ── Embedded YouTube Video ─────────────────────────────── */}
              {videos.length > 0 && (
                <div className="space-y-4">
                  {videos.map((v) => (
                    <div key={v.id} className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                      <div className="bg-slate-900 px-4 py-2.5 flex items-center gap-2">
                        <Youtube size={16} className="text-red-400" />
                        <p className="text-white text-xs font-bold">{v.name}</p>
                        <span className="ml-auto text-slate-400 text-xs">Playing inside TrainPi</span>
                      </div>
                      <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${v.id}?rel=0&modestbranding=1&color=white`}
                          title={v.name}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── YouTube search / browse links ──────────────────────── */}
              {ytLinks.length > 0 && (
                <div className="space-y-3">
                  {ytLinks.map((v, i) => (
                    <a
                      key={i}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-red-200 hover:shadow-md transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                        <Youtube size={20} className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{v.name}</p>
                        <p className="text-xs text-slate-500">Browse tutorials on YouTube</p>
                      </div>
                      <ArrowRight size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                    </a>
                  ))}
                </div>
              )}

              {/* ── Lesson description card ────────────────────────────── */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={16} className="text-indigo-600" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">What You Will Learn</p>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-base sm:text-lg">{active.description || 'No description available for this step.'}</p>
                </div>

                {/* Skills */}
                {Array.isArray(active?.skills) && active.skills.length > 0 && (
                  <div className="px-6 sm:px-8 py-5 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Skills You'll Gain</p>
                    <div className="flex flex-wrap gap-2">
                      {active.skills.map((skill: string) => (
                        <span key={skill} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold">
                          <Zap size={12} className="text-indigo-500" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning objectives */}
                <div className="px-6 sm:px-8 py-5">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Learning Path</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { icon: Target, label: 'Goal-Oriented', desc: 'Each step builds toward your career target' },
                      { icon: Sparkles, label: 'AI-Powered', desc: 'Launch a full lesson with quiz inside TrainPi' },
                      { icon: CheckCircle2, label: 'Track Progress', desc: 'Mark complete to advance your roadmap' },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <Icon size={15} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Launch TrainPi lesson CTA ──────────────────────────── */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black">Open Full Lesson in TrainPi</h3>
                      <p className="text-indigo-200 text-sm mt-1">AI generates structured modules + quiz — everything stays inside the platform</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openTrainPiLesson}
                    disabled={launchingLesson}
                    className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-indigo-700 font-black hover:scale-[1.02] transition-transform shadow-xl shadow-black/20 disabled:opacity-60"
                  >
                    {launchingLesson ? (
                      <><Loader2 className="animate-spin" size={16} /> Building…</>
                    ) : savedLessonId ? (
                      <>Resume Lesson <ArrowRight size={16} /></>
                    ) : (
                      <>Start Lesson <ArrowRight size={16} /></>
                    )}
                  </button>
                </div>
              </div>

              {/* ── Navigation + Mark Complete ─────────────────────────── */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
                    disabled={activeIdx === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 transition-colors text-sm"
                  >
                    <ArrowLeft size={15} /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIdx(i => Math.min(steps.length - 1, i + 1))}
                    disabled={activeIdx >= steps.length - 1}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 transition-colors text-sm"
                  >
                    Next <ArrowRight size={15} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={markCompleteAndNext}
                  disabled={updating || activeIdx < completedCount}
                  className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] disabled:opacity-50 text-sm"
                >
                  {updating ? (
                    <><Loader2 className="animate-spin" size={15} /> Saving…</>
                  ) : activeIdx < completedCount ? (
                    <><CheckCircle2 size={15} /> Already Completed</>
                  ) : (
                    <>Mark as Complete <ArrowRight size={15} /></>
                  )}
                </button>
              </div>

              {/* ── Mobile step switcher ───────────────────────────────── */}
              <div className="lg:hidden bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">All Steps</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {steps.map((_: any, idx: number) => {
                    const done = idx < completedCount
                    const active_ = idx === activeIdx
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveIdx(idx)}
                        className={`shrink-0 w-10 h-10 rounded-xl text-xs font-black transition-colors ${active_ ? 'bg-indigo-600 text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="card-premium p-16 text-center">
              <p className="text-slate-500 font-bold">No step selected.</p>
            </div>
          )}
        </main>
      </div>

      {/* ── Floating AI Chat Panel ────────────────────────────────────────── */}
      {chatOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-indigo-100/60 flex flex-col overflow-hidden"
          style={{ maxHeight: '72vh' }}
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-indigo-100 uppercase tracking-widest">AI Tutor</p>
                <p className="text-sm font-black text-white">Live Chat</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <X size={17} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare size={20} className="text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">Your AI tutor is ready</p>
                <p className="text-xs text-slate-400 mb-4">Ask anything about this lesson</p>
                <div className="space-y-2">
                  {[
                    'Explain this in simpler terms',
                    'Give me a practical example',
                    'What should I study next?',
                  ].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setChatInput(s)}
                      className="block w-full text-left text-xs px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about this step…"
                disabled={chatLoading}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-300"
              />
              <button
                type="button"
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 transition-colors shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
