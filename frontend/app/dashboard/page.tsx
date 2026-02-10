'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { dashboardAPI, chatAPI, careerAPI } from '../../lib/api'
import { getLessonsWithDefaults } from '../../lib/lessonsStorage'
import CareerSelectionModal from '../../components/dashboard/CareerSelectionModal'
import WeeklyGoalModal from '../../components/dashboard/WeeklyGoalModal'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '../../components/Logo'
import { ArrowRight, Send } from 'lucide-react'
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

  const loadDashboard = async () => {
    try {
      const data = await dashboardAPI.getStats()
      setStats(data)
      if (!data.career_path) setShowCareerModal(true)
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
    toast.success(`Career path selected: ${careerPath}`)
    try {
      await careerAPI.selectCareer(careerPath)
      const data = await dashboardAPI.getStats()
      setStats(data)
    } catch (_) {}
    setIsSettingUp(false)
  }

  const handleGoalSet = (goal: number) => {
    if (typeof window !== 'undefined') localStorage.setItem(DEMO_GOAL_KEY, String(goal))
    setDemoGoal(goal)
    toast.success(`Weekly goal set to ${goal} lessons!`)
    setShowGoalModal(false)
    dashboardAPI.getStats().then(setStats).catch(() => {})
  }

  const handleSignOut = () => {
    clearAuth()
    router.push('/')
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

  if (loading) {
    return ( <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-xl">Loading...</div></div> )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'Learner'}! 👋
          </h1>
          <p className="text-gray-600">Here's your learning progress overview</p>
        </div>
        <Link href="/career" className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-indigo-200">
          <span>🎯</span> Update Career Path
        </Link>
      </div>

      {/* AI Career Mentor — dedicated Gemini chat, 1 credit/message or your key */}
      <div className="mb-8 animate-fade-in">
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 border border-violet-100 shadow-lg shadow-violet-100/50">
          <div className="px-5 py-4 border-b border-violet-100/80 bg-white/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Career Mentor</h2>
                <p className="text-xs text-gray-500">Powered by Gemini · Answers in an open, natural way</p>
              </div>
            </div>
          </div>
          <div className="bg-white min-h-[300px] sm:min-h-[360px] md:min-h-[400px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[240px] text-center px-4">
                  <p className="text-gray-600 mb-6 max-w-md">
                    Great question! Based on your interests, I can suggest career paths, weekly plans, and skills to learn first. Ask in your own words.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setInputMessage('Help me choose a career path')}
                      className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold shadow-md shadow-violet-200 hover:bg-violet-700 hover:shadow-lg transition-all"
                    >
                      ✨ Help me choose a career path
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMessage('Create a weekly plan')}
                      className="px-5 py-3 rounded-xl bg-white border-2 border-violet-200 text-violet-700 font-medium hover:bg-violet-50 transition-colors"
                    >
                      📅 Create a weekly plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMessage('What skills should I learn first?')}
                      className="px-5 py-3 rounded-xl bg-white border-2 border-indigo-200 text-indigo-700 font-medium hover:bg-indigo-50 transition-colors"
                    >
                      📚 What skills should I learn first?
                    </button>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <ChatMessageBubble key={idx} role={msg.role} content={msg.content} />
              ))}
              {isChatLoading && <ChatLoadingBubble />}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500 mb-3">
                1 credit per message. Uses your Gemini key when set (no deduction).{' '}
                <Link href="/dashboard/credits" className="text-violet-600 font-medium hover:underline">Buy credits</Link>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask for advice..."
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-base placeholder:text-gray-400"
                  disabled={isChatLoading}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !inputMessage.trim()}
                  className="p-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Send"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-premium p-6 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats?.courses_completed || '-'}</h3>
          <p className="text-gray-500 font-medium pb-1">Courses Completed</p>
          {(stats?.courses_completed === 0 || !stats?.courses_completed) && (
            <p className="text-xs text-slate-400">Start your first course to begin</p>
          )}
        </div>

        <div className="card-premium p-6 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats?.lessons_in_progress || '-'}</h3>
          <p className="text-gray-500 font-medium pb-1">Lessons in Progress</p>
          {!stats?.career_path ? (
            <p className="text-xs text-slate-400">Pick a career path to unlock lessons</p>
          ) : (stats?.lessons_in_progress === 0 && (
            <p className="text-xs text-slate-400">Resume learning to see progress</p>
          ))}
        </div>

        <div className="card-premium p-6 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {!stats?.career_path ? '-' : (stats?.skills_acquired || 0)}
          </h3>
          <p className="text-gray-500 font-medium pb-1">Skills Acquired</p>
          {!stats?.career_path && (
            <p className="text-xs text-slate-400">Available after selecting a career path</p>
          )}
        </div>

        <div className="card-premium p-6 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats?.lessons_completed || 0}</h3>
          <p className="text-gray-500 font-medium pb-1">Lessons Completed</p>
          <p className="text-xs text-slate-400">From practice & AI learning modules</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Career Path Progress */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Career Path Progress</h2>
              <Link href="/roadmap" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                View Full Roadmap <ArrowRight size={16} />
              </Link>
            </div>
            {!stats?.career_path ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
                <div>
                  <span className="text-gray-700 font-medium block mb-1">Not Selected</span>
                  <p className="text-gray-500 text-sm">Choose a career path to unlock a personalized roadmap.</p>
                </div>
                <button
                  onClick={() => setShowCareerModal(true)}
                  className="btn-primary px-6 py-2 whitespace-nowrap"
                >
                  Select Career Path →
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">{stats?.career_path}</span>
                  <span className="text-gray-600">{stats?.roadmap_completion || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${stats?.roadmap_completion || 0}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Fundamentals</span>
                  <span>Specialization</span>
                  <span>Job Readiness</span>
                </div>
              </div>
            )}
          </div>

          {/* My Lessons */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">My Lessons</h2>
              <Link href="/learn" className="text-indigo-600 hover:text-indigo-800 font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {myLessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Start creating lessons to see them here</p>
                  <Link href="/learn" className="mt-4 inline-block btn-primary">
                    Create Lesson
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {myLessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 hover:border-indigo-200 transition-colors">
                      <span className="font-medium text-gray-900">{lesson.title}</span>
                      <Link href={`/learn/${lesson.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        View →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Weekly Goals */}
          <div className="card-premium p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Goals</h2>
            <ul className="space-y-3">
              {(stats?.weekly_goals || []).map((goal: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 rounded border-gray-300 text-indigo-600" />
                  <span className="text-gray-700">{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Next Steps */}
          <div className="card-premium p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Suggested Next Steps</h2>
            <div className="space-y-4">

              {/* Step 1: Select Career */}
              <div className={`p-4 rounded-xl border transition-all ${stats?.career_path
                ? 'bg-emerald-50 border-emerald-100'
                : 'bg-white border-indigo-200 shadow-sm ring-2 ring-indigo-50'
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-1 ${stats?.career_path ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                    <ArrowRight size={12} className={stats?.career_path ? "hidden" : "block"} />
                    <div className={stats?.career_path ? "block" : "hidden"}>✓</div>
                  </div>
                  <div>
                    <h4 className={`font-semibold ${stats?.career_path ? 'text-emerald-900' : 'text-gray-900'}`}>
                      Select a career path
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {stats?.career_path ? "Completed Today" : "Unlock your personalized roadmap"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: First Lesson */}
              <div className={`p-4 rounded-xl border transition-all ${!stats?.career_path ? 'opacity-50 grayscale' : 'bg-white border-gray-100'
                }`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-amber-500">
                    ⏳
                  </div>
                  <div className="w-full">
                    <h4 className="font-semibold text-gray-900">Complete your first lesson</h4>
                    <p className="text-sm text-gray-500 mt-1">(10-15 min)</p>
                    {stats?.career_path && (
                      <button className="mt-3 w-full btn-primary py-2 text-sm">Start First Lesson ›</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Weekly Goal */}
              <div className={`p-4 rounded-xl border transition-all ${!stats?.career_path ? 'opacity-50 grayscale' : 'bg-white border-gray-100'
                }`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-amber-500">
                    ⏳
                  </div>
                  <div className="w-full">
                    <h4 className="font-semibold text-gray-900">Set a weekly goal</h4>
                    <p className="text-sm text-gray-500 mt-1">(e.g. 3 lessons)</p>
                    {stats?.career_path && (
                      <button
                        onClick={() => setShowGoalModal(true)}
                        className="mt-3 w-full bg-indigo-100 text-indigo-700 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors"
                      >
                        Set Weekly Goal ›
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>


        </div>
      </div>

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