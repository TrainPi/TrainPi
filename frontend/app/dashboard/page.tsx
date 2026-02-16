'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { dashboardAPI, chatAPI, careerAPI, roadmapAPI } from '../../lib/api'
import { getLessonsWithDefaults } from '../../lib/lessonsStorage'
import CareerSelectionModal from '../../components/dashboard/CareerSelectionModal'
import WeeklyGoalModal from '../../components/dashboard/WeeklyGoalModal'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '../../components/Logo'
import { ArrowRight, Send, ExternalLink, BookOpen, Clock, Sparkles } from 'lucide-react'
import ChatMessageBubble, { ChatLoadingBubble } from '../../components/ui/ChatMessageBubble'

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
  const [showCareerModal, setShowCareerModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [demoCareer, setDemoCareer] = useState<string | null>(null)
  const [demoGoal, setDemoGoal] = useState<number>(3)
  const [myLessons, setMyLessons] = useState<{ id: number; title: string; modules?: unknown[]; quiz_questions?: unknown[] }[]>([])

  // Chat State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [allRoadmaps, setAllRoadmaps] = useState<any[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (typeof window !== 'undefined') {
      setDemoCareer(localStorage.getItem(DEMO_CAREER_KEY))
      const g = localStorage.getItem(DEMO_GOAL_KEY)
      if (g) setDemoGoal(Number(g))
      setMyLessons(getLessonsWithDefaults())
    }
    loadDashboard()
  }, [isAuthenticated, router])

  const [isUpdating, setIsUpdating] = useState(false)

  const handleCompleteStep = async () => {
    if (!stats?.roadmap_id || !stats?.current_roadmap_step) return
    setIsUpdating(true)
    try {
      const nextStep = stats.current_roadmap_step.step_number + 1
      await roadmapAPI.updateProgress(stats.roadmap_id, nextStep)
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
      const [statsData, roadmaps] = await Promise.all([
        dashboardAPI.getStats(),
        roadmapAPI.getAllRoadmaps()
      ])
      setStats(statsData)
      setAllRoadmaps(roadmaps)
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
      const data = await dashboardAPI.getStats()
      setStats(data)
      toast.success(`Career path selected: ${careerPath}`)
      // Stay on dashboard
      loadDashboard()
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
    dashboardAPI.getStats().then(setStats).catch(() => { })
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

  if (loading && !stats) {
    return (<div className="min-h-screen bg-transparent flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>)
  }

  return (
    <div className="space-y-10 pb-10">
      {/* 1. Academic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in relative px-2">
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Hey, {user?.full_name || user?.email?.split('@')[0] || 'Learner'}!
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Your academic progress is looking great today.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
              L4
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rank</p>
              <p className="text-sm font-bold text-slate-700 leading-none">Scholar</p>
            </div>
          </div>
          <button onClick={() => setShowCareerModal(true)} className="btn-primary flex items-center gap-2 px-8 py-3.5 shadow-xl shadow-indigo-100 group">
            <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Enroll Path</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Assessment Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        {[
          { label: 'Enrolled', value: allRoadmaps.length, icon: '🎓', color: 'indigo' },
          { label: 'Units Active', value: stats?.lessons_in_progress || 0, icon: '📚', color: 'fuchsia' },
          { label: 'Skills', value: stats?.skills_acquired || 0, icon: '✨', color: 'emerald' },
          { label: 'Completed', value: stats?.lessons_completed || 0, icon: '✅', color: 'amber' },
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
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Learning Hub (2/3) */}
        <div className="lg:col-span-2 space-y-8 animate-fade-in" style={{ animationDelay: '200ms' }}>

          {/* Quick AI Academic Bar (The Chat "On Top") */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex items-center gap-4 group hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
              <Sparkles size={18} />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask your Academic Mentor about this unit..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isChatLoading || !inputMessage.trim()}
              className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-30 transition-all flex items-center justify-center shrink-0"
            >
              <Send size={18} />
            </button>
          </div>

          {/* Active Course View */}
          {stats?.current_roadmap_step ? (
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
                        {Math.round(stats.roadmap_completion || 0)}
                      </span>
                      <span className="text-sm font-bold text-slate-400">%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full transition-all duration-1000"
                        style={{ width: `${stats.roadmap_completion || 0}%` }}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.current_roadmap_step.resources.map((res: any, i: number) => (
                        <a
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-400 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <ExternalLink size={16} />
                            </div>
                            <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]">
                              {res.name}
                            </span>
                          </div>
                          <ArrowRight size={16} className="text-slate-300" />
                        </a>
                      ))}
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
                      href={stats?.roadmap_id ? `/roadmap?id=${stats.roadmap_id}` : "/roadmap"}
                      className="text-slate-400 font-black hover:text-slate-900 transition-colors uppercase text-xs tracking-widest"
                    >
                      Full Details
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
                Personalized, goal-oriented curriculum waiting for you. Let's get started.
              </p>
              <button
                onClick={() => setShowCareerModal(true)}
                className="bg-indigo-600 text-white font-black py-4 px-12 rounded-2xl shadow-2xl shadow-indigo-100 hover:scale-105 transition-all text-lg"
              >
                Enroll Now
              </button>
            </div>
          )}

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
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{Math.round(r.completion_percentage || 0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-500"
                          style={{ width: `${r.completion_percentage || 0}%` }}
                        />
                      </div>
                    </div>
                    <Link href={`/roadmap?id=${r.id}`} className="absolute inset-0 z-10" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Support Sidebar (1/3) */}
        <div className="space-y-8 animate-fade-in" style={{ animationDelay: '300ms' }}>

          {/* Institutional Chat UI */}
          <div className="card-premium overflow-hidden border-indigo-100/50 shadow-2xl shadow-indigo-100/10 flex flex-col h-[650px]">
            <div className="p-6 border-b border-slate-100 bg-white/60 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white shadow-lg">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 leading-none mb-1.5">Study Mentor</h2>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Support
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/20">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center text-4xl mx-auto mb-6">👩‍🏫</div>
                  <h4 className="text-base font-black text-slate-900 mb-2">Academic Consultation</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">Clarify concepts, plan your study schedule, or request career advice.</p>
                  <div className="space-y-2 px-4">
                    {['How to learn React fast?', 'Explain neural networks', 'Tips for internship search'].map(q => (
                      <button
                        key={q}
                        onClick={() => setInputMessage(q)}
                        className="w-full text-left py-3 px-4 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all truncate"
                      >
                        ✦ {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <ChatMessageBubble key={idx} role={msg.role} content={msg.content} />
                  ))}
                  {isChatLoading && <ChatLoadingBubble />}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-white">
              <div className="relative group">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Inquiry..."
                  className="w-full pl-5 pr-14 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium text-sm"
                  disabled={isChatLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !inputMessage.trim()}
                  className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-30 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>

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