'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { lessonsAPI, dashboardAPI, aiFeaturesAPI, chatAPI } from '../../../lib/api'
import { getLessonById } from '../../../lib/lessonsStorage'
import { MOCK_ONLY } from '../../../lib/mockConfig'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, Loader2, MessageSquare, Send, Sparkles, X, Youtube } from 'lucide-react'

// ─── helpers ──────────────────────────────────────────────────────────────────

function ensureModules(lesson: any) {
  const modules = lesson?.modules
  if (modules && modules.length > 0) return lesson
  return {
    ...lesson,
    modules: [
      {
        title: lesson?.title || 'Overview',
        content: (lesson?.description as string) || 'Work through this lesson at your own pace.',
        duration_minutes: 5,
        key_takeaways: ['Complete the lesson to track progress.'],
      },
    ],
  }
}

/** Extract a YouTube video ID from a URL, or return null */
function extractYouTubeId(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v') || u.pathname.split('/').pop() || null
    }
  } catch { /* ignore */ }
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

/** Scan module content + resources for YouTube links */
function findYouTubeVideos(module: any, resources?: any[]): { id: string; label: string }[] {
  const videos: { id: string; label: string }[] = []

  // Check module.video_url
  if (module?.video_url) {
    const id = extractYouTubeId(module.video_url)
    if (id) videos.push({ id, label: module.title || 'Lesson Video' })
  }

  // Check resources array
  if (Array.isArray(resources)) {
    resources.forEach((r: any) => {
      const url = r?.url || r?.link || ''
      if (!url) return
      const id = extractYouTubeId(url)
      if (id && !videos.find(v => v.id === id)) {
        videos.push({ id, label: r?.name || r?.title || 'Video' })
      }
    })
  }

  return videos
}

// ─── types ────────────────────────────────────────────────────────────────────

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

// ─── component ────────────────────────────────────────────────────────────────

export default function LessonDetailPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const lessonId = parseInt(params.id as string)

  const [lesson, setLesson] = useState<any>(null)
  const [currentModule, setCurrentModule] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    loadLesson()
  }, [isAuthenticated, router, lessonId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const loadLesson = async () => {
    if (!MOCK_ONLY) {
      try {
        const data = await lessonsAPI.getLesson(lessonId)
        setLesson(ensureModules(data))
        setLoading(false)
        return
      } catch (_) { /* fall back */ }
    }
    const stored = getLessonById(lessonId)
    if (stored) {
      setLesson(ensureModules(stored))
    } else {
      toast.error('Lesson not found')
      router.push('/learn')
    }
    setLoading(false)
  }

  const handleGenerateQuiz = async () => {
    if (!lesson) return
    setGeneratingQuiz(true)
    try {
      const context = lesson.modules?.[0]?.content
        ? String(lesson.modules[0].content).slice(0, 1200)
        : undefined
      const { quiz_questions } = await aiFeaturesAPI.generateQuiz({ lesson_title: lesson.title, context })
      if (!quiz_questions?.length) { toast.error('No questions generated'); return }
      await lessonsAPI.updateQuiz(lessonId, quiz_questions)
      await loadLesson()
      toast.success(`Quiz created: ${quiz_questions.length} questions.`)
    } catch (e: any) {
      const msg = e.response?.data?.detail ?? e.message ?? 'Failed'
      toast.error(msg)
      if (e.response?.status === 402 || /credit|quota/i.test(String(msg))) {
        toast('Buy credits at Manage Credits.', { icon: '💳' })
      }
    } finally { setGeneratingQuiz(false) }
  }

  const handleModuleComplete = async () => {
    if (!lesson) return
    const mods = lesson.modules || []
    if (currentModule < mods.length - 1) {
      setCurrentModule(currentModule + 1)
      toast.success('Module completed! Keep going 🎉')
    } else {
      toast.success('Lesson complete! 🏆')
    }
    if (!MOCK_ONLY) {
      try {
        await dashboardAPI.updateProgress({
          lesson_id: lessonId,
          progress_type: 'lesson',
          completion_percentage: ((currentModule + 1) / mods.length) * 100,
          time_spent_minutes: mods[currentModule]?.duration_minutes || 5,
        })
      } catch (_) {}
    }
  }

  const sendChatMessage = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setChatInput('')
    setChatLoading(true)
    try {
      // Build a context-rich prompt so the AI knows which lesson we're on
      const lessonContext = lesson
        ? `You are an AI tutor helping a student study "${lesson.title}". Current module: "${lesson.modules?.[currentModule]?.title || ''}". Answer helpfully and concisely, keeping all answers within the platform context.\n\nStudent: ${text}`
        : text
      const data = await chatAPI.sendMessage(lessonContext)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that. Try again.' }])
    } finally { setChatLoading(false) }
  }

  // ── render guards ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-slate-500 font-medium">Loading your lesson…</p>
        </div>
      </div>
    )
  }

  if (!lesson) return null

  const mods = lesson.modules || []
  const currentModuleData = mods[currentModule]
  const videos = findYouTubeVideos(currentModuleData, lesson.resources)
  const totalPct = Math.round(((currentModule + 1) / mods.length) * 100)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── top nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lesson</p>
              <h1 className="text-sm font-black text-slate-900 truncate max-w-[260px] sm:max-w-md">{lesson.title}</h1>
            </div>
          </div>

          {/* progress */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${totalPct}%` }} />
            </div>
            <span className="text-xs font-black text-slate-400">{totalPct}%</span>
          </div>

          <button
            type="button"
            onClick={() => setChatOpen(o => !o)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${chatOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
          >
            <MessageSquare size={16} />
            <span className="hidden sm:inline">AI Tutor</span>
          </button>
        </div>
      </nav>

      {/* ── main layout ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex max-w-screen-xl mx-auto w-full px-4 sm:px-8 py-6 gap-6">

        {/* ── left sidebar: module list ───────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden self-start sticky top-24">
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modules</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${totalPct}%` }} />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[60vh] p-3 space-y-1">
            {mods.map((m: any, idx: number) => {
              const done = idx < currentModule
              const active = idx === currentModule
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentModule(idx)}
                  className={`w-full text-left rounded-2xl px-4 py-3 border transition-all ${active ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {done ? <CheckCircle2 size={14} /> : idx + 1}
                    </div>
                    <p className={`text-sm font-bold truncate ${active ? 'text-indigo-700' : 'text-slate-700'}`}>{m.title}</p>
                  </div>
                </button>
              )
            })}
          </div>
          {/* Quiz shortcut */}
          {lesson.quiz_questions?.length > 0 && (
            <div className="p-3 border-t border-slate-100">
              <Link
                href={`/learn/${lessonId}/quiz`}
                className="flex items-center justify-between gap-2 w-full px-4 py-3 rounded-2xl bg-violet-50 border border-violet-100 text-violet-700 font-bold text-sm hover:bg-violet-100 transition-colors"
              >
                <span>Take Quiz</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </aside>

        {/* ── center: lesson content ──────────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-6">
          {currentModuleData && (
            <>
              {/* module header */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module {currentModule + 1} of {mods.length}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{currentModuleData.title}</h2>
                  {currentModuleData.duration_minutes && (
                    <p className="text-sm text-slate-500 mt-1 font-medium">⏱ Estimated {currentModuleData.duration_minutes} min</p>
                  )}
                </div>

                {/* ── Embedded YouTube video (if any) ─────────────────── */}
                {videos.length > 0 && (
                  <div className="px-6 pt-5 space-y-4">
                    {videos.map((v) => (
                      <div key={v.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <Youtube size={16} className="text-red-500" />
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{v.label} — Embedded</p>
                        </div>
                        <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${v.id}?rel=0&modestbranding=1`}
                            title={v.label}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* lesson content */}
                <div className="px-6 py-6">
                  <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-base">
                    {currentModuleData.content}
                  </div>
                </div>

                {/* key takeaways */}
                {currentModuleData.key_takeaways?.length > 0 && (
                  <div className="mx-6 mb-6 rounded-2xl bg-indigo-50 border border-indigo-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-indigo-600" />
                      <h3 className="font-black text-indigo-900 text-sm uppercase tracking-widest">Key Takeaways</h3>
                    </div>
                    <ul className="space-y-2">
                      {currentModuleData.key_takeaways.map((t: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-indigo-800">
                          <span className="text-indigo-500 font-black mt-0.5">✓</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* nav buttons */}
                <div className="px-6 pb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentModule(m => Math.max(0, m - 1))}
                    disabled={currentModule === 0}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 transition-colors"
                  >
                    <ArrowLeft size={16} /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleModuleComplete}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02]"
                  >
                    {currentModule < mods.length - 1 ? (
                      <><span>Next Module</span><ArrowRight size={16} /></>
                    ) : (
                      <><CheckCircle2 size={16} /><span>Complete Lesson</span></>
                    )}
                  </button>
                </div>
              </div>

              {/* ── mobile module navigation ─────────────────────────── */}
              <div className="lg:hidden bg-white rounded-3xl border border-slate-200 shadow-sm p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Modules</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {mods.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentModule(idx)}
                      className={`shrink-0 w-10 h-10 rounded-xl text-sm font-black transition-colors ${idx === currentModule ? 'bg-indigo-600 text-white' : idx < currentModule ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── quiz section ─────────────────────────────────────── */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
                    <BookOpen size={18} className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">Knowledge Check</h3>
                    <p className="text-sm text-slate-500">Test what you've learned</p>
                  </div>
                </div>
                {lesson.quiz_questions?.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/learn/${lessonId}/quiz`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 text-white font-black hover:bg-violet-700 shadow-lg shadow-violet-100 transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle2 size={16} /> Start Quiz ({lesson.quiz_questions.length} Qs)
                    </Link>
                    <button
                      type="button"
                      onClick={handleGenerateQuiz}
                      disabled={generatingQuiz}
                      className="px-6 py-3 rounded-2xl border border-violet-200 text-violet-700 font-bold hover:bg-violet-50 disabled:opacity-60 transition-colors"
                    >
                      {generatingQuiz ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Generating…</span> : 'Regenerate Quiz with AI'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateQuiz}
                    disabled={generatingQuiz}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 text-white font-black hover:bg-violet-700 disabled:opacity-60 transition-all"
                  >
                    {generatingQuiz ? <><Loader2 size={14} className="animate-spin" />Generating…</> : <><Sparkles size={16} />Generate Quiz with AI</>}
                  </button>
                )}
                <p className="text-xs text-slate-400 mt-2">Uses 3 credits or your Gemini key.</p>
              </div>
            </>
          )}
        </main>

        {/* ── right panel: AI live chat ───────────────────────────────── */}
        {chatOpen && (
          <aside className="hidden lg:flex flex-col w-80 shrink-0 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden self-start sticky top-24 max-h-[85vh]">
            {/* chat header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-100 uppercase tracking-widest">Live AI Tutor</p>
                  <p className="text-sm font-black text-white">Ask anything</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare size={20} className="text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Ask your AI tutor</p>
                  <p className="text-xs text-slate-400 mt-1">Questions about this lesson? Ask away!</p>
                  <div className="mt-4 space-y-2">
                    {['Explain this in simpler terms', 'Give me a real-world example', 'What should I learn next?'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setChatInput(s); }}
                        className="block w-full text-left text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* chat input */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask about this lesson…"
                  disabled={chatLoading}
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-300"
                />
                <button
                  type="button"
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-2.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 transition-colors shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── mobile chat drawer ──────────────────────────────────────────── */}
      {chatOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative bg-white rounded-t-3xl flex flex-col max-h-[75vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-white" />
                <p className="font-black text-white">AI Tutor — Live Chat</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {messages.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-6">Ask anything about this lesson…</p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-1 px-4 py-3">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask about this lesson…"
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
                <button
                  type="button"
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-3 rounded-2xl bg-indigo-600 text-white disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
