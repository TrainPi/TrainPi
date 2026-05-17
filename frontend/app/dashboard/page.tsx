'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { dashboardAPI, chatAPI, careerAPI, roadmapAPI, readinessAPI } from '../../lib/api'
import CareerSelectionModal from '../../components/dashboard/CareerSelectionModal'
import WeeklyGoalModal from '../../components/dashboard/WeeklyGoalModal'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowRight, Send, BookOpen, Clock, Sparkles, Gauge, Target, LibraryBig, ChevronRight, Workflow, FileBarChart2, GitCompareArrows, BarChart3 } from 'lucide-react'
import { hasProfile, getCurrentStep, STEPS } from '../../lib/workforceState'
import ChatMessageBubble, { ChatLoadingBubble } from '../../components/ui/ChatMessageBubble'
import CourseTimeline from '../../components/dashboard/CourseTimeline'
import Image from 'next/image'
import type { ReadinessLevel } from '../../lib/demoData'

const DEMO_CAREER_KEY = 'trainpi_career_path'
const DEMO_GOAL_KEY = 'trainpi_weekly_goal'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function DashboardPage() {
  const { isAuthenticated, clearAuth, user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showCareerModal, setShowCareerModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [demoCareer, setDemoCareer] = useState<string | null>(null)
  const [demoGoal, setDemoGoal] = useState<number>(3)

  // Chat State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [allRoadmaps, setAllRoadmaps] = useState<any[]>([])
  const [readiness, setReadiness] = useState<{ overall_score: number; overall_level: ReadinessLevel; target_role: string; priority_gap: string } | null>(null)
  const [workforceStarted, setWorkforceStarted] = useState(false)
  const [workforceStep, setWorkforceStep] = useState(1)

  const clampPct = (n: any) => {
    const x = Number(n)
    if (!Number.isFinite(x)) return 0
    return Math.max(0, Math.min(100, x))
  }

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (typeof window !== 'undefined') {
      setDemoCareer(localStorage.getItem(DEMO_CAREER_KEY))
      const g = localStorage.getItem(DEMO_GOAL_KEY)
      if (g) setDemoGoal(Number(g))
      setWorkforceStarted(hasProfile())
      setWorkforceStep(getCurrentStep())
    }
    loadDashboard()
  }, [isAuthenticated, router])

  const [isUpdating, setIsUpdating] = useState(false)

  const handleCompleteStep = async () => {
    if (!stats?.roadmap_id || !stats?.current_roadmap_step) return
    setIsUpdating(true)
    try {
      const completedCount = stats.current_roadmap_step.step_number
      await roadmapAPI.updateProgress(stats.roadmap_id, completedCount)
      toast.success('Step completed! Keep it up!')
      await loadDashboard()
    } catch (error) {
      toast.error('Failed to update progress')
    } finally {
      setIsUpdating(false)
    }
  }

  const loadDashboard = async () => {
    try {
      const [statsData, roadmaps, readinessReport] = await Promise.all([
        dashboardAPI.getStats(),
        roadmapAPI.getAllRoadmaps(),
        readinessAPI.getReport(),
      ])
      setStats(statsData)
      setAllRoadmaps(roadmaps)
      setReadiness({
        overall_score: readinessReport.overall_score,
        overall_level: readinessReport.overall_level,
        target_role: readinessReport.target_role,
        priority_gap: readinessReport.priority_gap,
      })
      if (!statsData.career_path && roadmaps.length === 0) setShowCareerModal(true)
    } catch (error: any) {
      setStats(null)
      if (error?.response?.status === 401) {
        clearAuth()
        router.push('/login?next=/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCareerSelect = async (careerPath: string) => {
    setIsSettingUp(true)
    if (typeof window !== 'undefined') localStorage.setItem(DEMO_CAREER_KEY, careerPath)
    setDemoCareer(careerPath)
    setShowCareerModal(false)

    try {
      await careerAPI.selectCareer(careerPath)
      await loadDashboard()
      toast.success(`Career path selected: ${careerPath}`)
    } catch (_) {
      toast.error('Failed to update career path')
    }
    setIsSettingUp(false)
  }

  const handleGoalSet = (goal: number) => {
    if (typeof window !== 'undefined') localStorage.setItem(DEMO_GOAL_KEY, String(goal))
    setDemoGoal(goal)
    toast.success(`Weekly goal set to ${goal} lessons!`)
    setShowGoalModal(false)
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMsg = inputMessage
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInputMessage('')
    setIsChatLoading(true)
    try {
      const data = await chatAPI.sendMessage(userMsg)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      if (data.response?.includes('All AI quota is temporarily used')) {
        toast.error('AI is at capacity. Try again in a few minutes or buy credits for priority.', { duration: 5000 })
      }
    } catch (e: any) {
      if (e?.code === 'INSUFFICIENT_CREDITS' || e?.message === 'INSUFFICIENT_CREDITS') {
        setMessages(prev => [...prev, { role: 'assistant', content: "You're out of credits. Buy more to keep chatting with the AI Career Mentor." }])
        toast.error('Not enough credits. Buy more to continue.', { duration: 4000 })
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn’t process that. Try again.' }])
      }
    } finally {
      setIsChatLoading(false)
    }
  }

  return (
    <div className="space-y-10 pb-10">
      {/* 1. Academic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in relative px-2">
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Hey, {mounted ? (user?.full_name || user?.email?.split('@')[0] || 'Learner') : 'Learner'}!
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Your academic progress is looking great today.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => setShowCareerModal(true)} className="btn-primary flex items-center gap-2 px-8 py-3.5 shadow-xl shadow-indigo-100 group">
            <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Enroll Path</span>
          </button>
        </div>
      </div>

      {/* 2. Workforce Readiness Assessment CTA */}
      <Link
        href={workforceStarted ? STEPS[Math.min(workforceStep - 1, STEPS.length - 1)].href : '/workforce/profile'}
        className="block group animate-fade-in"
        style={{ animationDelay: '50ms' }}
      >
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-200/60 relative overflow-hidden hover:scale-[1.005] transition-all">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-fuchsia-300/20 rounded-full blur-3xl" />
          <div className="relative grid grid-cols-1 md:grid-cols-[auto,1fr,auto] items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Workflow className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-100 mb-1">AI Workforce Readiness Assessment</p>
                <h2 className="text-xl sm:text-2xl font-black leading-tight">
                  {workforceStarted ? `Continue Step ${workforceStep} of 5` : 'Start your 5-step assessment'}
                </h2>
                <p className="text-xs font-bold text-violet-100 mt-1">
                  {workforceStarted
                    ? STEPS[Math.min(workforceStep - 1, STEPS.length - 1)].label
                    : 'Profile → context → analysis → results → roadmap'}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              {STEPS.map((s) => {
                const done = s.number < workforceStep
                const active = s.number === workforceStep && workforceStarted
                return (
                  <div
                    key={s.number}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      done ? 'bg-emerald-400' : active ? 'bg-white' : 'bg-white/20'
                    }`}
                    style={{ minWidth: 24 }}
                    aria-hidden
                  />
                )
              })}
            </div>
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-600 font-black text-sm shadow-lg shrink-0 group-hover:scale-105 transition">
              {workforceStarted ? 'Resume Assessment' : 'Start Assessment'}
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>

      {/* 3. Quick Assessment Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
              <div className="h-3 w-16 bg-slate-200 rounded mb-3" />
              <div className="h-8 w-12 bg-slate-200 rounded" />
            </div>
          ))
        ) : (
          [
            { label: 'Enrolled Path', value: allRoadmaps.length, icon: '🎯', color: 'indigo' },
            { label: 'Active Units', value: stats?.lessons_in_progress || 0, icon: '📚', color: 'fuchsia' },
            { label: 'Op. Skills', value: stats?.skills_acquired || 0, icon: '🛡️', color: 'emerald' },
            { label: 'Completed', value: stats?.courses_completed || 0, icon: '✅', color: 'amber' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{kpi.value}</h3>
                </div>
                <div className="text-2xl">{kpi.icon}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Workforce Tools shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <Link href="/workforce/operational-context" className="group p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2 group-hover:bg-violet-600 group-hover:text-white transition-all">
            <FileBarChart2 className="w-4 h-4" />
          </div>
          <p className="text-xs font-black text-slate-900">Operational Context</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Upload SOPs &amp; docs</p>
        </Link>
        <Link href="/workforce/analysis-comparison" className="group p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <GitCompareArrows className="w-4 h-4" />
          </div>
          <p className="text-xs font-black text-slate-900">Analysis Comparison</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Profile vs requirements</p>
        </Link>
        <Link href="/workforce/results-insights" className="group p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <BarChart3 className="w-4 h-4" />
          </div>
          <p className="text-xs font-black text-slate-900">Results &amp; Insights</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Readiness gauge + gaps</p>
        </Link>
        <Link href="/workforce/roadmap-pathway" className="group p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition-all">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-xs font-black text-slate-900">Roadmap &amp; Pathway</p>
          <p className="text-[10px] text-slate-500 mt-0.5">4-phase plan</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Learning Hub (2/3) */}
        <div className="lg:col-span-2 space-y-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {/* Determine current course from loaded roadmaps */}
          {(() => {
            const currentRoadmap =
              (stats?.roadmap_id && allRoadmaps.find((r) => r.id === stats.roadmap_id)) || allRoadmaps[0] || null
            return (
              <>

          {/* Single Mentor Chat (only chat UI) */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                  <Image src="/aa.png" alt="AI Mentor" width={64} height={64} className="object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Career Mentor</p>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">Mentor chat</h3>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">Ask for a plan, next step, or skills to learn.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMessages([])}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm font-bold text-slate-700">Ask anything about your course.</p>
                  <p className="text-xs text-slate-500 mt-1">Try: “Create a 4-week plan for Data Analyst.”</p>
                </div>
              ) : (
                <>
                  {messages.slice(-10).map((msg, idx) => (
                    <ChatMessageBubble key={idx} role={msg.role} content={msg.content} showIcon={msg.role === 'assistant'} />
                  ))}
                  {isChatLoading && <ChatLoadingBubble />}
                </>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask your mentor…"
                  className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-300 text-sm font-medium placeholder:text-slate-400"
                  disabled={isChatLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !inputMessage.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 disabled:opacity-30 transition-all flex items-center justify-center shrink-0"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Course View */}
          {loading ? (
            <div className="card-premium p-8 animate-pulse">
              <div className="h-6 w-48 bg-slate-200 rounded mb-6" />
              <div className="h-4 w-full bg-slate-100 rounded mb-4" />
              <div className="h-4 w-3/4 bg-slate-100 rounded mb-8" />
              <div className="h-32 bg-slate-50 rounded-2xl" />
            </div>
          ) : stats?.current_roadmap_step ? (
            <div className="card-premium overflow-hidden border-2 border-indigo-100 shadow-2xl shadow-indigo-100/20 relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-2">
                      {stats.career_path}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold text-slate-500">
                        Current Unit: Step {stats.current_roadmap_step.step_number}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-[140px]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-indigo-600">
                        {Math.round(clampPct(stats.roadmap_completion))}
                      </span>
                      <span className="text-sm font-bold text-slate-400">%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full transition-all duration-1000"
                        style={{ width: `${clampPct(stats.roadmap_completion)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-3xl p-6 sm:p-8 border border-slate-100 mb-8 hover:bg-white hover:shadow-xl transition-all duration-500 group">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                      <BookOpen size={24} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {stats.current_roadmap_step.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-lg mb-8 font-medium">
                    {stats.current_roadmap_step.description}
                  </p>

                  {stats.current_roadmap_step.resources && stats.current_roadmap_step.resources.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-indigo-600" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Reference sources</p>
                      </div>
                      <p className="text-xs text-slate-500">These inform the TrainPi lesson plan. Learners stay on-platform.</p>
                      <div className="flex flex-wrap gap-2">
                        {stats.current_roadmap_step.resources.map((res: any, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
                          >
                            <BookOpen size={14} className="text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[200px]">{res.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-sm font-black text-slate-400 tracking-widest uppercase">
                    <span className="flex items-center gap-2">
                      ⏳ Estim. {stats.current_roadmap_step.estimated_time || '40 min'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleCompleteStep}
                      disabled={isUpdating}
                      className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 hover:scale-[1.03] active:scale-95 shadow-2xl shadow-indigo-100 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      <span className="hidden sm:inline">{isUpdating ? 'Updating...' : 'Mark as Complete'}</span>
                      <span className="sm:hidden">Complete</span>
                      <ArrowRight size={20} />
                    </button>
                    <Link
                      href={stats?.roadmap_id ? `/courses/${stats.roadmap_id}` : "/courses"}
                      className="text-slate-400 font-black hover:text-slate-900 transition-colors uppercase text-xs tracking-widest"
                    >
                      Open Course
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-premium p-16 text-center border-dashed border-2 border-slate-200 bg-slate-50/20">
              <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-5xl mx-auto mb-8">🎯</div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">Choose Your Path</h3>
              <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                Personalized, goal-oriented curriculum waiting for you. Let&apos;s get started.
              </p>
              <button
                onClick={() => setShowCareerModal(true)}
                className="bg-indigo-600 text-white font-black py-4 px-12 rounded-2xl shadow-2xl shadow-indigo-100 hover:scale-105 transition-all text-lg"
              >
                Enroll Now
              </button>
            </div>
          )}

                {/* Educative-style timeline (shows when we have roadmap steps) */}
                {currentRoadmap?.steps?.length ? (
                  <CourseTimeline
                    roadmap={currentRoadmap}
                    onJumpToRoadmap={() =>
                      router.push(currentRoadmap?.id ? `/courses/${currentRoadmap.id}` : '/courses')
                    }
                  />
                ) : null}

          {/* Catalog & Enrolled Paths */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Curriculum</h2>
              <button onClick={() => setShowCareerModal(true)} className="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                + Add New Path
              </button>
            </div>
            {allRoadmaps.length === 0 ? (
              <div className="p-10 rounded-3xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-slate-400 font-bold">No roadmaps currently active.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allRoadmaps.map((r) => (
                  <div key={r.id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                    <h3 className="font-black text-slate-900 text-lg mb-4 pr-6">{r.career_path}</h3>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">
                        <span>Progress</span>
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{Math.round(clampPct(r.completion_percentage))}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-500"
                          style={{ width: `${clampPct(r.completion_percentage)}%` }}
                        />
                      </div>
                    </div>
                    <Link href={`/courses/${r.id}`} className="absolute inset-0 z-10" />
                  </div>
                ))}
              </div>
            )}
          </div>
              </>
            )
          })()}
        </div>

        {/* Support Sidebar (1/3) */}
        <div className="space-y-8 animate-fade-in" style={{ animationDelay: '300ms' }}>

          {/* Learning Objectives */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Daily Goals</h2>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Clock size={16} />
              </div>
            </div>
            <div className="space-y-3">
              {(stats?.weekly_goals || []).map((goal: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer group">
                  <div className="w-5 h-5 rounded-lg border-2 border-slate-200 flex items-center justify-center group-hover:border-indigo-400 transition-all">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm opacity-0 group-hover:opacity-10" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{goal}</span>
                </div>
              ))}
              <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest mt-4">Discipline is Key</p>
            </div>
          </div>
        </div>
      </div>

      {/* Persistence Modals */}
      <CareerSelectionModal
        isOpen={showCareerModal}
        onClose={() => setShowCareerModal(false)}
        onSelect={handleCareerSelect}
        isLoading={isSettingUp}
      />
      <WeeklyGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onConfirm={handleGoalSet}
      />
    </div>
  )
}

